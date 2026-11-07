import test from "node:test"
import assert from "node:assert/strict"
import { appendComment, countComments } from "./backlog-comment.mjs"

// The CLI drops everything after a bare `---` inside the COMMENTS block, so the
// workaround must not parse the block at all: it inserts before the closing
// marker and leaves every existing byte alone.
const TASK = `---
id: TASK-1
status: To Do
---

## Description

Keep me.

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Keep this too.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T13:27:00Z

---

First body.

---

Second body with a rule.

---

\`\`\`
code fence
---

still inside the fence
\`\`\`

---

created: 2026-11-03T10:00:00Z

---

Third body.

---
<!-- COMMENTS:END -->
`

test("appending preserves bodies that contain a bare --- line", () => {
  const before = countComments(TASK)
  const after = appendComment(TASK, "New note.", "2026-11-07T12:00:00Z")

  assert.equal(before, 2)
  assert.equal(countComments(after), 3)
  // Every line that was there is still there, in the same order.
  const beforeLines = TASK.split("\n")
  const afterLines = new Set(after.split("\n"))
  for (const line of beforeLines) assert.ok(afterLines.has(line), `lost line: ${line}`)
  for (const body of ["First body.", "Second body with a rule.", "Third body.", "still inside the fence", "New note."]) {
    assert.ok(after.includes(body), `lost body: ${body}`)
  }
})

test("the new record uses the same shape the CLI writes", () => {
  const after = appendComment(TASK, "New note.", "2026-11-07T12:00:00Z")
  assert.match(
    after,
    /Third body\.\n\n---\n\ncreated: 2026-11-07T12:00:00Z\n\n---\n\nNew note\.\n\n---\n<!-- COMMENTS:END -->/,
  )
})

test("frontmatter and acceptance criteria are untouched", () => {
  const after = appendComment(TASK, "New note.", "2026-11-07T12:00:00Z")
  const head = TASK.slice(0, TASK.indexOf("<!-- COMMENTS:BEGIN -->"))
  assert.ok(after.startsWith(head), "the part before the comments block changed")
  assert.equal(countComments(after), 3)
})

test("a file with no comments block gets one at the end", () => {
  const bare = "---\nid: TASK-2\n---\n\n## Description\n\nOnly this.\n"
  const after = appendComment(bare, "First note.", "2026-11-07T12:00:00Z")
  assert.ok(after.startsWith(bare.replace(/\s*$/, "\n")))
  assert.match(after, /## Comments\n\n<!-- COMMENTS:BEGIN -->\ncreated: 2026-11-07T12:00:00Z/)
  assert.ok(after.trimEnd().endsWith("<!-- COMMENTS:END -->"))
  assert.equal(countComments(after), 1)
})

test("an empty body is refused rather than written", () => {
  assert.throws(() => appendComment(TASK, "   "), /non-empty body/)
})

test("a closing marker without an opening one is a malformed file", () => {
  assert.throws(() => appendComment("<!-- COMMENTS:END -->\n", "x"), /malformed/)
})

test("countComments ignores created: lines outside the block", () => {
  const tricked = `${TASK}\n\ncreated: 2020-01-01T00:00:00Z\n`
  assert.equal(countComments(tricked), 2)
})

// TASK-55's own description names both markers while explaining the format. A
// substring search spliced the file at the prose mention; the markers are lines.
test("a prose mention of the markers does not move the insertion point", () => {
  const prose = TASK.replace(
    "Keep me.",
    "Keep me. The block opens with `<!-- COMMENTS:BEGIN -->` and closes with `<!-- COMMENTS:END -->`.",
  )
  assert.equal(countComments(prose), 2)
  const after = appendComment(prose, "New note.", "2026-11-07T12:00:00Z")
  assert.equal(countComments(after), 3)
  assert.ok(after.includes("New note."))
  assert.ok(after.trimEnd().endsWith("<!-- COMMENTS:END -->"))
  assert.ok(after.includes("and closes with `<!-- COMMENTS:END -->`."), "the prose was rewritten")
})

test("a block opened but never closed counts as zero instead of throwing", () => {
  assert.equal(countComments("<!-- COMMENTS:BEGIN -->\ncreated: x\n"), 0)
})

