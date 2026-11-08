import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { tmpdir } from "node:os"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { REQUIRED, DEFAULT, installPaths, stateOf, detectStack, CODES } from "./harness-state.mjs"

const EVALS = join(dirname(fileURLToPath(import.meta.url)), "..", "references", "evals")

function tree(files) {
  const dir = mkdtempSync(join(tmpdir(), "harness-state-"))
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(dir, rel, ".."), { recursive: true })
    if (body !== null) writeFileSync(join(dir, rel), body)
  }
  return dir
}

function drop(dir, ...paths) {
  for (const p of paths) rmSync(join(dir, p), { recursive: true, force: true })
  return dir
}

// The default TypeScript profile, as package.json.template + the slot defaults
// write it. No node_modules and no lockfile: completeness is decided without
// either.
const DEFAULT_PKG = {
  name: "fixture",
  private: true,
  type: "module",
  packageManager: "npm@11.12.1",
  scripts: {
    lint: "oxlint src test",
    format: "prettier --write .",
    "format:check": "prettier --check .",
    typecheck: "tsc --noEmit",
    test: 'node --test "test/**/*.test.ts"',
    "docs:check": "node docs-check.mjs",
  },
  devDependencies: {
    "@types/node": "26.6.6",
    lefthook: "2.2.2",
    oxlint: "1.92.0",
    prettier: "3.9.10",
    typescript: "7.0.2",
  },
}

function tsHarness({ pkg = DEFAULT_PKG, files = {} } = {}) {
  const base = {}
  for (const p of REQUIRED.ts) {
    if (p.startsWith("docs/")) base[p + "/.keep"] = ""
    else base[p] = ""
  }
  return tree({
    ...base,
    "package.json": JSON.stringify(pkg),
    "justfile": "check:\n    true\n",
    "AGENTS.md": "# AGENTS\n",
    "docs-check.mjs": 'console.log("ok")\n',
    ...files,
  })
}

function pythonHarness(overrides = {}) {
  const base = {}
  for (const p of REQUIRED.python) {
    if (p.startsWith("docs/")) base[p + "/.keep"] = ""
    else base[p] = ""
  }
  return tree({
    ...base,
    "pyproject.toml": '[project]\nname = "fixture"\n',
    "uv.lock": "",
    "justfile": "check:\n    true\n",
    "docs_check.py": "print('ok')\n",
    "spec_sha.py": "",
    ...overrides,
  })
}

const hasJust = spawnSync("just", ["--version"], { stdio: "ignore" }).status === 0

test("an empty directory is empty", () => {
  const r = stateOf(tree({ ".hidden": "" }))
  assert.equal(r.state, "empty")
  assert.equal(r.code, CODES.empty)
})

test("code without AGENTS.md is a project without a harness", () => {
  const r = stateOf(tree({ "package.json": "{}", "src/index.js": "" }))
  assert.equal(r.state, "project-no-harness")
  assert.equal(r.code, CODES["project-no-harness"])
})

test("a new repository is complete from the templates before any install", () => {
  const r = stateOf(tsHarness())
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.code, CODES.complete)
  assert.equal(r.stack, "ts")
  assert.equal(r.smoke.kind, "builtin")
  assert.equal(r.smoke.ok, true)
  assert.equal(r.profile.runtime, "node")
  assert.equal(r.profile.packageManager, "npm")
  assert.equal(r.slots.linter, "oxlint")
  assert.equal(r.slots.formatter, "prettier")
  assert.equal(r.slots.typecheck, "tsc")
  assert.equal(r.slots.test, "node:test")
  assert.equal(r.slots.hooks, "lefthook")
  assert.equal(r.slots.ci, "github-actions")
  assert.equal(r.slots["docs-sensor"], "docs-check.mjs")
})

test("a complete Python harness is complete without an install", () => {
  const r = stateOf(pythonHarness())
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.stack, "python")
  assert.equal(r.slots.hooks, "lefthook")
  assert.equal(r.slots["docs-sensor"], "docs_check.py")
})

test("REQUIRED is derived from the default slots, not hand-kept", () => {
  assert.deepEqual(REQUIRED.ts, installPaths("ts", DEFAULT.ts))
  assert.ok(REQUIRED.ts.includes(".github/workflows/ci.yml"))
  assert.ok(!REQUIRED.ts.includes("eslint.config.js"))
})

// --- profiles --------------------------------------------------------------

