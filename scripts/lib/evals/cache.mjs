// cache.mjs — a pure predicate: may a stored arm's draws be reused?
//
// `compare` is the reason this exists. Re-running an unchanged control costs the
// same money as a new one and answers the same question, so an arm is reused only
// when every input that decides what the draw measures is identical:
//
//   model           the ref the child is launched with, provider included
//   promptHash      the case prompt
//   fixtureHash     the tree the agent starts from
//   gradingHash     the assertions (and gate) that decide pass/fail
//   skillHash       the tree staged as the skill under review (null on the control)
//   isolation       the boundary the child ran under
//
// The predicate is pure: the caller computes the six values for the current
// invocation and for the stored draw, and this module only compares them. That is
// what makes "why did it rerun?" answerable without a model, and what keeps a
// reused number from being a claim about a different experiment.
//
// A judged draw is never reused: the stored artefact records the judge's score,
// not the `expect:` text it was scored against, so the grading input cannot be
// reconstructed. The caller refuses it explicitly rather than hashing a guess.

import { textHash } from "./fixture.mjs"

// The six inputs, in the order a mismatch is reported.
export const IDENTITY_INPUTS = ["model", "promptHash", "fixtureHash", "gradingHash", "skillHash", "isolation"]

// A stable string for a value that may be a string, null, or the isolation
// object. Key order must not matter: two records that say the same thing are the
// same input.
export function canonical(value) {
  if (value === null || value === undefined) return "null"
  if (typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
    .join(",")}}`
}

export function armIdentity({
  model = null,
  promptHash = null,
  fixtureHash = null,
  gradingHash = null,
  skillHash = null,
  isolation = null,
} = {}) {
  return {
    model: model ?? null,
    promptHash: promptHash ?? null,
    fixtureHash: fixtureHash ?? null,
    gradingHash: gradingHash ?? null,
    skillHash: skillHash ?? null,
    isolation: isolation ?? null,
  }
}

// The isolation contract, reduced to what a run promised rather than how this
// host happened to spell it: a reason string naming a binary path is not part of
// the contract.
export function isolationContract(record = null) {
  return {
    isolate: record?.isolate === true,
    enforced: record?.enforced === true,
    mechanism: record?.enforced === true ? (record.mechanism ?? null) : null,
  }
}

export function reuseDecision({ current = null, stored = null, refresh = false } = {}) {
  const mismatched = IDENTITY_INPUTS.filter((input) => canonical(current?.[input]) !== canonical(stored?.[input]))
  if (refresh) return { reuse: false, refresh: true, mismatched }
  return { reuse: mismatched.length === 0, refresh: false, mismatched }
}

// Beyond the six identity inputs, an arm has to be the experiment it claims to
// be. A stopped-early arm did not run the requested draws, and a judged arm was
// scored against `expect:` text the stored artefact does not carry. Both are
// refusals, not mismatches, so a fresh run cannot inherit a number that means
// something else.
export function armReplayable(result, { repeat } = {}) {
  const draws = Array.isArray(result?.repetitions) ? result.repetitions : result ? [result] : []
  if (result?.stoppedEarly) return { reusable: false, reason: "stopped early" }
  if (Number.isInteger(repeat) && draws.length < repeat) {
    return { reusable: false, reason: `only ${draws.length}/${repeat} draws` }
  }
  if (draws.some((draw) => draw?.semantic)) return { reusable: false, reason: "judged draw" }
  return { reusable: true, reason: "" }
}

// What graded a draw: the assertion list and the gate. `expect:` lines only
// grade when a judge is asked, and a judged draw is never reused (see above), so
// they are not part of this hash.
export function gradingHash({ assert = [], gate = "auto" } = {}) {
  return textHash(JSON.stringify({ gate, assert: assert.map((a) => [a.kind, a.arg]) }))
}

// The same hash from a stored draw. `executeCase` records the assertions that
// ran and the gate's reason; a `gate: off` case says so in that reason.
export function gradingHashFromDraw(draw) {
  const gate = /does not gate on the skill/.test(draw?.skillGate?.reason ?? "") ? "off" : "auto"
  return gradingHash({ gate, assert: draw?.assertions ?? [] })
}
