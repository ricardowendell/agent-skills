import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { checkStaleness, scanCitations } from "./check-staleness.mjs"
import { stagedTreeHash } from "./lib/evals/fixture.mjs"

const CLI = resolve(dirname(fileURLToPath(import.meta.url)), "check-staleness.mjs")
const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex")

function write(root, rel, text) {
  mkdirSync(dirname(join(root, rel)), { recursive: true })
  writeFileSync(join(root, rel), text)
}

// A miniature checkout, store and coverage table. Every cell is cited by a run
// token, so the scanner and the hash comparison are exercised together.
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "staleness-"))
  const skills = join(root, "skills")
  const skill = join(skills, "demo")
  write(skill, "SKILL.md", "---\nname: demo\n---\nbody\n")
  write(skill, "references/notes.md", "notes\n")
  write(skill, "references/evals.md", "1. **T.**\n   - prompt: do it\n   - assert: reply ok\n")

  const store = join(root, "runs")
  const run1 = join(store, "2026-01-01T00-00-00--demo")
  const run2 = join(store, "2026-02-01T00-00-00--demo")
  write(run1, "manifest.json", JSON.stringify({ run: "run1", status: "completed", skillHashes: {} }))
  write(run2, "manifest.json", JSON.stringify({ run: "run2", status: "completed", skillHashes: {} }))
  // #1: legacy tree hash, current -> fresh.
  write(run1, "cases/demo--01/result.json", JSON.stringify({ skill: "demo", case: 1, skillHash: stagedTreeHash(skill) }))
  // #2: per-file hash, current -> fresh.
  write(
    run1,
    "cases/demo--02/result.json",
    JSON.stringify({ skill: "demo", case: 2, skillHashes: { "SKILL.md": sha(join(skill, "SKILL.md")) } }),
  )
  // #3: an older tree -> stale.
  write(run1, "cases/demo--03/result.json", JSON.stringify({ skill: "demo", case: 3, skillHash: "deadbeef" }))
  // #4: a governed subset that does not include the file a later edit touches.
  write(
    run2,
    "cases/demo--04/result.json",
    JSON.stringify({ skill: "demo", case: 4, skillHashes: { "SKILL.md": sha(join(skill, "SKILL.md")) } }),
  )
  // Not evidence: the checker must not read these.
  write(store, "baseline.json", "{ not json")
  write(store, "last-run.json", "{ not json")

  const coverage = join(root, "coverage.md")
  write(
    root,
    "coverage.md",
    [
      "| `demo` | 5 | 0 | 0 | tree | #1 `2026-01-01T00-00-00--demo`; #2 `2026-01-01T00-00-00--demo`; #3 `2026-01-01T00-00-00--demo`; #4 `2026-02-01T00-00-00--demo` |",
      "",
      "**`demo` #5 is historical at an older hash.**",
      "",
      "A bare #9 is another skill's case and must not become a citation.",
    ].join("\n"),
  )
  return { root, skills, skill, store, coverage }
}

