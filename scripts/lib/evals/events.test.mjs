import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { events, evidenceLedger, replyText, toolCalls, skillLoads, usageStats } from "./events.mjs"
import { evaluateAssertions } from "./assertions.mjs"

// A real stream, not a hand-written one. The parser only matters if it matches
// what `opencode run --format json` actually emits, and a fixture composed from
// the documented shape would agree with a wrong reader. These lines came from
// two recorded runs; only the long skill body and tool output were shortened,
// and no key, nesting level or type was touched.
const DIR = dirname(fileURLToPath(import.meta.url))
const out = readFileSync(join(DIR, "fixtures/stream.jsonl"), "utf8")

test("the recorded stream reads back as its events", () => {
  assert.deepEqual(
    events(out).map((e) => e.type),
    ["tool_use", "step_finish", "tool_use", "tool_use", "step_finish", "text", "step_finish", "tool_use"],
  )
})

// The nesting is the contract that broke silently before: a reader that expects
// `state.metadata.exit` finds nothing and reports "the command never ran",
// which reads like a missing call rather than a broken parser.
test("every tool call keeps its exit status where the stream puts it", () => {
  const calls = toolCalls(out)
  assert.deepEqual(
    calls.map((c) => c.tool),
    ["shell", "skill", "shell", "shell"],
  )
  assert.deepEqual(
    calls.map((c) => c.exit),
    [0, undefined, 0, 1],
  )
  assert.equal(calls[0].input.command.startsWith("ls -la"), true)
  assert.equal(calls[0].status, "completed")
  assert.equal(typeof calls[0].start, "number")
})

test("a failed command is distinguishable from one that never ran", () => {
  const one = (kind, arg) => evaluateAssertions({ assert: [{ kind, arg }] }, "/tmp", out)[0]
  const hi = "ci.yml.template"

  assert.equal(one("ran", hi).pass, true, "the command executed")
  assert.equal(one("ranpass", hi).pass, false, "a non-zero exit is not a pass")
  assert.match(one("ranpass", hi).detail, /^exit 1$/)

  assert.equal(one("ran", "no-such-command").pass, false)
  assert.equal(one("ran", "no-such-command").detail, "the command never ran")
})

test("the skill call reports the id and the directory it loaded from", () => {
  const loads = skillLoads(out)
  assert.equal(loads.length, 1)
  assert.equal(loads[0].id, "find-blind-spots")
  assert.match(loads[0].directory, /\.opencode\/skills\/find-blind-spots$/)
  assert.equal(loads[0].status, "completed")
})

test("the reply is the assistant's text, never the skill's own body", () => {
  const text = replyText(out)
  assert.match(text, /^I don't see a plan/)
  assert.doesNotMatch(text, /<skill_content/)
})

test("tokens, cost and steps come from the step-finish events", () => {
  const usage = usageStats(out)
  assert.equal(usage.steps, 3)
  assert.equal(usage.tokens.input, 13903)
  assert.equal(usage.tokens.cacheRead, 22272)
})

// The judge used to see only shell first lines, so reads and edits were
// invisible. Each shape below is one fact the expectations can point at.
const ledgerStream = [
  {
    type: "tool_use",
    part: {
      tool: "skill",
      state: { status: "completed", input: { id: "demo" }, metadata: { metadata: { name: "demo", directory: "/tmp/skills/demo" } } },
    },
  },
  { type: "tool_use", part: { tool: "read", state: { status: "completed", input: { path: "src/cart.js" }, output: "SECRET BODY that must never reach the judge" } } },
  { type: "tool_use", part: { tool: "glob", state: { status: "completed", input: { pattern: "**/*.js" } } } },
  { type: "tool_use", part: { tool: "grep", state: { status: "completed", input: { pattern: "total", path: "src" } } } },
  {
    type: "tool_use",
    part: {
      tool: "edit",
      state: { status: "completed", input: { path: "src/cart.js", oldString: "return total", newString: "return total * 1", output: "SECRET BODY" } },
    },
  },
  {
    type: "tool_use",
    part: {
      tool: "write",
      state: { status: "completed", input: { path: "tests/cart.test.js", content: 'test("doubles", () => expect(double(3)).toBe(6))\n' } },
    },
  },
  {
    type: "tool_use",
    part: {
      tool: "shell",
      state: {
        status: "completed",
        input: { command: "node --test" },
        output: "# tests 1\n# pass 0\n# fail 1\n",
        metadata: { metadata: { exit: 1 } },
      },
    },
  },
  { type: "tool_use", part: { tool: "webfetch", state: { status: "completed", input: { url: "https://example.com/spec" } } } },
]
  .map((e) => JSON.stringify(e))
  .join("\n")

test("the ledger shows every tool shape in compact, stable lines", () => {
  const ledger = evidenceLedger(ledgerStream)
  assert.match(ledger, /^skill: demo \(dir: \/tmp\/skills\/demo\)$/m)
  assert.match(ledger, /^read: src\/cart\.js$/m)
  assert.match(ledger, /^glob: \*\*\/\*\.js$/m)
  assert.match(ledger, /^grep: total in src$/m)
  assert.match(ledger, /^edit: src\/cart\.js$/m)
  assert.match(ledger, /^- return total$/m)
  assert.match(ledger, /^\+ return total \* 1$/m)
  assert.match(ledger, /^write: tests\/cart\.test\.js$/m)
  assert.match(ledger, /expect\(double\(3\)\)\.toBe\(6\)/)
  assert.match(ledger, /^\$ node --test {2}\[exit 1\]$/m)
  assert.match(ledger, /# fail 1/)
  assert.match(ledger, /^webfetch: url=https:\/\/example\.com\/spec$/m)
})

test("the ledger never carries the body of a read", () => {
  const ledger = evidenceLedger(ledgerStream)
  assert.ok(!ledger.includes("SECRET BODY"), "a read body leaked into the ledger")
})

test("the ledger is deterministic and never exceeds its budget, marker included", () => {
  assert.equal(evidenceLedger(ledgerStream), evidenceLedger(ledgerStream))
  // The old fallback appended `separator + marker` when no room was left for
  // the entry, which is how a 6000-char ledger came back at 6011. Walk every
  // boundary, not just one comfortable budget.
  const full = evidenceLedger(ledgerStream)
  for (let budget = 0; budget <= full.length; budget++) {
    const small = evidenceLedger(ledgerStream, { budget })
    assert.ok(small.length <= budget, `budget ${budget} produced ${small.length} chars`)
    assert.equal(small, evidenceLedger(ledgerStream, { budget }), "truncation moved between calls")
  }
  // Comfortably inside the budget, the marker still names the cut.
  assert.match(evidenceLedger(ledgerStream, { budget: 120 }), /\[ledger truncated\]$/)
})
