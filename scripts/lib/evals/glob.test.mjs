import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { toRegExp, expand, isGlob } from "./glob.mjs"

function tree(files) {
  const root = mkdtempSync(join(tmpdir(), "glob-test-"))
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true })
    writeFileSync(join(root, rel), content)
  }
  return root
}

test("a wildcard stays inside one segment", () => {
  const re = toRegExp("docs/decisions/ADR-0003-*.md")
  assert.ok(re.test("docs/decisions/ADR-0003-sqlite.md"))
  assert.ok(!re.test("docs/decisions/nested/ADR-0003-sqlite.md"))
  assert.ok(!re.test("docs/decisions/ADR-0004-sqlite.md"))
})

test("** crosses segments", () => {
  const re = toRegExp("**/SPEC-*.md")
  assert.ok(re.test("SPEC-0001.md"))
  assert.ok(re.test("docs/specs/SPEC-0001-demo.md"))
  assert.ok(re.test("a/b/c/SPEC-0002.md"))
  assert.ok(!re.test("docs/specs/SPEC.md"))
})

test("? matches one character and literals stay literal", () => {
  assert.ok(toRegExp("a/?.md").test("a/1.md"))
  assert.ok(!toRegExp("a/?.md").test("a/12.md"))
  assert.ok(toRegExp("docs/(x).md").test("docs/(x).md"))
  assert.ok(toRegExp("docs/a+b.md").test("docs/a+b.md"))
})

test("expand lists matching files and directories", () => {
  const root = tree({
    "docs/decisions/ADR-0001-first.md": "a",
    "docs/decisions/ADR-0003-sqlite.md": "b",
    "src/cart.js": "c",
  })
  assert.deepEqual(
    expand(root, "docs/decisions/*.md").map((e) => e.rel),
    ["docs/decisions/ADR-0001-first.md", "docs/decisions/ADR-0003-sqlite.md"],
  )
  assert.deepEqual(expand(root, "docs/decisions").map((e) => e.rel), ["docs/decisions"])
  assert.equal(expand(root, "docs/decisions").every((e) => e.isDir), true)
})

test("**.git and node_modules are never traversed", () => {
  const root = tree({ "node_modules/x/y.md": "a", ".git/HEAD": "b", "keep.md": "c" })
  assert.deepEqual(expand(root, "**").map((e) => e.rel), ["keep.md"])
})

test("isGlob only reports real patterns", () => {
  assert.equal(isGlob("docs/decisions/ADR-0003-*.md"), true)
  assert.equal(isGlob("docs/decisions/ADR-0003-sqlite.md"), false)
})