test("an existing Bun repository is complete, lockfile or not", () => {
  const pkg = {
    ...DEFAULT_PKG,
    packageManager: "bun@1.3.14",
    scripts: { ...DEFAULT_PKG.scripts, test: "bun test" },
  }
  const r = stateOf(tsHarness({ pkg, files: { "bunfig.toml": "" } }))
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.profile.runtime, "bun")
  assert.equal(r.profile.packageManager, "bun")
  assert.equal(r.slots.test, "bun:test")
})

test("Node with pnpm is complete", () => {
  const pkg = { ...DEFAULT_PKG, packageManager: "pnpm@11.1.2" }
  const r = stateOf(tsHarness({ pkg, files: { "pnpm-lock.yaml": "" } }))
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.profile.packageManager, "pnpm")
  assert.equal(r.profile.runtime, "node")
})

test("the Bun runtime with npm-installed dependencies is a supported cross-product", () => {
  const r = stateOf(tsHarness({ files: { "bunfig.toml": "", "package-lock.json": "" } }))
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.profile.runtime, "bun")
  assert.equal(r.profile.packageManager, "npm")
})

test("CI is a capability: another provider fills the slot", () => {
  const dir = drop(tsHarness({ files: { ".gitlab-ci.yml": "stages: [check]\n" } }), ".github/workflows/ci.yml")
  const r = stateOf(dir)
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.slots.ci, "gitlab-ci")
})

test("an existing ESLint + Prettier choice is preserved, not rewritten", () => {
  const pkg = {
    ...DEFAULT_PKG,
    scripts: { ...DEFAULT_PKG.scripts, lint: "eslint ." },
    devDependencies: {
      "@types/node": "26.6.6",
      eslint: "10.14.0",
      "typescript-eslint": "8.72.1",
      prettier: "3.9.10",
      typescript: "6.0.3",
      lefthook: "2.2.2",
    },
  }
  const dir = drop(tsHarness({ pkg, files: { "eslint.config.js": "export default []\n" } }), ".oxlintrc.json")
  const r = stateOf(dir)
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.slots.linter, "eslint")
  assert.equal(r.slots.formatter, "prettier")
  assert.ok(!r.missing.includes("eslint.config.js"))
})

test("a Biome repository fills lint and format with one implementation", () => {
  const pkg = {
    ...DEFAULT_PKG,
    scripts: {
      lint: "biome check .",
      format: "biome format --write .",
      "format:check": "biome format .",
      typecheck: "tsc --noEmit",
      test: "node --test",
      "docs:check": "node docs-check.mjs",
    },
    devDependencies: {
      "@types/node": "26.6.6",
      "@biomejs/biome": "2.6.6",
      lefthook: "2.2.2",
      typescript: "7.0.2",
    },
  }
  const dir = drop(tsHarness({ pkg, files: { "biome.json": "{}\n" } }), ".oxlintrc.json", ".prettierrc")
  const r = stateOf(dir)
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.slots.linter, "biome")
  assert.equal(r.slots.formatter, "biome")
})

test("Oxlint with Oxfmt is complete", () => {
  const pkg = {
    ...DEFAULT_PKG,
    scripts: {
      ...DEFAULT_PKG.scripts,
      format: "oxfmt",
      "format:check": "oxfmt --check",
    },
    devDependencies: {
      "@types/node": "26.6.6",
      lefthook: "2.2.2",
      oxlint: "1.92.0",
      oxfmt: "0.77.0",
      typescript: "7.0.2",
    },
  }
  const dir = drop(tsHarness({ pkg, files: { ".oxfmtrc.json": "{}\n" } }), ".prettierrc")
  const r = stateOf(dir)
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.slots.linter, "oxlint")
  assert.equal(r.slots.formatter, "oxfmt")
})

test("Vitest is a supported test runner", () => {
  const pkg = {
    ...DEFAULT_PKG,
    scripts: { ...DEFAULT_PKG.scripts, test: "vitest run" },
    devDependencies: { ...DEFAULT_PKG.devDependencies, vitest: "5.1.0" },
  }
  const r = stateOf(tsHarness({ pkg }))
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.slots.test, "vitest")
})

test("a monorepo is a note on the root package, not a second harness", () => {
  const pkg = { ...DEFAULT_PKG, workspaces: ["packages/*"] }
  const r = stateOf(tsHarness({ pkg, files: { "packages/app/package.json": '{"name":"app"}' } }))
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.workspaces, "npm")
})

// --- refusals --------------------------------------------------------------

