import test from "node:test"
import assert from "node:assert/strict"
import { classify, PASSED, FAILED, UNSCORED } from "./result.mjs"

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
