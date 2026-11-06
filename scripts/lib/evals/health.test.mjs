import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { evalHealth, pdlcHealth } from "./health.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const HEALTH = join(REPO, "scripts/harness-health.mjs")

function cli(args, options = {}) {
  const r = spawnSync(process.execPath, [HEALTH, ...args], {
    cwd: options.cwd ?? REPO,
    encoding: "utf8",
  })
  return { code: r.status, out: r.stdout, err: r.stderr }
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2))
}

function manifest({ run, dir, startedAt, finishedAt }) {
  return {
    run,
    dir,
    label: "demo",
    arm: "with-skill",
    model: "default",
    agent: "build",
    level: "behavior",
    repoSha: "abc",
    startedAt,
    finishedAt,
    status: "completed",
    counts: { passed: 0, failed: 0, unscored: 0, staged: 0, contaminated: 0, infrastructure: 0 },
    skillHashes: {},
  }
}

function draw({
  status = "passed",
  reason = "",
  assertions = [{ kind: "reply", arg: "x", pass: true }],
  execution = {
    exit: 0,
    durationMs: 1000,
    tokens: { input: 10, output: 2, reasoning: 1, cacheRead: 0, cacheWrite: 0 },
    steps: 2,
    toolCalls: 1,
  },
  semantic,
  provenance,
  skillGate = { ok: true },
} = {}) {
  return {
    skill: "demo",
    case: 1,
    status,
    reason,
    skillGate,
    leak: [],
    assertions,
    execution,
    arm: "with-skill",
    ...(semantic ? { semantic } : {}),
    ...(provenance ?? {}),
  }
}

// The fixture is deliberately one repeated case and one single case:
//   - 12 repetitions: 9 passed, 1 deterministic pass failed by the judge,
//     1 contaminated and 1 infrastructure. The case aggregate carries the dirty
//     counts, the repetitions carry only their status and execution, so the
//     fallback that reconciles the two shapes is exercised too.
//   - the repeated case has partial provenance (no hashes on its draws); the
//     single case has all three.
function makeStore() {
  const root = mkdtempSync(join(tmpdir(), "harness-health-"))
  const store = join(root, "store")
  const runs = join(store, "runs")

  const repeated = join(runs, "2026-01-01T00-00-00--repeated")
  writeJson(
    join(repeated, "manifest.json"),
    manifest({
      run: "2026-01-01T00-00-00--repeated",
      dir: repeated,
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:01:00.000Z",
    }),
  )
  const repetitions = []
  for (let i = 0; i < 9; i++) repetitions.push(draw())
  repetitions.push(
    draw({
      status: "failed",
      assertions: [{ kind: "reply", arg: "x", pass: true }],
      semantic: {
        model: "judge",
        selfJudged: false,
        threshold: 0.8,
        score: 0.5,
        expectations: [],
        reason: "judge: expectation 1 not met",
      },
    }),
  )
  repetitions.push(draw({ status: "unscored", reason: "contaminated — read /tmp/demo" }))
  repetitions.push(draw({ status: "unscored", reason: "infrastructure: timeout" }))
  writeJson(join(repeated, "cases", "demo--01", "result.json"), {
    skill: "demo",
    case: 1,
    status: "failed",
    reason: "1/10 clean repetitions passed",
    passRate: 0.9,
    passed: 9,
    reps: 12,
    contaminated: 1,
    infrastructure: 1,
    stoppedEarly: false,
    sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    skillHash: "skill",
    arm: "with-skill",
    meta: {},
    repetitions,
  })

  const single = join(runs, "2026-02-01T00-00-00--single")
  writeJson(
    join(single, "manifest.json"),
    manifest({
      run: "2026-02-01T00-00-00--single",
      dir: single,
      startedAt: "2026-02-01T00:00:00.000Z",
      finishedAt: "2026-02-01T00:02:00.000Z",
    }),
  )
  writeJson(join(single, "cases", "demo--02", "result.json"), {
    skill: "demo",
    case: 2,
    status: "passed",
    assertions: [{ kind: "reply", arg: "x", pass: true }],
    execution: {
      exit: 0,
      durationMs: 2000,
      tokens: { input: 20, output: 4, reasoning: 0, cacheRead: 5, cacheWrite: 0 },
      steps: 3,
      toolCalls: 2,
    },
    fixtureHash: "fixture",
    promptHash: "prompt",
    detectorVersion: "1",
    skillGate: { ok: true },
    leak: [],
    meta: {},
    arm: "with-skill",
  })

  const pdlc = join(root, "runs.json")
  writeJson(pdlc, {
    a: {
      run_id: "a",
      task: "SPEC-1",
      status: "merged",
      attempts: 2,
      gates: [
        { name: "lint", ok: true, exit: 0 },
        { name: "selftest", ok: false, exit: 1 },
      ],
      duration: 100,
    },
    b: {
      run_id: "b",
      task: "SPEC-2",
      status: "merged",
      attempts: 1,
      gates: [{ name: "lint", ok: true, exit: 0 }],
      duration: 300,
    },
    c: {
      run_id: "c",
      task: "SPEC-3",
      status: "active",
      attempts: 1,
      gates: null,
      duration: 200,
    },
  })

  return { root, store, pdlc }
}

