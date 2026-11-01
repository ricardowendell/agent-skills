import test from "node:test"
import assert from "node:assert/strict"
import { parseTranscript } from "./transcript.mjs"

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
