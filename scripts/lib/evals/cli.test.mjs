// cli.test.mjs — the one CLI's contract.
//
// These spawn the real `scripts/eval.mjs` on purpose. The old defects lived in
// how argv became options: `--case abc` left the case filter as NaN, which is
// falsy, so the filter was skipped and every case was selected; `--concurrency
// abc` started zero lanes, ran nothing and exited 0. A unit test of a helper
// would not prove the script wires it in.
//
// Nothing here calls a model. A usage error exits before discovery; `list`,
// `check`, `--level smoke` and the reuse path only read, stage or list.

import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { readEvals } from "./parse.mjs"
import { makeScratch, stageFixture, stagedTreeHash, textHash } from "./fixture.mjs"
import { gradingHash } from "./cache.mjs"
import { probeIsolation } from "./isolation.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const EVAL = join(REPO, "scripts/eval.mjs")

function cli(args, { env = process.env, cwd = REPO } = {}) {
  const r = spawnSync(process.execPath, [EVAL, ...args], { cwd, encoding: "utf8", env })
  return { code: r.status, out: r.stdout, err: r.stderr }
}

function rejects(args, pattern, { code = 2, env } = {}) {
  const r = cli(args, { env })
  assert.equal(r.code, code, `expected exit ${code}, got ${r.code}\n${r.err}`)
  assert.match(r.err, pattern)
  // A usage error must not look like a clean scan or an empty run.
  assert.doesNotMatch(r.out, /Parsed|passed,|Replayed/, "failed after it had already scanned or run")
}

function tempHome() {
  return mkdtempSync(join(tmpdir(), "eval-home-"))
}

function envWith(home) {
  return { ...process.env, HOME: home }
}

function makeCorpus({ name = "demo", cases, fixtures = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), "eval-corpus-"))
  mkdirSync(join(root, "skills", name), { recursive: true })
  writeFileSync(join(root, "skills", name, "SKILL.md"), `---\nname: ${name}\ndescription: demo skill\n---\n\n# Demo\n`)
  mkdirSync(join(root, "evals", name), { recursive: true })
  writeFileSync(join(root, "evals", name, "cases.md"), cases)
  for (const [n, files] of Object.entries(fixtures)) {
    for (const [rel, body] of Object.entries(files)) {
      const path = join(root, "evals", name, "fixtures", String(n), rel)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, body)
    }
  }
  return root
}

const DEMO_CASES = `
1. **Write hello.**

   - prompt: Create hello.txt and say hello.
   - why: the fixture has nothing.
   - expect: hello.txt exists.
   - assert: file hello.txt

2. **Second case.**

   - prompt: Say nothing.
   - assert: reply nothing
`

test("a non-numeric --case is rejected instead of selecting every case", () => {
  rejects(["list", "--root", "skills", "--case", "abc"], /--case/)
})

test("a zero --case is rejected", () => {
  rejects(["list", "--root", "skills", "--case", "0"], /--case/)
})

test("a non-numeric --concurrency is rejected instead of running nothing", () => {
  rejects(["run", "review-code", "7", "--root", "skills", "--concurrency", "abc"], /--concurrency/)
})

test("a non-numeric --timeout is rejected", () => {
  rejects(["run", "review-code", "7", "--root", "skills", "--timeout", "abc"], /--timeout/)
})

test("an out-of-range --judge-threshold is rejected", () => {
  rejects(["run", "review-code", "7", "--root", "skills", "--judge-threshold", "2"], /--judge-threshold/)
})

test("a malformed --stop is rejected instead of running the full count", () => {
  rejects(["run", "review-code", "7", "--root", "skills", "--stop", "5-3"], /--stop/)
})

test("a zero-pass --stop is rejected", () => {
  rejects(["run", "review-code", "7", "--root", "skills", "--stop", "0/3"], /--stop/)
})

test("a non-numeric --stall-seconds is rejected", () => {
  rejects(["run", "review-code", "7", "--root", "skills", "--stall-seconds", "abc"], /--stall-seconds/)
})

test("an unknown flag is rejected", () => {
  rejects(["list", "--nope"], /unknown flag/)
})

test("an unknown subcommand is not a run directory", () => {
  rejects(["skils", "review-code"], /expected one of|takes at most/)
})