function reportFor({ store, pdlc }, extra = []) {
  const r = cli(["--runs", store, "--pdlc", pdlc, "--json", ...extra])
  assert.equal(r.code, 0, r.err)
  return JSON.parse(r.out)
}

test("the report counts both case shapes, clean outcomes, dirty draws, judge failures and provenance", () => {
  const report = reportFor(makeStore())
  const e = report.evals

  assert.equal(e.runs, 2)
  assert.equal(e.cases, 2)
  assert.equal(e.draws, 13)
  assert.deepEqual(e.shapes, { single: 1, repeated: 1 })

  // Nine clean passes in the repeated case plus the single draw. The judge
  // failure is the one clean failed draw; contaminated and infrastructure draws
  // are counted apart, never folded into the clean buckets.
  assert.equal(e.passed, 10)
  assert.equal(e.failed, 1)
  assert.equal(e.unscored, 0)
  assert.equal(e.staged, 0)
  assert.equal(e.contaminated, 1)
  assert.equal(e.infrastructure, 1)
  assert.equal(e.unfinishedRuns, 0)
  assert.equal(e.unfinishedDraws, 0)
  assert.equal(e.eligibleDraws, 11)
  assert.equal(e.rateDenominator, 11)
  assert.equal(e.rate, 10 / 11)
  assert.equal(e.gateMisses, 0)

  // Only the single draw has full provenance and a clean checkRun; the repeated
  // case is partial provenance, so it stays eligible but not strict.
  assert.deepEqual(e.strict, { draws: 1, passed: 1, failed: 0, unscored: 0, staged: 0, rate: 1 })

  // 60 s + 120 s of wall time and 12 + 2 s of draw time.
  assert.equal(e.wallSeconds, 180)
  assert.equal(e.drawSeconds, 14)
  assert.deepEqual(e.tokens, { input: 140, output: 28, reasoning: 12, cacheRead: 5, cacheWrite: 0 })
  assert.equal(e.steps, 27)
  assert.equal(e.toolCalls, 14)

  assert.deepEqual(e.judge, { runs: 1, failures: 1, deterministicPassJudgeFail: 1 })
  assert.deepEqual(e.provenance, { complete: 1, partial: 12 })
  assert.deepEqual(e.unreadable, [])
})

test("pdlc counts retries, red gates and the median duration", () => {
  const report = reportFor(makeStore())
  const p = report.pdlc

  assert.equal(p.runs, 3)
  assert.deepEqual(p.byStatus, { active: 1, merged: 2 })
  assert.equal(p.retries, 1)
  assert.equal(p.gateFailures, 1)
  assert.deepEqual(p.failedGates, [{ id: "a", name: "selftest", exit: 1 }])
  assert.equal(p.medianDurationSeconds, 200)
  assert.equal(p.durations, 3)
  assert.deepEqual(p.unreadable, [])
})

