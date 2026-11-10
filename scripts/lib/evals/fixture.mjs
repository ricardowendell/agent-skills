// fixture.mjs — put a case's starting state (and the skill under review) into
// the scratch dir.
//
// A plain tree is copied as-is. A `git.json` manifest stages history instead:
// `{ "base": "../base", "remove": [...], "branch": "...", "message": "...",
//   "patch": "change.patch" }` commits the base tree as `main`, prunes `remove`,
// applies the patch on `branch`, and leaves that branch checked out.
//
// Two optional keys stage the state a survey skill needs:
//   "remote": true   creates a bare repo beside the scratch dir, adds it as
//                     `origin`, and pushes what was staged.
//   "branches": [{ "name": "...", "patch": "...", "message": "..." }]
//                    branches each cut from `main`; the last one is left checked
//                    out. A branch without a patch is an empty branch.
//
// The skill is copied into `<scratch>/.opencode/skills/<id>/` because OpenCode
// gives a project-local skill precedence over a global install of the same id
// (verified: the `skill` tool reports `directory` inside the scratch dir). That
// is what makes the run test the checkout rather than whatever is installed.

import { readFileSync, readdirSync, existsSync, mkdtempSync, cpSync, writeFileSync, unlinkSync, rmSync, mkdirSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { dirname, join, resolve } from "node:path"
import { tmpdir } from "node:os"
import { expand } from "./glob.mjs"

export function makeScratch(id, n) {
  return mkdtempSync(join(tmpdir(), `eval-${id}-${n}-`))
}

// Hash of every file and directory relative path, so two runs can prove they
// staged the same skill.
export function treeHash(root) {
  const h = createHash("sha256")
  for (const { rel, isDir } of expand(root, "**")) {
    h.update(`${rel}\u0000${isDir ? "d" : "f"}\u0000`)
    if (!isDir) {
      try {
        h.update(createHash("sha256").update(readFileSync(join(root, rel))).digest("hex"))
      } catch {
        h.update("unreadable")
      }
    }
    h.update("\n")
  }
  return h.digest("hex")
}

// A prompt is not a tree; the same digest shape keeps the artifact uniform.
export function textHash(value) {
  return createHash("sha256").update(String(value ?? "")).digest("hex")
}

// Content hashes of the staged tree, for `unchanged`/`changed`.
export function snapshotTree(root) {
  const map = new Map()
  for (const { rel, isDir } of expand(root, "**")) {
    if (isDir) continue
    try {
      map.set(rel, createHash("md5").update(readFileSync(join(root, rel))).digest("hex"))
    } catch {}
  }
  return map
}

function copyTree(src, dest, filter) {
  cpSync(src, dest, { recursive: true, filter })
}

// The eval corpus is the answer key: `references/evals.md` holds every case's
// prompt, expectations and assertions, and `references/evals/<n>/` the fixtures
// of the other cases. An agent that can read them can satisfy a case without
// exercising the skill, and 40 of the first 194 transcripts did. The skill is
// staged without them; `stageFixture` reads the case's fixture from the repo.
const CORPUS = /(^|\/)(node_modules|\.git|evals|evals\.md)$/

// Copy the skill under review into the scratch dir, returning its id and hash.
// A project-local skill shadows the global install of the same id (verified:
// the `skill` tool reports `directory` inside the scratch dir), so this is what
// makes the run test the checkout. The copy is added to .git/info/exclude when
// the fixture is a git repo, so a review skill does not see it as untracked.
export function stageSkill(skill, scratch) {
  const dest = join(scratch, ".opencode/skills", skill.id)
  rmSync(dest, { recursive: true, force: true })
  copyTree(skill.dir, dest, (src) => !CORPUS.test(src))
  const exclude = join(scratch, ".git/info/exclude")
  if (existsSync(exclude)) {
    const cur = readFileSync(exclude, "utf8")
    if (!cur.includes(".opencode/")) writeFileSync(exclude, cur + "\n.opencode/\n")
  }
  return { id: skill.id, dest, hash: treeHash(dest) }
}

// Deny the skill tool while leaving the fixture's own config intact: the
// --no-skill arm must still stage the case, only without the artefact under test.
export function denySkillTool(scratch) {
  const dir = join(scratch, ".opencode")
  mkdirSync(dir, { recursive: true })
  const file = join(dir, "opencode.json")
  let config = {}
  try {
    config = JSON.parse(readFileSync(file, "utf8"))
  } catch {}
  config.tools = { ...(config.tools ?? {}), skill: false }
  writeFileSync(file, JSON.stringify(config, null, 2))
}

// Stage the case's starting state. A case with no fixture tree stages nothing:
// its prompt carries the whole situation, and the assertions decide the rest.
// Returns `{ hash }`, the hash of the tree the agent will see as its starting
// state. `treeHash` skips `.git`/`node_modules`, and the staged skill (which
// lives under `.opencode/`) is copied *after* this, so the hash describes the
// fixture alone — a fixture edit moves it, a skill edit does not.
export function stageFixture(skill, c, scratch) {
  const caseDir = join(skill.dir, "references/evals", String(c.n))
  const manifest = join(caseDir, "git.json")
  const isGit = existsSync(manifest)
  const spec = isGit ? JSON.parse(readFileSync(manifest, "utf8")) : {}
  const baseDir = isGit ? resolve(caseDir, spec.base ?? ".") : caseDir
  // A `base` that does not resolve used to stage an empty scratch silently, so
  // a broken pointer was audited as an empty directory and the draw was paid
  // for anyway (SPEC-0055 case 9). A `patch` that fails already throws; the
  // manifest is not a softer contract than the patch. A case with no `git.json`
  // keeps the old behaviour: its prompt carries the situation and an empty
  // starting tree can be meaningful.
  if (isGit && !existsSync(baseDir)) {
    throw new Error(
      `case ${c.n}: git.json base '${spec.base ?? "."}' does not resolve (resolved ${baseDir}); fixture directory ${caseDir}`,
    )
  }
  if (!existsSync(baseDir)) return { hash: treeHash(scratch) }
  copyTree(baseDir, scratch, (src) => !/(^|\/)(git\.json|change\.patch)$/.test(src))
  if (!isGit) return { hash: treeHash(scratch) }

  // `remove` prunes paths from the base before the first commit — for a case
  // where the artefact under review (a spec, a prompt) must not exist yet.
  for (const rel of spec.remove ?? []) rmSync(join(scratch, rel), { recursive: true, force: true })

  const git = (...args) =>
    spawnSync(
      "git",
      ["-c", "user.name=Eval", "-c", "user.email=eval@example.com", "-c", "commit.gpgsign=false", ...args],
      { cwd: scratch, encoding: "utf8" },
    )

  const run = (...args) => {
    const r = git(...args)
    if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr || r.stdout}`)
  }

  const dirty = () => git("status", "--porcelain").stdout.trim() !== ""
  const commit = (message) => {
    if (!dirty()) return
    run("add", "-A")
    run("commit", "-q", "-m", message)
  }

  run("init", "-q", "-b", "main")
  commit("chore: fixture base")

  // A bare repo outside the scratch dir: a remote inside it would show up in
  // every `git status` and in the tree the skill reviews.
  if (spec.remote) {
    const bare = `${scratch}-origin.git`
    rmSync(bare, { recursive: true, force: true })
    const init = spawnSync("git", ["init", "-q", "--bare", bare], { encoding: "utf8" })
    if (init.status !== 0) throw new Error(`git init --bare failed: ${init.stderr}`)
    run("remote", "add", "origin", bare)
    run("push", "-q", "-u", "origin", "main")
  }

  const applyPatch = (file) => {
    if (!file) return
    const tmp = join(scratch, ".eval-change.patch")
    writeFileSync(tmp, readFileSync(join(caseDir, file), "utf8"))
    try {
      run("apply", "--whitespace=nowarn", tmp)
    } finally {
      unlinkSync(tmp)
    }
  }

  // A manifest without `branch` keeps the old behaviour: the patch lands on
  // `main`. A manifest without `remote`/`branches` must stage exactly as before.
  if (spec.branch) run("checkout", "-q", "-b", spec.branch)
  applyPatch(spec.patch)
  commit(spec.message ?? "change under review")
  if (spec.branch && spec.remote) run("push", "-q", "-u", "origin", spec.branch)

  for (const b of spec.branches ?? []) {
    run("checkout", "-q", "-B", b.name, "main")
    applyPatch(b.patch)
    commit(b.message ?? `change on ${b.name}`)
    if (spec.remote) run("push", "-q", "-u", "origin", b.name)
  }

  return { hash: treeHash(scratch) }
}

// `stageSkill` copies the skill without its eval corpus, so a legacy run's
// `skillHash` is the hash of that filtered tree. Recomputing it from the working
// checkout (rather than copying to a temp dir) keeps `check-staleness` a query;
// the filtered listing is the same shape `stageSkill` copies.
function inCorpus(rel) {
  const parts = rel.split("/")
  return parts.some((p) => p === "node_modules" || p === ".git" || p === "evals") || parts[parts.length - 1] === "evals.md"
}

export function stagedTreeHash(root) {
  const h = createHash("sha256")
  for (const { rel, isDir } of expand(root, "**")) {
    if (inCorpus(rel)) continue
    h.update(`${rel}\u0000${isDir ? "d" : "f"}\u0000`)
    if (!isDir) {
      try {
        h.update(createHash("sha256").update(readFileSync(join(root, rel))).digest("hex"))
      } catch {
        h.update("unreadable")
      }
    }
    h.update("\n")
  }
  return h.digest("hex")
}

// A case may name the files that govern its result with `governs:`; absent
// means the whole skill tree, the conservative default from review. Paths are
// skill-relative and validated by `parse.mjs`.
export function governedFiles(skillDir, governs = null) {
  if (Array.isArray(governs) && governs.length) {
    return governs.map((rel) => String(rel).replace(/^\.\//, "")).sort()
  }
  return expand(skillDir, "**")
    .filter((e) => !e.isDir)
    .map((e) => e.rel)
    .sort()
}

// One hash per governed file, taken from the working tree at draw time. The
// staged copy is not used: `governs:` may name a file the copy strips (the
// answer key) and the later comparison is against the checkout, not the copy.
export function skillFileHashes(skillDir, files) {
  const out = {}
  for (const rel of files) {
    try {
      out[rel] = createHash("sha256").update(readFileSync(join(skillDir, rel))).digest("hex")
    } catch {
      out[rel] = null
    }
  }
  return out
}

export function hasGitFixture(skill, c) {
  return existsSync(join(skill.dir, "references/evals", String(c.n), "git.json"))
}

// The files a fixture can put in the scratch dir, without staging it. Used by
// `--list --check` to warn about an existence target the draw must create; the
// base tree, `remove:`, and both sides of every patch are the whole answer.
// Staging remains the authoritative check.
export function fixtureEntries(skill, c) {
  const caseDir = join(skill.dir, "references/evals", String(c.n))
  const manifest = join(caseDir, "git.json")
  const isGit = existsSync(manifest)
  let spec = {}
  if (isGit) {
    try {
      spec = JSON.parse(readFileSync(manifest, "utf8"))
    } catch {
      return []
    }
  }
  const baseDir = isGit ? resolve(caseDir, spec.base ?? ".") : caseDir
  const removed = spec.remove ?? []
  const entries = !existsSync(baseDir)
    ? []
    : expand(baseDir, "**").filter((e) => {
        if (/(^|\/)(git\.json|change\.patch)$/.test(e.rel)) return false
        return !removed.some((r) => e.rel === r || e.rel.startsWith(`${r}/`))
      })

  const add = (rel, isDir) => {
    if (!entries.some((e) => e.rel === rel)) entries.push({ rel, isDir })
  }
  const patches = [spec.patch, ...(spec.branches ?? []).map((b) => b.patch)].filter(Boolean)
  for (const patch of patches) {
    const file = join(caseDir, patch)
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^(?:\+\+\+ b\/|--- a\/)(.+)$/)
      if (!m || m[1] === "/dev/null") continue
      add(m[1], false)
      for (let dir = dirname(m[1]); dir && dir !== "." && dir !== "/"; dir = dirname(dir)) add(dir, true)
    }
  }
  return entries
}