test("a flag that needs a value does not swallow the next flag", () => {
  rejects(["list", "--root", "--tag", "trigger"], /--root needs a value/)
})

test("a flag with no meaning for the command is refused, not ignored", () => {
  rejects(["run", "review-code", "7", "--root", "skills", "--against", "main"], /--against has no meaning/)
  rejects(["list", "--root", "skills", "--refresh"], /--refresh has no meaning/)
})

test("valid input still filters and lists", () => {
  const r = cli(["list", "--root", "skills", "tighten-harness", "--case", "6"])
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /Parsed 1 case/)
  assert.match(r.out, /tighten-harness #6/)
})

test("list --json carries the same cases as the text view", () => {
  const r = cli(["list", "--root", "skills", "tighten-harness", "--case", "6", "--json"])
  assert.equal(r.code, 0, r.err)
  const record = JSON.parse(r.out)
  assert.equal(record.cases.length, 1)
  assert.equal(record.cases[0].case, 6)
})

// `check` is the staging gate: it parses, validates, resolves and stages every
// runnable fixture without a model.
test("check stages a fixture and exits 0", () => {
  const root = makeCorpus({ cases: DEMO_CASES, fixtures: { 1: { "hello.txt": "hello\n" } } })
  const r = cli(["check", "--root", root])
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /2 runnable, 0 manual; 2 fixture\(s\) staged/)
  assert.match(r.out, /No findings/)
})

test("check reports a snapshot assertion the fixture cannot satisfy", () => {
  const root = makeCorpus({
    cases: `
1. **Keep the file.**

   - prompt: Leave it alone.
   - assert: unchanged missing.txt
`,
  })
  const r = cli(["check", "--root", root])
  assert.equal(r.code, 1, r.stdout)
  assert.match(r.err, /no staged file matches missing\.txt/)
})

test("check reports a git.json base that does not resolve", () => {
  const root = makeCorpus({
    cases: `
1. **Review.**

   - prompt: Review it.
   - assert: file a.txt
`,
  })
  mkdirSync(join(root, "evals", "demo", "fixtures", "1"), { recursive: true })
  writeFileSync(join(root, "evals", "demo", "fixtures", "1", "git.json"), JSON.stringify({ base: "../nope" }))
  const r = cli(["check", "--root", root])
  assert.equal(r.code, 1, r.stdout)
  assert.match(r.err, /does not resolve/)
})

test("run --level smoke stages one draw and labels it staging", () => {
  const home = tempHome()
  const root = makeCorpus({ cases: DEMO_CASES, fixtures: { 1: { "hello.txt": "hello\n" } } })
  const r = cli(["run", "demo", "1", "--root", root, "--level", "smoke"], { env: envWith(home) })
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /demo #1: staged \[0\/1\] — staging/)
  const runDirs = join(home, ".local/share/opencode/evals/runs")
  assert.equal(existsSync(runDirs), true)
})

test("run --arm without is the control arm, not a deleted flag", () => {
  const home = tempHome()
  const root = makeCorpus({ cases: DEMO_CASES, fixtures: { 1: { "hello.txt": "hello\n" } } })
  const r = cli(["run", "demo", "1", "--root", root, "--level", "smoke", "--arm", "without"], { env: envWith(home) })
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /arm=without-skill/)
  const dirs = join(home, ".local/share/opencode/evals/runs")
  const [dir] = readdirSync(dirs)
  const manifest = JSON.parse(readFileSync(join(dirs, dir, "manifest.json"), "utf8"))
  assert.equal(manifest.arm, "without-skill")
})

// Resume is a directory, not a new run: the manifest and the per-draw files are
// the state. A missing manifest must fail before discovery, like any usage error.
test("--resume refuses a directory without a manifest", () => {
  const dir = mkdtempSync(join(tmpdir(), "resume-empty-"))
  rejects(["run", "capture-idea", "1", "--root", "skills", "--level", "smoke", "--resume", dir], /no manifest\.json/)
})

