import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { events, replyText, toolCalls, skillLoads, usageStats } from "./events.mjs"
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
