import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { join, dirname, resolve, relative } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { readEvals, parseCases } from "./parse.mjs"

// A case's prompt must name documents its own fixture contains.
//
// `write-implementation-prompt` case 4 asked for SPEC-0012 while its fixture and
// assertions were about SPEC-0011. Nothing failed: an agent that ignored the
// requested id and built the prompt for the spec that happened to be there went
// green. The migration that introduced the prompt line invented the number, and
// only a reader noticed.
//
// The rule is narrow on purpose. It applies to cases that ship a fixture, and
// follows `git.json`'s `base` so a shared tree counts. A case that cites a spec
// which is deliberately absent — a refusal case — marks itself with the
// `absent-spec` tag.

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const ID = /\b[A-Z]{2,}-\d{3,}\b/

// Every path a case stages, including the base a git manifest points at.
function stagedPaths(caseDir) {
  if (!existsSync(caseDir)) return null
  const paths = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name)
      if (entry.isDirectory()) walk(p)
      else paths.push(relative(caseDir, p))
    }
  }
  walk(caseDir)
  const manifest = join(caseDir, "git.json")
  if (existsSync(manifest)) {
    const spec = JSON.parse(readFileSync(manifest, "utf8"))
    const base = resolve(caseDir, spec.base ?? ".")
    if (existsSync(base) && statSync(base).isDirectory()) walk(base)
  }
  return paths
}

// `danglingIds` is the detector, kept separate so it can be tested against a
// fixture that really is broken instead of only ever returning an empty list.
function danglingIds(cases, caseDirFor) {
  const broken = []
  for (const c of cases) {
    if (c.tags.includes("absent-spec")) continue
    const paths = stagedPaths(caseDirFor(c))
    if (!paths) continue // no fixture: the prompt carries the situation
    for (const id of new Set(c.prompt.match(ID) ?? [])) {
      if (!paths.some((p) => p.includes(id))) broken.push(`case ${c.n}: prompt cites ${id}, fixture has none`)
    }
  }
  return broken
}

test("a case only asks for documents its fixture stages", () => {
  const broken = []
  for (const skill of readdirSync(join(REPO, "skills"), { withFileTypes: true })) {
    if (!skill.isDirectory()) continue
    const evals = join(REPO, "skills", skill.name, "references/evals.md")
    if (!existsSync(evals)) continue
    for (const id of danglingIds(readEvals(evals).cases, (c) =>
      join(REPO, "skills", skill.name, "references/evals", String(c.n)),
    ))
      broken.push(`${skill.name} ${id}`)
  }
  assert.deepEqual(broken, [])
})

test("the detector reports the mismatch it exists for", () => {
  const root = mkdtempSync(join(tmpdir(), "corpus-test-"))
  mkdirSync(join(root, "1/docs/specs"), { recursive: true })
  writeFileSync(join(root, "1/docs/specs/SPEC-0011-bulk-import.md"), "# spec\n")
  writeFileSync(join(root, "1/git.json"), JSON.stringify({ base: "base" }))
  mkdirSync(join(root, "1/base/docs/specs"), { recursive: true })
  writeFileSync(join(root, "1/base/docs/specs/SPEC-0007-cart-tax.md"), "# spec\n")

  const { cases } = parseCases(`# Evals

1. **A spec overlapping an existing prompt's domain.**
   - prompt: Create the implementation prompt for SPEC-0012.
   - assert: filematch docs/prompts/SPEC-0011-*.prompt.md spec_sha:

2. **A refusal case.**
   - prompt: Create the implementation prompt for SPEC-0013.
   - tags: absent-spec
   - assert: nodir docs/prompts
`)
  const report = danglingIds(cases, (c) => join(root, String(c.n)))
  assert.deepEqual(report, ["case 1: prompt cites SPEC-0012, fixture has none"])
})