test("every cited cell is checked, and a stale one is named with its run", () => {
  const f = fixture()
  try {
    const report = checkStaleness({ coverage: f.coverage, store: f.store, skillsRoot: f.skills })
    assert.equal(report.cited, 5, "cells 1-5 are cited; the bare #9 is not")
    assert.deepEqual(
      report.stale.map((c) => [c.cell, c.run, c.reason]),
      [
        ["demo#3", "2026-01-01T00-00-00--demo", "tree hash deadbeef != " + stagedTreeHash(f.skill).slice(0, 12)],
        ["demo#5", null, "no recorded run"],
      ],
    )
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})

test("a change to a governed file makes the cell stale; an ungoverned edit does not", () => {
  const f = fixture()
  try {
    write(f.skill, "references/notes.md", "edited\n")
    const report = checkStaleness({ coverage: f.coverage, store: f.store, skillsRoot: f.skills })
    assert.equal(report.stale.some((c) => c.cell === "demo#4"), false, "notes.md is outside demo#4's governs set")
    assert.equal(report.stale.some((c) => c.cell === "demo#2"), false, "SKILL.md is unchanged")

    write(f.skill, "SKILL.md", "---\nname: demo\n---\nchanged\n")
    const after = checkStaleness({ coverage: f.coverage, store: f.store, skillsRoot: f.skills })
    assert.equal(after.stale.some((c) => c.cell === "demo#2"), true)
    assert.equal(after.stale.some((c) => c.cell === "demo#4"), true)
    assert.equal(after.stale.find((c) => c.cell === "demo#2").reason, "changed SKILL.md")
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})

test("scanCitations ignores a bare #N and keeps explicit skill cells", () => {
  const f = fixture()
  try {
    const { cited } = scanCitations(readFileSync(f.coverage, "utf8"), {
      store: f.store,
      storeRuns: ["2026-01-01T00-00-00--demo", "2026-02-01T00-00-00--demo"],
      knownSkills: new Set(["demo"]),
    })
    assert.equal([...cited.keys()].sort().join(","), "demo#1,demo#2,demo#3,demo#4,demo#5")
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})

test("a bare timestamp resolves by unique prefix; ambiguous or missing is uncited", () => {
  const f = fixture()
  try {
    const text = [
      "the run `2026-01-01T00-00-00` is cited",
      "the pair `2026-03-03T00-00-00` is ambiguous",
      "the ghost `2026-09-09T00-00-00` does not exist",
    ].join("\n")
    const { cited, uncited } = scanCitations(text, {
      store: f.store,
      storeRuns: [
        "2026-01-01T00-00-00--demo",
        "2026-02-01T00-00-00--demo",
        "2026-03-03T00-00-00--demo",
        "2026-03-03T00-00-00--demo--without-skill",
      ],
      knownSkills: new Set(["demo"]),
    })
    assert.deepEqual([...cited.keys()].sort(), ["demo#1", "demo#2", "demo#3"])
    assert.deepEqual(
      uncited.map((u) => [u.timestamp, u.candidates.length]),
      [
        ["2026-03-03T00-00-00", 2],
        ["2026-09-09T00-00-00", 0],
      ],
    )
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})

test("a time-only citation resolves by unique time slot; ambiguous or missing is uncited", () => {
  const f = fixture()
  try {
    const run = join(f.store, "2026-05-05T09-32-51--demo")
    write(run, "cases/demo--06/result.json", JSON.stringify({ skill: "demo", case: 6, skillHash: "deadbeef" }))
    const text = [
      "the ablation `09-32-51` is cited",
      "the pair `08-00-00` is ambiguous",
      "the ghost `07-07-07` does not exist",
      "the ellipsis `…10-45-29` is the date-relative shorthand",
    ].join("\n")
    const { cited, uncited } = scanCitations(text, {
      store: f.store,
      storeRuns: [
        "2026-05-05T09-32-51--demo",
        "2026-06-06T08-00-00--demo",
        "2026-06-06T08-00-00--demo--without-skill",
      ],
      knownSkills: new Set(["demo"]),
    })
    assert.deepEqual([...cited.keys()], ["demo#6"])
    assert.deepEqual(
      uncited.map((u) => [u.timestamp, u.candidates.length]),
      [
        ["08-00-00", 2],
        ["07-07-07", 0],
      ],
    )
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})

test("the report form exits 0 and --check exits 1 when a cited cell is stale", () => {
  const f = fixture()
  try {
    const args = ["--coverage", f.coverage, "--store", f.store, "--skills", f.skills]
    const report = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" })
    assert.equal(report.status, 0, report.stderr)
    assert.match(report.stdout, /stale demo#3/)
    assert.match(report.stdout, /5 cited cell\(s\), 2 stale/)

    const check = spawnSync(process.execPath, [CLI, ...args, "--check"], { encoding: "utf8" })
    assert.equal(check.status, 1, check.stderr)
    assert.match(check.stdout, /stale demo#5 — no run \(no recorded run\)/)
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})

test("a clean coverage table exits 0 under --check too", () => {
  const f = fixture()
  try {
    // Run 1 also contains the deliberately stale #3, so cite run 2 alone: its
    // per-file hash matches the checkout.
    const clean = join(f.root, "clean.md")
    write(f.root, "clean.md", "| `demo` | 1 | 0 | 0 | tree | #4 in `2026-02-01T00-00-00--demo` |")
    const args = ["--coverage", clean, "--store", f.store, "--skills", f.skills, "--check"]
    const check = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" })
    assert.equal(check.status, 0, check.stdout + check.stderr)
    assert.match(check.stdout, /1 cited cell\(s\), 0 stale/)
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})
