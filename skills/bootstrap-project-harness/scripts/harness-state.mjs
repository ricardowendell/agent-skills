#!/usr/bin/env node
// harness-state.mjs — the state of a repo, decided once.
//
// The skill used to ask the agent to read a table and judge. Given a repo whose
// files were all present and whose gates were green without an install, agents
// called it partial in 7 of 12 runs, because they audited against these
// templates instead of the criterion. The criterion now has one implementation.
//
//   state: empty | project-no-harness | partial | complete | ambiguous | conflict
//   refusal: ambiguous stack, conflicting choices, unreadable directory
//
// A harness is a set of capability slots — linter, formatter, test runner,
// typecheck, hooks, CI, docs sensor — plus the files that are the harness itself.
// A slot is filled by any supported implementation, never by one vendor's file
// name, so an Oxlint, an ESLint and a Biome repository can all read `complete`.
// The result names the implementation each slot found.
//
// It only reads. Nothing here writes, installs or fixes, and a missing install
// artefact (node_modules, a lockfile, an installed hook) is never a gap: a fresh
// clone has none, and completeness has to be decidable before one exists.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

export const DOCS = ["docs/specs", "docs/prompts", "docs/decisions"]

const has = (dir, p) => existsSync(join(dir, p))

function read(dir, p) {
  try {
    return readFileSync(join(dir, p), "utf8")
  } catch {
    return ""
  }
}

function hasWorkflow(dir) {
  try {
    return readdirSync(join(dir, ".github", "workflows")).some((name) => /\.ya?ml$/.test(name))
  } catch {
    return false
  }
}

// --- slots -----------------------------------------------------------------
//
// `files` are names that prove an implementation is present (any one of them);
// `deps` and `scripts` are the package.json signals for the same. `installs` is
// what this repo's template writes for the candidate — it is what `REQUIRED`
// derives from, and the file named when the slot is empty. `requires` are files
// that must exist whenever the candidate is chosen (a Python manifest needs its
// interpreter pin too). `expected` is the gap text for a candidate declared by a
// manifest but not configured.
//
// `optional: true` reports the slot without making it part of completeness.
// Python keeps its previous contract that way: its lint/format/type/test tools
// are named when present, and their absence is not a new gap.

const TS_CORE = [
  "AGENTS.md",
  "README.md",
  ".editorconfig",
  ".gitignore",
  "justfile",
  "commitlint.config.cjs",
  "spec-sha.mjs",
  ...DOCS,
]

const PY_CORE = ["AGENTS.md", "README.md", ".editorconfig", ".gitignore", "justfile", "spec_sha.py", ...DOCS]

const CI_CANDIDATES = [
  { id: "github-actions", expected: ".github/workflows/ci.yml", has: (dir) => hasWorkflow(dir), installs: [".github/workflows/ci.yml"] },
  { id: "gitlab-ci", expected: ".gitlab-ci.yml", files: [".gitlab-ci.yml"] },
  { id: "circleci", expected: ".circleci/config.yml", files: [".circleci/config.yml"] },
  { id: "jenkins", expected: "Jenkinsfile", files: ["Jenkinsfile"] },
  { id: "azure-pipelines", expected: "azure-pipelines.yml", files: ["azure-pipelines.yml"] },
  { id: "buildkite", expected: ".buildkite/pipeline.yml", files: [".buildkite/pipeline.yml"] },
]

