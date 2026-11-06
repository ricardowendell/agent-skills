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
  assert.equal(classify({ exit: "timeout", asserts: [pass], skillGate: okGate }).status, FAILED)
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

test("a leak turns a green result into a failed, contaminated one", () => {
  const leak = [{ tool: "read", path: "/Users/me/.agents/skills/review-code/SKILL.md" }]
  const r = contaminate({ status: PASSED, reason: "" }, leak)
  assert.equal(r.status, FAILED)
  assert.equal(r.contaminated, true)
  assert.deepEqual(r.leak, leak)
  assert.match(r.reason, /contaminated/)
  assert.match(r.reason, /\.agents\/skills\/review-code/)
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
  assert.equal(agg.status, FAILED)
  assert.equal(agg.passed, 0)
  assert.equal(agg.contaminated, 1)
  assert.match(agg.reason, /1\/1 repetition\(s\) contaminated/)
  assert.match(agg.reason, /\.agents\/skills\/review-code/)
})

test("a contaminated draw stays in the denominator instead of shrinking it", () => {
  const agg = aggregateReps([{ status: PASSED }, { status: PASSED, contaminated: true, leak: [] }])
  assert.equal(agg.passed, 1)
  assert.equal(agg.passRate, 0.5)
  assert.equal(agg.contaminated, 1)
  assert.equal(agg.status, FAILED, "one of two draws was not evidence")
})

test("summarize counts contaminated repetitions apart from pass and fail", () => {
  const totals = summarize([
    { status: PASSED },
    { status: FAILED, contaminated: true, leak: [] },
    { status: FAILED, repetitions: [{ status: FAILED, contaminated: true }, { status: PASSED }], contaminated: 1 },
  ])
  assert.deepEqual(totals, { passed: 1, failed: 2, unscored: 0, contaminated: 2, total: 3 })
})