test("--resume reads the persisted draw and closes the case without a model", () => {
  const home = tempHome()
  const root = makeCorpus({ cases: DEMO_CASES, fixtures: { 1: { "hello.txt": "hello\n" } } })
  const runDir = join(home, ".local/share/opencode/evals/runs/resume-demo")
  const caseDir = join(runDir, "cases/demo--01")
  mkdirSync(join(caseDir, "draws"), { recursive: true })
  writeFileSync(
    join(runDir, "manifest.json"),
    JSON.stringify({
      run: "resume-demo",
      dir: runDir,
      label: "demo",
      arm: "with-skill",
      model: "default",
      agent: "build",
      level: "smoke",
      repoSha: "abc",
      params: { repeat: 1 },
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: null,
      status: "running",
      counts: null,
      skillHashes: {},
      stagedSkills: {},
    }),
  )
  writeFileSync(
    join(caseDir, "draws/r1.json"),
    JSON.stringify({
      skill: "demo",
      case: 1,
      status: "passed",
      reason: "",
      fixtureHash: "fixture",
      promptHash: "prompt",
      detectorVersion: "71bfb85a91cd68ab",
      skillHash: "skill",
      skillGate: { ok: true, reason: "loaded", loaded: ["demo"] },
      assertions: [],
      execution: { exit: 0 },
      arm: "with-skill",
      leak: [],
      contaminated: false,
      meta: {},
      transcript: join(caseDir, "transcript.md"),
    }),
  )

  const r = cli(
    ["run", "demo", "1", "--root", root, "--level", "smoke", "--repeat", "1", "--resume", runDir],
    { env: envWith(home) },
  )
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /demo #1: passed \[1\/1\]/)
  assert.equal(existsSync(join(caseDir, "result.json")), true)
  const manifest = JSON.parse(readFileSync(join(runDir, "manifest.json"), "utf8"))
  assert.equal(manifest.status, "completed")
})

// `inspect` reads a stored run. No model, no write.
test("inspect prints the stored status and the failing assertions", () => {
  const home = tempHome()
  const runDir = join(home, ".local/share/opencode/evals/runs/2026-01-01T00-00-00--demo")
  const caseDir = join(runDir, "cases/demo--01")
  mkdirSync(caseDir, { recursive: true })
  writeFileSync(
    join(runDir, "manifest.json"),
    JSON.stringify({
      run: "2026-01-01T00-00-00--demo",
      dir: runDir,
      label: "demo",
      arm: "with-skill",
      model: "default",
      level: "behavior",
      params: { repeat: 2, isolate: true, isolation: { enforced: true, mechanism: "seatbelt" } },
      status: "completed",
      counts: { passed: 0, failed: 1, unscored: 0 },
    }),
  )
  writeFileSync(
    join(caseDir, "result.json"),
    JSON.stringify({
      skill: "demo",
      case: 1,
      status: "failed",
      reps: 2,
      passed: 0,
      repetitions: [
        { rep: 1, status: "failed", assertions: [{ kind: "file", arg: "hello.txt", pass: false }] },
        { rep: 2, status: "failed", assertions: [{ kind: "verdict", arg: "APPROVE", pass: false }] },
      ],
    }),
  )
  const r = cli(["inspect", runDir], { env: envWith(home) })
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /status=completed/)
  assert.match(r.out, /demo#1: failed \[0\/2\]/)
  assert.match(r.out, /r1: file hello\.txt/)
  assert.match(r.out, /r2: verdict APPROVE/)
  const json = JSON.parse(cli(["inspect", runDir, "--json"], { env: envWith(home) }).out)
  assert.equal(json[0].cases[0].status, "failed")
})

test("inspect --replay re-reads stored transcripts and --changed exits 1 on a move", () => {
  const home = tempHome()
  const runDir = join(home, ".local/share/opencode/evals/runs/2026-01-01T00-00-00--demo")
  const caseDir = join(runDir, "cases/implement-from-prompt--02")
  mkdirSync(caseDir, { recursive: true })
  writeFileSync(
    join(caseDir, "transcript.md"),
    "# Eval: implement-from-prompt case 2\n\n**Scratch:** /tmp/x\n**Exit:** 0\n**Status:** passed\n\n## Transcript\n\n```\n{}\n```\n",
  )
  const r = cli(["inspect", runDir, "--replay", "--verbose"], { env: envWith(home) })
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /Replayed 1 transcript\(s\)/)
  assert.match(r.out, /failed passed -> failed/)
  const changed = cli(["inspect", runDir, "--replay", "--changed"], { env: envWith(home) })
  assert.equal(changed.code, 1, changed.out)
  assert.match(changed.out, /verdict\(s\) differ/)
})