const TS_SLOTS = {
  core: {
    perFile: true,
    candidates: [{ id: "template", files: TS_CORE, installs: TS_CORE }],
  },
  manifest: {
    candidates: [{ id: "package.json", expected: "package.json", files: ["package.json"], installs: ["package.json"] }],
  },
  linter: {
    candidates: [
      { id: "oxlint", expected: ".oxlintrc.json", files: [".oxlintrc.json", "oxlint.json"], deps: ["oxlint"], scripts: [/\boxlint\b/], installs: [".oxlintrc.json"] },
      {
        id: "eslint",
        expected: "eslint.config.js",
        files: ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", "eslint.config.ts", ".eslintrc.json", ".eslintrc.cjs", ".eslintrc.js"],
        deps: ["eslint", "typescript-eslint"],
        scripts: [/\beslint\b/],
        installs: ["eslint.config.js"],
      },
      { id: "biome", expected: "biome.json", files: ["biome.json", "biome.jsonc"], scripts: [/\bbiome\b/], installs: ["biome.json"] },
    ],
  },
  formatter: {
    candidates: [
      {
        id: "prettier",
        expected: ".prettierrc",
        files: [".prettierrc", ".prettierrc.json", ".prettierrc.yml", ".prettierrc.yaml", ".prettierrc.cjs", ".prettierrc.mjs", "prettier.config.js", "prettier.config.mjs", "prettier.config.cjs"],
        deps: ["prettier"],
        scripts: [/\bprettier\b/],
        installs: [".prettierrc"],
      },
      { id: "biome", expected: "biome.json", files: ["biome.json", "biome.jsonc"], scripts: [/\bbiome\b/], installs: ["biome.json"] },
      { id: "oxfmt", expected: ".oxfmtrc.json", files: [".oxfmtrc.json", "oxfmt.json"], deps: ["oxfmt"], scripts: [/\boxfmt\b/], installs: [".oxfmtrc.json"] },
    ],
  },
  typecheck: {
    candidates: [
      { id: "tsc", expected: "tsconfig.json", files: ["tsconfig.json"], deps: ["typescript"], scripts: [/\btsc\b/], installs: ["tsconfig.json"] },
    ],
  },
  test: {
    candidates: [
      { id: "node:test", expected: "a `node --test` script", scripts: [/node\s+--test/] },
      {
        id: "vitest",
        expected: "vitest",
        files: ["vitest.config.ts", "vitest.config.js", "vitest.config.mjs", "vitest.config.mts"],
        deps: ["vitest"],
        scripts: [/\bvitest\b/],
        requiresConfig: false,
      },
      { id: "bun:test", expected: "a `bun test` script", scripts: [/\bbun\s+test\b/] },
    ],
  },
  hooks: {
    candidates: [
      { id: "lefthook", expected: "lefthook.yml", files: ["lefthook.yml", "lefthook.yaml", ".lefthook.yml"], installs: ["lefthook.yml"] },
      { id: "husky", expected: ".husky", has: (dir) => has(dir, ".husky") || has(dir, "husky.config.js") || has(dir, ".huskyrc") },
      { id: "pre-commit", expected: ".pre-commit-config.yaml", files: [".pre-commit-config.yaml"] },
    ],
  },
  ci: { candidates: CI_CANDIDATES },
  "docs-sensor": {
    candidates: [
      { id: "docs-check.mjs", expected: "docs-check.mjs", files: ["docs-check.mjs"], scripts: [/docs:check/], installs: ["docs-check.mjs"] },
    ],
  },
}