test("two package managers are a conflict, never complete", () => {
  const r = stateOf(tsHarness({ files: { "bun.lock": "", "pnpm-lock.yaml": "" } }))
  assert.equal(r.state, "conflict")
  assert.equal(r.code, CODES.conflict)
  assert.ok(r.conflicts.some((c) => /package manager: .*bun.*pnpm/.test(c)), JSON.stringify(r.conflicts))
})

test("two owners of one slot are a conflict, never complete", () => {
  const r = stateOf(tsHarness({ files: { "biome.json": "{}\n" } }))
  assert.equal(r.state, "conflict")
  assert.ok(r.conflicts.includes("linter: oxlint, biome"), JSON.stringify(r.conflicts))
  assert.ok(r.conflicts.includes("formatter: prettier, biome"), JSON.stringify(r.conflicts))
})

test("two stacks at once is a refusal, not a guess", () => {
  const r = stateOf(tsHarness({ files: { "uv.lock": "" } }))
  assert.equal(r.state, "ambiguous")
  assert.equal(r.code, CODES.ambiguous)
  assert.match(r.detail, /uv\.lock/)
})

test("no stack markers is a refusal with no candidates", () => {
  const r = stateOf(tree({ "AGENTS.md": "", "notes.txt": "" }))
  assert.equal(r.state, "ambiguous")
  assert.match(r.detail, /no stack markers/)
})

test("an unreadable path is a refusal, not a state", () => {
  const r = stateOf("/nonexistent/harness-state-spec")
  assert.equal(r.state, "unreadable")
  assert.equal(r.code, CODES.unreadable)
})

// --- partial ---------------------------------------------------------------

test("one missing file is partial and is named", () => {
  const dir = drop(tsHarness(), "lefthook.yml")
  const r = stateOf(dir)
  assert.equal(r.state, "partial")
  assert.deepEqual(r.missing, ["lefthook.yml"])
})

test("a missing docs directory is a gap like a missing file", () => {
  const dir = drop(tsHarness(), "docs/specs")
  const r = stateOf(dir)
  assert.equal(r.state, "partial")
  assert.ok(r.missing.includes("docs/specs"))
})

test("a docs sensor that does not parse fails the built-in smoke", () => {
  const r = stateOf(tsHarness({ files: { "docs-check.mjs": "export const = 1\n" } }))
  assert.equal(r.state, "partial")
  assert.equal(r.smoke.ok, false)
  assert.deepEqual(r.missing, [])
})

test("a preserved hook manager fills the slot and is named as competing", () => {
  const dir = drop(tsHarness(), "lefthook.yml")
  mkdirSync(join(dir, ".husky"))
  const r = stateOf(dir)
  assert.equal(r.state, "partial")
  assert.deepEqual(r.missing, [])
  assert.equal(r.slots.hooks, "husky")
  assert.deepEqual(r.competing, ["husky"])
})

test("a competing toolchain is a diagnostic, not a rewrite", () => {
  const r = stateOf(tsHarness({ files: { "tslint.json": "{}" } }))
  assert.equal(r.state, "partial")
  assert.deepEqual(r.competing, ["tslint"])
  assert.deepEqual(r.missing, [])
})

// --- fixtures --------------------------------------------------------------

// The SPEC-0043 template rename broke both fixtures silently: one started
// reporting `partial`, the other named two gaps. A fixture assertion costs one
// line and catches it.
test("the eval fixtures keep the verdicts their cases assert", () => {
  const complete = stateOf(join(EVALS, "14"))
  assert.equal(complete.state, "complete", JSON.stringify(complete.missing))

  const partial = stateOf(join(EVALS, "15"))
  assert.equal(partial.state, "partial")
  assert.deepEqual(partial.missing, ["lefthook.yml"])
})

test("just smoke decides when the repo has both the binary and the recipe", { skip: !hasJust }, () => {
  const good = tsHarness({ files: { justfile: "smoke:\n    true\n" } })
  assert.equal(stateOf(good).smoke.kind, "just")
  assert.equal(stateOf(good).state, "complete")

  const bad = tsHarness({ files: { justfile: "smoke:\n    exit 1\n" } })
  const r = stateOf(bad)
  assert.equal(r.smoke.kind, "just")
  assert.equal(r.smoke.ok, false)
  assert.equal(r.state, "partial")
})

test("detectStack follows the skill's rule order", () => {
  assert.equal(detectStack(tree({ "uv.lock": "" })).id, "python")
  assert.equal(detectStack(tree({ "bun.lock": "" })).id, "ts")
  assert.equal(detectStack(tree({ "pyproject.toml": "" })).id, "python")
  assert.equal(detectStack(tree({ "package.json": "{}" })).id, "ts")
})
