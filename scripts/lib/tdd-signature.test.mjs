import test from "node:test"
import assert from "node:assert/strict"
import { classifyPath, parseEvents, signature } from "./tdd-signature.mjs"

// The runner stores JSONL inside a fence after `## Transcript`. The pure reader
// must work from this string alone: no run directory, no eval store.
function transcript(events) {
  return [
    "# Eval: demo case 1",
    "",
    "**Prompt:** do the thing",
    "",
    "## Transcript",
    "",
    "```",
    ...events.map((event) => JSON.stringify(event)),
    "```",
    "",
  ].join("\n")
}

const toolUse = (tool, input, metadata = undefined) => ({
  type: "tool_use",
  part: { tool, state: { status: "completed", input, metadata } },
})

const shell = (command, exit, output = "") => ({
  type: "tool_use",
  part: { tool: "shell", state: { status: "completed", input: { command }, output, metadata: { metadata: { exit } } } },
})

const edit = (path, additions) => toolUse("edit", { path, oldString: "old", newString: "new" }, { metadata: { files: [{ file: path, additions }] } })
const write = (path, content) => toolUse("write", { path, content })

test("the batch pattern writes a test and never sees it red", () => {
  const result = signature(
    transcript([
      write("tests/demo.test.js", 'import test from "node:test"\n\ntest("double", () => {})\n'),
      edit("src/index.js", 4),
      shell("npm test", 0),
    ]),
  )
  assert.equal(result.testFirst, true, "the test is written before the source")
  assert.equal(result.redBeforeImplementation, false, "the first run was already green")
  assert.deepEqual(result.testFiles, ["tests/demo.test.js"])
  assert.deepEqual(result.sourceFiles, ["src/index.js"])
  assert.deepEqual(result.added, { test: 3, source: 4 })
  assert.deepEqual(result.testRuns.map((run) => run.exit), [0])
})

test("the TDD pattern is red before the source and green after it", () => {
  const result = signature(
    transcript([
      write("test/slug.test.js", 'import test from "node:test"\n\ntest("slugify", () => {})\n'),
      shell("node --test", 1),
      write("src/index.js", "export function slugify(value) {\n  return value\n}\n"),
      shell("node --test", 0),
    ]),
  )
  assert.equal(result.testFirst, true)
  assert.equal(result.redBeforeImplementation, true, "a failing test run precedes the implementation")
  assert.deepEqual(result.testFiles, ["test/slug.test.js"])
  assert.deepEqual(result.sourceFiles, ["src/index.js"])
  assert.deepEqual(result.added, { test: 3, source: 3 })
  assert.deepEqual(result.testRuns.map((run) => run.failed), [true, false])
})

test("a piped or echoed test run is red from the output the wrapper kept", () => {
  const result = signature(
    transcript([
      write("test/slug.test.js", 'import { slugify } from "../src/index.js"\n'),
      shell("node --test 2>&1 | tail -30", 0, "ℹ tests 1\nℹ pass 0\nℹ fail 1\n✖ failing tests:\n  'test failed'\n"),
      edit("src/index.js", 4),
    ]),
  )
  assert.equal(result.redBeforeImplementation, true, "the pipeline's exit 0 must not hide the runner's red")
  assert.deepEqual(result.testRuns.map((run) => [run.exit, run.failed]), [[0, true]])
})

test("an explicit EXIT marker is the test's status, not the echo's", () => {
  const result = signature(
    transcript([
      write("test/slug.test.js", "line\n"),
      shell('node --test 2>&1; echo "EXIT=$?"', 0, "ℹ pass 0\nℹ fail 1\nEXIT=1\n"),
      edit("src/index.js", 1),
    ]),
  )
  assert.equal(result.redBeforeImplementation, true)
  assert.deepEqual(result.testRuns.map((run) => run.failed), [true])
})

test("a green run that mentions fail 0 is not red", () => {
  const result = signature(
    transcript([
      write("test/slug.test.js", "line\n"),
      shell("node --test 2>&1 | tail -5", 0, "ℹ pass 1\nℹ fail 0\nEXIT=0\n"),
      edit("src/index.js", 1),
    ]),
  )
  assert.equal(result.redBeforeImplementation, false)
})

test("lines added are counted per class from edits and writes", () => {
  const result = signature(
    transcript([
      write("src/index.js", "export function add(a, b) {\n  return a + b\n}\n"),
      edit("test/add.test.js", 2),
      edit("src/index.js", 5),
      write("docs/specs/SPEC-0001-slug.md", "status: implemented\n"),
    ]),
  )
  assert.deepEqual(result.added, { test: 2, source: 8 })
  assert.deepEqual(result.sourceFiles, ["src/index.js"])
  assert.deepEqual(result.testFiles, ["test/add.test.js"])
  assert.equal(result.testFirst, false, "the source write came first")
})

test("only code files are classified as source or test", () => {
  assert.equal(classifyPath("scripts/lib/tdd-signature.mjs"), "source")
  assert.equal(classifyPath("scripts/lib/tdd-signature.test.mjs"), "test")
  assert.equal(classifyPath("tests/demo.test.js"), "test")
  assert.equal(classifyPath("docs/specs/SPEC-0001-slug.md"), "other")
  assert.equal(classifyPath("package.json"), "other")
})

test("a raw JSONL stream is read without the markdown header", () => {
  const events = [write("test/one.test.js", "line\n"), edit("src/one.js", 1)]
  const result = signature(events.map((event) => JSON.stringify(event)).join("\n"))
  assert.equal(result.testFirst, true)
  assert.deepEqual(result.added, { test: 1, source: 1 })
})

test("a truncated frame does not lose the frames before it", () => {
  const lines = [JSON.stringify(write("test/one.test.js", "line\n")), '{"type":"tool_use"']
  const result = signature(lines.join("\n"))
  assert.equal(result.mutations, 1)
})

test("parseEvents sees the fenced block and nothing in the prose", () => {
  const events = parseEvents(transcript([shell("node --test", 1)]))
  assert.equal(events.length, 1)
  assert.equal(events[0].type, "tool_use")
})
