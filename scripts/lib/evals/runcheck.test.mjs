import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { checkRun, isPreDetector } from "./runcheck.mjs"

const gate = ({ ok = true, loaded = ["implement-from-prompt"], reason = "loaded implement-from-prompt" } = {}) => ({
  ok,
  loaded,
  reason,
})

const controlGate = () => ({ ok: true, loaded: [], reason: "no skill loaded (control arm)" })

const rep = (overrides = {}) => ({
  skill: "implement-from-prompt",
  case: 1,
  status: "passed",
  arm: "with-skill",
  leak: [],
  contaminated: false,
  skillGate: gate(),
  ...overrides,
})

const aggregate = (reps, overrides = {}) => ({
  skill: "implement-from-prompt",
  case: 1,
  arm: "with-skill",
  status: "passed",
  contaminated: reps.filter((r) => r.contaminated).length,
  repetitions: reps,
  ...overrides,
})

const kinds = (findings) => findings.map((f) => f.kind)

test("a clean with-skill run at 5/5 has no findings", () => {
  const cases = [aggregate(Array.from({ length: 5 }, (_, i) => rep({ rep: i + 1 })))]
  const { findings, counts } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(findings, [])
  assert.deepEqual(counts, { cases: 1, reps: 5, findings: 0, infrastructure: 0 })
})

test("a clean control run at 0/5 is not dirty just because it failed", () => {
  const reps = Array.from({ length: 5 }, (_, i) =>
    rep({ rep: i + 1, status: "failed", arm: "without-skill", skillGate: controlGate() }),
  )
  const { findings, counts } = checkRun({ arm: "without-skill", cases: [aggregate(reps, { contaminated: 0 })] })
  assert.deepEqual(findings, [])
  assert.deepEqual(counts, { cases: 1, reps: 5, findings: 0, infrastructure: 0 })
})

test("a control repetition that loaded a skill is a gate miss", () => {
  const cases = [
    aggregate([
      rep({ rep: 1, arm: "without-skill", skillGate: controlGate() }),
      rep({
        rep: 2,
        arm: "without-skill",
        skillGate: { ok: false, loaded: ["review-code"], reason: "LOADED — the control arm is broken" },
      }),
    ]),
  ]
  const { findings } = checkRun({ arm: "without-skill", cases })
  assert.deepEqual(kinds(findings), ["gate-miss"])
  assert.equal(findings[0].case, "implement-from-prompt#1")
  assert.equal(findings[0].rep, 2)
  assert.match(findings[0].detail, /control arm loaded review-code/)
})

test("a with-skill repetition that lost the gate is a gate miss", () => {
  const cases = [aggregate([rep({ rep: 1, skillGate: { ok: false, loaded: [], reason: "skill not loaded" } })])]
  const { findings } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["gate-miss"])
  assert.equal(findings[0].rep, 1)
  assert.match(findings[0].detail, /skill not loaded/)
})

test("a repetition with no skillGate is unknown provenance, not clean", () => {
  const r = rep({ rep: 3 })
  delete r.skillGate
  const { findings } = checkRun({ arm: "with-skill", cases: [aggregate([r])] })
  assert.deepEqual(kinds(findings), ["provenance"])
  assert.equal(findings[0].rep, 3)
  assert.match(findings[0].detail, /skillGate missing/)
})

test("a repetition with no leak field fails as missing provenance", () => {
  const r = rep({ rep: 2 })
  delete r.leak
  const { findings } = checkRun({ arm: "with-skill", cases: [aggregate([r])] })
  assert.deepEqual(kinds(findings), ["leak-missing"])
  assert.equal(findings[0].rep, 2)
  assert.match(findings[0].detail, /leak field missing/)
})

