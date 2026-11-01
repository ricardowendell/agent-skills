import test from "node:test"
import assert from "node:assert/strict"
import { classify, aggregateReps, PASSED, FAILED, UNSCORED } from "./result.mjs"

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
