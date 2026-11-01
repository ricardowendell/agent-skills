// fixture.mjs — put a case's starting state (and the skill under review) into
// the scratch dir.
//
// A plain tree is copied as-is. A `git.json` manifest stages history instead:
// `{ "base": "../base", "remove": [...], "branch": "...", "message": "...",
//   "patch": "change.patch" }` commits the base tree as `main`, prunes `remove`,
// applies the patch on `branch`, and leaves that branch checked out.
//
// The skill is copied into `<scratch>/.opencode/skills/<id>/` because OpenCode
// gives a project-local skill precedence over a global install of the same id
// (verified: the `skill` tool reports `directory` inside the scratch dir). That
// is what makes the run test the checkout rather than whatever is installed.

import { readFileSync, readdirSync, existsSync, mkdtempSync, cpSync, writeFileSync, unlinkSync, rmSync, mkdirSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { join, resolve } from "node:path"
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

// Copy the skill under review into the scratch dir, returning its id and hash.
// A project-local skill shadows the global install of the same id (verified:
// the `skill` tool reports `directory` inside the scratch dir), so this is what
// makes the run test the checkout. The copy is added to .git/info/exclude when
// the fixture is a git repo, so a review skill does not see it as untracked.
export function stageSkill(skill, scratch) {
  const dest = join(scratch, ".opencode/skills", skill.id)
  rmSync(dest, { recursive: true, force: true })
  copyTree(skill.dir, dest, (src) => !/(^|\/)(node_modules|\.git)$/.test(src))
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

export function stageFixture(skill, c, scratch) {
  const caseDir = join(skill.dir, "references/evals", String(c.n))
  const manifest = join(caseDir, "git.json")
  const isGit = existsSync(manifest)
  const spec = isGit ? JSON.parse(readFileSync(manifest, "utf8")) : {}
  const baseDir = isGit ? resolve(caseDir, spec.base ?? ".") : caseDir
  if (!existsSync(baseDir)) return { staged: false }
  copyTree(baseDir, scratch, (src) => !/(^|\/)(git\.json|change\.patch)$/.test(src))
  if (!isGit) return { staged: true, git: false }

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
  if (spec.branch) run("checkout", "-q", "-b", spec.branch)
  if (spec.patch) {
    const tmp = join(scratch, ".eval-change.patch")
    writeFileSync(tmp, readFileSync(join(caseDir, spec.patch), "utf8"))
    try {
      run("apply", "--whitespace=nowarn", tmp)
    } finally {
      unlinkSync(tmp)
    }
  }
  commit(spec.message ?? "change under review")
  return { staged: true, git: true }
}
