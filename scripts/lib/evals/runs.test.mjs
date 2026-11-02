import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createRun, runId } from "./runs.mjs"

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

test("a run that did not finish keeps that status", () => {
  const root = mkdtempSync(join(tmpdir(), "runs-"))
  const run = createRun({ ...base, root, label: "review-code" })
  run.finish({ status: "partial", counts: { passed: 0, failed: 0, unscored: 1 } })
  assert.equal(JSON.parse(readFileSync(join(run.dir, "manifest.json"), "utf8")).status, "partial")
})