// One explicit directory must be measured, not a prefix match that silently
// included a neighbour.
test("inspect --replay selects exactly the named run directories", () => {
  const home = tempHome()
  const seed = (name) => {
    const caseDir = join(home, ".local/share/opencode/evals/runs", name, "cases/implement-from-prompt--01")
    mkdirSync(caseDir, { recursive: true })
    writeFileSync(
      join(caseDir, "transcript.md"),
      "# Eval: implement-from-prompt case 1\n\n**Scratch:** /tmp/x\n**Exit:** 0\n**Status:** failed\n\n## Transcript\n\n```\n{}\n```\n",
    )
  }
  seed("2026-01-01T00-00-00--demo")
  seed("2026-01-02T00-00-00--demo")
  const one = cli(["inspect", join(home, ".local/share/opencode/evals/runs/2026-01-02T00-00-00--demo"), "--replay"], {
    env: envWith(home),
  })
  assert.equal(one.code, 0, one.err)
  assert.match(one.out, /Replayed 1 transcript/)
})

// The CLI branch is exercised with a draw that failed deterministically: it is
// skipped before the judge, so this test proves the wiring without a model call.
test("inspect --judge --json reports a skipped deterministic failure", () => {
  const home = tempHome()
  const caseDir = join(home, ".local/share/opencode/evals/runs/2026-01-01T00-00-00--demo/cases/implement-from-prompt--01")
  mkdirSync(caseDir, { recursive: true })
  writeFileSync(
    join(caseDir, "result.json"),
    JSON.stringify({
      skill: "implement-from-prompt",
      case: 1,
      status: "failed",
      repetitions: [
        {
          rep: 1,
          status: "failed",
          assertions: [{ kind: "reply", arg: "must exist", pass: false }],
          skillGate: { ok: true },
          execution: { exit: 0 },
        },
      ],
    }),
  )
  writeFileSync(
    join(caseDir, "transcript.r1.md"),
    "# Eval: implement-from-prompt case 1\n\n**Scratch:** /tmp/x\n**Exit:** 0\n**Status:** failed\n\n## Transcript\n\n```\n{}\n```\n",
  )
  const dir = join(home, ".local/share/opencode/evals/runs/2026-01-01T00-00-00--demo")
  const r = cli(["inspect", dir, "--judge", "default", "--json"], { env: envWith(home) })
  assert.equal(r.code, 0, r.err)
  const report = JSON.parse(r.out)
  assert.equal(report.length, 1)
  assert.equal(report[0].draws[0].outcome, "skipped")
  assert.match(report[0].draws[0].reason, /deterministic/)
  assert.deepEqual(report[0].tally, { total: 1, judged: 0, passed: 0, failed: 0, skipped: 1, deterministicFailed: 1 })
  // Human output must not reduce a skipped case to a meaningless `0/0 judged`.
  const text = cli(["inspect", dir, "--judge", "default"], { env: envWith(home) })
  assert.equal(text.code, 0, text.err)
  assert.match(text.out, /tally: 0\/1 judged passed, 1 skipped \(deterministic failures\)/)
  assert.match(text.out, /provenance: partial/)
})

test("inspect --leaks is model-free and refuses --judge", () => {
  const dir = mkdtempSync(join(tmpdir(), "inspect-leaks-"))
  rejects(["inspect", dir, "--leaks", "--judge", "default"], /--leaks is model-free/)
})

test("inspect --leaks needs a directory or --all", () => {
  const dir = mkdtempSync(join(tmpdir(), "inspect-leaks-"))
  rejects(["inspect", "--leaks", "--dir", dir], /--leaks needs one or more run directories/)
})

test("inspect --leaks reports a clean stored draw", () => {
  const home = tempHome()
  const runDir = join(home, ".local/share/opencode/evals/runs/2026-01-01T00-00-00--demo")
  const caseDir = join(runDir, "cases/demo--01")
  mkdirSync(caseDir, { recursive: true })
  writeFileSync(
    join(runDir, "manifest.json"),
    JSON.stringify({
      run: "2026-01-01T00-00-00--demo",
      status: "completed",
      params: { isolation: { enforced: true, mechanism: "seatbelt" } },
    }),
  )
  writeFileSync(
    join(caseDir, "transcript.md"),
    "# Eval: demo case 1\n\n**Scratch:** /tmp/scratch\n**Exit:** 0\n**Status:** passed\n\n## Transcript\n\n```\n{}\n```\n",
  )
  const r = cli(["inspect", runDir, "--leaks"], { env: envWith(home) })
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /demo#1 → clean/)
  assert.match(r.out, /1 cell\(s\), 0 dirty/)
})

