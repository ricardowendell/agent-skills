import test from "node:test"
import assert from "node:assert/strict"
import { judgePrompt, parseJudge, judgeOutcome, verifyEvidence, runJudge } from "./judge.mjs"

const c = {
  title: "Review against SPEC-0007.",
  why: "the diff satisfies every AC",
  expect: ["Walks AC-1 through AC-3.", "Runs the documented gate."],
}

test("the judge prompt carries the expectations but never the scenario note", () => {
  const p = judgePrompt(c, { reply: "VERDICT: APPROVE", ledger: "$ npm test  [exit 0]" })
  assert.match(p, /Walks AC-1 through AC-3\./)
  assert.match(p, /npm test/)
  assert.ok(!p.includes("the diff satisfies every AC"), "the why line leaked into the judge prompt")
})

test("the prompt has exactly two evidence blocks: the ledger and the reply", () => {
  const ledger = "read: src/cart.js\n$ node --test  [exit 1]\n  # fail 1"
  const p = judgePrompt(c, { reply: "done", ledger })
  assert.match(p, /## Tool calls\n```\nread: src\/cart\.js/)
  assert.match(p, /\$ node --test {2}\[exit 1\]/)
  // No second, unbudgeted rendering of the stream: the command log used to show
  // lines the ledger's budget had cut, and the judge could quote one of them.
  assert.ok(!p.includes("## Command log"), "the command log section came back")
  assert.equal(p.match(/## (Tool calls|Reply)/g).length, 2)
  assert.ok(p.indexOf("## Tool calls") < p.indexOf("## Reply"))
  assert.match(p, /A read\nline shows a file was opened, not what the file said/)
})

test("an empty ledger still renders its block, not a missing section", () => {
  const p = judgePrompt({ expect: ["Runs the gate."] }, { reply: "ok" })
  assert.match(p, /## Tool calls\n```\n\(no tool calls\)\n```/)
  assert.match(p, /## Reply\n```\nok\n```/)
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

// A composite expectation ("adds a test AND runs it") needs two facts. The
// prompt now allows them separated by ` | `; the verifier already accepts the
// segments and still rejects a fabricated join.
test("a composite expectation may cite two passages separated by a pipe", () => {
  const ledger = "write: tests/demo.test.ts\n$ bun test  [exit 0]"
  const parsed = {
    verdicts: [{ i: 1, verdict: "met", evidence: "write: tests/demo.test.ts | $ bun test  [exit 0]" }],
    met: 1,
    unmet: 0,
    score: 1,
  }
  const out = verifyEvidence(parsed, ledger)
  assert.equal(out.verdicts[0].verdict, "met")
  assert.equal(out.unverified, 0)
})

test("the judge prompt allows a composite citation but still forbids an ellipsis", () => {
  const p = judgePrompt(c, { reply: "done" })
  assert.match(p, /join the passages with "\s*\|\s*"/i)
  assert.match(p, /never join two quotes with an ellipsis/i)
})

test("a quote from the ledger verifies, including the #7 `$ node --test  [exit 1]` shape", () => {
  const ledger = "$ node --test  [exit 1]\n  # fail 1"
  const parsed = {
    verdicts: [{ i: 1, verdict: "met", evidence: "$ node --test  [exit 1]" }],
    met: 1,
    unmet: 0,
    score: 1,
  }
  const out = verifyEvidence(parsed, ["the agent reported the red gate", ledger].join("\n"))
  assert.equal(out.verdicts[0].verdict, "met")
  assert.equal(out.unverified, 0)
})

test("code fences, a `$ ` prompt and whitespace do not sink a literal quote", () => {
  const parsed = {
    verdicts: [{ i: 1, verdict: "met", evidence: "```sh\n$ node --test\n```" }],
    met: 1,
    unmet: 0,
    score: 1,
  }
  const out = verifyEvidence(parsed, "$ node --test  [exit 1]")
  assert.equal(out.verdicts[0].verdict, "met")
})

test("a short but literal quote is evidence, not a missing quote", () => {
  for (const evidence of ["exit 1", "exit 1]", "fail 1"]) {
    const parsed = { verdicts: [{ i: 1, verdict: "met", evidence }], met: 1, unmet: 0, score: 1 }
    const out = verifyEvidence(parsed, "$ node --test  [exit 1]\n  # fail 1")
    assert.equal(out.verdicts[0].verdict, "met", `short quote '${evidence}' was discarded`)
  }
})

test("a quote that is in neither the reply nor the ledger is unverifiable", () => {
  const parsed = {
    verdicts: [{ i: 1, verdict: "met", evidence: "the suite was green and all checks passed" }],
    met: 1,
    unmet: 0,
    score: 1,
  }
  const out = verifyEvidence(parsed, ["done", "$ node --test  [exit 1]\n  # fail 1"].join("\n"))
  assert.equal(out.verdicts[0].verdict, "unverifiable")
  assert.equal(out.unverified, 1)
})

test("empty evidence stays unverifiable even when the corpus is rich", () => {
  const parsed = {
    verdicts: [
      { i: 1, verdict: "met", evidence: "" },
      { i: 2, verdict: "met", evidence: '""' },
    ],
    met: 2,
    unmet: 0,
    score: 1,
  }
  const out = verifyEvidence(parsed, "a rich reply\n$ node --test  [exit 1]")
  assert.deepEqual(
    out.verdicts.map((v) => v.verdict),
    ["unverifiable", "unverifiable"],
  )
  assert.equal(out.score, 0)
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

test("runJudge goes through the shared runner with a scrubbed env", async () => {
  let seen = null
  const out = JSON.stringify({
    type: "text",
    part: { text: '{"expectations":[{"i":1,"verdict":"met","evidence":"halved the ceiling"}],"score":1}' },
  })
  const result = await runJudge({
    prompt: "grade this",
    source: "halved the ceiling",
    env: { PATH: "/bin", OPENCODE_SESSION: "leak", AI_AGENT: "1" },
    spawnAgent: async ({ args, env }) => {
      seen = { args, env }
      return { code: 0, out, err: "", durationMs: 1 }
    },
  })

  assert.equal(result.code, 0)
  assert.equal(result.parsed.verdicts[0].verdict, "met")
  assert.equal(seen.env.OPENCODE_SESSION, undefined, "the judge kept the caller's session")
  assert.equal(seen.env.AI_AGENT, undefined)
  assert.match(seen.args.join(" "), /--standalone/)
})
