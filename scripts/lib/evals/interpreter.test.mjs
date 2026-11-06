// interpreter.test.mjs — the resolver behind the parity check.
//
// The point of the resolver is to tell "no Python" apart from "the sensors
// disagree", which is the bug that cost two commits in the 0.4.0 wave. The pure
// paths inject `probe`, so they never depend on the host's interpreters; the CLI
// paths spawn the real script with a controlled environment.

import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { chmodSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  defaultCandidates,
  findPython,
  formatTried,
  probePython,
  versionAtLeast,
} from "./interpreter.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const CLI = join(REPO, "scripts/check-sensor-parity.mjs")

function cli(env = process.env) {
  const r = spawnSync(process.execPath, [CLI], { cwd: REPO, encoding: "utf8", env })
  return { code: r.status, out: r.stdout, err: r.stderr }
}

// Every candidate fails without a usable standard library, which is what "no
// interpreter" looks like on a machine that still ships `/usr/bin/python3`.
// `PATH` alone cannot hide those absolute fallbacks, so `PYTHONHOME` makes the
// existing interpreter unusable (broken), not absent.
function noInterpreterEnv(extra = {}) {
  return {
    PATH: mkdtempSync(join(tmpdir(), "parity-nopath-")),
    HOME: process.env.HOME ?? "",
    PYTHONHOME: "/nonexistent",
    ...extra,
  }
}

test("candidates are ordered and deduplicated", () => {
  assert.deepEqual(defaultCandidates({}), [
    "python3",
    "python",
    "/opt/homebrew/bin/python3",
    "/usr/bin/python3",
  ])
  assert.deepEqual(defaultCandidates({ PDLC_PYTHON: "/custom/python3" }), [
    "/custom/python3",
    "python3",
    "python",
    "/opt/homebrew/bin/python3",
    "/usr/bin/python3",
  ])
  // An explicit path that is already in the list does not repeat.
  assert.deepEqual(defaultCandidates({ PDLC_PYTHON: "python3" }), [
    "python3",
    "python",
    "/opt/homebrew/bin/python3",
    "/usr/bin/python3",
  ])
})

test("no candidate reports every attempt instead of a generic failure", () => {
  const tried = ["python3", "python"]
  const calls = []
  const result = findPython({
    candidates: tried,
    probe: (command) => {
      calls.push(command)
      return { ok: false, reason: "missing" }
    },
  })
  assert.deepEqual(result, {
    command: null,
    tried: [
      { command: "python3", reason: "missing" },
      { command: "python", reason: "missing" },
    ],
  })
  assert.deepEqual(calls, tried)
})

test("the first working candidate wins and is not probed twice", () => {
  const calls = []
  const result = findPython({
    candidates: ["python3", "python", "/usr/bin/python3"],
    probe: (command) => {
      calls.push(command)
      return { ok: true, version: "3.11" }
    },
  })
  assert.deepEqual(result, { command: "python3", version: "3.11" })
  assert.deepEqual(calls, ["python3"])
})

test("a broken shim is skipped with its first stderr line and the next candidate is used", () => {
  const calls = []
  const result = findPython({
    candidates: ["/tmp/broken-shim", "python3"],
    probe: (command) => {
      calls.push(command)
      if (command === "/tmp/broken-shim") {
        return { ok: false, reason: "broken", detail: "boom: shim cannot run" }
      }
      return { ok: true, version: "3.10" }
    },
  })
  assert.deepEqual(result, { command: "python3", version: "3.10" })
  assert.deepEqual(calls, ["/tmp/broken-shim", "python3"])
})

test("a candidate older than 3.8 is skipped and named", () => {
  const result = findPython({
    candidates: ["old", "new"],
    probe: (command) =>
      command === "old" ? { ok: true, version: "3.7" } : { ok: true, version: "3.8" },
  })
  assert.deepEqual(result, { command: "new", version: "3.8" })
  assert.equal(versionAtLeast("3.7"), false)
  assert.equal(versionAtLeast("3.8"), true)
  assert.equal(versionAtLeast("4.0"), true)
})

test("probePython calls a nonexistent binary missing, not broken", () => {
  const result = probePython("/nonexistent/pdlc-test-python3")
  assert.deepEqual(result, { ok: false, reason: "missing" })
})

test("formatTried names broken candidates with stderr and leaves absent ones bare", () => {
  assert.equal(
    formatTried([
      { command: "python3", reason: "missing" },
      { command: "/usr/bin/python3", reason: "broken", detail: "boom: cannot run" },
      { command: "python2", reason: "old", version: "2.7" },
    ]),
    "python3, /usr/bin/python3 (broken: boom: cannot run), python2 (2.7 < 3.8)",
  )
})

test("a stripped PATH with no usable interpreter names it and exits 1, with no false FAIL", () => {
  const r = cli(noInterpreterEnv())
  assert.equal(r.code, 1, r.err)
  assert.match(
    r.err,
    /^cannot check sensor parity: no usable Python 3 interpreter found \(tried: .+\); set PDLC_PYTHON=\/path\/to\/python3$/m,
  )
  // One line, and the absence is not reported as a fixture divergence.
  assert.equal(r.err.trim().split(/\r?\n/).length, 1)
  assert.doesNotMatch(r.out, /FAIL/, "a missing interpreter must not fail a fixture")
  assert.doesNotMatch(r.out + r.err, /undefined/, "a spawn failure must not format a non-string")
  assert.doesNotMatch(r.out, /fixtures in parity/, "no verdict is reached without an interpreter")
})

test("PDLC_ALLOW_MISSING_PYTHON=1 turns the absence into a named skip and exits 0", () => {
  const r = cli(noInterpreterEnv({ PDLC_ALLOW_MISSING_PYTHON: "1" }))
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /^skip python: no usable interpreter found \(tried: .+\); parity not checked$/m)
  assert.doesNotMatch(r.out, /FAIL/)
  assert.doesNotMatch(r.out + r.err, /undefined/)
})

test("a broken PDLC_PYTHON is skipped and the next candidate is used (skipped when the host has no Python)", (t) => {
  if (!findPython({ env: process.env }).command) {
    t.skip("the host has no Python 3.8+ to fall back to")
    return
  }
  const dir = mkdtempSync(join(tmpdir(), "parity-broken-python-"))
  const shim = join(dir, "python3")
  writeFileSync(shim, "#!/bin/sh\necho 'boom: shim cannot run' >&2\nexit 1\n")
  chmodSync(shim, 0o755)
  const r = cli({ ...process.env, PDLC_PYTHON: shim })
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /^python \d+\.\d+ \(.+\)\n/, "the interpreter actually used is named")
  assert.doesNotMatch(r.out, new RegExp(shim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
})

test("with the host's Python the CLI names it and keeps 2/2 fixtures in parity (skipped when the host has no Python)", (t) => {
  const found = findPython({ env: process.env })
  if (!found.command) {
    t.skip("the host has no Python 3.8+")
    return
  }
  const r = cli()
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, new RegExp(`^python \\d+\\.\\d+ \\(.+\\)\\n`))
  assert.match(r.out, /2\/2 fixtures in parity/)
})