// ---------------------------------------------------------------------------
// compare: reuse, scorecard, artefact shape. Seeded arms mean no model call.
// ---------------------------------------------------------------------------

function seedArm(home, { id, arm, skillId, c, identity, statuses, requested = statuses.length, contaminated = [], judged = [], stoppedEarly = false }) {
  const dir = join(home, ".local/share/opencode/evals/runs", id)
  const caseDir = join(dir, "cases", `${skillId}--${String(c.n).padStart(2, "0")}`)
  mkdirSync(caseDir, { recursive: true })
  const probe = probeIsolation()
  const isolation = { enforced: probe.enforced, mechanism: probe.enforced ? probe.mechanism : null, reason: "seed" }
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({
      run: id,
      dir,
      label: skillId,
      arm,
      model: "default",
      agent: "build",
      level: "behavior",
      repoSha: "abc",
      params: { repeat: requested, isolate: true, isolation, effectiveModel: "default", baseline: null },
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:10:00.000Z",
      status: "completed",
      counts: { passed: statuses.filter((s) => s === "passed").length, failed: 0, unscored: 0 },
      skillHashes: {},
      stagedSkills: {},
    }),
  )
  const contaminatedSet = new Set(contaminated)
  const judgedSet = new Set(judged)
  const draw = (status, i) => ({
    rep: i + 1,
    status: contaminatedSet.has(i) ? "unscored" : status,
    reason: contaminatedSet.has(i) ? "contaminated" : status === "passed" ? "" : "file hello.txt",
    assertions: c.assert.map((a) => ({ ...a, pass: status === "passed" })),
    skillGate: { ok: true, reason: arm === "without-skill" ? "no skill loaded (control arm)" : "loaded" },
    execution: { exit: 0, durationMs: 1000 + i * 100, tokens: { input: 1000, output: 200 } },
    fixtureHash: identity.fixtureHash,
    promptHash: identity.promptHash,
    skillHash: identity.skillHash,
    ...(contaminatedSet.has(i) ? { contaminated: true } : {}),
    ...(judgedSet.has(i) ? { semantic: { model: "judge", threshold: 0.8, score: 1, expectations: [] } } : {}),
  })
  const clean = statuses.length - contaminatedSet.size
  const passed = statuses.filter((s, i) => s === "passed" && !contaminatedSet.has(i)).length
  writeFileSync(
    join(caseDir, "result.json"),
    JSON.stringify({
      skill: skillId,
      case: c.n,
      status: passed === clean ? "passed" : "failed",
      reason: passed === clean ? "" : "file hello.txt",
      reps: statuses.length,
      passed,
      passRate: clean ? passed / clean : 0,
      stoppedEarly,
      contaminated: contaminatedSet.size,
      fixtureHash: identity.fixtureHash,
      promptHash: identity.promptHash,
      detectorVersion: "seed",
      skillHash: identity.skillHash,
      repetitions: statuses.map(draw),
    }),
  )
}

// The fixture identity a fresh `compare` computes, without a model.
function demoContext(root) {
  const skill = { id: "demo", dir: join(root, "skills", "demo") }
  const { cases } = readEvals(join(root, "evals", "demo", "cases.md"), "demo", { skillDir: skill.dir })
  const c = cases[0]
  const scratch = makeScratch(skill.id, c.n)
  let fixtureHash
  try {
    fixtureHash = stageFixture(skill, c, scratch).hash
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
  return {
    skill,
    c,
    skillHash: stagedTreeHash(skill.dir),
    common: { promptHash: textHash(c.prompt), fixtureHash, gradingHash: gradingHash({ assert: c.assert, gate: c.gate }) },
  }
}

// A no-model stand-in for the agent. A behavior draw must be *attempted* to prove
// it was not reused; the fake exits cleanly with an empty stream, so the draw is
// scored (and fails its reply/gate) without a provider call.
function fakeOpencodeEnv(home) {
  const bin = join(home, "bin")
  mkdirSync(bin, { recursive: true })
  writeFileSync(join(bin, "opencode"), "#!/bin/sh\nexit 0\n", { mode: 0o755 })
  return { ...process.env, HOME: home, PATH: `${bin}:${process.env.PATH}` }
}

function seedRunDir(home, id, { status, skill = "demo", n = 1 }) {
  const dir = join(home, ".local/share/opencode/evals/runs", id)
  const caseDir = join(dir, "cases", `${skill}--${String(n).padStart(2, "0")}`)
  mkdirSync(caseDir, { recursive: true })
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ run: id, status: "completed", level: "behavior" }))
  writeFileSync(
    join(caseDir, "result.json"),
    JSON.stringify({ skill, case: n, status, reason: status === "passed" ? "" : "file hello.txt" }),
  )
  return dir
}

