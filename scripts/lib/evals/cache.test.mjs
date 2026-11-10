// cache.test.mjs — one test per reuse input, plus the explicit override.
//
// `compare` reuses a stored arm only when every input that decides what the draw
// measures is identical. Each test changes exactly one input, so a regression in
// the predicate names the input it broke instead of only "cache stopped working".

import test from "node:test"
import assert from "node:assert/strict"
import {
  IDENTITY_INPUTS,
  armIdentity,
  canonical,
  gradingHash,
  gradingHashFromDraw,
  isolationContract,
  reuseDecision,
} from "./cache.mjs"

const base = () =>
  armIdentity({
    model: "agentworks/deepseek-v4-1-flash",
    promptHash: "prompt",
    fixtureHash: "fixture",
    gradingHash: "grading",
    skillHash: "skill",
    isolation: { isolate: true, enforced: true, mechanism: "seatbelt", baseline: null },
  })

test("identical identities reuse", () => {
  const decision = reuseDecision({ current: base(), stored: base() })
  assert.equal(decision.reuse, true)
  assert.deepEqual(decision.mismatched, [])
})

test("a different model (or provider) reruns the arm", () => {
  const stored = { ...base(), model: "opencode-go/gpt-6-luna" }
  const decision = reuseDecision({ current: base(), stored })
  assert.equal(decision.reuse, false)
  assert.deepEqual(decision.mismatched, ["model"])
})

test("a different prompt hash reruns the arm", () => {
  const stored = { ...base(), promptHash: "edited" }
  const decision = reuseDecision({ current: base(), stored })
  assert.equal(decision.reuse, false)
  assert.deepEqual(decision.mismatched, ["promptHash"])
})

test("a different fixture hash reruns the arm", () => {
  const stored = { ...base(), fixtureHash: "one-byte-changed" }
  const decision = reuseDecision({ current: base(), stored })
  assert.equal(decision.reuse, false)
  assert.deepEqual(decision.mismatched, ["fixtureHash"])
})

test("a different grading hash reruns the arm", () => {
  const stored = { ...base(), gradingHash: "assertion-added" }
  const decision = reuseDecision({ current: base(), stored })
  assert.equal(decision.reuse, false)
  assert.deepEqual(decision.mismatched, ["gradingHash"])
})

test("a different skill hash reruns the arm", () => {
  const stored = { ...base(), skillHash: "skill-edited" }
  const decision = reuseDecision({ current: base(), stored })
  assert.equal(decision.reuse, false)
  assert.deepEqual(decision.mismatched, ["skillHash"])
})

test("a different isolation contract reruns the arm", () => {
  const stored = { ...base(), isolation: { isolate: true, enforced: false, mechanism: null, baseline: null } }
  const decision = reuseDecision({ current: base(), stored })
  assert.equal(decision.reuse, false)
  assert.deepEqual(decision.mismatched, ["isolation"])
})

test("the control arm's null skill hash is an input, not a missing value", () => {
  const control = { ...base(), skillHash: null }
  assert.equal(reuseDecision({ current: control, stored: { ...base(), skillHash: null } }).reuse, true)
  assert.deepEqual(reuseDecision({ current: control, stored: base() }).mismatched, ["skillHash"])
})

test("--refresh reruns even when all six inputs match", () => {
  const decision = reuseDecision({ current: base(), stored: base(), refresh: true })
  assert.equal(decision.reuse, false)
  assert.equal(decision.refresh, true)
  assert.deepEqual(decision.mismatched, [])
})

test("the six inputs are exactly the documented list", () => {
  assert.deepEqual(IDENTITY_INPUTS, ["model", "promptHash", "fixtureHash", "gradingHash", "skillHash", "isolation"])
})

test("canonical ignores key order but not values", () => {
  assert.equal(canonical({ a: 1, b: 2 }), canonical({ b: 2, a: 1 }))
  assert.notEqual(canonical({ a: 1 }), canonical({ a: 2 }))
  assert.equal(canonical(null), "null")
})

test("isolationContract reduces the record to the promise it made", () => {
  assert.deepEqual(isolationContract({ enforced: true, mechanism: "seatbelt", reason: "path /x" }), {
    isolate: false,
    enforced: true,
    mechanism: "seatbelt",
  })
  assert.deepEqual(isolationContract({ enforced: false, mechanism: null, reason: "no boundary" }), {
    isolate: false,
    enforced: false,
    mechanism: null,
  })
  // An enforced claim without a mechanism cannot become a reusable contract.
  assert.deepEqual(isolationContract({ enforced: true, reason: "claimed" }), { isolate: false, enforced: true, mechanism: null })
})

test("the grading hash moves with an assertion and with the gate", () => {
  const one = { kind: "file", arg: "hello.txt" }
  const a = gradingHash({ assert: [one], gate: "auto" })
  assert.equal(a, gradingHash({ assert: [one], gate: "auto" }))
  assert.notEqual(a, gradingHash({ assert: [one, { kind: "reply", arg: "hi" }], gate: "auto" }))
  assert.notEqual(a, gradingHash({ assert: [one], gate: "off" }))
  assert.notEqual(a, gradingHash({ assert: [{ kind: "file", arg: "other.txt" }], gate: "auto" }))
})

test("a stored draw reconstructs the gate it ran under", () => {
  const draw = {
    assertions: [{ kind: "file", arg: "hello.txt", pass: true }],
    skillGate: { ok: true, reason: "case does not gate on the skill (trigger/routing case)" },
  }
  assert.equal(gradingHashFromDraw(draw), gradingHash({ assert: draw.assertions, gate: "off" }))
  const gated = { ...draw, skillGate: { ok: true, reason: "no skill loaded (control arm)" } }
  assert.equal(gradingHashFromDraw(gated), gradingHash({ assert: draw.assertions, gate: "auto" }))
})
