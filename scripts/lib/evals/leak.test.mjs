import test from "node:test"
import assert from "node:assert/strict"
import { findLeaks, leaksIn } from "./leak.mjs"

const SCRATCH = "/var/folders/aa/T/eval-review-code-1-abc123"
const call = (tool, input = {}, meta = {}) => ({ tool, input, meta })
const paths = (hits) => hits.map((h) => h.path)

test("a read inside the scratch is not a leak", () => {
  const hits = findLeaks([call("read", { path: `${SCRATCH}/AGENTS.md` })], SCRATCH)
  assert.deepEqual(hits, [])
})

test("the staged skill lives inside the scratch and is not a leak", () => {
  const hits = findLeaks(
    [
      call("read", { path: `${SCRATCH}/.opencode/skills/review-code/SKILL.md` }),
      call("glob", { pattern: "**/*.md", path: `${SCRATCH}/.opencode/skills/review-code` }),
    ],
    SCRATCH,
  )
  assert.deepEqual(hits, [])
})

test("the same scratch reached through /private is still inside it", () => {
  const hits = findLeaks([call("read", { path: `/private${SCRATCH}/.opencode/skills/review-code/SKILL.md` })], SCRATCH)
  assert.deepEqual(hits, [])
})

test("reading an installed skill is a leak", () => {
  const hits = findLeaks([call("read", { path: "/Users/me/.agents/skills/review-code/SKILL.md" })], SCRATCH)
  assert.deepEqual(hits, [{ tool: "read", path: "/Users/me/.agents/skills/review-code/SKILL.md" }])
})

test("a shell call that cats an installed skill is a leak", () => {
  const hits = findLeaks([call("shell", { command: "cat /Users/me/.claude/skills/review-code/SKILL.md" })], SCRATCH)
  assert.deepEqual(paths(hits), ["/Users/me/.claude/skills/review-code/SKILL.md"])
  assert.equal(hits[0].tool, "shell")
})

test("a stale copy under T/opencode is a leak, even without an install dir", () => {
  const stale = "/private/var/folders/aa/T/opencode/agent-skills-pr/skills/review-code/SKILL.md"
  const hits = findLeaks([call("shell", { command: `sed -n '1,20p' ${stale}` })], SCRATCH)
  assert.deepEqual(paths(hits), [stale])
})

test("an external references/evals.md is a leak", () => {
  const hits = findLeaks([call("read", { path: "/Users/me/repos/other/references/evals.md" })], SCRATCH)
  assert.deepEqual(paths(hits), ["/Users/me/repos/other/references/evals.md"])
})

test("the corpus staged inside the scratch is not a leak", () => {
  // The runner strips it from the staged skill; a fixture may still carry one
  // under another name, and that copy is inside the scratch.
  const hits = findLeaks([call("read", { path: `${SCRATCH}/references/evals.md` })], SCRATCH)
  assert.deepEqual(hits, [])
})

test("a path that only resembles a skill root is benign", () => {
  const hits = findLeaks(
    [
      call("read", { path: `${SCRATCH}/docs/skills/SKILL.md` }),
      call("read", { path: "/Users/me/project/docs/skills/SKILL.md" }),
      call("read", { path: "/Users/me/notes/other-skills/x/SKILL.md" }),
    ],
    SCRATCH,
  )
  assert.deepEqual(hits, [])
})

test("metadata is scanned too, so a glob's listing is caught", () => {
  const hits = findLeaks(
    [
      call("glob", { pattern: "**/SKILL.md", path: "/Users/me/.codex/skills" }, {
        output: "/Users/me/.codex/skills/review-code/SKILL.md\n/Users/me/.codex/skills/audit/SKILL.md",
      }),
    ],
    SCRATCH,
  )
  assert.deepEqual(paths(hits), ["/Users/me/.codex/skills/review-code/SKILL.md", "/Users/me/.codex/skills/audit/SKILL.md"])
})

test("duplicates collapse and the transcript stream is read through events", () => {
  const line = (id, tool, input) =>
    JSON.stringify({ type: "tool_use", part: { id, tool, state: { status: "completed", input, metadata: { metadata: {} } } } })
  const out = [
    line("a", "read", { path: "/Users/me/.agents/skills/review-code/SKILL.md" }),
    line("b", "read", { path: "/Users/me/.agents/skills/review-code/SKILL.md" }),
  ].join("\n")
  assert.deepEqual(leaksIn(out, SCRATCH), [{ tool: "read", path: "/Users/me/.agents/skills/review-code/SKILL.md" }])
})