test("two invocations over the same store are byte-identical", () => {
  const store = makeStore()
  const first = cli(["--runs", store.store, "--pdlc", store.pdlc])
  const second = cli(["--runs", store.store, "--pdlc", store.pdlc])
  assert.equal(first.code, 0, first.err)
  assert.equal(second.code, 0, second.err)
  assert.equal(first.out, second.out)

  const jsonFirst = cli(["--runs", store.store, "--pdlc", store.pdlc, "--json"])
  const jsonSecond = cli(["--runs", store.store, "--pdlc", store.pdlc, "--json"])
  assert.equal(jsonFirst.out, jsonSecond.out)
})

test("--since filters eval runs and keeps pdlc records that have no start", () => {
  const store = makeStore()
  const report = reportFor(store, ["--since", "2026-01-15"])

  assert.equal(report.evals.runs, 1)
  assert.equal(report.evals.cases, 1)
  assert.equal(report.evals.draws, 1)
  assert.equal(report.evals.passed, 1)
  assert.equal(report.evals.eligibleDraws, 1)
  assert.equal(report.evals.rateDenominator, 1)
  assert.equal(report.evals.rate, 1)
  assert.equal(report.evals.strict.draws, 1)
  assert.equal(report.evals.strict.rate, 1)
  assert.equal(report.evals.wallSeconds, 120)
  assert.equal(report.evals.provenance.complete, 1)
  assert.equal(report.evals.provenance.partial, 0)
  assert.equal(report.pdlc.runs, 3)

  const empty = reportFor(store, ["--since", "2026-03-01"])
  assert.equal(empty.evals.runs, 0)
  assert.equal(empty.evals.draws, 0)
  assert.equal(empty.evals.rate, null)
})

test("--until is inclusive and filters both eval runs and pdlc records", () => {
  const root = mkdtempSync(join(tmpdir(), "harness-health-until-"))
  const store = join(root, "store")
  const runsRoot = join(store, "runs")
  const starts = [
    ["2026-01-01T10-00-00--before", "2026-01-01T10:00:00.000Z"],
    ["2026-01-15T12-00-00--exact", "2026-01-15T12:00:00.000Z"],
    ["2026-01-20T00-00-00--after", "2026-01-20T00:00:00.000Z"],
  ]
  for (const [id, startedAt] of starts) {
    const dir = join(runsRoot, id)
    writeJson(join(dir, "manifest.json"), manifest({ run: id, dir, startedAt, finishedAt: startedAt }))
    writeJson(join(dir, "cases", "demo--01", "result.json"), {
      skill: "demo",
      case: 1,
      status: "passed",
      assertions: [{ kind: "reply", arg: "x", pass: true }],
      execution: { exit: 0, durationMs: 10 },
      fixtureHash: "fixture",
      promptHash: "prompt",
      detectorVersion: "1",
      skillGate: { ok: true },
      leak: [],
    })
  }

  const pdlc = join(root, "runs.json")
  writeJson(pdlc, {
    a: { run_id: "a", status: "merged", attempts: 1, gates: [], duration: 100, started_at: "2026-01-01T10:00:00.000Z" },
    b: { run_id: "b", status: "merged", attempts: 1, gates: [], duration: 100, started_at: "2026-01-15T12:00:00.000Z" },
    c: { run_id: "c", status: "merged", attempts: 1, gates: [], duration: 100, started_at: "2026-01-20T00:00:00.000Z" },
  })

  // The run exactly at the bound is included; the one after it is not. The same
  // bound applies to the pdlc records.
  const atLimit = reportFor({ store, pdlc }, ["--until", "2026-01-15T12:00:00Z"])
  assert.equal(atLimit.evals.runs, 2)
  assert.equal(atLimit.evals.draws, 2)
  assert.equal(atLimit.pdlc.runs, 2)
  assert.deepEqual(atLimit.pdlc.byStatus, { merged: 2 })

  // A date-only bound is the end of that UTC day, so the noon run is included.
  const dateOnly = reportFor({ store, pdlc }, ["--until", "2026-01-15"])
  assert.equal(dateOnly.evals.runs, 2)
  assert.equal(dateOnly.pdlc.runs, 2)

  // `--since` and `--until` close the window on both sources.
  const window = reportFor({ store, pdlc }, ["--since", "2026-01-10", "--until", "2026-01-15T12:00:00Z"])
  assert.equal(window.evals.runs, 1)
  assert.equal(window.evals.draws, 1)
  assert.equal(window.pdlc.runs, 1)
  assert.equal(window.pdlc.byStatus.merged, 1)

  for (const value of ["2026-13-01", "2026-02-30", "nope", "2026-11-06T25:00:00Z", "2026-11-06T16:12:50"]) {
    const bad = cli(["--runs", store, "--pdlc", pdlc, "--until", value])
    assert.equal(bad.code, 2, value)
    assert.match(bad.err, /--until expects/)
    assert.equal(bad.out, "")
  }
})

