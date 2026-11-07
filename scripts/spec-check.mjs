#!/usr/bin/env node
// spec-check.mjs — fail a spec whose own contract does not hold.
//
// Model-free and filesystem-only: read the spec, the neighbouring specs (for
// depends_on/blocks), the backlog task filenames, and `git diff` for the base.
// Exit 1 per finding, one line each; `--json` prints the same set for a tool.

import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import { checkSpec, parseFrontmatter, asListForCorpus } from "./lib/evals/speccheck.mjs"

const USAGE = `Usage: node scripts/spec-check.mjs --spec <path> [--base <ref>] [--json]

Check a spec's contract: files: against the diff, task: against backlog/tasks,
depends_on/blocks for dangling or asymmetric links, and the body requirements of
status: ready and status: implemented. Without --base the diff rule is skipped.

Exit codes:
  0  no findings
  1  at least one finding
  2  the spec, the repo, or git could not be read
`

function option(argv, name) {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : null
}

function repoRoot() {
  const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" })
  if (r.status !== 0) throw new Error("not inside a git repository")
  return r.stdout.trim()
}

function changedFiles(base) {
  const r = spawnSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" })
  if (r.status !== 0) {
    const detail = (r.stderr || r.stdout || "git diff failed").trim().split("\n")[0]
    throw new Error(`cannot read git diff against ${base}: ${detail}`)
  }
  return r.stdout.split("\n").map((l) => l.trim()).filter(Boolean)
}

function specCorpus(root) {
  const dirs = [join(root, "docs", "specs"), join(root, "docs", "specs", "active")]
  const specs = []
  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".md")) continue
      const path = join(dir, name)
      let data = {}
      try {
        data = parseFrontmatter(readFileSync(path, "utf8")).data
      } catch {
        continue
      }
      specs.push({
        path,
        slug: basename(name, ".md"),
        id: String(data.id ?? basename(name, ".md")).toUpperCase(),
        status: data.status ?? null,
        depends_on: asListForCorpus(data.depends_on),
        blocks: asListForCorpus(data.blocks),
      })
    }
  }
  return specs
}

function taskFiles(root) {
  const dir = join(root, "backlog", "tasks")
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((name) => name.endsWith(".md"))
}

function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(USAGE)
    return 0
  }

  const specArg = option(argv, "--spec")
  if (!specArg) {
    process.stderr.write("spec-check: --spec <path> is required\n")
    return 2
  }
  const base = option(argv, "--base")
  const json = argv.includes("--json")

  const root = repoRoot()
  const specPath = resolve(specArg)
  if (!existsSync(specPath)) {
    process.stderr.write(`spec-check: no such spec: ${specPath}\n`)
    return 2
  }

  const text = readFileSync(specPath, "utf8")
  const findings = checkSpec({
    text,
    path: specPath,
    diff: base ? changedFiles(base) : null,
    specs: specCorpus(root),
    tasks: taskFiles(root),
  })

  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: findings.length === 0, spec: specPath, base: base ?? null, findings }, null, 2)}\n`)
  } else if (findings.length === 0) {
    process.stdout.write(`ok ${specPath} — contract holds\n`)
  } else {
    for (const f of findings) process.stdout.write(`error ${f.rule} ${f.file} — ${f.message}\n`)
  }

  return findings.length ? 1 : 0
}

try {
  process.exitCode = main(process.argv.slice(2))
} catch (e) {
  process.stderr.write(`spec-check: ${e.message}\n`)
  process.exitCode = 2
}
