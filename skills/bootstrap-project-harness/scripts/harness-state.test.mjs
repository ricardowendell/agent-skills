import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { spawnSync } from "node:child_process"

import { REQUIRED, stateOf, detectStack, CODES } from "./harness-state.mjs"

function tree(files) {
  const dir = mkdtempSync(join(tmpdir(), "harness-state-"))
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(dir, rel, ".."), { recursive: true })
    if (body !== null) writeFileSync(join(dir, rel), body)
  }
  return dir
}

// A TypeScript harness with every required file and no `just smoke` recipe, so
// the verdict comes from the built-in check and does not depend on `just`.
function tsHarness(overrides = {}) {
  const base = {}
  for (const p of REQUIRED.ts) {
    if (p.startsWith("docs/")) base[p + "/.keep"] = ""
    else base[p] = ""
  }
  return tree({
    ...base,
    "package.json": '{"name":"fixture"}',
    "tsconfig.json": "{}",
    "justfile": "check:\n    true\n",
    "AGENTS.md": "# AGENTS\n",
    "docs-check.mjs": 'console.log("ok")\n',
    "spec-sha.mjs": "",
    ...overrides,
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

test("a complete TypeScript harness is complete without an install", () => {
  const r = stateOf(tsHarness())
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.code, CODES.complete)
  assert.equal(r.stack, "ts")
  assert.equal(r.smoke.kind, "builtin")
  assert.equal(r.smoke.ok, true)
})

test("a complete Python harness is complete without an install", () => {
  const r = stateOf(pythonHarness())
  assert.equal(r.state, "complete", JSON.stringify(r.missing))
  assert.equal(r.stack, "python")
})

test("one missing file is partial and is named", () => {
  const dir = tsHarness()
  rmSync(join(dir, "lefthook.yml"))
  const r = stateOf(dir)
  assert.equal(r.state, "partial")
  assert.deepEqual(r.missing, ["lefthook.yml"])
})

test("a missing docs directory is a gap like a missing file", () => {
  const dir = tsHarness()
  rmSync(join(dir, "docs/specs"), { recursive: true, force: true })
  const r = stateOf(dir)
  assert.equal(r.state, "partial")
  assert.ok(r.missing.includes("docs/specs"))
})

test("a docs sensor that does not parse fails the built-in smoke", () => {
  const r = stateOf(tsHarness({ "docs-check.mjs": "export const = 1\n" }))
  assert.equal(r.state, "partial")
  assert.equal(r.smoke.ok, false)
  assert.deepEqual(r.missing, [])
})

test("a competing toolchain is partial even when every file is present", () => {
  const dir = tsHarness()
  mkdirSync(join(dir, ".husky"))
  const r = stateOf(dir)
  assert.equal(r.state, "partial")
  assert.deepEqual(r.competing, ["husky"])
})

test("two stacks at once is a refusal, not a guess", () => {
  const dir = tsHarness({ "uv.lock": "" })
  const r = stateOf(dir)
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

test("just smoke decides when the repo has both the binary and the recipe", { skip: !hasJust }, () => {
  const good = tsHarness({ justfile: "smoke:\n    true\n" })
  assert.equal(stateOf(good).smoke.kind, "just")
  assert.equal(stateOf(good).state, "complete")

  const bad = tsHarness({ justfile: "smoke:\n    exit 1\n" })
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