test("an unknown flag and a malformed --since exit 2 before reading the store", () => {
  const store = makeStore()
  const unknown = cli(["--runs", store.store, "--nope"])
  assert.equal(unknown.code, 2)
  assert.match(unknown.err, /unknown flag/)
  assert.equal(unknown.out, "")

  for (const value of ["2026-13-01", "2026-02-30", "06-11-2026", "2026-1-1"]) {
    const bad = cli(["--runs", store.store, "--since", value])
    assert.equal(bad.code, 2, value)
    assert.match(bad.err, /--since expects YYYY-MM-DD/, value)
    assert.equal(bad.out, "")
  }
})

test("the report is read-only over the store and the pdlc file", () => {
  const store = makeStore()
  const before = treeHash(store.store) + treeHash(store.pdlc)
  const r = cli(["--runs", store.store, "--pdlc", store.pdlc])
  assert.equal(r.code, 0, r.err)
  assert.equal(treeHash(store.store) + treeHash(store.pdlc), before)
})

test("a missing manifest, a broken result and an unknown shape are named, not skipped", () => {
  const root = mkdtempSync(join(tmpdir(), "harness-health-unreadable-"))
  const store = join(root, "store")
  const runs = join(store, "runs")

  // No manifest: the run is unreadable before its cases are read.
  mkdirSync(join(runs, "bad-run", "cases", "demo--01"), { recursive: true })
  writeJson(join(runs, "bad-run", "cases", "demo--01", "result.json"), { skill: "demo", case: 1 })

  const good = join(runs, "2026-01-01T00-00-00--good")
  writeJson(
    join(good, "manifest.json"),
    manifest({
      run: "2026-01-01T00-00-00--good",
      dir: good,
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:00:10.000Z",
    }),
  )
  // Broken JSON.
  mkdirSync(join(good, "cases", "broken"), { recursive: true })
  writeFileSync(join(good, "cases", "broken", "result.json"), "{not json")
  // Shape that is neither repetitions nor a single execution.
  writeJson(join(good, "cases", "shape", "result.json"), { skill: "demo", case: 1 })
  // And one readable draw, so the report is not empty.
  writeJson(join(good, "cases", "ok", "result.json"), {
    skill: "demo",
    case: 2,
    status: "passed",
    assertions: [{ kind: "reply", arg: "x", pass: true }],
    execution: { exit: 0, durationMs: 10 },
    fixtureHash: "fixture",
    promptHash: "prompt",
    detectorVersion: "1",
  })

  const pdlc = join(root, "runs.json")
  writeJson(pdlc, {})

  const report = reportFor({ store, pdlc })
  assert.equal(report.evals.runs, 1)
  assert.equal(report.evals.cases, 1)
  assert.equal(report.evals.draws, 1)
  assert.equal(report.evals.passed, 1)

  const ids = report.evals.unreadable.map((entry) => entry.id)
  assert.ok(ids.includes("bad-run"))
  assert.ok(ids.includes("2026-01-01T00-00-00--good/broken"))
  assert.ok(ids.includes("2026-01-01T00-00-00--good/shape"))
  assert.equal(report.evals.unreadable.length, 3)

  const markdown = cli(["--runs", store, "--pdlc", pdlc])
  assert.equal(markdown.code, 0, markdown.err)
  assert.match(markdown.out, /Unreadable eval artefacts/)
  assert.match(markdown.out, /bad-run/)
  assert.match(markdown.out, /good\/broken/)
  assert.match(markdown.out, /good\/shape/)
})

