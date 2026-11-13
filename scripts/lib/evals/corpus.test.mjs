import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join, dirname, resolve, relative } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { corpusDir, readEvals, parseCases } from "./parse.mjs"
import { treeHash } from "./fixture.mjs"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"

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
    const evals = join(REPO, "evals", skill.name, "cases.md")
    if (!existsSync(evals)) continue
    for (const id of danglingIds(readEvals(evals, skill.name, { skillDir: join(REPO, "skills", skill.name) }).cases, (c) =>
      join(corpusDir(join(REPO, "skills", skill.name)), "fixtures", String(c.n)),
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

// SPEC-0058: the corpus moved out of the skill. `evals/corpus-baseline.json` is
// the pre-move snapshot (generated from skills/<id>/references/evals.md and
// .../references/evals/<n>/); this compares the moved corpus against it. The
// baseline is the "before", so the check is reproducible after the fact.
//
// SPEC-0065: the comparison is a subset, not an equality. A record of a past
// state cannot constrain every future state — every case and fixture the
// baseline records must still be present and unchanged, and a new case is an
// addition, not a regression in the move. `caseFileSha256` is still recorded in
// the baseline, but no longer asserted: a whole-file hash is that same mistake
// one level up, since adding a case necessarily rewrites the file.
const BASELINE = join(REPO, "evals", "corpus-baseline.json")
const sha256 = (text) => createHash("sha256").update(text).digest("hex")
const fieldsSha = (c) =>
  sha256(JSON.stringify({ n: c.n, title: c.title, prompt: c.prompt, why: c.why, assert: c.assert }))

// The subset rule, pure so both directions can be proven without a checkout.
// `fixtureHashes` maps a baseline fixture name to the tree hash on disk and
// omits the name when the directory does not exist, so a deletion is reported
// as a deletion rather than as changed bytes.
function parityFindings(expected, cases, fixtureHashes) {
  const findings = []
  const byN = new Map(cases.map((c) => [c.n, c]))
  for (const want of expected.cases) {
    const got = byN.get(want.n)
    if (!got) findings.push(`case ${want.n} is missing`)
    else if (fieldsSha(got) !== want.fieldsSha256) findings.push(`case ${want.n} fields changed`)
  }
  for (const [name, hash] of Object.entries(expected.fixtures)) {
    if (!(name in fixtureHashes)) findings.push(`fixture ${name} was deleted`)
    else if (fixtureHashes[name] !== hash) findings.push(`fixture ${name} bytes changed`)
  }
  return findings
}

test("every case and fixture survived the move byte-for-byte", () => {
  const baseline = JSON.parse(readFileSync(BASELINE, "utf8")).cases
  const onDisk = readdirSync(join(REPO, "evals"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
  // The baseline is a pre-move snapshot, not a closed set: a skill added later
  // has no baseline entries and must not fail the move's parity check. SPEC-0065
  // already made the case/fixture comparison a subset; the skill set follows it.
  const missing = Object.keys(baseline).filter((id) => !onDisk.includes(id))
  assert.deepEqual(missing, [], "a skill with a baseline corpus disappeared")

  const mismatches = []
  for (const [id, expected] of Object.entries(baseline)) {
    const casesFile = join(REPO, "evals", id, "cases.md")
    const skillDir = join(REPO, "skills", id)
    if (!existsSync(casesFile)) {
      mismatches.push(`${id}: evals/${id}/cases.md is missing`)
      continue
    }
    const { cases } = readEvals(casesFile, id, { skillDir })
    const fixtureHashes = {}
    for (const name of Object.keys(expected.fixtures)) {
      const fixture = join(REPO, "evals", id, "fixtures", name)
      if (existsSync(fixture)) fixtureHashes[name] = treeHash(fixture)
    }
    for (const finding of parityFindings(expected, cases, fixtureHashes)) mismatches.push(`${id}: ${finding}`)
  }
  assert.deepEqual(mismatches, [])
})

// The four directions of the subset rule. A regression in the move still fails;
// growth does not.
const sampleCase = (n, over = {}) => ({
  n,
  title: `Case ${n}`,
  prompt: `Do thing ${n}.`,
  why: `because ${n}`,
  assert: [{ kind: "file", arg: `src/${n}.js` }],
  ...over,
})
const sampleBaseline = (cases, fixtures = {}) => ({
  caseFileSha256: "recorded-but-not-asserted",
  cases: cases.map((c) => ({ n: c.n, title: c.title, fieldsSha256: fieldsSha(c) })),
  fixtures,
})

test("the parity check fails when a baseline case is removed", () => {
  const expected = sampleBaseline([sampleCase(1), sampleCase(2)])
  assert.deepEqual(parityFindings(expected, [sampleCase(1)], {}), ["case 2 is missing"])
})

test("the parity check fails when a baseline case's fields change", () => {
  const expected = sampleBaseline([sampleCase(1)])
  const changed = sampleCase(1, { prompt: "Do something else." })
  assert.deepEqual(parityFindings(expected, [changed], {}), ["case 1 fields changed"])
})

test("the parity check fails when a baseline fixture's tree hash changes", () => {
  const expected = sampleBaseline([], { 1: "aaaa" })
  assert.deepEqual(parityFindings(expected, [], { 1: "bbbb" }), ["fixture 1 bytes changed"])
})

test("the parity check fails when a baseline fixture is deleted", () => {
  const expected = sampleBaseline([], { 1: "aaaa" })
  assert.deepEqual(parityFindings(expected, [], {}), ["fixture 1 was deleted"])
})

test("the parity check passes when a case is added", () => {
  const expected = sampleBaseline([sampleCase(1)], { 1: "aaaa" })
  assert.deepEqual(parityFindings(expected, [sampleCase(1), sampleCase(2)], { 1: "aaaa" }), [])
})

test("no skill checkout carries the eval corpus after the move", () => {
  const stray = []
  for (const skill of readdirSync(join(REPO, "skills"), { withFileTypes: true })) {
    if (!skill.isDirectory()) continue
    const references = join(REPO, "skills", skill.name, "references")
    if (!existsSync(references)) continue
    for (const entry of readdirSync(references)) {
      if (entry.startsWith("evals")) stray.push(`skills/${skill.name}/references/${entry}`)
    }
  }
  assert.deepEqual(stray, [])
})

// The guard that keeps the boundary from drifting back: `lint` fails when a
// skill still carries the corpus under any `evals*` name, canonical or not.
test("validate-skills fails on any references/evals* entry", () => {
  const cli = join(REPO, "scripts", "validate-skills.mjs")
  for (const name of ["evals.md", "evals", "evals-archive", "evals.md.bak"]) {
    const root = mkdtempSync(join(tmpdir(), "stray-evals-"))
    try {
      const skill = join(root, "skills", "demo")
      const references = join(skill, "references")
      mkdirSync(references, { recursive: true })
      writeFileSync(join(skill, "SKILL.md"), "---\nname: demo\ndescription: demo\n---\nbody\n")
      if (name.endsWith(".md")) {
        writeFileSync(join(references, name), "1. **T.**\n   - prompt: do it\n")
      } else {
        mkdirSync(join(references, name))
        writeFileSync(join(references, name, "cases.md"), "1. **T.**\n   - prompt: do it\n")
      }
      const run = spawnSync(process.execPath, [cli, "--root", join(root, "skills")], { encoding: "utf8" })
      assert.equal(run.status, 1, `${name}: ${run.stdout}${run.stderr}`)
      assert.ok(run.stdout.includes("stray eval corpus"), `${name}: ${run.stdout}`)
      assert.ok(run.stdout.includes(`references/${name}`), `${name}: ${run.stdout}`)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }
})
