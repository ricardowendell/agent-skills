import { test } from "node:test"
import assert from "node:assert/strict"
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

// The templates are the decision made executable; `references/typescript.md`
// states that decision. SPEC-0043 made them one system, but nothing compared the
// two mechanically, so a template edit could silently contradict the reference
// (or the reverse). This test reads both and reports every divergence.
//
// The reference keeps its normative values in three JSON blocks (tsconfig,
// .oxlintrc, package scripts) and two tables (the default pins and the minimum
// versions). Comparing those is enough: the prose explains the choice, the
// blocks and tables are what a bootstrap installs.

const SKILL = join(dirname(fileURLToPath(import.meta.url)), "..")
const REFERENCE = join(SKILL, "references", "typescript.md")

function read(path) {
  return readFileSync(path, "utf8")
}

function jsonBlocks(text) {
  const out = []
  const re = /```json\n([\s\S]*?)```/g
  for (const match of text.matchAll(re)) {
    try {
      out.push(JSON.parse(match[1]))
    } catch (error) {
      throw new Error(`reference has a JSON block that does not parse: ${error.message}`)
    }
  }
  return out
}

function tableRows(section) {
  return section
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length > 1 && !/^-+$/.test(cells[0].replace(/[:\s]/g, "")))
}

// The minimum-versions table has one row per tool; the first semver in the row
// is the default, and the Node row also carries the floor.
function minimumVersions(text) {
  const start = text.indexOf("## Minimum versions")
  const end = text.indexOf("\n## ", start + 1)
  const section = text.slice(start, end === -1 ? undefined : end)
  const versions = {}
  let floor = null
  for (const [tool, cell] of tableRows(section)) {
    const name = tool.replace(/`/g, "")
    const first = cell.match(/\d+\.\d+\.\d+/)
    if (first) versions[name] = first[0]
    const floorMatch = cell.match(/(\d+\.\d+\.\d+)\s+floor/i)
    if (floorMatch) floor = floorMatch[1]
  }
  return { versions, floor }
}

function ciNodeVersions(workflow) {
  const matrix = workflow.match(/node:\s*\[([^\]]*)\]/)
  if (!matrix) return null
  return [...matrix[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
}

// The reference's Quality-limits table is a claim about the linter config the
// template installs. The generated AGENTS.md states no limit of its own
// (SPEC-0061), so this table is the one place a limit is named — and it must
// mirror `.oxlintrc.json.template` rule for rule, or the reference claims a
// gate the scaffold does not install.
function limitsRows(text) {
  const start = text.indexOf("## Quality limits")
  const end = text.indexOf("\n## ", start + 1)
  const section = text.slice(start, end === -1 ? undefined : end)
  const rows = new Map()
  for (const cells of tableRows(section)) rows.set(cells[0], cells)
  return rows
}

const LIMIT_ROWS = [
  { rule: "complexity", label: /^Cyclomatic complexity (\d+)$/ },
  { rule: "max-params", label: /^Max parameters (\d+)$/ },
  { rule: "max-lines-per-function", label: /^Max (\d+) lines\/function$/ },
  { rule: "max-lines", label: /^Max (\d+) lines\/file$/ },
]

function ruleSpec(value) {
  const [severity, options] = Array.isArray(value) ? value : [value, null]
  const max = typeof options === "number" ? options : (options?.max ?? null)
  return { severity, max, options: options && typeof options === "object" ? options : {} }
}

// `templatesRoot` is the directory that holds `ts/`; passing a mutated copy is
// how the second test proves the comparison is not vacuous.
export function compare(templatesRoot, referenceText) {
  const mismatches = []
  const fail = (message) => mismatches.push(message)

  const templates = join(templatesRoot, "ts")
  const blocks = jsonBlocks(referenceText)
  const tsconfigRef = blocks.find((block) => block.compilerOptions)
  const oxlintRef = blocks.find((block) => block.rules && block.$schema)
  const scriptsRef = blocks.find((block) => block.scripts)
  if (!tsconfigRef) fail("reference has no tsconfig JSON block")
  if (!oxlintRef) fail("reference has no .oxlintrc JSON block")
  if (!scriptsRef) fail("reference has no package scripts JSON block")
  if (!tsconfigRef || !oxlintRef || !scriptsRef) return { mismatches }

  const { versions, floor } = minimumVersions(referenceText)
  for (const tool of ["Node.js", "npm", "TypeScript", "Oxlint", "Prettier", "@types/node"]) {
    if (!versions[tool]) fail(`reference minimum-versions table has no ${tool} row`)
  }

  let pkg
  let oxlint
  let tsconfig
  try {
    pkg = JSON.parse(read(join(templates, "package.json.template")))
    oxlint = JSON.parse(read(join(templates, ".oxlintrc.json.template")))
    tsconfig = JSON.parse(read(join(templates, "tsconfig.json.template")))
  } catch (error) {
    fail(`template read failed: ${error.message}`)
    return { mismatches }
  }

  const expect = (label, actual, wanted) => {
    try {
      assert.deepEqual(actual, wanted)
    } catch {
      fail(`${label}: template ${JSON.stringify(actual)} != reference ${JSON.stringify(wanted)}`)
    }
  }

  const nvmrc = read(join(templates, ".nvmrc.template")).trim()
  expect(".nvmrc", nvmrc, versions["Node.js"])
  expect("package.json packageManager", pkg.packageManager, `npm@${versions.npm}`)
  expect("package.json engines.node", pkg.engines?.node, `>=${floor}`)
  expect("package.json scripts", pkg.scripts, scriptsRef.scripts)
  expect("package.json typescript", pkg.devDependencies?.typescript, versions.TypeScript)
  expect("package.json oxlint", pkg.devDependencies?.oxlint, versions.Oxlint)
  expect("package.json prettier", pkg.devDependencies?.prettier, versions.Prettier)
  expect("package.json @types/node", pkg.devDependencies?.["@types/node"], versions["@types/node"])
  expect("tsconfig.json", tsconfig, tsconfigRef)
  expect(".oxlintrc.json", oxlint, oxlintRef)

  const ci = read(join(templates, ".github/workflows/ci.yml.template"))
  expect("ci.yml node matrix", ciNodeVersions(ci), [versions["Node.js"], floor])

  const limits = limitsRows(referenceText)
  if (!limits.size) fail("reference has no Quality limits table")
  for (const { rule, label } of LIMIT_ROWS) {
    const declared = [...limits.entries()]
      .map(([text, cells]) => ({ text, cells, match: text.match(label) }))
      .find((entry) => entry.match)
    const installed = ruleSpec(oxlint.rules?.[rule])
    if (!installed.severity) {
      fail(`template .oxlintrc.json has no ${rule} rule, but the reference names it`)
      continue
    }
    if (!declared) {
      fail(`reference Quality limits table has no ${rule} row`)
      continue
    }
    if (Number(declared.match[1]) !== installed.max) {
      fail(`quality limit ${rule}: reference row '${declared.text}' != template max ${installed.max}`)
    }
    const cell = declared.cells[1].replace(/`/g, "")
    if (!cell.startsWith(installed.severity)) {
      fail(`quality limit ${rule}: reference severity '${cell}' != template '${installed.severity}'`)
    }
    for (const option of ["skipBlankLines", "skipComments"]) {
      const inReference = cell.includes(option)
      const inTemplate = installed.options[option] === true
      if (inReference !== inTemplate) {
        fail(
          `quality limit ${rule}: ${option} is ${inReference ? "claimed by" : "missing from"} the reference but ${inTemplate ? "set" : "not set"} in the template`,
        )
      }
    }
  }

  return { mismatches }
}

