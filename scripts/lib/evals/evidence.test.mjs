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

// SPEC-0046: the manifest can refute the claim. Only a record that says
// `enforced: false` fires; a legacy manifest carries no record and keeps the
// old rule, so historical `isolated=yes` citations stay valid.
test("isolated=yes on an unenforced manifest is an error", () => {
  const line = "`2026-01-01T00-00-00--unenforced` `isolated=yes`"
  const findings = cites(
    line,
    run({ isolationRecord: { enforced: false, mechanism: null, reason: "platform linux" } }),
  )
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["error", "unenforced-isolation"]])
  assert.match(findings[0].message, /unenforced run/)
  assert.match(findings[0].message, /platform linux/)
})

test("a malformed or partial isolation record cannot underwrite isolated=yes", () => {
  const line = "`2026-01-01T00-00-00--run` `isolated=yes`"
  for (const isolationRecord of [
    {},
    { mechanism: "seatbelt" },
    "enforced",
    { enforced: "yes" },
    { enforced: true, mechanism: null },
    { enforced: true, mechanism: "" },
  ]) {
    const findings = cites(line, run({ isolationRecord }))
    assert.deepEqual(findings.map((f) => f.rule), ["unenforced-isolation"], JSON.stringify(isolationRecord))
  }
})

test("an enforced manifest allows isolated=yes and a legacy one is not judged", () => {
  const line = "`2026-01-01T00-00-00--run` `isolated=yes`"
  assert.deepEqual(cites(line, run({ isolationRecord: { enforced: true, mechanism: "seatbelt", reason: "available" } })), [])
  assert.deepEqual(cites(line, run()), [], "a manifest without the record is legacy")
})

test("a polluted run is a warning without a dirty marker", () => {
  const line = "`2026-01-01T00-00-00--polluted`"
  const findings = cites(line, run({ findings: 2 }))
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["warning", "dirty-run"]])
  assert.deepEqual(cites("leak `2026-01-01T00-00-00--polluted`", run({ findings: 2 })), [])
})

test("a completed manifest with no case results is an error", () => {
  const line = "`2026-01-01T00-00-00--empty`"
  const findings = cites(line, {
    exists: true,
    unreadable: true,
    status: "completed",
    reason: "has no cases/ directory",
    detectorVersion: null,
    findings: 1,
  })
  assert.deepEqual(findings.map((f) => [f.level, f.rule]), [["error", "empty-run"]])
})

test("a run inside an abbreviated range is not a citation", () => {
  assert.deepEqual(scanCitations("2026-11-01 run (`2026-11-01T22-18-10--matrix--…`)"), [])
})

test("the token keeps the arm segment", () => {
  const tokens = scanCitations("`2026-11-06T10-00-00--demo--without-skill`")[0].tokens
  assert.deepEqual(tokens.map((t) => t.token), ["2026-11-06T10-00-00--demo--without-skill"])
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

function makeRun(
  store,
  name,
  { status = "completed", detectorVersion = current, leak = [], isolate = true, isolation, cases = true } = {},
) {
  const dir = join(store, name)
  const params = { isolate, ...(isolation ? { isolation } : {}) }
  if (!cases) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, "manifest.json"),
      JSON.stringify({ arm: "with-skill", status, params }, null, 2),
    )
    return
  }
  mkdirSync(join(dir, "cases", "demo--01"), { recursive: true })
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({ arm: "with-skill", status, params }, null, 2),
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

