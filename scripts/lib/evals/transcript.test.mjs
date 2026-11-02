import test from "node:test"
import assert from "node:assert/strict"
import { parseTranscript, renderHeader, patchStatus } from "./transcript.mjs"

// A reply that itself contains a fenced block: splitting the file on the fence
// marker used to cut the transcript short, and every later event disappeared.
const run = (extra = "") => `# Eval: demo case 2

**Prompt:** do the thing
**Scratch:** /tmp/eval-demo
**Exit:** 0
**Status:** passed
**Skill:** loaded (from the scratch)
**Repo:** abc123  **Agent:** build  **Model:** m  **Level:** behavior  **Duration:** 10ms

## Transcript

\`\`\`
{"type":"text","timestamp":1,"part":{"text":"here is code:\\n\\n\`\`\`js\\nconst a = 1\\n\`\`\`\\n"}}
{"type":"tool_use","timestamp":2,"part":{"tool":"skill","state":{"status":"completed","input":{"id":"demo"}}}}
${extra}
\`\`\`

## stderr

\`\`\`
warning: nothing
\`\`\`
`

test("the transcript survives fences inside the reply", () => {
  const t = parseTranscript(run())
  assert.equal(t.skill, "demo")
  assert.equal(t.n, 2)
  assert.equal(t.scratch, "/tmp/eval-demo")
  assert.equal(t.exit, 0)
  assert.equal(t.recorded, "passed")
  assert.equal(t.arm, "with-skill")
  // Both events are there: the text (with its fence) and the skill call.
  assert.match(t.text, /const a = 1/)
  assert.match(t.text, /"tool":"skill"/)
  assert.doesNotMatch(t.text, /warning: nothing/)
})

test("a control-arm run is recognised, and a non-numeric exit is kept", () => {
  const md = run().replace("**Skill:** loaded (from the scratch)", "**Skill:** not loaded (control arm)").replace("**Exit:** 0", "**Exit:** timeout")
  const t = parseTranscript(md)
  assert.equal(t.arm, "without-skill")
  assert.equal(t.exit, "timeout")
})

test("a file without the eval header is not a transcript", () => {
  assert.equal(parseTranscript("# something else\n"), null)
})

test("the header the runner writes parses back with the same identity", () => {
  const md =
    renderHeader({
      skill: "demo",
      n: 7,
      prompt: "do it",
      scratch: "/tmp/x",
      exit: 0,
      status: "failed",
      reason: "1/2 assertions failed",
      skillLine: "**Skill:** loaded (from the scratch)",
      skillHash: "abc",
      meta: { repoSha: "r", agent: "build", model: "m", level: "behavior" },
      durationMs: 12,
    }) + '\n\n## Transcript\n\n```\n{"type":"text","part":{"text":"hi"}}\n```\n'

  const t = parseTranscript(md)
  assert.equal(t.skill, "demo")
  assert.equal(t.n, 7)
  assert.equal(t.scratch, "/tmp/x")
  assert.equal(t.exit, 0)
  assert.equal(t.recorded, "failed")
  assert.equal(t.arm, "with-skill")
  assert.match(t.text, /"text":"hi"/)
})

test("patchStatus rewrites only the status line", () => {
  const before = renderHeader({ skill: "demo", n: 1, prompt: "p", scratch: "/tmp", status: "passed" })
  const after = patchStatus(before, "failed", "judge: expectation 2 not met")
  assert.match(after, /\*\*Status:\*\* failed — judge: expectation 2 not met/)
  assert.equal(parseTranscript(after).recorded, "failed")
  assert.equal(after.replace(/^\*\*Status:\*\*.*$/m, ""), before.replace(/^\*\*Status:\*\*.*$/m, ""))
})

test("a staged header parses without a transcript body", () => {
  const md = renderHeader({ skill: "demo", n: 2, prompt: "p", scratch: "/tmp", status: "staged", reason: "staged only (smoke)" })
  const t = parseTranscript(md)
  assert.equal(t.recorded, "staged")
  assert.equal(t.text, "")
})