const PY_SLOTS = {
  core: {
    perFile: true,
    candidates: [{ id: "template", files: PY_CORE, installs: PY_CORE }],
  },
  manifest: {
    candidates: [
      {
        id: "pyproject",
        expected: "pyproject.toml",
        files: ["pyproject.toml"],
        requires: ["pyproject.toml", ".python-version"],
        installs: ["pyproject.toml", ".python-version"],
      },
    ],
  },
  linter: {
    optional: true,
    candidates: [
      { id: "ruff", expected: "[tool.ruff]", has: (dir) => /\bruff\b/.test(read(dir, "pyproject.toml")) || has(dir, ".ruff.toml") || has(dir, "ruff.toml") },
      { id: "flake8", expected: ".flake8", files: [".flake8"], has: (dir) => /\[tool\.flake8\]/.test(read(dir, "pyproject.toml")) },
    ],
  },
  formatter: {
    optional: true,
    candidates: [
      { id: "ruff", expected: "[tool.ruff]", has: (dir) => /\[tool\.ruff\]/.test(read(dir, "pyproject.toml")) },
      { id: "black", expected: "[tool.black]", has: (dir) => /\[tool\.black\]/.test(read(dir, "pyproject.toml")) || has(dir, ".black") },
    ],
  },
  typecheck: {
    optional: true,
    candidates: [
      { id: "mypy", expected: "[tool.mypy]", has: (dir) => /\[tool\.mypy\]/.test(read(dir, "pyproject.toml")) || has(dir, "mypy.ini") || has(dir, ".mypy.ini") },
      { id: "pyright", expected: "pyrightconfig.json", files: ["pyrightconfig.json"], has: (dir) => /\[tool\.pyright\]/.test(read(dir, "pyproject.toml")) },
    ],
  },
  test: {
    optional: true,
    candidates: [
      {
        id: "pytest",
        expected: "[tool.pytest]",
        has: (dir) => /\[tool\.pytest/.test(read(dir, "pyproject.toml")) || has(dir, "pytest.ini") || has(dir, "conftest.py"),
      },
    ],
  },
  hooks: {
    candidates: [
      { id: "lefthook", expected: "lefthook.yml", files: ["lefthook.yml", "lefthook.yaml", ".lefthook.yml"], installs: ["lefthook.yml"] },
      { id: "pre-commit", expected: ".pre-commit-config.yaml", files: [".pre-commit-config.yaml"] },
    ],
  },
  ci: { optional: true, candidates: CI_CANDIDATES },
  "docs-sensor": {
    candidates: [
      { id: "docs_check.py", expected: "docs_check.py", files: ["docs_check.py"], scripts: [/docs-check/], installs: ["docs_check.py"] },
    ],
  },
}

export const SLOTS = { ts: TS_SLOTS, python: PY_SLOTS }

// The profile a template installs. Changing the default is a decision in
// references/typescript.md, and the parity test holds `REQUIRED` to it.
export const DEFAULT = {
  ts: {
    core: "template",
    manifest: "package.json",
    linter: "oxlint",
    formatter: "prettier",
    typecheck: "tsc",
    test: "node:test",
    hooks: "lefthook",
    ci: "github-actions",
    "docs-sensor": "docs-check.mjs",
  },
  python: {
    core: "template",
    manifest: "pyproject",
    linter: "ruff",
    formatter: "ruff",
    typecheck: "mypy",
    test: "pytest",
    hooks: "lefthook",
    ci: "github-actions",
    "docs-sensor": "docs_check.py",
  },
}

// Every path the default profile writes, derived from the slots above instead of
// a hand-kept list. The parity test uses it to prove every shipped template is
// classified; a repo's verdict uses the slots, not this list.
export function installPaths(stack, choices = DEFAULT[stack]) {
  const out = []
  for (const [slot, definition] of Object.entries(SLOTS[stack])) {
    if (definition.optional) continue
    const candidate =
      definition.candidates.find((c) => c.id === choices[slot]) ?? definition.candidates[0]
    out.push(...(candidate.installs ?? []))
  }
  return [...new Set(out)]
}

export const REQUIRED = { ts: installPaths("ts"), python: installPaths("python") }

// Templates that ship but are not part of "is this harness complete": the docs
// content the bootstrap seeds, local agent config, and optional extras. CI is a
// required capability now, so its workflow is derived above, not listed here.
export const OPTIONAL = {
  ts: [
    ".nvmrc",
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

// The stack rules, in the order the skill states them. Returns `{ id }` or
// `{ ambiguous: [...] }` — never a guess, because guessing here is how a
// monorepo gets the wrong harness. `package.json` is TypeScript/Node evidence
// only; `bunfig.toml` and a `packageManager` naming Bun are profile signals, not
// a second stack.
export function detectStack(dir) {
  const tsMarkers = ["package.json", "tsconfig.json", "bun.lock", "bun.lockb", "pnpm-lock.yaml", "package-lock.json"].filter(
    (f) => has(dir, f),
  )
  const pyMarkers = ["pyproject.toml", "requirements.txt", ".python-version", "uv.lock", "setup.py"].filter((f) =>
    has(dir, f),
  )

  // Both stacks at once is the documented ambiguity: ask which directory rather
  // than pick.
  if (tsMarkers.length && pyMarkers.length) return { ambiguous: [...tsMarkers, ...pyMarkers] }
  if (tsMarkers.length) return { id: "ts" }
  if (pyMarkers.length) return { id: "python" }
  return { ambiguous: [] }
}

function tsSignals(dir) {
  let pkg = null
  try {
    pkg = JSON.parse(read(dir, "package.json"))
  } catch {}
  const deps = {}
  for (const key of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    for (const [name, range] of Object.entries(pkg?.[key] ?? {})) deps[name] = range
  }
  const scripts = Object.values(pkg?.scripts ?? {})
    .filter((s) => typeof s === "string")
    .join("\n")
  return { pkg, deps, scripts }
}

// The runtime/package manager and the workspace note. Lockfiles are evidence of
// a choice, never a requirement: none existing means the default, not a gap. Two
// managers named at once is a conflict the skill must not resolve by itself.
function detectProfile(dir, signals) {
  const declared = String(signals.pkg?.packageManager ?? "")
    .split("@")[0]
    .trim()
  const named = new Set()
  if (declared) named.add(declared)
  if (has(dir, "bun.lock") || has(dir, "bun.lockb")) named.add("bun")
  if (has(dir, "pnpm-lock.yaml")) named.add("pnpm")
  if (has(dir, "package-lock.json") || has(dir, "npm-shrinkwrap.json")) named.add("npm")
  if (has(dir, "yarn.lock")) named.add("yarn")

  const conflicts = []
  const managers = [...named]
  if (managers.length > 1) conflicts.push(`package manager: ${managers.join(", ")}`)

  const supported = managers.filter((m) => m === "npm" || m === "pnpm" || m === "bun")
  // A manager the templates do not cover is named as itself and left alone; it is
  // never relabelled as the npm default. `competingFor` reports it as a diagnostic.
  const packageManager = supported[0] ?? managers[0] ?? "npm"
  const runtime =
    managers.includes("bun") || has(dir, "bunfig.toml") || /\bbun\s+(run|test|install)\b/.test(signals.scripts)
      ? "bun"
      : "node"
  const workspaces = signals.pkg?.workspaces ? "npm" : has(dir, "pnpm-workspace.yaml") ? "pnpm" : null
  return { runtime, packageManager, workspaces, conflicts }
}

function candidatePresent(dir, candidate, signals) {
  if (candidate.has?.(dir, signals)) return true
  if ((candidate.files ?? []).some((f) => has(dir, f))) return true
  if ((candidate.deps ?? []).some((d) => Object.hasOwn(signals.deps, d))) return true
  if ((candidate.scripts ?? []).some((re) => re.test(signals.scripts))) return true
  return false
}

// One slot at a time: what fills it, or what is missing. Two implementations in
// one slot is a conflict — the skill asks which is authoritative instead of
// merging them.
function resolveSlot(slot, stack, dir, signals) {
  if (slot.perFile) {
    const candidate = slot.candidates[0]
    return { id: candidate.id, missing: candidate.installs.filter((f) => !has(dir, f)) }
  }

  const present = slot.candidates.filter((candidate) => candidatePresent(dir, candidate, signals))
  if (present.length > 1) return { conflict: `${slot.id}: ${present.map((candidate) => candidate.id).join(", ")}` }

  if (present.length === 1) {
    const candidate = present[0]
    const missing = []
    const files = candidate.files ?? []
    if (files.length && !files.some((f) => has(dir, f)) && candidate.requiresConfig !== false) {
      missing.push(candidate.expected ?? files[0])
    }
    for (const f of candidate.requires ?? []) if (!has(dir, f)) missing.push(f)
    return { id: candidate.id, missing }
  }

  if (slot.optional) return {}

  const candidate = slot.candidates[0]
  if (slot.candidates.length === 1) {
    return { missing: candidate.installs.filter((f) => !has(dir, f)) }
  }

  // An empty slot names what the template would install when the default has a
  // file of its own (the hook manager, the CI workflow); a script-only default
  // has none, so the alternatives are named instead.
  const fallback = slot.candidates.find((c) => c.id === DEFAULT[stack]?.[slot.id])
  if (fallback?.installs?.length) {
    return { missing: fallback.installs.filter((f) => !has(dir, f)) }
  }
  const expected = slot.candidates.map((c) => c.expected ?? c.id).join(" or ")
  return { missing: [`${slot.id} (${expected})`] }
}

function resolveSlots(dir, stack, signals) {
  const slots = {}
  const missing = []
  const conflicts = []
  for (const [id, slot] of Object.entries(SLOTS[stack])) {
    const result = resolveSlot({ ...slot, id }, stack, dir, signals)
    if (result.conflict) conflicts.push(result.conflict)
    if (result.id) slots[id] = result.id
    missing.push(...(result.missing ?? []))
  }
  return { slots, missing, conflicts }
}

// A repo that already owns that slot counts as competing even when the file the
// harness would install is absent: the skill must report it, not install ours.
export function competingFor(dir, stack) {
  const found = []
  if (stack === "ts") {
    if (has(dir, "tslint.json")) found.push("tslint")
    if (has(dir, ".husky") || has(dir, "husky.config.js") || has(dir, ".huskyrc")) found.push("husky")
    if (has(dir, ".pre-commit-config.yaml")) found.push("pre-commit")
    let declared = ""
    try {
      declared = String(JSON.parse(read(dir, "package.json")).packageManager ?? "")
    } catch {}
    if (has(dir, "yarn.lock") || /^yarn(@|$)/.test(declared)) found.push("yarn")
  }
  if (stack === "python") {
    for (const f of PYTHON_PACKAGE_MANAGERS) if (has(dir, f)) found.push(f)
    const pyproject = read(dir, "pyproject.toml")
    if (/^\[tool\.poetry\]/m.test(pyproject)) found.push("[tool.poetry]")
    if (has(dir, "setup.cfg")) found.push("setup.cfg")
    for (const tool of PYTHON_OWNERS) {
      if (new RegExp(`^\\s*${tool}\\b`, "m").test(pyproject) || has(dir, `.${tool}-config`)) found.push(tool)
    }
  }
  return [...new Set(found)]
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

export const CODES = {
  complete: 0,
  partial: 1,
  empty: 2,
  "project-no-harness": 3,
  ambiguous: 4,
  conflict: 5,
  unreadable: 64,
}

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

  const signals = stack === "ts" ? tsSignals(dir) : { pkg: null, deps: {}, scripts: "" }
  const resolved = resolveSlots(dir, stack, signals)
  const profile = stack === "ts" ? detectProfile(dir, signals) : null
  const conflicts = [...(profile?.conflicts ?? []), ...resolved.conflicts]

  if (conflicts.length) {
    return {
      state: "conflict",
      code: CODES.conflict,
      stack,
      detail: `conflicting choices: ${conflicts.join("; ")}`,
      conflicts,
      slots: resolved.slots,
      ...(profile ? { profile: { runtime: profile.runtime, packageManager: profile.packageManager } } : {}),
    }
  }

  const missing = resolved.missing
  const competing = [...new Set(competingFor(dir, stack))]
  const smokeResult = smoke(dir, stack)
  const complete = !missing.length && !competing.length && smokeResult.ok
  return {
    state: complete ? "complete" : "partial",
    code: complete ? CODES.complete : CODES.partial,
    stack,
    missing,
    competing,
    slots: resolved.slots,
    ...(profile ? { profile: { runtime: profile.runtime, packageManager: profile.packageManager } } : {}),
    ...(profile?.workspaces ? { workspaces: profile.workspaces } : {}),
    smoke: smokeResult,
  }
}

function main(argv) {
  const dir = argv[2] ?? "."
  const result = stateOf(dir)
  for (const m of result.missing ?? []) console.log(`missing: ${m}`)
  for (const c of result.competing ?? []) console.log(`competing: ${c}`)
  for (const c of result.conflicts ?? []) console.log(`conflict: ${c}`)
  if (result.slots) {
    console.log(`slots: ${Object.entries(result.slots).map(([slot, impl]) => `${slot}=${impl}`).join(" ")}`)
  }
  if (result.workspaces) console.log(`workspaces: ${result.workspaces}`)
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