test("the TypeScript templates and references/typescript.md agree", () => {
  const { mismatches } = compare(join(SKILL, "templates"), read(REFERENCE))
  assert.deepEqual(mismatches, [])
})

test("a deliberate divergence is reported", () => {
  const dir = mkdtempSync(join(tmpdir(), "template-reference-parity-"))
  try {
    cpSync(join(SKILL, "templates/ts"), join(dir, "ts"), { recursive: true })
    writeFileSync(join(dir, "ts/.nvmrc.template"), "24.14.0\n")
    const { mismatches } = compare(dir, read(REFERENCE))
    assert.ok(
      mismatches.some((message) => message.includes(".nvmrc")),
      `a changed .nvmrc must be reported, got: ${mismatches.join("; ")}`,
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("a deliberate quality-limit divergence is reported by the rule-level check", () => {
  // Mutate the reference row, not the template JSON: the pre-existing
  // whole-block comparison also quotes `max-params`, so a template mutation
  // would still pass with the rule-by-rule check deleted. A reference-row change
  // can only be caught by the rule-level comparison, and it must be the only
  // finding — that is what proves this check is doing the work.
  const reference = read(REFERENCE)
  const mutated = reference.replace("| Max parameters 4 |", "| Max parameters 5 |")
  assert.notEqual(mutated, reference, "the reference row to mutate was not found")
  const { mismatches } = compare(join(SKILL, "templates"), mutated)
  assert.deepEqual(mismatches, [
    "quality limit max-params: reference row 'Max parameters 5' != template max 4",
  ])
})
