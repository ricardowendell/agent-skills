// cli.test.mjs — the CLI's contract on bad input.
//
// These spawn the real scripts on purpose. The bugs live in how argv becomes
// options: `--case abc` left the case filter as NaN, which is falsy, so the
// filter was skipped and every case was selected; `--concurrency abc` left the
// lane count as NaN, which starts zero lanes, runs nothing and exits 0. A unit
// test of a helper would not prove the script wires it in.
//
// None of these invocations calls a model: a bad value exits before discovery,
// and the valid one only lists.

import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const RUN = join(REPO, "scripts/run-evals.mjs")
const REPLAY = join(REPO, "scripts/replay-evals.mjs")

function cli(script, args) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd: REPO, encoding: "utf8" })
  return { code: r.status, out: r.stdout, err: r.stderr }
}

function rejects(args, pattern, { script = RUN, code = 1 } = {}) {
  const r = cli(script, args)
  assert.equal(r.code, code, `expected exit ${code}, got ${r.code}\n${r.err}`)
  assert.match(r.err, pattern)
  // A usage error must not look like a clean scan or an empty run.
  assert.doesNotMatch(r.out, /Parsed|passed,|Replayed/, "failed after it had already scanned or run")
}

test("a non-numeric --case is rejected instead of selecting every case", () => {
  rejects(["--case", "abc", "--list"], /--case/)
})

test("a zero --case is rejected", () => {
  rejects(["--case", "0", "--list"], /--case/)
})

test("a non-numeric --concurrency is rejected instead of running nothing", () => {
  rejects(
    ["--root", "skills", "--skill", "tighten-harness", "--case", "6", "--concurrency", "abc", "--run"],
    /--concurrency/,
  )
})

test("a non-numeric --timeout is rejected", () => {
  rejects(["--timeout", "abc", "--list"], /--timeout/)
})

test("an out-of-range --judge-threshold is rejected", () => {
  rejects(["--judge-threshold", "2", "--list"], /--judge-threshold/)
})

test("a malformed --stop is rejected instead of running the full count", () => {
  rejects(["--stop", "5-3", "--list"], /--stop/)
})

test("a zero-pass --stop is rejected", () => {
  rejects(["--stop", "0/3", "--list"], /--stop/)
})

test("a non-numeric --stall-seconds is rejected", () => {
  rejects(["--stall-seconds", "abc", "--list"], /--stall-seconds/)
})

test("an unknown flag is rejected", () => {
  rejects(["--nope", "--list"], /unknown flag/)
})

test("a flag that needs a value does not swallow the next flag", () => {
  rejects(["--skill", "--list"], /--skill needs a value/)
})

test("valid input still filters and lists", () => {
  const r = cli(RUN, ["--root", "skills", "--skill", "tighten-harness", "--case", "6", "--list", "--check"])
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /Parsed 1 case/)
  assert.match(r.out, /tighten-harness #6/)
})

test("replay rejects a non-numeric --case", () => {
  const dir = mkdtempSync(join(tmpdir(), "replay-cli-"))
  rejects(["--dir", dir, "--case", "abc"], /--case/, { script: REPLAY, code: 2 })
})
