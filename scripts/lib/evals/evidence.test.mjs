import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  checkCitation,
  checkDocuments,
  hasMarker,
  scanCitations,
} from "./evidence.mjs"
import { DETECTOR_VERSION } from "./leak.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const cli = resolve(here, "..", "..", "check-evidence.mjs")
const current = DETECTOR_VERSION

const run = (overrides = {}) => ({
  exists: true,
  status: "completed",
  detectorVersion: current,
  findings: 0,
  ...overrides,
})

const cites = (line, runRecord, tokens = scanCitations(line)[0]?.tokens ?? []) =>
  checkCitation({ line, token: tokens[0].token, run: runRecord, currentDetector: current, tokens })

test("a clean, completed, current-detector run has no findings", () => {
  const line = "clean `2026-01-01T00-00-00--clean`"
  assert.deepEqual(cites(line, run()), [])
})

test("a missing run directory is an error", () => {
  const line = "`2026-01-01T00-00-00--gone`"
  const findings = cites(line, { exists: false })
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["error", "missing-run"]])
})

test("an unfinished run needs a marker on the line", () => {
  const line = "`2026-01-01T00-00-00--slow`"
  const findings = cites(line, run({ status: "running" }))
  assert.deepEqual(findings.map((f) => f.rule), ["unfinished-run"])
  assert.deepEqual(cites("unfinished `2026-01-01T00-00-00--slow`", run({ status: "running" })), [])
})

test("isolated=yes on a v1 run is an error", () => {
  const line = "`2026-01-01T00-00-00--v1` `isolated=yes`"
  const findings = cites(line, run({ detectorVersion: "v1old" }))
  assert.deepEqual(findings.map((f) => f.rule), ["stale-detector"])
  assert.deepEqual(cites(line, run()), [])
})

test("the run nearest the isolated=yes claim is the one checked", () => {
  const line = "`2026-01-01T00-00-00--current` and `2026-01-01T00-00-00--old` `isolated=yes`"
  const tokens = scanCitations(line)[0].tokens
  const findings = checkCitation({
    line,
    token: tokens[1].token,
    run: run({ detectorVersion: "v1old" }),
    currentDetector: current,
    tokens,
  })
  assert.deepEqual(findings.map((f) => f.rule), ["stale-detector"])
})

test("a polluted run is a warning without a dirty marker", () => {
  const line = "`2026-01-01T00-00-00--polluted`"
  const findings = cites(line, run({ findings: 2 }))
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["warning", "dirty-run"]])
  assert.deepEqual(cites("leak `2026-01-01T00-00-00--polluted`", run({ findings: 2 })), [])
})

test("a run inside an abbreviated range is not a citation", () => {
  assert.deepEqual(scanCitations("2026-11-01 run (`2026-11-01T22-18-10--matrix--…`)"), [])
})

test("markers match whole words", () => {
  assert.equal(hasMarker("this is a leak", ["leak"]), true)
  assert.equal(hasMarker("linking is not a leak marker", ["link"]), false)
})

test("checkDocuments carries the file and line", () => {
  const findings = checkDocuments({
    documents: [{ path: "docs/evals/a.md", text: "x\n`2026-01-01T00-00-00--gone`\n" }],
    resolveRun: () => ({ exists: false }),
    currentDetector: current,
  })
  assert.equal(findings.length, 1)
  assert.equal(findings[0].file, "docs/evals/a.md")
  assert.equal(findings[0].line, 2)
})

function makeRun(store, name, { status = "completed", detectorVersion = current, leak = [], isolate = true } = {}) {
  const dir = join(store, name)
  mkdirSync(join(dir, "cases", "demo--01"), { recursive: true })
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({ arm: "with-skill", status, params: { isolate } }, null, 2),
  )
  writeFileSync(
    join(dir, "cases", "demo--01", "result.json"),
    JSON.stringify(
      {
        skill: "demo",
        case: 1,
        arm: "with-skill",
        status: leak.length ? "failed" : "passed",
        detectorVersion,
        leak,
        contaminated: leak.length > 0,
        skillGate: { ok: true, loaded: ["demo"], reason: "loaded demo" },
      },
      null,
      2,
    ),
  )
}

test("the CLI reads a synthetic store: existing, running, v1 and dirty", () => {
  const dir = mkdtempSync(join(tmpdir(), "evidence-cli-"))
  try {
    const store = join(dir, "store")
    mkdirSync(join(dir, "docs", "evals"), { recursive: true })
    mkdirSync(store, { recursive: true })
    makeRun(store, "2026-11-06T10-00-00--clean")
    makeRun(store, "2026-11-06T10-01-00--slow", { status: "running" })
    makeRun(store, "2026-11-06T10-02-00--old", { detectorVersion: "v1old" })
    makeRun(store, "2026-11-06T10-03-00--polluted", {
      leak: ["/Users/x/.agents/skills/other/SKILL.md"],
    })

    const doc = [
      "# evidence",
      "",
      "clean `2026-11-06T10-00-00--clean`.",
      "slow `2026-11-06T10-01-00--slow`.",
      "old `2026-11-06T10-02-00--old` `isolated=yes`.",
      "polluted `2026-11-06T10-03-00--polluted`.",
      "",
    ].join("\n")
    const docPath = join(dir, "docs", "evals", "test.md")
    writeFileSync(docPath, doc)

    const result = spawnSync(process.execPath, [cli, "--store", store, "--json"], { cwd: dir, encoding: "utf8" })
    assert.equal(result.status, 1)
    const parsed = JSON.parse(result.stdout)
    assert.equal(parsed.summary.errors, 2)
    assert.equal(parsed.summary.warnings, 1)
    assert.deepEqual(
      parsed.findings.map((f) => f.rule).sort(),
      ["dirty-run", "stale-detector", "unfinished-run"],
    )

    // Warning only: default exits 0, --strict exits 1.
    writeFileSync(docPath, "# evidence\n\n`2026-11-06T10-03-00--polluted`.\n")
    const warning = spawnSync(process.execPath, [cli, "--store", store], { cwd: dir, encoding: "utf8" })
    assert.equal(warning.status, 0)
    assert.match(warning.stdout, /1 warnings/)

    const strict = spawnSync(process.execPath, [cli, "--store", store, "--strict"], { cwd: dir, encoding: "utf8" })
    assert.equal(strict.status, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("the CLI resolves a unique shorthand and leaves an ambiguous one missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "evidence-short-"))
  try {
    const store = join(dir, "store")
    mkdirSync(join(dir, "docs", "evals"), { recursive: true })
    mkdirSync(store, { recursive: true })
    makeRun(store, "2026-11-06T10-00-00--demo--without-skill")
    makeRun(store, "2026-11-06T11-00-00--demo--a")
    makeRun(store, "2026-11-06T11-00-00--demo--b")

    writeFileSync(
      join(dir, "docs", "evals", "test.md"),
      ["short `2026-11-06T10-00-00--demo`", "ambiguous `2026-11-06T11-00-00--demo`", ""].join("\n"),
    )
    const result = spawnSync(process.execPath, [cli, "--store", store, "--json"], { cwd: dir, encoding: "utf8" })
    const parsed = JSON.parse(result.stdout)
    assert.deepEqual(parsed.findings.map((f) => f.token), ["2026-11-06T11-00-00--demo"])
    assert.equal(parsed.findings[0].rule, "missing-run")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
