import test from "node:test"
import assert from "node:assert/strict"
import { parseCases, unquote } from "./parse.mjs"

const legacy = `# Evals

1. **"Review this branch against SPEC-0007."** (the diff satisfies every AC)
   - Walks AC-1 through AC-3.
   - Watch for: approving without the AC walk-through, or citing taste as a
     finding.
   - [assert] verdict APPROVE
   - [assert] unchanged src/cart.js
`

const v2 = `# Evals

1. **Review against SPEC-0007.**
   - prompt: Review this branch against SPEC-0007.
   - why: the diff satisfies every AC
   - expect: Walks AC-1 through AC-3.
   - needs: gates
   - tags: review, git
   - assert: verdict APPROVE
`

test("a legacy note never reaches the prompt", () => {
  const { cases } = parseCases(legacy)
  const c = cases[0]
  assert.equal(c.prompt, "Review this branch against SPEC-0007.")
  assert.equal(c.why, "the diff satisfies every AC")
  assert.ok(!c.prompt.includes("("), "the parenthetical leaked into the prompt")
  assert.ok(!c.prompt.startsWith('"'), "the quotes leaked into the prompt")
  assert.equal(c.legacy, true)
})

test("wrapped expectation lines are preserved", () => {
  const { cases } = parseCases(legacy)
  assert.deepEqual(cases[0].expect.at(-1), "Watch for: approving without the AC walk-through, or citing taste as a finding.")
})

test("legacy [assert] bullets still parse", () => {
  const { cases, errors } = parseCases(legacy)
  assert.deepEqual(cases[0].assert, [
    { kind: "verdict", arg: "APPROVE" },
    { kind: "unchanged", arg: "src/cart.js" },
  ])
  assert.deepEqual(errors, [])
})

test("the title is not the prompt when a prompt is explicit", () => {
  const { cases, errors } = parseCases(v2)
  const c = cases[0]
  assert.equal(c.title, "Review against SPEC-0007.")
  assert.equal(c.prompt, "Review this branch against SPEC-0007.")
  assert.equal(c.legacy, undefined)
  assert.deepEqual(c.needs, ["gates"])
  assert.deepEqual(c.tags, ["review", "git"])
  assert.deepEqual(errors, [])
})

test("a case with neither prompt nor manual status is an error", () => {
  const { errors } = parseCases(`1. **Some title.**\n   - expect: something.\n`)
  assert.ok(errors.some((e) => /no prompt/.test(e)))
})

test("manual cases need no prompt and are excluded from runnable", () => {
  const { cases, errors, runnable, manual } = parseCases(`1. **Some title.**\n   - status: manual\n   - expect: nothing to run.\n`)
  assert.deepEqual(errors, [])
  assert.equal(cases[0].status, "manual")
  assert.equal(runnable, 0)
  assert.equal(manual, 1)
})

test("unknown assert kinds are errors, not runtime surprises", () => {
  const { errors } = parseCases(`1. **T.**\n   - prompt: do it\n   - assert: grep something\n`)
  assert.ok(errors.some((e) => /unknown assert kind 'grep'/.test(e)))
})

test("duplicate case numbers are an error", () => {
  const { errors } = parseCases(`1. **A.**\n   - prompt: a\n2. **B.**\n   - prompt: b\n1. **C.**\n   - prompt: c`)
  assert.ok(errors.some((e) => /duplicate case number/.test(e)))
})

test("unquote strips one layer of quotes only", () => {
  assert.equal(unquote('"Review this branch."'), "Review this branch.")
  assert.equal(unquote('"Say "hi"."'), 'Say "hi".')
  assert.equal(unquote("no quotes"), "no quotes")
})
