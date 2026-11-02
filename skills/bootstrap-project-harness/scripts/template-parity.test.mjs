import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, statSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { REQUIRED, OPTIONAL, DOCS } from "./harness-state.mjs"

const TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), "..", "templates")
const STACKS = ["ts", "python"]

// The docs content and shared files keep their own names; everything else is
// `<stack>/<name>.template` → `<name>`.
const ROOT_MAP = {
  "AGENTS.md.template": "AGENTS.md",
  "README.template": "README.md",
  ".editorconfig.template": ".editorconfig",
  ".gitignore.template": ".gitignore",
  ".opencode/opencode.json": ".opencode/opencode.json",
  "architecture.md.template": "docs/architecture.md",
  "pipeline.md.template": "docs/pipeline.md",
  "WORKFLOW.md": "docs/WORKFLOW.md",
  "decisions-README.md": "docs/decisions/README.md",
  "experience-README.md": "docs/experience/README.md",
  "system-README.md": "docs/system/README.md",
  "product-design-principles.md": "docs/product/design-principles.md",
  "product-design-system.md": "docs/product/design-system.md",
  "product-language.md": "docs/product/language.md",
  "product-principles.md": "docs/product/principles.md",
  "product-roadmap.md": "docs/product/roadmap.md",
  "product-scope.md": "docs/product/scope.md",
  "product-vision.md": "docs/product/vision.md",
  "product-voice.md": "docs/product/voice.md",
}

function walk(root, prefix = "") {
  return readdirSync(join(root, prefix)).flatMap((name) => {
    const rel = prefix ? `${prefix}/${name}` : name
    return statSync(join(root, rel)).isDirectory() ? walk(root, rel) : [rel]
  })
}

function installsByStack() {
  const installs = { ts: new Set(), python: new Set() }
  const accounted = new Set()
  for (const rel of walk(TEMPLATES)) {
    if (ROOT_MAP[rel]) {
      for (const stack of STACKS) installs[stack].add(ROOT_MAP[rel])
      accounted.add(rel)
      continue
    }
    for (const stack of STACKS) {
      if (!rel.startsWith(`${stack}/`)) continue
      installs[stack].add(rel.slice(stack.length + 1).replace(/\.template$/, ""))
      accounted.add(rel)
    }
  }
  return { installs, accounted }
}

test("every template file maps to an install path", () => {
  const { accounted } = installsByStack()
  const unaccounted = walk(TEMPLATES).filter((rel) => !accounted.has(rel))
  assert.deepEqual(unaccounted, [], `add ${unaccounted.join(", ")} to ROOT_MAP or a stack directory`)
})

test("every required path is one the template installs", () => {
  const { installs } = installsByStack()
  for (const stack of STACKS) {
    const missing = REQUIRED[stack].filter((p) => !DOCS.includes(p) && !installs[stack].has(p))
    assert.deepEqual(missing, [], `${stack}: required but never installed: ${missing.join(", ")}`)
  }
})

// The direction that would otherwise rot in silence: a new template file that
// is neither required nor declared optional makes a repo without it look
// complete. Adding it is a decision, and this test forces the decision.
test("every installed path is required or explicitly optional", () => {
  const { installs } = installsByStack()
  for (const stack of STACKS) {
    const unclassified = [...installs[stack]].filter(
      (p) => !REQUIRED[stack].includes(p) && !OPTIONAL[stack].includes(p),
    )
    assert.deepEqual(
      unclassified,
      [],
      `${stack}: installed but neither required nor optional — add to REQUIRED or OPTIONAL in harness-state.mjs: ${unclassified.join(", ")}`,
    )
  }
})

test("every optional path is installed and not also required", () => {
  const { installs } = installsByStack()
  for (const stack of STACKS) {
    const stale = OPTIONAL[stack].filter((p) => !installs[stack].has(p))
    assert.deepEqual(stale, [], `${stack}: optional but never installed: ${stale.join(", ")}`)
    const both = OPTIONAL[stack].filter((p) => REQUIRED[stack].includes(p))
    assert.deepEqual(both, [], `${stack}: both required and optional: ${both.join(", ")}`)
  }
})