test("a clean unscored draw and a staged smoke draw stay out of the pass rate", () => {
  const report = evalHealth({
    runs: [
      {
        id: "run",
        dir: "/tmp/run",
        manifest: {
          status: "completed",
          arm: "with-skill",
          startedAt: "2026-01-01T00:00:00Z",
          finishedAt: "2026-01-01T00:00:01Z",
        },
        cases: [
          {
            id: "unscored",
            dir: "/tmp/run/cases/unscored",
            result: {
              skill: "demo",
              case: 1,
              status: "unscored",
              reason: "no assertions — nothing was checked",
              execution: { durationMs: 10 },
              fixtureHash: "fixture",
              promptHash: "prompt",
              detectorVersion: "1",
            },
          },
          {
            id: "staged",
            dir: "/tmp/run/cases/staged",
            result: {
              skill: "demo",
              case: 2,
              status: "staged",
              reason: "staged only (smoke)",
              execution: { durationMs: 10 },
              fixtureHash: "fixture",
              promptHash: "prompt",
              detectorVersion: "1",
            },
          },
        ],
      },
    ],
  })

  assert.equal(report.passed, 0)
  assert.equal(report.failed, 0)
  assert.equal(report.unscored, 1)
  assert.equal(report.staged, 1)
  assert.equal(report.eligibleDraws, 2)
  assert.equal(report.rateDenominator, 1)
  assert.equal(report.rate, 0)
  assert.equal(report.strict.draws, 0)
})

test("eligible and strict separate unfinished, gate-miss and partial provenance", () => {
  const provenance = { fixtureHash: "fixture", promptHash: "prompt", detectorVersion: "1" }
  const draw = (overrides = {}) => ({
    skill: "demo",
    case: 1,
    status: "passed",
    leak: [],
    contaminated: false,
    skillGate: { ok: true, loaded: ["demo"], reason: "loaded demo" },
    execution: { durationMs: 1000 },
    ...provenance,
    ...overrides,
  })
  const run = (id, status, cases) => ({
    id,
    dir: `/tmp/${id}`,
    manifest: {
      status,
      arm: "with-skill",
      startedAt: "2026-01-01T00:00:00Z",
      finishedAt: status === "completed" ? "2026-01-01T00:00:10Z" : null,
    },
    cases,
  })

  const report = evalHealth({
    runs: [
      run("a", "completed", [
        {
          id: "one",
          dir: "/tmp/a/one",
          result: {
            skill: "demo",
            case: 1,
            status: "passed",
            ...provenance,
            repetitions: [draw({ rep: 1 }), draw({ rep: 2, detectorVersion: undefined })],
          },
        },
      ]),
      run("b", "completed", [
        {
          id: "gate",
          dir: "/tmp/b/gate",
          result: {
            skill: "demo",
            case: 2,
            status: "failed",
            ...provenance,
            repetitions: [
              draw({ case: 2, rep: 1, status: "failed", skillGate: { ok: false, loaded: [], reason: "skill not loaded" } }),
            ],
          },
        },
      ]),
      run("c", "running", [
        {
          id: "unfinished",
          dir: "/tmp/c/unfinished",
          result: { skill: "demo", case: 3, status: "passed", ...provenance, execution: { durationMs: 1000 } },
        },
      ]),
    ],
  })

  assert.equal(report.runs, 3)
  assert.equal(report.unfinishedRuns, 1)
  assert.equal(report.unfinishedDraws, 1)
  assert.equal(report.draws, 4)
  assert.equal(report.cases, 3)
  assert.deepEqual(report.shapes, { single: 1, repeated: 2 })

  // The unfinished draw is not eligible. The partial and gate-miss draws are
  // eligible (no leak, no infrastructure) but not strict.
  assert.equal(report.eligibleDraws, 3)
  assert.equal(report.passed, 2)
  assert.equal(report.failed, 1)
  assert.equal(report.rateDenominator, 3)
  assert.equal(report.rate, 2 / 3)
  assert.equal(report.gateMisses, 1)
  assert.deepEqual(report.strict, { draws: 1, passed: 1, failed: 0, unscored: 0, staged: 0, rate: 1 })

  assert.deepEqual(report.provenance, { complete: 2, partial: 1 })
  assert.equal(report.wallSeconds, 20)
})

