// rejudge.test.mjs — the replay judge path, with a stub spawn.
//
// No test here calls a model: the seam is `spawnAgent`, the same one
// `judge.mjs` already exposes. A judge reply that cites a tool line must keep a
// `met`, one that cites nothing must stay `unverifiable`, and a draw that failed
// deterministically must never be turned into a pass.

import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { rejudge } from "./rejudge.mjs"

const c = { n: 1, title: "demo", prompt: "Do the thing.", expect: ["Runs the suite and reports the red gate."] }

function transcriptMd(jsonl) {
  return `# Eval: demo case 1\n\n**Scratch:** /tmp/demo\n**Exit:** 0\n**Status:** failed\n\n## Transcript\n\n\`\`\`\n${jsonl}\n\`\`\`\n`
}

function stream({ reply = "done", command = "node --test", exit = 1, output = "# fail 1" } = {}) {
  return [
    JSON.stringify({
      type: "tool_use",
      part: {
        tool: "shell",
        state: { status: "completed", input: { command }, output, metadata: { metadata: { exit } } },
      },
    }),
    JSON.stringify({ type: "text", part: { text: reply } }),
  ].join("\n")
}

// One case directory with the stored result and the transcripts, laid out the
// way `runs.mjs` writes them.
function fixture(draws) {
  const dir = mkdtempSync(join(tmpdir(), "rejudge-"))
  const result = { skill: "demo", case: 1, status: "failed", repetitions: [] }
  for (const d of draws) {
    result.repetitions.push({
      skill: "demo",
      case: 1,
      rep: d.rep,
      status: d.status ?? "failed",
      reason: d.reason ?? "judge: expectation(s) 1 could not be verified",
      assertions: d.assertions ?? [{ kind: "file", arg: "src/echo.js", pass: true }],
      skillGate: d.skillGate ?? { ok: true, reason: "loaded" },
      execution: { exit: d.executionExit ?? 0 },
      arm: "with-skill",
    })
    writeFileSync(join(dir, `transcript.r${d.rep}.md`), transcriptMd(d.stream ?? stream(d)))
  }
  writeFileSync(join(dir, "result.json"), JSON.stringify(result, null, 2))
  return dir
}

function judgeReply(evidence) {
  return JSON.stringify({
    type: "text",
    part: {
      text: JSON.stringify({ expectations: [{ i: 1, verdict: "met", evidence }], score: 1 }),
    },
  })
}

function stub(reply) {
  const calls = []
  const spawnAgent = async ({ args }) => {
    calls.push(args[args.length - 1])
    return { out: reply, err: "", code: 0 }
  }
  return { spawnAgent, calls }
}

test("a quote from the ledger keeps the draw passed", async () => {
  const dir = fixture([{ rep: 1 }])
  const { spawnAgent, calls } = stub(judgeReply("$ node --test  [exit 1]"))
  try {
    const out = await rejudge({ dir, c, model: "stub", spawnAgent })
    assert.equal(calls.length, 1, "one judge call per eligible draw")
    assert.match(calls[0], /## Tool calls/)
    assert.match(calls[0], /\$ node --test {2}\[exit 1\]/)
    assert.deepEqual(
      out.draws.map((d) => [d.rep, d.outcome, d.score]),
      [[1, "passed", 1]],
    )
    assert.deepEqual(out.tally, { total: 1, judged: 1, passed: 1, failed: 0, skipped: 0 })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("a quote in neither the reply nor the ledger is unverifiable and fails", async () => {
  const dir = fixture([{ rep: 1 }])
  const { spawnAgent } = stub(judgeReply("the agent probably ran the suite"))
  try {
    const out = await rejudge({ dir, c, model: "stub", spawnAgent })
    assert.equal(out.draws[0].outcome, "failed")
    assert.equal(out.draws[0].verdicts[0].verdict, "unverifiable")
    assert.match(out.draws[0].reason, /could not be verified/)
    assert.deepEqual(out.tally, { total: 1, judged: 1, passed: 0, failed: 1, skipped: 0 })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("a deterministic failure is skipped, never judged and never rescued", async () => {
  const dir = fixture([
    { rep: 1, assertions: [{ kind: "file", arg: "src/echo.js", pass: false }] },
    { rep: 2, executionExit: 1 },
  ])
  const { spawnAgent, calls } = stub(judgeReply("$ node --test  [exit 1]"))
  try {
    const out = await rejudge({ dir, c, model: "stub", spawnAgent })
    assert.equal(calls.length, 0, "a failing draw spent a judge call")
    assert.deepEqual(
      out.draws.map((d) => [d.rep, d.outcome]),
      [
        [1, "skipped"],
        [2, "skipped"],
      ],
    )
    assert.match(out.draws[0].reason, /deterministic/)
    assert.deepEqual(out.tally, { total: 2, judged: 0, passed: 0, failed: 0, skipped: 2 })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("a case with a pass and a failure re-judges only the eligible draw", async () => {
  const dir = fixture([{ rep: 1 }, { rep: 2, assertions: [{ kind: "file", arg: "x", pass: false }] }])
  const { spawnAgent, calls } = stub(judgeReply("$ node --test  [exit 1]"))
  try {
    const out = await rejudge({ dir, c, model: "stub", spawnAgent })
    assert.equal(calls.length, 1)
    assert.deepEqual(
      out.draws.map((d) => [d.rep, d.outcome]),
      [
        [1, "passed"],
        [2, "skipped"],
      ],
    )
    assert.deepEqual(out.tally, { total: 2, judged: 1, passed: 1, failed: 0, skipped: 1 })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("re-judging leaves the stored result and transcript byte-identical", async () => {
  const dir = fixture([{ rep: 1 }])
  const before = [join(dir, "result.json"), join(dir, "transcript.r1.md")].map((f) => readFileSync(f, "utf8"))
  const { spawnAgent } = stub(judgeReply("$ node --test  [exit 1]"))
  try {
    await rejudge({ dir, c, model: "stub", spawnAgent })
    const after = [join(dir, "result.json"), join(dir, "transcript.r1.md")].map((f) => readFileSync(f, "utf8"))
    assert.deepEqual(after, before, "the immutable run directory was rewritten")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("an unparsable judge reply is reported with the raw text", async () => {
  const dir = fixture([{ rep: 1 }])
  const { spawnAgent } = stub(JSON.stringify({ type: "text", part: { text: "Looks fine to me." } }))
  try {
    const out = await rejudge({ dir, c, model: "stub", spawnAgent })
    assert.equal(out.draws[0].outcome, "failed")
    assert.match(out.draws[0].reason, /no parsable verdict/)
    assert.equal(out.draws[0].raw, "Looks fine to me.")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