test("a run with no leak field at all is recognised as pre-detector", () => {
  const reps = Array.from({ length: 12 }, (_, i) => rep({ rep: i + 1 }))
  for (const r of reps) delete r.leak
  const cases = [aggregate(reps)]
  assert.equal(isPreDetector(cases, "2026-11-05T15:35:30.459Z"), true)
  assert.equal(isPreDetector(cases, "2026-11-06T10:05:00.000Z"), false)
  assert.equal(isPreDetector(cases), false, "fails closed without a start time")

  // The pure rule stays strict; the CLI downgrades these to warnings for the
  // historical artefact so the old run remains citable.
  const { findings, counts } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), Array(12).fill("leak-missing"))
  assert.deepEqual(counts, { cases: 1, reps: 12, findings: 12, infrastructure: 0 })
})

test("a run that carries leak somewhere must carry it everywhere", () => {
  const missing = rep({ rep: 2 })
  delete missing.leak
  const cases = [aggregate([rep({ rep: 1 }), missing])]
  assert.equal(isPreDetector(cases), false)

  const { findings } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["leak-missing"])
  assert.equal(findings[0].rep, 2)
})

test("a contaminated repetition is a finding even with an empty leak list", () => {
  const cases = [aggregate([rep({ rep: 4, contaminated: true, leak: [] })])]
  const { findings } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["contaminated"])
  assert.equal(findings[0].rep, 4)
})

test("an infrastructure draw is its own finding, not a gate miss", () => {
  const cases = [
    aggregate([
      rep({ rep: 1 }),
      rep({
        rep: 2,
        status: "unscored",
        reason: "infrastructure: timeout",
        infrastructure: true,
        infrastructureReason: "timeout",
        skillGate: { ok: false, loaded: [], reason: "killed before it could load" },
        execution: { retries: 1 },
      }),
    ]),
  ]
  const { findings, counts } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["infrastructure"])
  assert.equal(findings[0].case, "implement-from-prompt#1")
  assert.equal(findings[0].rep, 2)
  assert.match(findings[0].detail, /infrastructure: timeout \(retried 1x\)/)
  assert.equal(counts.infrastructure, 1)
  assert.equal(counts.findings, 1, "the run is not clean")
})

test("an unscored reason naming infrastructure is recognised without the flag", () => {
  const cases = [aggregate([rep({ rep: 1, status: "unscored", reason: "infrastructure: stalled" })])]
  const { findings, counts } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["infrastructure"])
  assert.match(findings[0].detail, /stalled/)
  assert.equal(counts.infrastructure, 1)
})

test("a run without manifest.json falls back to each repetition's arm", () => {
  const cases = [
    aggregate([
      rep({ rep: 1, arm: "with-skill" }),
      rep({ rep: 2, arm: "with-skill" }),
      rep({ rep: 3, arm: "without-skill", skillGate: controlGate() }),
    ]),
  ]
  const { findings, counts } = checkRun({ cases })
  assert.deepEqual(findings, [])
  assert.equal(counts.reps, 3)
})

test("the aggregated case reads repetitions[] and names the leaking draw", () => {
  const cases = [
    aggregate([
      rep({ rep: 1 }),
      rep({
        rep: 2,
        leak: [{ tool: "shell", path: "/Users/me/.agents/skills/implement-from-prompt/SKILL.md" }],
      }),
    ]),
  ]
  const { findings } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["leak"])
  assert.equal(findings[0].case, "implement-from-prompt#1")
  assert.equal(findings[0].rep, 2)
  assert.match(findings[0].detail, /SKILL\.md/)
})

test("a single-draw result is the repetition at the root", () => {
  const root = rep({ rep: 1, skillGate: gate({ ok: false, loaded: [], reason: "MISSING" }) })
  const { findings, counts } = checkRun({ arm: "with-skill", cases: [root] })
  assert.deepEqual(counts, { cases: 1, reps: 1, findings: 1, infrastructure: 0 })
  assert.deepEqual(kinds(findings), ["gate-miss"])
  assert.equal(findings[0].rep, 1)
})

// The CLI is the part that touches the filesystem; the tests above cover the
// pure rule. These run the real script against synthetic run directories in
// $TMPDIR so the exit codes and the summary cannot drift.
const CLI = fileURLToPath(new URL("../../check-eval-run.mjs", import.meta.url))