test("a finding in rep 1 of a case does not exclude rep 2 from strict", () => {
  const provenance = { fixtureHash: "fixture", promptHash: "prompt", detectorVersion: "1" }
  const rep = (overrides = {}) => ({
    skill: "demo",
    case: 1,
    status: "passed",
    leak: [],
    contaminated: false,
    skillGate: { ok: true, loaded: ["demo"], reason: "loaded demo" },
    execution: { durationMs: 10 },
    ...provenance,
    ...overrides,
  })

  const report = evalHealth({
    runs: [
      {
        id: "same-case",
        dir: "/tmp/same-case",
        manifest: {
          status: "completed",
          arm: "with-skill",
          startedAt: "2026-01-01T00:00:00Z",
          finishedAt: "2026-01-01T00:00:01Z",
        },
        cases: [
          {
            id: "one",
            dir: "/tmp/same-case/one",
            result: {
              skill: "demo",
              case: 1,
              status: "passed",
              ...provenance,
              repetitions: [
                rep({ rep: 1, skillGate: { ok: false, loaded: [], reason: "skill not loaded" } }),
                rep({ rep: 2 }),
              ],
            },
          },
        ],
      },
    ],
  })

  assert.equal(report.eligibleDraws, 2)
  assert.equal(report.gateMisses, 1)
  assert.equal(report.strict.draws, 1)
  assert.equal(report.strict.passed, 1)
  assert.equal(report.strict.failed, 0)
  assert.equal(report.strict.rate, 1)
})

test("the pure aggregator names unreadable objects and falls back to timestamps for pdlc duration", () => {
  const evals = evalHealth({
    runs: [
      { id: "no-manifest", dir: "/tmp/no-manifest", manifest: null, error: "missing manifest.json", cases: [] },
      {
        id: "with-case",
        dir: "/tmp/with-case",
        manifest: {
          status: "completed",
          arm: "with-skill",
          startedAt: "2026-01-01T00:00:00Z",
          finishedAt: "2026-01-01T00:00:05Z",
        },
        cases: [{ id: "bad", dir: "/tmp/with-case/cases/bad", result: null, error: "unreadable result.json" }],
      },
    ],
  })
  assert.equal(evals.runs, 1)
  assert.equal(evals.cases, 0)
  assert.deepEqual(evals.unreadable.map((entry) => entry.id), ["no-manifest", "with-case/bad"])
  assert.equal(evals.wallSeconds, 5)

  const pdlc = pdlcHealth({
    runs: {
      a: {
        run_id: "a",
        status: "merged",
        attempts: 1,
        gates: [{ name: "lint", ok: true, exit: 0 }],
        started_at: "2026-01-01T00:00:00Z",
        finished_at: "2026-01-01T00:02:00Z",
      },
    },
  })
  assert.equal(pdlc.medianDurationSeconds, 120)
  assert.deepEqual(pdlc.byStatus, { merged: 1 })

  const missing = pdlcHealth({ runs: {}, error: "not found", path: "/tmp/runs.json" })
  assert.equal(missing.runs, 0)
  assert.deepEqual(missing.unreadable, [{ id: "pdlc", path: "/tmp/runs.json", reason: "not found" }])
})

function treeHash(path) {
  const hash = createHash("sha256")
  const walk = (current) => {
    const stat = statSync(current)
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current).sort()) walk(join(current, entry))
      return
    }
    hash.update(current)
    hash.update(readFileSync(current))
  }
  walk(path)
  return hash.digest("hex")
}
