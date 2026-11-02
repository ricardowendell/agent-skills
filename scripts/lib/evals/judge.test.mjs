import test from "node:test"
import assert from "node:assert/strict"
import { judgePrompt, parseJudge, judgeOutcome, verifyEvidence } from "./judge.mjs"

const c = {
  title: "Review against SPEC-0007.",
  why: "the diff satisfies every AC",
  expect: ["Walks AC-1 through AC-3.", "Runs the documented gate."],
}

test("the judge prompt carries the expectations but never the scenario note", () => {
  const p = judgePrompt(c, { reply: "VERDICT: APPROVE", shell: ["npm test"] })
  assert.match(p, /Walks AC-1 through AC-3\./)
  assert.match(p, /npm test/)
  assert.ok(!p.includes("the diff satisfies every AC"), "the why line leaked into the judge prompt")
})

test("watch-for lines are marked negative so the judge does not require them", () => {
  const p = judgePrompt({ expect: ["Runs the gate.", "Watch for: approving without evidence."] }, { reply: "ok" })
  assert.match(p, /1\. Runs the gate\./)
  assert.match(p, /2\. \[NEGATIVE\] Watch for: approving without evidence\./)
  assert.match(p, /Mark it "met" when the reply shows the agent did not fall into it/)
})

test("parses a fenced verdict and computes the score", () => {
  const text = 'Here you go:\n```json\n{"expectations":[{"i":1,"verdict":"met","evidence":"AC-1..AC-3"},{"i":2,"verdict":"not-met","evidence":"never ran"}],"score":0.5}\n```'
  const p = parseJudge(text)
  assert.equal(p.verdicts.length, 2)
  assert.equal(p.score, 0.5)
  assert.equal(p.unmet, 1)
})

test("unverifiable lines do not dilute the score", () => {
  const p = parseJudge('{"expectations":[{"i":1,"verdict":"met"},{"i":2,"verdict":"unverifiable"}],"score":1}')
  assert.equal(p.met, 1)
  assert.equal(p.score, 1)
})

test("nonsense scores zero instead of passing", () => {
  assert.equal(parseJudge("I think it went well."), null)
  assert.equal(judgeOutcome(null, 0.8).ok, false)
})

test("a not-met expectation fails below the threshold, and a low score fails too", () => {
  const unmet = judgeOutcome(parseJudge('{"expectations":[{"i":2,"verdict":"not-met"}]}'), 0.5)
  assert.equal(unmet.ok, false)
  assert.match(unmet.reason, /expectation\(s\) 2 not met/)

  const low = judgeOutcome(parseJudge('{"expectations":[{"i":1,"verdict":"met"},{"i":2,"verdict":"not-met"}],"score":0.5}'), 0.8)
  assert.equal(low.ok, false)
})

test("all met above the threshold passes", () => {
  const ok = judgeOutcome(parseJudge('{"expectations":[{"i":1,"verdict":"met"},{"i":2,"verdict":"met"}],"score":1}'), 0.8)
  assert.equal(ok.ok, true)
  assert.equal(ok.score, 1)
})

test("a quote the run never said does not count as evidence", () => {
  const parsed = {
    verdicts: [
      { i: 1, verdict: "met", evidence: "AC-1 — src/cart.js:6, test total rejects NaN" },
      { i: 2, verdict: "met", evidence: "the agent invented this sentence" },
    ],
    met: 2,
    unmet: 0,
    score: 1,
  }
  const out = verifyEvidence(parsed, "AC-1 — src/cart.js:6, test   total rejects NaN")
  assert.equal(out.verdicts[0].verdict, "met")
  assert.equal(out.verdicts[1].verdict, "unverifiable")
  assert.equal(out.unverified, 1)
  // Only the verified one is scored, so the case is not carried by a guess.
  assert.equal(out.score, 1)
  assert.equal(out.met, 1)
})

test("a not-met verdict needs no quote, and keeps failing", () => {
  const parsed = { verdicts: [{ i: 1, verdict: "not-met", evidence: "" }], met: 0, unmet: 1, score: 0 }
  const out = verifyEvidence(parsed, "a reply that says nothing about it")
  assert.equal(out.verdicts[0].verdict, "not-met")
  assert.equal(out.score, 0)
  assert.equal(judgeOutcome(out, 0.8).ok, false)
})

test("compound evidence counts when most of its segments are real", () => {
  const reply = "Captured to inbox/2026-11-01-digest.md with status unprocessed."
  const parsed = {
    verdicts: [
      { i: 1, verdict: "met", evidence: 'Reply: "Captured to inbox/2026-11-01-digest.md" ... "status unprocessed"' },
      { i: 2, verdict: "met", evidence: "a line the agent never wrote ... nor this one" },
    ],
    met: 2,
    unmet: 0,
    score: 1,
  }
  const out = verifyEvidence(parsed, reply)
  assert.equal(out.verdicts[0].verdict, "met")
  assert.equal(out.verdicts[1].verdict, "unverifiable")
})

test("an expectation the evidence cannot settle does not pass the case", () => {
  const parsed = {
    verdicts: [
      { i: 1, verdict: "met", evidence: "AC-1 verified in test/cart.test.js" },
      { i: 2, verdict: "unverifiable", evidence: "" },
    ],
    met: 1,
    unmet: 0,
    score: 1,
  }
  const outcome = judgeOutcome(parsed, 0.8)
  assert.equal(outcome.ok, false)
  assert.match(outcome.reason, /could not be verified/)
})