function makeRun(t, { manifest, cases = [] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "pdlc-runcheck-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  if (manifest !== undefined) writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest))
  for (const c of cases) {
    const caseDir = join(dir, "cases", c.name)
    mkdirSync(caseDir, { recursive: true })
    if (c.result !== undefined) writeFileSync(join(caseDir, "result.json"), JSON.stringify(c.result))
  }
  return dir
}

const runCli = (dir) => spawnSync(process.execPath, [CLI, dir], { encoding: "utf8" })
const modern = (overrides = {}) => ({ arm: "with-skill", status: "completed", startedAt: "2026-11-06T12:00:00.000Z", ...overrides })

test("CLI exits 0 for a clean completed run", (t) => {
  const dir = makeRun(t, { manifest: modern(), cases: [{ name: "x--01", result: aggregate([rep({ rep: 1 })]) }] })
  const r = runCli(dir)
  assert.equal(r.status, 0)
  assert.match(r.stdout, /findings=0 warnings=0/)
})

test("CLI exits 1 and names a leaking draw", (t) => {
  const leak = [{ tool: "shell", path: "/Users/me/.agents/skills/x/SKILL.md" }]
  const dir = makeRun(t, {
    manifest: modern(),
    cases: [{ name: "x--01", result: aggregate([rep({ rep: 2, leak })]) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /leak implement-from-prompt#1 r2/)
  assert.match(r.stdout, /SKILL\.md/)
})

test("CLI treats an infrastructure draw as incomplete evidence, not clean", (t) => {
  const dir = makeRun(t, {
    manifest: modern(),
    cases: [
      {
        name: "x--01",
        result: aggregate([
          rep({ rep: 1 }),
          rep({
            rep: 2,
            status: "unscored",
            reason: "infrastructure: timeout",
            infrastructure: true,
            infrastructureReason: "timeout",
          }),
        ]),
      },
    ],
  })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /infrastructure implement-from-prompt#1 r2/)
  assert.doesNotMatch(r.stdout, /gate-miss/)
})

test("CLI exits 2 for a path that is not a run dir", () => {
  const dir = mkdtempSync(join(tmpdir(), "pdlc-runcheck-missing-"))
  rmSync(dir, { recursive: true, force: true })
  const r = runCli(dir)
  assert.equal(r.status, 2)
  assert.match(r.stderr, /not a readable run dir/)
})

test("CLI downgrades a pre-detector run to warnings and reports them", (t) => {
  const old = rep({ rep: 1 })
  delete old.leak
  const dir = makeRun(t, {
    manifest: modern({ startedAt: "2026-11-05T15:35:30.459Z" }),
    cases: [{ name: "x--01", result: aggregate([old]) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 0)
  assert.match(r.stdout, /warn leak-missing implement-from-prompt#1 r1/)
  assert.match(r.stdout, /pre-SPEC-0017 artefact/)
  assert.match(r.stdout, /findings=0 warnings=1/)
})

test("CLI falls back to the repetition's arm without manifest.json", (t) => {
  const control = rep({
    rep: 1,
    arm: "without-skill",
    status: "failed",
    skillGate: { ok: true, loaded: [], reason: "no skill loaded (control arm)" },
  })
  const dir = makeRun(t, { cases: [{ name: "x--01", result: control }] })
  const r = runCli(dir)
  assert.equal(r.status, 0)
  assert.match(r.stdout, /findings=0 warnings=0/)
})

test("CLI fails a manifest-only run as incomplete", (t) => {
  const dir = makeRun(t, { manifest: modern() })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /incomplete cases r0 — run contains no case results/)
})

test("CLI fails a run whose manifest never completed", (t) => {
  const dir = makeRun(t, {
    manifest: modern({ status: "running" }),
    cases: [{ name: "x--01", result: aggregate([rep({ rep: 1 })]) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /incomplete manifest r0 — status running; run did not complete/)
})

test("CLI fails a case directory without result.json", (t) => {
  const dir = makeRun(t, { manifest: modern(), cases: [{ name: "x--01" }] })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /incomplete x--01 r0 — case directory has no result\.json/)
})
