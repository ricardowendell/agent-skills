import test from "node:test"
import assert from "node:assert/strict"
import { classify, aggregateReps, caseResult, contaminate, summarize, PASSED, FAILED, UNSCORED } from "./result.mjs"

const pass = { kind: "file", arg: "AGENTS.md", pass: true }
const fail = { kind: "verdict", arg: "APPROVE", pass: false }
const okGate = { ok: true, reason: "loaded review-code" }
const badGate = { ok: false, reason: "skill 'review-code' was not loaded" }

test("exit 0 with no assertions is unscored, never passed", () => {
  const r = classify({ exit: 0, asserts: [], skillGate: okGate })
  assert.equal(r.status, UNSCORED)
})

test("a non-zero exit fails even when every assertion passed", () => {
  assert.equal(classify({ exit: 1, asserts: [pass], skillGate: okGate }).status, FAILED)
})

test("a timeout is infrastructure, never a behavioural failure", () => {
  const r = classify({ exit: "timeout", asserts: [pass], skillGate: okGate })
  assert.equal(r.status, UNSCORED)
  assert.equal(r.reason, "infrastructure: timeout")
  assert.equal(r.infrastructure, true)
  assert.equal(r.infrastructureReason, "timeout")
})

test("a stall is its own infrastructure reason, distinct from a timeout", () => {
  const r = classify({ exit: "stalled", asserts: [], skillGate: null })
  assert.equal(r.status, UNSCORED)
  assert.equal(r.reason, "infrastructure: stalled")
  assert.equal(r.infrastructureReason, "stalled")
})

test("an infrastructure draw is excluded from the pass-rate denominator", () => {
  const agg = aggregateReps([{ status: PASSED }, { status: UNSCORED, infrastructure: true, reason: "infrastructure: timeout" }])
  assert.equal(agg.status, PASSED)
  assert.equal(agg.passed, 1)
  assert.equal(agg.passRate, 1)
  assert.equal(agg.infrastructure, 1)
  assert.match(agg.reason, /1\/2 repetition\(s\) infrastructure/)
})

test("a case whose only draws were infrastructure is unscored, never failed", () => {
  const agg = aggregateReps([
    { status: UNSCORED, infrastructure: true, reason: "infrastructure: timeout" },
    { status: UNSCORED, infrastructure: true, reason: "infrastructure: stalled" },
  ])
  assert.equal(agg.status, UNSCORED)
  assert.equal(agg.passed, 0)
  assert.equal(agg.infrastructure, 2)
  assert.match(agg.reason, /every repetition infrastructure/)
})

test("one failed assertion fails the case", () => {
  const r = classify({ exit: 0, asserts: [pass, fail], skillGate: okGate })
  assert.equal(r.status, FAILED)
  assert.match(r.reason, /1\/2 assertion/)
})

test("a run that loaded the wrong skill fails despite green assertions", () => {
  const r = classify({ exit: 0, asserts: [pass], skillGate: badGate })
  assert.equal(r.status, FAILED)
  assert.match(r.reason, /not loaded/)
})

test("everything green and the right skill loaded passes", () => {
  assert.equal(classify({ exit: 0, asserts: [pass], skillGate: okGate }).status, PASSED)
})

test("no gate means no gate check (cases that should not load a skill)", () => {
  assert.equal(classify({ exit: 0, asserts: [pass], skillGate: null }).status, PASSED)
})

test("every repetition must pass by default", () => {
  const agg = aggregateReps([{ status: "passed" }, { status: "failed", reason: "judge: expectation 4" }, { status: "passed" }])
  assert.equal(agg.status, "failed")
  assert.equal(agg.passRate, 2 / 3)
  assert.match(agg.reason, /2\/3 repetitions/)
  assert.match(agg.reason, /expectation 4/)
})

test("a flake can pass only when the bar is lowered explicitly", () => {
  const reps = [{ status: "passed" }, { status: "passed" }, { status: "failed", reason: "verdict" }]
  assert.equal(aggregateReps(reps, 0.66).status, "passed")
  assert.match(aggregateReps(reps, 0.66).reason, /min 0.66/)
})

test("all repetitions unscored is unscored, not failed", () => {
  const agg = aggregateReps([{ status: "unscored" }, { status: "unscored" }])
  assert.equal(agg.status, "unscored")
})

test("a mix of unscored and passed follows the pass rate", () => {
  const agg = aggregateReps([{ status: "passed" }, { status: "unscored" }])
  assert.equal(agg.status, "failed")
  assert.equal(agg.passRate, 0.5)
})

