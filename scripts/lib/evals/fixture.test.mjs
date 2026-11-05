import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { stageFixture, stageSkill, makeScratch, snapshotTree, treeHash } from "./fixture.mjs"

function files(root, map) {
  for (const [rel, content] of Object.entries(map)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true })
    writeFileSync(join(root, rel), content)
  }
  return root
}

function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" })
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`)
  return r.stdout.trim()
}

test("the staged skill carries no eval corpus", () => {
  const skillDir = files(mkdtempSync(join(tmpdir(), "fixture-skill-")), {
    "SKILL.md": "---\nname: demo\n---\n",
    "references/notes.md": "kept\n",
    "references/evals.md": "- prompt: the answer\n",
    "references/evals/1/AGENTS.md": "# another case's fixture\n",
  })
  const scratch = makeScratch("demo", 9)
  const pinned = stageSkill({ id: "demo", dir: skillDir }, scratch)
  const staged = join(scratch, ".opencode/skills/demo")
  assert.equal(existsSync(join(staged, "SKILL.md")), true)
  assert.equal(existsSync(join(staged, "references/notes.md")), true)
  assert.equal(existsSync(join(staged, "references/evals.md")), false)
  assert.equal(existsSync(join(staged, "references/evals")), false)
  // The hash describes what the agent could see, so it must move too.
  assert.match(pinned.hash, /^[0-9a-f]{64}$/)
})

test("a plain fixture is copied whole", () => {
  const skillDir = files(mkdtempSync(join(tmpdir(), "fixture-skill-")), {
    "SKILL.md": "---\nname: demo\n---\n",
    "references/evals/1/AGENTS.md": "# repo\n",
    "references/evals/1/docs/specs/SPEC-0001.md": "# spec\n",
  })
  const scratch = makeScratch("demo", 1)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)
  assert.equal(readFileSync(join(scratch, "docs/specs/SPEC-0001.md"), "utf8"), "# spec\n")
})

test("a git fixture stages main, prunes, then applies the patch on a branch", () => {
  const skillDir = files(mkdtempSync(join(tmpdir(), "fixture-git-")), {
    "SKILL.md": "---\nname: demo\n---\n",
    "references/evals/1/base/a.txt": "one\n",
    "references/evals/1/base/docs/keep.md": "keep\n",
    "references/evals/1/base/docs/specs/SPEC-0001.md": "old\n",
    "references/evals/1/git.json": JSON.stringify({ base: "base", remove: ["docs/specs"], branch: "feature/x", patch: "change.patch", message: "feat: change" }),
    "references/evals/1/change.patch": "diff --git a/a.txt b/a.txt\n--- a/a.txt\n+++ b/a.txt\n@@ -1 +1 @@\n-one\n+two\n",
  })
  const scratch = makeScratch("demo", 1)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)

  assert.equal(git(scratch, "rev-parse", "--abbrev-ref", "HEAD"), "feature/x")
  assert.equal(git(scratch, "rev-list", "--count", "HEAD"), "2")
  assert.equal(readFileSync(join(scratch, "a.txt"), "utf8"), "two\n")
  assert.equal(existsSync(join(scratch, "docs/specs/SPEC-0001.md")), false, "remove did not prune")
  assert.equal(existsSync(join(scratch, "docs/keep.md")), true)
  assert.equal(git(scratch, "status", "--porcelain"), "", "staging left a dirty tree")
})

test("the skill under review is copied into the scratch dir and hashed", () => {
  const skillDir = files(mkdtempSync(join(tmpdir(), "pin-skill-")), {
    "SKILL.md": "---\nname: review-code\ndescription: demo\n---\nbody\n",
    "references/evals.md": "1. **x**\n",
  })
  const a = makeScratch("review-code", 1)
  const pinned = stageSkill({ id: "review-code", dir: skillDir }, a)
  assert.equal(pinned.hash, treeHash(join(a, ".opencode/skills/review-code")))
  assert.equal(readFileSync(join(a, ".opencode/skills/review-code/SKILL.md"), "utf8").includes("body"), true)

  const b = makeScratch("review-code", 1)
  assert.equal(stageSkill({ id: "review-code", dir: skillDir }, b).hash, pinned.hash, "hash is not stable")
})

test("a git fixture can stage several branches and a local remote", () => {
  const skillDir = files(mkdtempSync(join(tmpdir(), "fixture-branches-")), {
    "SKILL.md": "---\nname: demo\n---\n",
    "references/evals/1/base/shared.js": "one\n",
    "references/evals/1/a.patch": "diff --git a/shared.js b/shared.js\n--- a/shared.js\n+++ b/shared.js\n@@ -1 +1 @@\n-one\n+from a\n",
    "references/evals/1/b.patch": "diff --git a/shared.js b/shared.js\n--- a/shared.js\n+++ b/shared.js\n@@ -1 +1 @@\n-one\n+from b\n",
    "references/evals/1/git.json": JSON.stringify({
      base: "base",
      remote: true,
      branches: [{ name: "feature/a", patch: "a.patch" }, { name: "feature/b", patch: "b.patch" }],
    }),
  })
  const scratch = makeScratch("demo", 3)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)

  assert.equal(git(scratch, "rev-parse", "--abbrev-ref", "HEAD"), "feature/b")
  assert.equal(git(scratch, "rev-parse", "--abbrev-ref", "origin/feature/a"), "origin/feature/a")
  assert.equal(git(scratch, "rev-parse", "--abbrev-ref", "origin/feature/b"), "origin/feature/b")
  assert.equal(git(scratch, "show", "feature/a:shared.js"), "from a")
  assert.equal(git(scratch, "show", "feature/b:shared.js"), "from b")
  assert.equal(git(scratch, "status", "--porcelain"), "", "staging left a dirty tree")
})

test("a git fixture still applies a patch on main when no branch is named", () => {
  const skillDir = files(mkdtempSync(join(tmpdir(), "fixture-patch-main-")), {
    "SKILL.md": "---\nname: demo\n---\n",
    "references/evals/1/base/shared.js": "one\n",
    "references/evals/1/p.patch": "diff --git a/shared.js b/shared.js\n--- a/shared.js\n+++ b/shared.js\n@@ -1 +1 @@\n-one\n+patched\n",
    "references/evals/1/git.json": JSON.stringify({
      base: "base",
      patch: "p.patch",
      message: "change under review",
    }),
  })
  const scratch = makeScratch("demo", 4)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)

  assert.equal(git(scratch, "rev-parse", "--abbrev-ref", "HEAD"), "main")
  assert.equal(git(scratch, "log", "-1", "--pretty=%s"), "change under review")
  assert.equal(readFileSync(join(scratch, "shared.js"), "utf8"), "patched\n")
  assert.equal(git(scratch, "status", "--porcelain"), "", "staging left a dirty tree")
})

test("a pinned skill stays out of the fixture's git status", () => {
  const skillDir = files(mkdtempSync(join(tmpdir(), "pin-git-")), {
    "SKILL.md": "---\nname: demo\n---\n",
    "references/evals/1/base/a.txt": "one\n",
    "references/evals/1/git.json": JSON.stringify({ base: "base", branch: "feature" }),
  })
  const scratch = makeScratch("demo", 1)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)
  stageSkill({ id: "demo", dir: skillDir }, scratch)
  assert.equal(git(scratch, "status", "--porcelain"), "")
})

test("the snapshot records staged content, so a later edit is visible", () => {
  const scratch = files(makeScratch("demo", 2), { "src/cart.js": "one\n" })
  const snap = snapshotTree(scratch)
  assert.equal(snap.size, 1)
  writeFileSync(join(scratch, "src/cart.js"), "two\n")
  assert.notEqual(snapshotTree(scratch).get("src/cart.js"), snap.get("src/cart.js"))
})