test("the CLI resolves a unique two-segment shorthand and names an ambiguous one", () => {
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
    assert.match(parsed.findings[0].message, /2026-11-06T11-00-00--demo--a/)
    assert.match(parsed.findings[0].message, /2026-11-06T11-00-00--demo--b/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("a missing store is a warning in normal mode and an error under --strict", () => {
  const dir = mkdtempSync(join(tmpdir(), "evidence-nostore-"))
  try {
    const store = join(dir, "no-such-store")
    const normal = spawnSync(process.execPath, [cli, "--store", store], { cwd: dir, encoding: "utf8" })
    assert.equal(normal.status, 0)
    assert.match(normal.stdout, /warning missing-store/)
    assert.match(normal.stdout, /0 errors, 1 warnings/)

    const strict = spawnSync(process.execPath, [cli, "--store", store, "--strict"], { cwd: dir, encoding: "utf8" })
    assert.equal(strict.status, 1)
    assert.match(strict.stdout, /error missing-store/)
    assert.match(strict.stdout, /1 errors, 0 warnings/)

    const json = spawnSync(process.execPath, [cli, "--store", store, "--json"], { cwd: dir, encoding: "utf8" })
    assert.equal(json.status, 0)
    assert.equal(JSON.parse(json.stdout).summary.warnings, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("--help names empty-run and missing-store", () => {
  const result = spawnSync(process.execPath, [cli, "--help"], { encoding: "utf8" })
  assert.equal(result.status, 0)
  assert.match(result.stdout, /empty-run/)
  assert.match(result.stdout, /missing-store/)
})

test("the CLI never drops an arm: with-arm is exact, missing-arm is an error, empty run is an error", () => {
  const dir = mkdtempSync(join(tmpdir(), "evidence-arm-"))
  try {
    const store = join(dir, "store")
    mkdirSync(join(dir, "docs", "evals"), { recursive: true })
    mkdirSync(store, { recursive: true })
    makeRun(store, "2026-11-06T10-00-00--demo--with-skill")
    makeRun(store, "2026-11-06T10-01-00--empty", { cases: false })

    writeFileSync(
      join(dir, "docs", "evals", "test.md"),
      [
        "existing `2026-11-06T10-00-00--demo--with-skill`",
        "missing arm `2026-11-06T10-00-00--demo--nonexistent-arm`",
        "empty `2026-11-06T10-01-00--empty`",
        "",
      ].join("\n"),
    )
    const result = spawnSync(process.execPath, [cli, "--store", store, "--json"], { cwd: dir, encoding: "utf8" })
    assert.equal(result.status, 1)
    const parsed = JSON.parse(result.stdout)
    assert.deepEqual(
      parsed.findings.map((f) => f.rule).sort(),
      ["empty-run", "missing-run"],
    )
    assert.deepEqual(parsed.findings.map((f) => f.token).sort(), [
      "2026-11-06T10-00-00--demo--nonexistent-arm",
      "2026-11-06T10-01-00--empty",
    ])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// The pure rule is only useful if the CLI actually carries the record into the
// citation check. This exercises the resolver: manifest -> inspectRun -> guard.
test("the CLI rejects isolated=yes for an unenforced manifest and accepts a legacy one", () => {
  const dir = mkdtempSync(join(tmpdir(), "evidence-unenforced-"))
  try {
    const store = join(dir, "store")
    mkdirSync(join(dir, "docs", "evals"), { recursive: true })
    mkdirSync(store, { recursive: true })
    makeRun(store, "2026-11-06T10-00-00--unenforced", {
      isolation: { enforced: false, mechanism: null, reason: "platform linux" },
    })
    makeRun(store, "2026-11-06T10-01-00--legacy", { isolate: true })

    writeFileSync(
      join(dir, "docs", "evals", "test.md"),
      ["unenforced `2026-11-06T10-00-00--unenforced` `isolated=yes`.", "legacy `2026-11-06T10-01-00--legacy` `isolated=yes`.", ""].join("\n"),
    )

    const result = spawnSync(process.execPath, [cli, "--store", store, "--json"], { cwd: dir, encoding: "utf8" })
    assert.equal(result.status, 1)
    const parsed = JSON.parse(result.stdout)
    assert.deepEqual(parsed.findings.map((f) => f.rule), ["unenforced-isolation"])
    assert.equal(parsed.findings[0].token, "2026-11-06T10-00-00--unenforced")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
