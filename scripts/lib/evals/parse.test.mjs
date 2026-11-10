import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { corpusDir, parseCases, readEvals, unquote } from "./parse.mjs"

function writeFiles(root, files) {
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true })
    writeFileSync(join(root, rel), text)
  }
}

// A mini repo: `<root>/skills/demo` is the skill, `<root>/evals/demo` the
// corpus beside it (SPEC-0058). The helper returns the skill directory, which
// is what every caller passes as `skillDir`.
function skillDir(files = {}) {
  const root = mkdtempSync(join(tmpdir(), "parse-skill-"))
  const dir = join(root, "skills", "demo")
  writeFiles(dir, files)
  return dir
}

function corpusFiles(skill, files) {
  writeFiles(corpusDir(skill), files)
}

const legacy = `# Evals

1. **"Review this branch against SPEC-0007."** (the diff satisfies every AC)
   - Walks AC-1 through AC-3.
   - Watch for: approving without the AC walk-through, or citing taste as a
     finding.
   - [assert] verdict APPROVE
   - [assert] unchanged src/cart.js
`

const v2 = `# Evals

1. **Review against SPEC-0007.**
   - prompt: Review this branch against SPEC-0007.
   - why: the diff satisfies every AC
   - expect: Walks AC-1 through AC-3.
   - needs: gates
   - tags: review, git
   - assert: verdict APPROVE
`

test("a legacy note never reaches the prompt", () => {
  const { cases } = parseCases(legacy)
  const c = cases[0]
  assert.equal(c.prompt, "Review this branch against SPEC-0007.")
  assert.equal(c.why, "the diff satisfies every AC")
  assert.ok(!c.prompt.includes("("), "the parenthetical leaked into the prompt")
  assert.ok(!c.prompt.startsWith('"'), "the quotes leaked into the prompt")
  assert.equal(c.legacy, true)
})

test("wrapped expectation lines are preserved", () => {
  const { cases } = parseCases(legacy)
  assert.deepEqual(cases[0].expect.at(-1), "Watch for: approving without the AC walk-through, or citing taste as a finding.")
})

test("legacy [assert] bullets still parse", () => {
  const { cases, errors } = parseCases(legacy)
  assert.deepEqual(cases[0].assert, [
    { kind: "verdict", arg: "APPROVE" },
    { kind: "unchanged", arg: "src/cart.js" },
  ])
  assert.deepEqual(errors, [])
})

test("the title is not the prompt when a prompt is explicit", () => {
  const { cases, errors } = parseCases(v2)
  const c = cases[0]
  assert.equal(c.title, "Review against SPEC-0007.")
  assert.equal(c.prompt, "Review this branch against SPEC-0007.")
  assert.equal(c.legacy, undefined)
  assert.deepEqual(c.needs, ["gates"])
  assert.deepEqual(c.tags, ["review", "git"])
  assert.deepEqual(errors, [])
})

test("a case with neither prompt nor manual status is an error", () => {
  const { errors } = parseCases(`1. **Some title.**\n   - expect: something.\n`)
  assert.ok(errors.some((e) => /no prompt/.test(e)))
})

test("manual cases need no prompt and are excluded from runnable", () => {
  const { cases, errors, runnable, manual } = parseCases(`1. **Some title.**\n   - status: manual\n   - expect: nothing to run.\n`)
  assert.deepEqual(errors, [])
  assert.equal(cases[0].status, "manual")
  assert.equal(runnable, 0)
  assert.equal(manual, 1)
})

test("unknown assert kinds are errors, not runtime surprises", () => {
  const { errors } = parseCases(`1. **T.**\n   - prompt: do it\n   - assert: grep something\n`)
  assert.ok(errors.some((e) => /unknown assert kind 'grep'/.test(e)))
})

test("duplicate case numbers are an error", () => {
  const { errors } = parseCases(`1. **A.**\n   - prompt: a\n2. **B.**\n   - prompt: b\n1. **C.**\n   - prompt: c`)
  assert.ok(errors.some((e) => /duplicate case number/.test(e)))
})

test("gate: off is parsed, and anything else is rejected", () => {
  const ok = parseCases(`1. **T.**\n   - prompt: do it\n   - gate: off\n   - assert: skill x\n`)
  assert.equal(ok.cases[0].gate, "off")
  assert.deepEqual(ok.errors, [])
  const bad = parseCases(`1. **T.**\n   - prompt: do it\n   - gate: sideways\n   - assert: skill x\n`)
  assert.ok(bad.errors.some((e) => /unknown gate/.test(e)))
})

test("an assertion on the skill under review needs no stage", () => {
  const { errors, warnings } = parseCases(
    `1. **T.**\n   - prompt: do it\n   - assert: skill demo\n   - assert: notskill demo\n`,
    "demo",
  )
  assert.deepEqual(errors, [])
  assert.deepEqual(warnings, [])
})

test("an assertion on an undeclared sibling fails validation", () => {
  const skill = parseCases(`1. **T.**\n   - prompt: do it\n   - assert: skill other\n`, "demo")
  assert.ok(skill.errors.some((e) => /assert 'skill other' names a skill the run will not stage/.test(e)))
  const notskill = parseCases(`1. **T.**\n   - prompt: do it\n   - assert: notskill other\n`, "demo")
  assert.ok(notskill.errors.some((e) => /assert 'notskill other' names a skill the run will not stage/.test(e)))
})

