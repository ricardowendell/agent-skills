import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { REQUIRED, OPTIONAL, DOCS } from "./harness-state.mjs"

const TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), "..", "templates")
const AGENTS_TEMPLATE = join(TEMPLATES, "AGENTS.md.template")
const STACKS = ["ts", "python"]

// The generated AGENTS.md is assembled from the project: every value below is a
// `{{field}}` the template declares, rendered here the way a bootstrap would.
// Assertions run on the rendered document, never on the template source: a
// placeholder that survives rendering is exactly what a source-only check
// cannot see.
const AGENTS_FIXTURE = {
  project_name: "ledger",
  purpose: "Ledger issues invoices for small studios and reconciles the payments.",
  stack: "Node 24 + npm; TypeScript; Oxlint; Prettier; `node:test`",
  commands: [
    "- `npm run check` — typecheck, lint, format and tests",
    "- `npm test` — the test suite",
  ].join("\n"),
  constraints:
    "- Public responses are versioned; `docs/decisions/` records why a version was cut.",
  change_scope:
    "Source and tests for the requested change. Config changes only when the change needs one.",
  secret_policy:
    "Never commit `.env`, `.db`, data files or credentials; the pre-commit hook rejects them.",
  approval_points: "A human signs off before a merge and before a release tag.",
}

function renderAgents(values = AGENTS_FIXTURE) {
  return readFileSync(AGENTS_TEMPLATE, "utf8").replace(/\{\{([a-z_]+)\}\}/g, (match, field) => {
    if (!(field in values)) throw new Error(`no fixture value for ${match}`)
    return values[field]
  })
}

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

// The generated AGENTS.md is the always-loaded path. It is assembled from the
// project, so these invariants are asserted on the rendered document: a
// template that only *looks* clean because nothing was substituted proves
// nothing about what a bootstrapped repo receives.

test("every field the AGENTS template declares has a render fixture", () => {
  const source = readFileSync(AGENTS_TEMPLATE, "utf8")
  const fields = [...source.matchAll(/\{\{([a-z_]+)\}\}/g)].map((match) => match[1])
  assert.ok(fields.length > 0, "AGENTS.md.template declares no {{field}} — it cannot describe a real project")
  assert.deepEqual(
    [...new Set(fields)].sort(),
    Object.keys(AGENTS_FIXTURE).sort(),
    "add the new field to AGENTS_FIXTURE (or drop it from the template)",
  )
})

test("the rendered AGENTS.md carries no placeholder", () => {
  const rendered = renderAgents()
  assert.doesNotMatch(rendered, /\{\{|\}\}/, "an unrendered {{field}} reached the document")
  // Markdown links and inline code are not placeholders; strip links first so
  // the bracket rule cannot be satisfied by a link's text.
  const withoutLinks = rendered.replace(/\[[^\]\n]*\]\([^)\n]+\)/g, "")
  assert.doesNotMatch(withoutLinks, /\[[^\]\n]*\]/, "a bracketed field reached the document")
  assert.doesNotMatch(rendered, /<[a-z][^>\n]*>/i, "an angle-bracket field reached the document")
  assert.doesNotMatch(rendered, /\b(?:TODO|TBD|FIXME)\b/i, "a TODO marker reached the document")
  assert.doesNotMatch(rendered, /tech stack/i, "a stack placeholder reached the document")
})

test("the rendered AGENTS.md states only commands the project has", () => {
  const rendered = renderAgents()
  assert.doesNotMatch(
    rendered,
    /\bjust\s+(?:dev|check|ci)\b/,
    "a universal `just` recipe reached a project that may have no justfile",
  )
  assert.deepEqual(
    readFileSync(AGENTS_TEMPLATE, "utf8").match(/```/g) ?? [],
    [],
    "a fenced command block in the template is unconditional; commands come from {{commands}}",
  )

  const section = rendered.split("## Commands this project has")[1]?.split("\n## ")[0] ?? ""
  const commands = [...section.matchAll(/`([^`]+)`/g)].map((match) => match[1])
  assert.ok(commands.length > 0, "the commands section lists nothing")
  const installed = new Set(["npm run check", "npm test"])
  for (const command of commands) {
    assert.ok(installed.has(command), `${command} is not a command the fixture project has`)
  }
})

test("the rendered AGENTS.md points at the generated WORKFLOW and does not repeat it", () => {
  const rendered = renderAgents()
  assert.ok(
    rendered.includes(ROOT_MAP["WORKFLOW.md"]),
    `the generated document must point at ${ROOT_MAP["WORKFLOW.md"]}`,
  )
  for (const step of ["/capture", "/process-inbox", "/groom", "/prompt", "/implement", "/docs-check"]) {
    assert.ok(!rendered.includes(step), `${step} belongs to the generated WORKFLOW, not the always-loaded contract`)
  }
})

test("the rendered AGENTS.md states no lint limit of its own", () => {
  const rendered = renderAgents()
  assert.doesNotMatch(
    rendered,
    /Linter Limits|Cyclomatic complexity|Max lines per file|Max params per function/i,
    "an unconditional limit the installed linter may not enforce reached the document",
  )
  assert.match(
    rendered,
    /linter, formatter and test config/i,
    "the document must point at the config that owns the limits",
  )
})

