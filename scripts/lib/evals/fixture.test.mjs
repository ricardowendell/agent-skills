import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  fixtureEntries,
  governedFiles,
  hasGitFixture,
  skillFileHashes,
  stageFixture,
  stageSkill,
  makeScratch,
  snapshotTree,
  stagedTreeHash,
  treeHash,
} from "./fixture.mjs"

function files(root, map) {
  for (const [rel, content] of Object.entries(map)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true })
    writeFileSync(join(root, rel), content)
  }
  return root
}

// A mini repo: the skill at `<root>/skills/demo`, its corpus beside it at
// `<root>/evals/demo` (SPEC-0058). Returns the skill directory, which is what
// `stageFixture`/`stageSkill` take as `skill.dir`.
function repo(skillFiles = {}, corpusFiles = {}) {
  const root = mkdtempSync(join(tmpdir(), "fixture-skill-"))
  const skill = join(root, "skills", "demo")
  files(skill, skillFiles)
  files(join(root, "evals", "demo"), corpusFiles)
  return skill
}

function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" })
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`)
  return r.stdout.trim()
}

test("the staged skill carries no eval corpus", () => {
  const skillDir = repo(
    {
      "SKILL.md": "---\nname: demo\n---\n",
      "references/notes.md": "kept\n",
    },
    {
      "cases.md": "1. **T.**\n   - prompt: the answer\n",
      "fixtures/1/AGENTS.md": "# another case's fixture\n",
    },
  )
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
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    {
      "fixtures/1/AGENTS.md": "# repo\n",
      "fixtures/1/docs/specs/SPEC-0001.md": "# spec\n",
    },
  )
  const scratch = makeScratch("demo", 1)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)
  assert.equal(readFileSync(join(scratch, "docs/specs/SPEC-0001.md"), "utf8"), "# spec\n")
})

test("a git fixture stages main, prunes, then applies the patch on a branch", () => {
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    {
      "fixtures/1/base/a.txt": "one\n",
      "fixtures/1/base/docs/keep.md": "keep\n",
      "fixtures/1/base/docs/specs/SPEC-0001.md": "old\n",
      "fixtures/1/git.json": JSON.stringify({ base: "base", remove: ["docs/specs"], branch: "feature/x", patch: "change.patch", message: "feat: change" }),
      "fixtures/1/change.patch": "diff --git a/a.txt b/a.txt\n--- a/a.txt\n+++ b/a.txt\n@@ -1 +1 @@\n-one\n+two\n",
    },
  )
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
  const skillDir = repo({
    "SKILL.md": "---\nname: review-code\ndescription: demo\n---\nbody\n",
  })
  const a = makeScratch("review-code", 1)
  const pinned = stageSkill({ id: "review-code", dir: skillDir }, a)
  assert.equal(pinned.hash, treeHash(join(a, ".opencode/skills/review-code")))
  assert.equal(readFileSync(join(a, ".opencode/skills/review-code/SKILL.md"), "utf8").includes("body"), true)

  const b = makeScratch("review-code", 1)
  assert.equal(stageSkill({ id: "review-code", dir: skillDir }, b).hash, pinned.hash, "hash is not stable")
})

test("a git fixture can stage several branches and a local remote", () => {
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    {
      "fixtures/1/base/shared.js": "one\n",
      "fixtures/1/a.patch": "diff --git a/shared.js b/shared.js\n--- a/shared.js\n+++ b/shared.js\n@@ -1 +1 @@\n-one\n+from a\n",
      "fixtures/1/b.patch": "diff --git a/shared.js b/shared.js\n--- a/shared.js\n+++ b/shared.js\n@@ -1 +1 @@\n-one\n+from b\n",
      "fixtures/1/git.json": JSON.stringify({
        base: "base",
        remote: true,
        branches: [{ name: "feature/a", patch: "a.patch" }, { name: "feature/b", patch: "b.patch" }],
      }),
    },
  )
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
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    {
      "fixtures/1/base/shared.js": "one\n",
      "fixtures/1/p.patch": "diff --git a/shared.js b/shared.js\n--- a/shared.js\n+++ b/shared.js\n@@ -1 +1 @@\n-one\n+patched\n",
      "fixtures/1/git.json": JSON.stringify({
        base: "base",
        patch: "p.patch",
        message: "change under review",
      }),
    },
  )
  const scratch = makeScratch("demo", 4)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)

  assert.equal(git(scratch, "rev-parse", "--abbrev-ref", "HEAD"), "main")
  assert.equal(git(scratch, "log", "-1", "--pretty=%s"), "change under review")
  assert.equal(readFileSync(join(scratch, "shared.js"), "utf8"), "patched\n")
  assert.equal(git(scratch, "status", "--porcelain"), "", "staging left a dirty tree")
})

test("mainPatch advances main after the branch is cut, leaving the branch behind", () => {
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    {
      "fixtures/1/base/shared.js": "one\n",
      "fixtures/1/advance.patch":
        "diff --git a/shared.js b/shared.js\n--- a/shared.js\n+++ b/shared.js\n@@ -1 +1 @@\n-one\n+advanced\n",
      "fixtures/1/git.json": JSON.stringify({ base: "base", branch: "develop", mainPatch: "advance.patch" }),
    },
  )
  const scratch = makeScratch("demo", 10)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)

  assert.equal(git(scratch, "rev-parse", "--abbrev-ref", "HEAD"), "develop")
  assert.equal(git(scratch, "show", "main:shared.js"), "advanced")
  assert.equal(git(scratch, "show", "develop:shared.js"), "one")
  assert.equal(git(scratch, "rev-list", "--count", "develop..main"), "1")
  assert.equal(git(scratch, "status", "--porcelain"), "", "staging left a dirty tree")
})

test("mainPatch is pushed to the local remote, so the branch is behind origin/main", () => {
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    {
      "fixtures/1/base/shared.js": "one\n",
      "fixtures/1/advance.patch":
        "diff --git a/shared.js b/shared.js\n--- a/shared.js\n+++ b/shared.js\n@@ -1 +1 @@\n-one\n+advanced\n",
      "fixtures/1/git.json": JSON.stringify({
        base: "base",
        remote: true,
        branches: [{ name: "develop" }],
        mainPatch: "advance.patch",
      }),
    },
  )
  const scratch = makeScratch("demo", 11)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)

  assert.equal(git(scratch, "rev-parse", "--abbrev-ref", "HEAD"), "develop")
  assert.equal(git(scratch, "show", "origin/main:shared.js"), "advanced")
  assert.equal(git(scratch, "show", "origin/develop:shared.js"), "one")
  assert.equal(git(scratch, "rev-list", "--count", "develop..origin/main"), "1")
})

test("dirty writes an uncommitted change after the last commit", () => {
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    {
      "fixtures/1/base/shared.js": "one\n",
      "fixtures/1/dirty.patch":
        "diff --git a/seen.txt b/seen.txt\nnew file mode 100644\n--- /dev/null\n+++ b/seen.txt\n@@ -0,0 +1 @@\n+committed\n",
      "fixtures/1/git.json": JSON.stringify({
        base: "base",
        branch: "develop",
        patch: "dirty.patch",
        dirty: [{ path: "shared.js", content: "one local\n" }, { path: "notes/local.md", content: "mine\n" }],
      }),
    },
  )
  const scratch = makeScratch("demo", 12)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)

  assert.equal(git(scratch, "rev-parse", "--abbrev-ref", "HEAD"), "develop")
  assert.equal(readFileSync(join(scratch, "shared.js"), "utf8"), "one local\n")
  assert.equal(readFileSync(join(scratch, "notes/local.md"), "utf8"), "mine\n")
  assert.equal(git(scratch, "show", "HEAD:shared.js"), "one", "the dirty change was committed")
  assert.equal(git(scratch, "ls-files", "notes/local.md"), "", "the dirty file was tracked")
  const status = git(scratch, "status", "--porcelain", "--untracked-files=all")
  assert.match(status, /M shared\.js/)
  assert.match(status, /\?\? notes\/local\.md/)
})

test("a manifest without mainPatch or dirty stages exactly as before", () => {
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    {
      "fixtures/1/base/shared.js": "one\n",
      "fixtures/1/p.patch": "diff --git a/shared.js b/shared.js\n--- a/shared.js\n+++ b/shared.js\n@@ -1 +1 @@\n-one\n+patched\n",
      "fixtures/1/git.json": JSON.stringify({ base: "base", branch: "develop", patch: "p.patch" }),
    },
  )
  const scratch = makeScratch("demo", 13)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)

  assert.equal(git(scratch, "rev-parse", "--abbrev-ref", "HEAD"), "develop")
  assert.equal(git(scratch, "rev-parse", "--abbrev-ref", "main"), "main")
  assert.equal(git(scratch, "rev-list", "--count", "HEAD"), "2")
  assert.equal(readFileSync(join(scratch, "shared.js"), "utf8"), "patched\n")
  assert.equal(git(scratch, "status", "--porcelain"), "")
})

test("a pinned skill stays out of the fixture's git status", () => {
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    {
      "fixtures/1/base/a.txt": "one\n",
      "fixtures/1/git.json": JSON.stringify({ base: "base", branch: "feature" }),
    },
  )
  const scratch = makeScratch("demo", 1)
  stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)
  stageSkill({ id: "demo", dir: skillDir }, scratch)
  assert.equal(git(scratch, "status", "--porcelain"), "")
})

// A routing case names a sibling it expects on the menu. The sibling is a skill
// exactly like the arm's: copied into the scratch, stripped of its eval corpus,
// and hashed so the run can prove which copy the agent could see.
test("two synthetic skills stage side by side, each with its own hash", () => {
  const armRoot = mkdtempSync(join(tmpdir(), "fixture-arm-"))
  const arm = files(join(armRoot, "skills", "capture"), {
    "SKILL.md": "---\nname: capture\n---\nbody\n",
    "references/notes.md": "arm\n",
  })
  files(join(armRoot, "evals", "capture"), { "cases.md": "1. **x**\n" })
  const siblingRoot = mkdtempSync(join(tmpdir(), "fixture-sibling-"))
  const sibling = files(join(siblingRoot, "skills", "process"), {
    "SKILL.md": "---\nname: process\n---\nbody\n",
    "references/notes.md": "sibling\n",
  })
  files(join(siblingRoot, "evals", "process"), { "cases.md": "1. **y**\n" })
  const scratch = makeScratch("capture", 3)
  const pinned = stageSkill({ id: "capture", dir: arm }, scratch)
  const staged = stageSkill({ id: "process", dir: sibling }, scratch)

  assert.equal(staged.id, "process")
  assert.equal(staged.hash, treeHash(join(scratch, ".opencode/skills/process")))
  assert.equal(pinned.hash, treeHash(join(scratch, ".opencode/skills/capture")))
  assert.notEqual(staged.hash, pinned.hash, "two skills cannot share one hash")
  // The answer key stays out of both copies, not just the arm's.
  assert.equal(existsSync(join(scratch, ".opencode/skills/process/references/evals.md")), false)
})

// `stage:` is case syntax validated by the CLI, so the check runs the real
// script on synthetic roots: a known sibling is accepted, a self-reference and
// an unknown id are refused.
const EVAL = resolve(dirname(fileURLToPath(import.meta.url)), "../../eval.mjs")
function stageRoot(skills) {
  const root = mkdtempSync(join(tmpdir(), "stage-check-"))
  for (const [id, stage] of Object.entries(skills)) {
    files(join(root, "skills", id), { "SKILL.md": `---\nname: ${id}\n---\n` })
    files(join(root, "evals", id), {
      "cases.md": `1. **T.**\n   - prompt: do it\n   - stage: ${stage}\n   - assert: skill ${stage}\n`,
    })
  }
  return join(root, "skills")
}
const checkRoot = (root) => spawnSync(process.execPath, [EVAL, "check", "--root", root], { encoding: "utf8" })

test("--check accepts a declared sibling and rejects a self-reference", () => {
  const ok = checkRoot(stageRoot({ capture: "process", process: "capture" }))
  assert.equal(ok.status, 0, ok.stderr)
  assert.match(ok.stdout, /Parsed 2 case/)

  const self = checkRoot(stageRoot({ capture: "capture" }))
  assert.equal(self.status, 1)
  assert.match(self.stderr, /names the skill under review/)
})

test("--check rejects an unknown stage id", () => {
  const unknown = checkRoot(stageRoot({ capture: "ghost" }))
  assert.equal(unknown.status, 1)
  assert.match(unknown.stderr, /unknown stage 'ghost'/)
})

// SPEC-0055 case 9 spent five paid draws on an empty scratch because a broken
// `base` returned quietly. The contrast is `applyPatch`, which already threw.
test("a git.json base that does not resolve throws and names case, path and fixture", () => {
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    { "fixtures/1/git.json": JSON.stringify({ base: "../missing" }) },
  )
  const scratch = makeScratch("demo", 1)
  assert.throws(
    () => stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch),
    (e) => /case 1/.test(e.message) && /\.\.\/missing/.test(e.message) && /fixture directory/.test(e.message),
  )
  assert.equal(readdirSync(scratch).length, 0, "the throw must not leave a half-staged tree")
})

test("a case without git.json still stages its empty tree quietly", () => {
  const skillDir = repo({ "SKILL.md": "---\nname: demo\n---\n" })
  const scratch = makeScratch("demo", 1)
  const staged = stageFixture({ id: "demo", dir: skillDir }, { n: 1 }, scratch)
  assert.match(staged.hash, /^[0-9a-f]{64}$/)
})

// Staleness compares a legacy run's `skillHash` with the working tree, so the
// re-computed filtered hash must be the exact one `stageSkill` produced.
test("the staged tree hash matches the copy stageSkill hashes", () => {
  const skillDir = repo(
    {
      "SKILL.md": "---\nname: demo\n---\nbody\n",
      "references/notes.md": "kept\n",
    },
    {
      "cases.md": "1. **x**\n",
      "fixtures/1/base/a.txt": "excluded\n",
    },
  )
  const scratch = makeScratch("demo", 1)
  const pinned = stageSkill({ id: "demo", dir: skillDir }, scratch)
  assert.equal(stagedTreeHash(skillDir), pinned.hash)
})

// SPEC-0071: an empty, untracked directory is not part of the skill. In the
// primary checkout one such directory made `groom-backlog` read fresh where a
// clean worktree read stale, so the tree hash must ignore it.
test("an empty directory does not change the staged tree hash", () => {
  const skillDir = repo({ "SKILL.md": "---\nname: demo\n---\nbody\n" })
  const before = stagedTreeHash(skillDir)
  mkdirSync(join(skillDir, "references"))
  assert.equal(stagedTreeHash(skillDir), before, "an empty directory moved the tree hash")
})

test("a file added to that directory changes the staged tree hash", () => {
  const skillDir = repo({ "SKILL.md": "---\nname: demo\n---\nbody\n" })
  mkdirSync(join(skillDir, "references"))
  const empty = stagedTreeHash(skillDir)
  writeFileSync(join(skillDir, "references/notes.md"), "notes\n")
  assert.notEqual(stagedTreeHash(skillDir), empty, "a file a draw can read must move the hash")
})

// The old behaviour, kept: a directory holding a file is still hashed. The tree
// is one directory and one file, so the entry order is unambiguous and the
// digest can be computed by hand.
test("a directory with a file still participates in the staged tree hash", () => {
  const root = files(makeScratch("demo", 7), { "references/notes.md": "notes\n" })
  const expected = createHash("sha256")
    .update("references\u0000d\u0000\n")
    .update(`references/notes.md\u0000f\u0000${createHash("sha256").update("notes\n").digest("hex")}\n`)
    .digest("hex")
  assert.equal(stagedTreeHash(root), expected)
})

test("governs narrows the hashed set; absent means the whole skill tree", () => {
  const skillDir = repo({
    "SKILL.md": "---\nname: demo\n---\n",
    "references/notes.md": "notes\n",
  })
  const all = governedFiles(skillDir, null)
  assert.deepEqual(all, ["SKILL.md", "references/notes.md"])
  const narrow = governedFiles(skillDir, ["references/notes.md"])
  assert.deepEqual(narrow, ["references/notes.md"])
  const hashes = skillFileHashes(skillDir, narrow)
  assert.deepEqual(Object.keys(hashes), ["references/notes.md"])
  assert.match(hashes["references/notes.md"], /^[0-9a-f]{64}$/)
  assert.equal(hasGitFixture({ id: "demo", dir: skillDir }, { n: 1 }), false)
})

test("fixtureEntries lists the base, prune and both sides of the patch", () => {
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    {
      "fixtures/1/base/keep.js": "one\n",
      "fixtures/1/base/docs/old.md": "old\n",
      "fixtures/1/git.json": JSON.stringify({ base: "base", remove: ["docs/old.md"], patch: "p.patch" }),
      "fixtures/1/p.patch":
        "diff --git a/new.js b/new.js\n--- a/new.js\n+++ b/new.js\n@@ -0,0 +1 @@\n+new\n",
    },
  )
  const entries = fixtureEntries({ id: "demo", dir: skillDir }, { n: 1 })
  const rels = entries.map((e) => `${e.rel}${e.isDir ? "/" : ""}`)
  assert.ok(rels.includes("keep.js"))
  assert.ok(rels.includes("new.js"), "the patch addition was not listed")
  assert.ok(!rels.includes("docs/old.md"), "remove: was not pruned")
  assert.ok(!rels.some((r) => r.endsWith("git.json")))
})

test("fixtureEntries lists mainPatch and dirty targets", () => {
  const skillDir = repo(
    { "SKILL.md": "---\nname: demo\n---\n" },
    {
      "fixtures/1/base/keep.js": "one\n",
      "fixtures/1/git.json": JSON.stringify({
        base: "base",
        branch: "develop",
        mainPatch: "advance.patch",
        dirty: [{ path: "local/notes.md", content: "mine\n" }],
      }),
      "fixtures/1/advance.patch":
        "diff --git a/new.js b/new.js\nnew file mode 100644\n--- /dev/null\n+++ b/new.js\n@@ -0,0 +1 @@\n+new\n",
    },
  )
  const rels = fixtureEntries({ id: "demo", dir: skillDir }, { n: 1 }).map((e) => e.rel)
  assert.ok(rels.includes("keep.js"))
  assert.ok(rels.includes("new.js"), "the mainPatch addition was not listed")
  assert.ok(rels.includes("local/notes.md"), "the dirty file was not listed")
  assert.ok(rels.includes("local"), "the dirty file's directory was not listed")
})

test("the snapshot records staged content, so a later edit is visible", () => {
  const scratch = files(makeScratch("demo", 2), { "src/cart.js": "one\n" })
  const snap = snapshotTree(scratch)
  assert.equal(snap.size, 1)
  writeFileSync(join(scratch, "src/cart.js"), "two\n")
  assert.notEqual(snapshotTree(scratch).get("src/cart.js"), snap.get("src/cart.js"))
})