test("caseResult fills the case identity once and lets the caller override", () => {
  const r = caseResult({ id: "review-code" }, { n: 3, title: "Review", prompt: "Do it" }, { status: "failed" })
  assert.deepEqual(r, { skill: "review-code", case: 3, title: "Review", prompt: "Do it", status: "failed" })
})

test("a leak turns a green result into an unscored, contaminated one", () => {
  const leak = [{ tool: "read", path: "/Users/me/.agents/skills/review-code/SKILL.md" }]
  const r = contaminate({ status: PASSED, reason: "" }, leak)
  assert.equal(r.status, UNSCORED)
  assert.equal(r.contaminated, true)
  assert.deepEqual(r.leak, leak)
  assert.match(r.reason, /contaminated/)
  assert.match(r.reason, /\.agents\/skills\/review-code/)
})

test("a single-draw contamination says every repetition was contaminated", () => {
  const r = contaminate(
    { status: PASSED, reason: "" },
    [{ tool: "read", path: "/Users/me/.agents/skills/review-code/SKILL.md" }],
    { all: true },
  )
  assert.equal(r.status, UNSCORED)
  assert.match(r.reason, /^every repetition contaminated/)
})

test("a clean result records an empty leak and stays as it was", () => {
  const r = contaminate({ status: PASSED, reason: "" }, [])
  assert.equal(r.status, PASSED)
  assert.equal(r.contaminated, false)
  assert.deepEqual(r.leak, [])
})

test("a contaminated repetition never counts as a pass, even when its assertions are green", () => {
  const agg = aggregateReps([
    { status: PASSED, contaminated: true, leak: [{ tool: "read", path: "/Users/me/.agents/skills/review-code/SKILL.md" }] },
  ])
  assert.equal(agg.status, UNSCORED)
  assert.equal(agg.passed, 0)
  assert.equal(agg.contaminated, 1)
  assert.match(agg.reason, /^every repetition contaminated/)
  assert.match(agg.reason, /\.agents\/skills\/review-code/)
})

test("a contaminated draw is removed from the denominator", () => {
  const agg = aggregateReps([{ status: PASSED }, { status: PASSED, contaminated: true, leak: [] }])
  assert.equal(agg.passed, 1)
  assert.equal(agg.passRate, 1)
  assert.equal(agg.contaminated, 1)
  assert.equal(agg.status, PASSED)
})

test("the case status comes only from the clean draws", () => {
  const agg = aggregateReps([
    { status: FAILED, reason: "verdict APPROVE" },
    { status: PASSED, contaminated: true, leak: [] },
    { status: PASSED },
  ])
  assert.equal(agg.passed, 1)
  assert.equal(agg.passRate, 0.5)
  assert.equal(agg.contaminated, 1)
  assert.equal(agg.status, FAILED)
  assert.match(agg.reason, /verdict/)
})

test("a case with no clean draw is unscored, never failed", () => {
  const agg = aggregateReps([{ status: FAILED, contaminated: true, leak: [] }, { status: PASSED, contaminated: true, leak: [] }])
  assert.equal(agg.status, UNSCORED)
  assert.equal(agg.passRate, 0)
  assert.equal(agg.reason, "every repetition contaminated")
})

test("summarize counts contaminated repetitions apart and never as failed", () => {
  const totals = summarize([
    { status: PASSED },
    { status: UNSCORED, contaminated: true, leak: [] },
    {
      status: FAILED,
      contaminated: 2,
      repetitions: [
        { status: UNSCORED, contaminated: true },
        { status: UNSCORED, contaminated: true },
        { status: FAILED, reason: "reply" },
      ],
    },
  ])
  assert.deepEqual(totals, { passed: 1, failed: 1, unscored: 1, contaminated: 3, infrastructure: 0, total: 3 })
})

test("summarize counts infrastructure draws apart, never as failed", () => {
  const totals = summarize([
    { status: PASSED },
    { status: UNSCORED, infrastructure: true, reason: "infrastructure: timeout" },
    {
      status: PASSED,
      infrastructure: 2,
      repetitions: [
        { status: UNSCORED, infrastructure: true },
        { status: UNSCORED, infrastructure: true },
        { status: PASSED },
      ],
    },
  ])
  assert.deepEqual(totals, { passed: 2, failed: 0, unscored: 1, contaminated: 0, infrastructure: 3, total: 3 })
})