test("compare reuses an arm only when all six inputs match, and prints its decision", () => {
  const home = tempHome()
  const root = makeCorpus({ cases: DEMO_CASES, fixtures: { 1: { "hello.txt": "hello\n" } } })
  const skill = { id: "demo", dir: join(root, "skills", "demo") }
  const { cases } = readEvals(join(root, "evals", "demo", "cases.md"), "demo", { skillDir: skill.dir })
  const c = cases[0]

  const scratch = makeScratch(skill.id, c.n)
  let fixtureHash
  try {
    fixtureHash = stageFixture(skill, c, scratch).hash
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
  const skillHash = stagedTreeHash(skill.dir)
  const common = { promptHash: textHash(c.prompt), fixtureHash, gradingHash: gradingHash({ assert: c.assert, gate: c.gate }) }

  seedArm(home, { id: "2026-01-01T00-00-01--demo--without-skill", arm: "without-skill", skillId: "demo", c, identity: { ...common, skillHash: null }, statuses: ["failed", "failed", "failed"] })
  seedArm(home, { id: "2026-01-01T00-00-02--demo", arm: "with-skill", skillId: "demo", c, identity: { ...common, skillHash }, statuses: ["passed", "passed", "passed"] })

  const r = cli(["compare", "demo", "1", "--root", root], { env: envWith(home) })
  assert.equal(r.code, 0, r.err)
  assert.equal((r.err.match(/reused /g) ?? []).length, 2, r.err)
  assert.match(r.out, /demo #1\s+default\s+screening \(3\/arm\)/)
  assert.match(r.out, /none\s+3\/3\s+0\/3/)
  assert.match(r.out, /candidate\s+3\/3\s+3\/3/)
  assert.match(r.out, /-> improves/)

  const record = JSON.parse(cli(["compare", "demo", "1", "--root", root, "--json"], { env: envWith(home) }).out)
  assert.equal(record.repeat, 3)
  assert.equal(record.arms.length, 2)
  assert.deepEqual(record.arms.map((a) => a.arm), ["none", "candidate"])
  assert.equal(record.arms.every((a) => a.reused), true)
  // The summary is the existing run record, not a second schema.
  assert.equal(record.arms[1].summary.results[0].status, "passed")
  assert.equal(record.arms[1].manifest.run, "2026-01-01T00-00-02--demo")
})

test("compare --against refuses a ref that is not a commit", () => {
  const root = makeCorpus({ cases: DEMO_CASES })
  const r = cli(["compare", "demo", "1", "--root", root, "--against", "not-a-ref"])
  assert.equal(r.code, 1, r.err)
  assert.match(r.err, /is not a commit/)
})

test("compare needs exactly one case", () => {
  rejects(["compare", "demo", "--root", "skills"], /compare needs <skill> <n>/)
})

// The scorecard's arrow compares rates. `none 5/5` and `candidate 4/4` are both
// 100%; a numerator comparison called the smaller clean denominator a regression.
test("compare scores by rate, not by numerator, and labels five draws evidence", () => {
  const home = tempHome()
  const root = makeCorpus({ cases: DEMO_CASES, fixtures: { 1: { "hello.txt": "hello\n" } } })
  const { c, common, skillHash } = demoContext(root)
  seedArm(home, { id: "2026-01-01T00-00-01--demo--without-skill", arm: "without-skill", skillId: "demo", c, identity: { ...common, skillHash: null }, statuses: ["passed", "passed", "passed", "passed", "passed"], requested: 5 })
  seedArm(home, { id: "2026-01-01T00-00-02--demo", arm: "with-skill", skillId: "demo", c, identity: { ...common, skillHash }, statuses: ["passed", "passed", "passed", "passed", "passed"], requested: 5, contaminated: [4] })

  const r = cli(["compare", "demo", "1", "--root", root, "--repeat", "5"], { env: envWith(home) })
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /evidence \(5\/arm\)/)
  assert.match(r.out, /none\s+5\/5\s+5\/5/)
  assert.match(r.out, /candidate\s+4\/5\s+4\/4/)
  assert.doesNotMatch(r.out, /->/)
})

test("compare reports a genuinely worse rate as a regression", () => {
  const home = tempHome()
  const root = makeCorpus({ cases: DEMO_CASES, fixtures: { 1: { "hello.txt": "hello\n" } } })
  const { c, common, skillHash } = demoContext(root)
  seedArm(home, { id: "2026-01-01T00-00-01--demo--without-skill", arm: "without-skill", skillId: "demo", c, identity: { ...common, skillHash: null }, statuses: ["passed", "passed", "passed", "passed", "failed"], requested: 5 })
  seedArm(home, { id: "2026-01-01T00-00-02--demo", arm: "with-skill", skillId: "demo", c, identity: { ...common, skillHash }, statuses: ["passed", "passed", "passed", "failed", "failed"], requested: 5 })

  const r = cli(["compare", "demo", "1", "--root", root, "--repeat", "5"], { env: envWith(home) })
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /candidate\s+5\/5\s+3\/5\s+.*-> regresses/)
})

