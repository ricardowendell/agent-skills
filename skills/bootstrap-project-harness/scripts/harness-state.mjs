#!/usr/bin/env node
// harness-state.mjs — the state of a repo, decided once.
//
// The skill used to ask the agent to read a table and judge. Given a repo whose
// files were all present and whose gates were green without an install, agents
// called it partial in 7 of 12 runs, because they audited against these
// templates instead of the criterion. The criterion now has one implementation.
//
//   state: empty | project-no-harness | partial | complete
//   refusal: ambiguous stack, unreadable directory
//
// It only reads. Nothing here writes, installs or fixes, and a missing install
// artefact (node_modules, a lockfile, an installed hook) is never a gap: a fresh
// clone has none, and completeness has to be decidable before one exists.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

// The files a harness is made of. Kept in step with templates/ by its parity
// test: every path here has to be produced by a template, and every template
// has to be either required or listed as optional. Drift is a failing test, not
// a repo that silently reads as complete.
export const DOCS = ["docs/specs", "docs/prompts", "docs/decisions"]

export const REQUIRED = {
  ts: [
    "AGENTS.md",
    "README.md",
    ".editorconfig",
    ".gitignore",
    "package.json",
    "tsconfig.json",
    "justfile",
    "lefthook.yml",
    ".oxlintrc.json",
    ".prettierrc",
    "commitlint.config.cjs",
    "docs-check.mjs",
    "spec-sha.mjs",
    ...DOCS,
  ],
  python: [
    "AGENTS.md",
    "README.md",
    ".editorconfig",
    ".gitignore",
    "justfile",
    "lefthook.yml",
    "pyproject.toml",
    ".python-version",
    "docs_check.py",
    "spec_sha.py",
    ...DOCS,
  ],
}

// Templates that ship but are not part of "is this harness complete": the docs
// content the bootstrap seeds, the CI workflow (a repo may use another CI), and
// local agent config.
export const OPTIONAL = {
  ts: [
    ".nvmrc",
    ".github/workflows/ci.yml",
    "dependency-cruiser-rules.md",
    "oxlint-ai-rules.md",
    ".prettierignore",
    "tsconfig.build.json",
    "audit-gate.mjs",
    ".opencode/opencode.json",
    "docs/WORKFLOW.md",
    "docs/architecture.md",
    "docs/pipeline.md",
    "docs/decisions/README.md",
    "docs/experience/README.md",
    "docs/system/README.md",
    "docs/product/design-principles.md",
    "docs/product/design-system.md",
    "docs/product/language.md",
    "docs/product/principles.md",
    "docs/product/roadmap.md",
    "docs/product/scope.md",
    "docs/product/vision.md",
    "docs/product/voice.md",
  ],
  python: [
    ".github/workflows/ci.yml",
    ".opencode/opencode.json",
    "docs/WORKFLOW.md",
    "docs/architecture.md",
    "docs/pipeline.md",
    "docs/decisions/README.md",
    "docs/experience/README.md",
    "docs/system/README.md",
    "docs/product/design-principles.md",
    "docs/product/design-system.md",
    "docs/product/language.md",
    "docs/product/principles.md",
    "docs/product/roadmap.md",
    "docs/product/scope.md",
    "docs/product/vision.md",
    "docs/product/voice.md",
  ],
}

const PYTHON_PACKAGE_MANAGERS = ["poetry.lock", "pdm.lock", "Pipfile", "requirements.in"]
const PYTHON_OWNERS = ["black", "flake8", "isort", "mypy", "pre-commit"]

const has = (dir, p) => existsSync(join(dir, p))

// The stack rules, in the order the skill states them. Returns `{ id }` or
// `{ ambiguous: [...] }` — never a guess, because guessing here is how a
// monorepo gets the wrong harness.
export function detectStack(dir) {
  const uv = has(dir, "uv.lock")
  const tsMarkers = ["bun.lock", "bun.lockb", "tsconfig.json"].filter((f) => has(dir, f))
  const pyMarkers = ["pyproject.toml", ".python-version", "requirements.txt"].filter((f) => has(dir, f))
  const pkg = has(dir, "package.json")

  // Rule 1 and rule 2 both firing is the documented ambiguity: ask which
  // directory rather than pick.
  if (uv && tsMarkers.length) return { ambiguous: ["uv.lock", ...tsMarkers] }
  if (uv) return { id: "python" }
  if (tsMarkers.length) return { id: "ts" }
  if (pyMarkers.length) return { id: "python" }
  if (pkg) return { id: "ts" }
  return { ambiguous: [] }
}

// A repo that already owns that slot counts as competing even when the file the
// harness would install is absent: the skill must report it, not install ours.
export function competingFor(dir, stack) {
  const found = []
  if (stack === "ts") {
    if (has(dir, ".husky") || has(dir, "husky.config.js") || has(dir, ".huskyrc")) found.push("husky")
    if (has(dir, "tslint.json")) found.push("tslint")
  }
  if (stack === "python") {
    for (const f of PYTHON_PACKAGE_MANAGERS) if (has(dir, f)) found.push(f)
    let pyproject = ""
    try {
      pyproject = readFileSync(join(dir, "pyproject.toml"), "utf8")
    } catch {}
    if (/^\[tool\.poetry\]/m.test(pyproject)) found.push("[tool.poetry]")
    if (has(dir, "setup.cfg")) found.push("setup.cfg")
    for (const tool of PYTHON_OWNERS) {
      if (new RegExp(`^\\s*${tool}\\b`, "m").test(pyproject) || has(dir, `.${tool}-config`)) found.push(tool)
    }
  }
  return [...new Set(found)]
}

