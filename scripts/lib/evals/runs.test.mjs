import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, existsSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createRun, openRun, runId } from "./runs.mjs"

const at = new Date("2026-11-01T22:59:00")
const base = { root: null, agent: "build", level: "behavior", repoSha: "abc", at }

test("the run id names the configuration, so two cells never share a directory", () => {
  const a = runId({ label: "review-code", arm: "with-skill", model: null, at })
  const b = runId({ label: "review-code", arm: "without-skill", model: null, at })
  const c = runId({ label: "review-code", arm: "with-skill", model: "opencode-go/gpt-6-luna", at })
  assert.equal(a, "2026-11-01T22-59-00--review-code")
  assert.equal(b, "2026-11-01T22-59-00--review-code--without-skill")
  assert.equal(c, "2026-11-01T22-59-00--review-code--opencode-go-gpt-6-luna")
  assert.equal(new Set([a, b, c]).size, 3)
})

test("a multi-skill run labels itself instead of borrowing one skill's name", () => {
  assert.equal(runId({ label: "trigger", arm: "with-skill", model: null, at }), "2026-11-01T22-59-00--trigger")
  assert.equal(runId({ label: "all", arm: "with-skill", model: null, at }), "2026-11-01T22-59-00--all")
})

test("a second run of the same configuration and second does not merge", () => {
  const root = mkdtempSync(join(tmpdir(), "runs-"))
  const a = createRun({ ...base, root, label: "review-code" })
  const b = createRun({ ...base, root, label: "review-code" })
  assert.notEqual(a.dir, b.dir)
  assert.equal(existsSync(join(a.dir, "manifest.json")), true)
  assert.equal(existsSync(join(b.dir, "manifest.json")), true)
})

test("cases from different skills cannot collide inside one run", () => {
  const root = mkdtempSync(join(tmpdir(), "runs-"))
  const run = createRun({ ...base, root, label: "trigger" })
  run.writeResult("review-code", 1, { case: 1, status: "passed" })
  run.writeResult("audit-docs", 1, { case: 1, status: "failed" })
  assert.notEqual(run.resultPath("review-code", 1), run.resultPath("audit-docs", 1))
  assert.equal(JSON.parse(readFileSync(run.resultPath("audit-docs", 1), "utf8")).status, "failed")
})

test("a failed case still writes a result, so no stale green can pass for this run", () => {
  const root = mkdtempSync(join(tmpdir(), "runs-"))
  const run = createRun({ ...base, root, label: "review-code" })
  run.writeResult("review-code", 3, { case: 3, status: "failed", reason: "fixture failed to stage" })
  const result = JSON.parse(readFileSync(run.resultPath("review-code", 3), "utf8"))
  assert.equal(result.reason, "fixture failed to stage")
})

test("the manifest is closed with counts and keeps the skill hash per case", () => {
  const root = mkdtempSync(join(tmpdir(), "runs-"))
  const run = createRun({ ...base, root, label: "review-code" })
  run.writeResult("review-code", 1, { case: 1, status: "passed", skillHash: "deadbeef" })
  run.finish({ counts: { passed: 1, failed: 0 } })
  const manifest = JSON.parse(readFileSync(join(run.dir, "manifest.json"), "utf8"))
  assert.equal(manifest.status, "completed")
  assert.equal(manifest.counts.passed, 1)
  assert.equal(manifest.skillHashes["review-code#1"], "deadbeef")
  assert.ok(manifest.finishedAt)
})

// SPEC-0057: the tree hash stays the identity; the per-file set is additive so
// a later reader can tell which files governed the draw.
test("the manifest records governed file hashes and the resolved list", () => {
  const root = mkdtempSync(join(tmpdir(), "runs-"))
  const run = createRun({ ...base, root, label: "review-code" })
  run.writeResult("review-code", 1, {
    case: 1,
    status: "passed",
    skillHash: "tree",
    skillHashes: { "SKILL.md": "abc" },
    governs: ["SKILL.md"],
  })
  run.finish({ counts: { passed: 1, failed: 0 } })
  const manifest = JSON.parse(readFileSync(join(run.dir, "manifest.json"), "utf8"))
  assert.equal(manifest.skillHashes["review-code#1"], "tree")
  assert.deepEqual(manifest.skillFileHashes["review-code#1"], { "SKILL.md": "abc" })
  assert.deepEqual(manifest.governs["review-code#1"], ["SKILL.md"])
  assert.deepEqual(JSON.parse(readFileSync(run.resultPath("review-code", 1), "utf8")).skillHashes, { "SKILL.md": "abc" })
})