// An arm stopped by --stop did not run the requested draws, so it is not the
// experiment the heading describes. It must be rerun, not reused.
test("compare does not reuse a stopped-early arm with fewer draws than requested", () => {
  const home = tempHome()
  const root = makeCorpus({ cases: DEMO_CASES, fixtures: { 1: { "hello.txt": "hello\n" } } })
  const { c, common, skillHash } = demoContext(root)
  seedArm(home, { id: "none-run", arm: "without-skill", skillId: "demo", c, identity: { ...common, skillHash: null }, statuses: ["failed", "failed", "failed"] })
  seedArm(home, { id: "candidate-run", arm: "with-skill", skillId: "demo", c, identity: { ...common, skillHash }, statuses: ["passed", "passed"], requested: 3, stoppedEarly: true })

  const r = cli(["compare", "demo", "1", "--root", root], { env: fakeOpencodeEnv(home) })
  assert.equal(r.code, 0, r.err)
  assert.match(r.err, /reused .*none-run/)
  assert.doesNotMatch(r.err, /reused .*candidate-run/)
  assert.match(r.err, /ran /)
})

// A stored judged arm carries a score the non-judged compare cannot justify.
test("compare does not reuse a judged arm", () => {
  const home = tempHome()
  const root = makeCorpus({ cases: DEMO_CASES, fixtures: { 1: { "hello.txt": "hello\n" } } })
  const { c, common, skillHash } = demoContext(root)
  seedArm(home, { id: "none-run", arm: "without-skill", skillId: "demo", c, identity: { ...common, skillHash: null }, statuses: ["failed", "failed", "failed"] })
  seedArm(home, { id: "candidate-run", arm: "with-skill", skillId: "demo", c, identity: { ...common, skillHash }, statuses: ["passed", "passed", "passed"], judged: [1] })

  const r = cli(["compare", "demo", "1", "--root", root], { env: fakeOpencodeEnv(home) })
  assert.equal(r.code, 0, r.err)
  assert.match(r.err, /reused .*none-run/)
  assert.doesNotMatch(r.err, /reused .*candidate-run/)
  assert.match(r.err, /ran /)
})

// `compare <run-dir-a> <run-dir-b>` is the whole-run regression gate.
test("compare run directories prints the diff and exits 1 on a regression", () => {
  const home = tempHome()
  const before = seedRunDir(home, "2026-01-01T00-00-00--demo", { status: "passed" })
  const after = seedRunDir(home, "2026-01-02T00-00-00--demo", { status: "failed" })
  const r = cli(["compare", before, after], { env: envWith(home) })
  assert.equal(r.code, 1, r.out)
  assert.match(r.out, /Baseline: /)
  assert.match(r.out, /REGRESSION demo#1: passed → failed/)
})

test("compare run directories exits 0 with no regressions", () => {
  const home = tempHome()
  const before = seedRunDir(home, "2026-01-01T00-00-00--demo", { status: "passed" })
  const after = seedRunDir(home, "2026-01-02T00-00-00--demo", { status: "passed" })
  const r = cli(["compare", before, after], { env: envWith(home) })
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /no regressions/)
})