export function missingFor(dir, stack) {
  return REQUIRED[stack].filter((p) => !has(dir, p))
}

function onPath(cmd) {
  const r = spawnSync(cmd, ["--version"], { stdio: "ignore", timeout: 10000 })
  return !r.error && r.status === 0
}

// `just smoke` when the repo has both the binary and the recipe — a repo whose
// own gate fails is not complete, even by our definition. Otherwise a built-in
// check that needs no install, so a fresh clone can still be judged.
export function smoke(dir, stack) {
  let justfile = ""
  try {
    justfile = readFileSync(join(dir, "justfile"), "utf8")
  } catch {}
  if (/^smoke:/m.test(justfile) && onPath("just")) {
    const r = spawnSync("just", ["smoke"], { cwd: dir, stdio: "ignore", timeout: 120000 })
    return { kind: "just", ok: !r.error && r.status === 0, detail: r.error ? String(r.error.code) : `exit ${r.status}` }
  }
  return builtinSmoke(dir, stack)
}

function builtinSmoke(dir, stack) {
  if (stack === "ts") {
    let pkg
    try {
      pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"))
    } catch {
      return { kind: "builtin", ok: false, detail: "package.json does not parse" }
    }
    const check = spawnSync(process.execPath, ["--check", join(dir, "docs-check.mjs")], {
      stdio: "ignore",
      timeout: 60000,
    })
    if (check.error || check.status !== 0) return { kind: "builtin", ok: false, detail: "docs-check.mjs does not parse" }
    if (typeof pkg === "object" && pkg !== null) return { kind: "builtin", ok: true, detail: "manifests parse" }
    return { kind: "builtin", ok: false, detail: "package.json is not an object" }
  }
  let pyproject = ""
  try {
    pyproject = readFileSync(join(dir, "pyproject.toml"), "utf8")
  } catch {
    return { kind: "builtin", ok: false, detail: "pyproject.toml is unreadable" }
  }
  if (!/^\[project\]/m.test(pyproject)) return { kind: "builtin", ok: false, detail: "pyproject.toml has no [project]" }
  if (!onPath("python3")) return { kind: "builtin", ok: true, detail: "python3 absent, syntax check skipped" }
  const check = spawnSync("python3", ["-m", "py_compile", join(dir, "docs_check.py")], {
    stdio: "ignore",
    timeout: 60000,
  })
  return check.status === 0
    ? { kind: "builtin", ok: true, detail: "manifests parse" }
    : { kind: "builtin", ok: false, detail: "docs_check.py does not compile" }
}

function isEmptyProject(dir) {
  if (existsSync(join(dir, ".git"))) return false
  let entries
  try {
    entries = readdirSync(dir).filter((n) => !n.startsWith("."))
  } catch {
    return false
  }
  return entries.length === 0
}

export const CODES = { complete: 0, partial: 1, empty: 2, "project-no-harness": 3, ambiguous: 4, unreadable: 64 }

// The one function the skill's answer is read from.
export function stateOf(dir) {
  let st
  try {
    st = statSync(dir)
  } catch {
    return { state: "unreadable", code: CODES.unreadable, detail: `cannot read ${dir}` }
  }
  if (!st.isDirectory()) return { state: "unreadable", code: CODES.unreadable, detail: `${dir} is not a directory` }
  if (isEmptyProject(dir)) return { state: "empty", code: CODES.empty, stack: null }

  const detected = detectStack(dir)
  if (detected.ambiguous) {
    return {
      state: "ambiguous",
      code: CODES.ambiguous,
      detail: detected.ambiguous.length ? `two stacks: ${detected.ambiguous.join(", ")}` : "no stack markers",
    }
  }
  const stack = detected.id
  if (!has(dir, "AGENTS.md")) return { state: "project-no-harness", code: CODES["project-no-harness"], stack }

  const missing = missingFor(dir, stack)
  const competing = competingFor(dir, stack)
  const smokeResult = smoke(dir, stack)
  const complete = !missing.length && !competing.length && smokeResult.ok
  return {
    state: complete ? "complete" : "partial",
    code: complete ? CODES.complete : CODES.partial,
    stack,
    missing,
    competing,
    smoke: smokeResult,
  }
}

function main(argv) {
  const dir = argv[2] ?? "."
  const result = stateOf(dir)
  for (const m of result.missing ?? []) console.log(`missing: ${m}`)
  for (const c of result.competing ?? []) console.log(`competing: ${c}`)
  if (result.smoke) console.log(`smoke: ${result.smoke.kind} (${result.smoke.detail})`)
  if (result.detail) console.log(`detail: ${result.detail}`)
  if (result.stack) console.log(`stack: ${result.stack}`)
  console.log(`state: ${result.state}`)
  if (result.state === "partial" && !result.missing.length && !result.competing.length && result.smoke?.ok === false) {
    console.log("note: every file is present; the smoke gate is what fails")
  }
  return result.code
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (invoked) process.exit(main(process.argv))
