import test from "node:test"
import assert from "node:assert/strict"
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
  assert.deepEqual(counts, { cases: 1, reps: 5, findings: 0 })
})

test("a clean control run at 0/5 is not dirty just because it failed", () => {
  const reps = Array.from({ length: 5 }, (_, i) =>
    rep({ rep: i + 1, status: "failed", arm: "without-skill", skillGate: controlGate() }),
  )
  const { findings, counts } = checkRun({ arm: "without-skill", cases: [aggregate(reps, { contaminated: 0 })] })
  assert.deepEqual(findings, [])
  assert.deepEqual(counts, { cases: 1, reps: 5, findings: 0 })
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
  assert.deepEqual(counts, { cases: 1, reps: 12, findings: 12 })
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
  assert.deepEqual(counts, { cases: 1, reps: 1, findings: 1 })
  assert.deepEqual(kinds(findings), ["gate-miss"])
  assert.equal(findings[0].rep, 1)
})