test("a declared stage makes the sibling assertion valid", () => {
  const { errors, warnings } = parseCases(
    `1. **T.**\n   - prompt: do it\n   - stage: other\n   - assert: skill other\n`,
    "demo",
  )
  assert.deepEqual(errors, [])
  assert.deepEqual(warnings, [])
})

test("a stage no assertion uses is a warning", () => {
  const { errors, warnings } = parseCases(
    `1. **T.**\n   - prompt: do it\n   - stage: other\n   - assert: skill demo\n`,
    "demo",
  )
  assert.deepEqual(errors, [])
  assert.ok(warnings.some((w) => /stage 'other' has no skill\/notskill assertion/.test(w)))
})

test("without the skill id the consistency rule is not applied", () => {
  const { errors } = parseCases(`1. **T.**\n   - prompt: do it\n   - assert: skill other\n`)
  assert.deepEqual(errors, [])
})

// SPEC-0057: a bad regex is an authoring error, not a permanent red cell.
test("every regex-bearing assertion compiles through safeRegex", () => {
  const bad = `1. **T.**
   - prompt: do it
   - assert: reply (
   - assert: noreply [z
   - assert: filematch src/*.js (
   - assert: ran (
   - assert: ranpass [z
`
  const { errors } = parseCases(bad)
  for (const kind of ["reply", "noreply", "filematch", "ran", "ranpass"]) {
    assert.ok(errors.some((e) => e.includes(`'${kind}' does not compile`)), `${kind} was not rejected: ${errors.join(" | ")}`)
  }
})

test("filematch without a regex is an error", () => {
  const { errors } = parseCases(`1. **T.**\n   - prompt: do it\n   - assert: filematch src/*.js\n`)
  assert.ok(errors.some((e) => /filematch' has no regex/.test(e)))
})

test("a valid regex is accepted", () => {
  const { errors } = parseCases(
    `1. **T.**\n   - prompt: do it\n   - assert: reply (approve|reject)\n   - assert: filematch src/*.js status:\n   - assert: ran npm test\n`,
  )
  assert.deepEqual(errors, [])
})

// SPEC-0057: `--list --check` must catch a broken pointer without staging.
test("a git.json base that does not resolve is reported from the authoring side", () => {
  const md = `1. **T.**\n   - prompt: do it\n   - assert: file a.txt\n`
  const dir = skillDir()
  corpusFiles(dir, { "fixtures/1/git.json": JSON.stringify({ base: "../missing" }) })
  const { errors } = parseCases(md, "demo", { skillDir: dir })
  assert.ok(errors.some((e) => /case 1: git\.json base '\.\.\/missing' does not resolve/.test(e)), errors.join(" | "))
})

test("readEvals resolves the corpus and the fixture pointer from its own layout", () => {
  const dir = skillDir()
  corpusFiles(dir, {
    "cases.md": `1. **T.**\n   - prompt: do it\n   - assert: file a.txt\n`,
    "fixtures/1/git.json": JSON.stringify({ base: "nowhere" }),
  })
  const { errors } = readEvals(join(corpusDir(dir), "cases.md"))
  assert.ok(errors.some((e) => /does not resolve/.test(e)), errors.join(" | "))
})

test("a resolving base and a malformed manifest are reported honestly", () => {
  const ok = skillDir()
  corpusFiles(ok, {
    "fixtures/1/base/a.txt": "a\n",
    "fixtures/1/git.json": JSON.stringify({ base: "base" }),
  })
  const parsed = parseCases(`1. **T.**\n   - prompt: do it\n   - assert: file a.txt\n`, "demo", { skillDir: ok })
  assert.deepEqual(parsed.errors, [])

  const broken = skillDir()
  corpusFiles(broken, { "fixtures/1/git.json": "{ not json" })
  const bad = parseCases(`1. **T.**\n   - prompt: do it\n   - assert: file a.txt\n`, "demo", { skillDir: broken })
  assert.ok(bad.errors.some((e) => /git\.json is not valid JSON/.test(e)))
})

test("governs is parsed, and a path outside the skill is rejected", () => {
  const dir = skillDir({ "SKILL.md": "x\n", "references/notes.md": "n\n" })
  const ok = parseCases(
    `1. **T.**\n   - prompt: do it\n   - governs: SKILL.md, references/notes.md\n   - assert: reply ok\n`,
    "demo",
    { skillDir: dir },
  )
  assert.deepEqual(ok.errors, [])
  assert.deepEqual(ok.cases[0].governs, ["SKILL.md", "references/notes.md"])

  for (const bad of ["missing.md", "../outside.md", "/etc/passwd", "references"]) {
    const parsed = parseCases(`1. **T.**\n   - prompt: do it\n   - governs: ${bad}\n   - assert: reply ok\n`, "demo", {
      skillDir: dir,
    })
    assert.ok(
      parsed.errors.some((e) => e.includes(`governs '${bad}' is not a file in the skill`)),
      `${bad} was accepted: ${parsed.errors.join(" | ")}`,
    )
  }
})

test("governs is absent by default and may only name a file", () => {
  const parsed = parseCases(`1. **T.**\n   - prompt: do it\n   - assert: reply ok\n`, "demo")
  assert.deepEqual(parsed.cases[0].governs, [])
})

test("unquote strips one layer of quotes only", () => {
  assert.equal(unquote('"Review this branch."'), "Review this branch.")
  assert.equal(unquote('"Say "hi"."'), 'Say "hi".')
  assert.equal(unquote("no quotes"), "no quotes")
})