test("the manifest records the scheduling parameters instead of leaving them inferred", () => {
  const root = mkdtempSync(join(tmpdir(), "runs-"))
  const params = { concurrency: 4, repeat: 12, stop: { passes: 5, fails: 3 }, stallMs: 120000 }
  const run = createRun({ ...base, root, label: "review-code", params })
  const manifest = JSON.parse(readFileSync(join(run.dir, "manifest.json"), "utf8"))
  assert.deepEqual(manifest.params, params)
})

test("a run that did not finish keeps that status", () => {
  const root = mkdtempSync(join(tmpdir(), "runs-"))
  const run = createRun({ ...base, root, label: "review-code" })
  run.finish({ status: "partial", counts: { passed: 0, failed: 0, unscored: 1 } })
  assert.equal(JSON.parse(readFileSync(join(run.dir, "manifest.json"), "utf8")).status, "partial")
})

// A draw is written before the case finishes, so a dead run still has the paid
// work. `openRun` reads the same directory back and resets the manifest to
// running; the caller supplies the same selection and repeat.
test("a draw is persisted before the case closes, and resume reads it back", () => {
  const root = mkdtempSync(join(tmpdir(), "runs-"))
  const run = createRun({ ...base, root, label: "review-code", params: { repeat: 3 } })
  run.writeDraw("review-code", 1, 1, { rep: 1, status: "passed" })
  run.writeDraw("review-code", 1, 2, { rep: 2, status: "failed" })
  assert.equal(existsSync(run.drawPath("review-code", 1, 1)), true)

  const resumed = openRun(run.dir)
  assert.equal(resumed.dir, run.dir, "resume reuses the directory, it does not create one")
  assert.deepEqual(resumed.readDraw("review-code", 1, 1), { rep: 1, status: "passed" })
  assert.deepEqual(resumed.readDraw("review-code", 1, 2), { rep: 2, status: "failed" })
  assert.equal(resumed.readDraw("review-code", 1, 3), null)
  const manifest = JSON.parse(readFileSync(join(run.dir, "manifest.json"), "utf8"))
  assert.equal(manifest.status, "running")
  assert.equal(manifest.finishedAt, null)
})

// SPEC-0057: an old manifest predates `skillFileHashes`/`governs`. Resume must
// not throw on its first result write.
test("an old manifest without the SPEC-0057 maps can still be resumed", () => {
  const root = mkdtempSync(join(tmpdir(), "runs-"))
  const dir = join(root, "runs", "2026-11-01T22-59-00--review-code")
  mkdirSync(dir, { recursive: true })
  const legacy = {
    run: "2026-11-01T22-59-00--review-code",
    dir,
    label: "review-code",
    arm: "with-skill",
    model: "default",
    agent: "build",
    level: "behavior",
    repoSha: "abc",
    params: null,
    startedAt: new Date("2026-11-01T22:59:00").toISOString(),
    finishedAt: null,
    status: "running",
    counts: null,
    skillHashes: {},
    stagedSkills: {},
  }
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(legacy))
  const resumed = openRun(dir)
  assert.doesNotThrow(() =>
    resumed.writeResult("review-code", 1, {
      case: 1,
      status: "passed",
      skillHash: "tree",
      skillHashes: { "SKILL.md": "abc" },
      governs: ["SKILL.md"],
    }),
  )
  resumed.finish({ counts: { passed: 1, failed: 0 } })
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"))
  assert.deepEqual(manifest.skillFileHashes["review-code#1"], { "SKILL.md": "abc" })
  assert.deepEqual(manifest.governs["review-code#1"], ["SKILL.md"])
})

test("openRun refuses a directory that is not a run", () => {
  const root = mkdtempSync(join(tmpdir(), "runs-"))
  assert.throws(() => openRun(join(root, "missing")), /not a run directory/)
})