// The stopped-early line names the draws that ran, never the ceiling.
test("inspect reports a stopped-early case against the requested repeat", () => {
  const home = tempHome()
  const dir = join(home, ".local/share/opencode/evals/runs/2026-01-01T00-00-00--demo")
  const caseDir = join(dir, "cases/demo--01")
  mkdirSync(caseDir, { recursive: true })
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ run: "x", status: "completed", params: { repeat: 3 } }))
  writeFileSync(
    join(caseDir, "result.json"),
    JSON.stringify({ skill: "demo", case: 1, status: "passed", reps: 2, passed: 2, stoppedEarly: true, repetitions: [{ rep: 1, status: "passed" }, { rep: 2, status: "passed" }] }),
  )
  const r = cli(["inspect", dir], { env: envWith(home) })
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /demo#1: passed \[2\/2\] stopped early \(2\/3\)/)
})

test("inspect --judge refuses a bare flag instead of guessing a model", () => {
  const dir = mkdtempSync(join(tmpdir(), "inspect-judge-"))
  rejects(["inspect", dir, "--judge"], /--judge needs a model/)
})

test("inspect --leaks --all can narrow the store by --skill", () => {
  const home = tempHome()
  const seed = (run, skill) => {
    const caseDir = join(home, ".local/share/opencode/evals/runs", run, "cases", `${skill}--01`)
    mkdirSync(caseDir, { recursive: true })
    writeFileSync(
      join(caseDir, "transcript.md"),
      `# Eval: ${skill} case 1\n\n**Scratch:** /tmp/scratch\n**Exit:** 0\n**Status:** passed\n\n## Transcript\n\n\`\`\`\n{}\n\`\`\`\n`,
    )
    writeFileSync(join(home, ".local/share/opencode/evals/runs", run, "manifest.json"), JSON.stringify({ status: "completed" }))
  }
  seed("2026-01-01T00-00-00--a", "capture-idea")
  seed("2026-01-02T00-00-00--b", "process-inbox")
  const store = join(home, ".local/share/opencode/evals")
  const r = cli(["inspect", "--leaks", "--all", "--skill", "capture-idea", "--dir", store], { env: envWith(home) })
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, /capture-idea#1 → clean/)
  assert.doesNotMatch(r.out, /process-inbox#1/)
  assert.match(r.out, /1 cell\(s\), 0 dirty/)
})

// The run-dir form reads two directories; a flag that only makes sense for the
// arm form is a usage error, never accepted and ignored.
test("compare run directories refuses every flag it cannot honour", () => {
  const home = tempHome()
  const before = seedRunDir(home, "2026-01-01T00-00-00--demo", { status: "passed" })
  const after = seedRunDir(home, "2026-01-02T00-00-00--demo", { status: "passed" })
  rejects(["compare", before, after, "--repeat", "5"], /--repeat cannot be used with compare <run-dir-a> <run-dir-b>/)
  rejects(["compare", before, after, "--verbose"], /--verbose cannot be used with compare <run-dir-a> <run-dir-b>/)
  rejects(["compare", before, after, "--against", "main"], /--against cannot be used with compare <run-dir-a> <run-dir-b>/)
})

// `run`'s own stopped-early line: the ceiling is never printed as the count.
// The no-op opencode shim fails the gate without a model, so --stop 5/1 fires
// after one draw and the line says (1/5), not (5/5).
test("run reports the draws that actually ran when --stop fires", () => {
  const home = tempHome()
  const root = makeCorpus({ cases: DEMO_CASES, fixtures: { 1: { "hello.txt": "hello\n" } } })
  const r = cli(["run", "demo", "1", "--root", root, "--repeat", "5", "--stop", "5/1", "--concurrency", "1"], {
    env: fakeOpencodeEnv(home),
  })
  assert.equal(r.code, 1, r.err)
  assert.match(r.out, /stopped early \(1\/5\)/)
  assert.doesNotMatch(r.out, /stopped early \(5\/5\)/)
})
