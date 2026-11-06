import test from "node:test"
import assert from "node:assert/strict"
import { compareRuns, summarizeRun } from "./report.mjs"

const run = (results, meta = {}) => summarizeRun({ results, ...meta })
const r = (n, status, reason = "") => ({ skill: "review-code", case: n, status, reason })

test("a passed case that now fails is a regression", () => {
  const c = compareRuns(run([r(1, "passed"), r(2, "passed")]), run([r(1, "passed"), r(2, "failed", "verdict APPROVE")]))
  assert.equal(c.ok, false)
  assert.deepEqual(c.regressions.map((x) => x.key), ["review-code#2"])
  assert.match(c.regressions[0].reason, /verdict/)
})

test("falling to unscored counts as a regression, not as neutral", () => {
  const c = compareRuns(run([r(1, "passed")]), run([r(1, "unscored", "every repetition contaminated")]))
  assert.equal(c.ok, false)
  assert.equal(c.regressions[0].to, "unscored")
  assert.deepEqual(c.fixes, [])
})

test("failed → unscored is lost evidence, not a fix", () => {
  const c = compareRuns(run([r(1, "failed", "reply")]), run([r(1, "unscored", "every repetition contaminated — read …/skills/x/SKILL.md")]))
  assert.equal(c.ok, false)
  assert.deepEqual(c.fixes, [])
  assert.deepEqual(c.regressions.map((x) => x.key), ["review-code#1"])
  assert.equal(c.regressions[0].from, "failed")
  assert.equal(c.regressions[0].to, "unscored")
  assert.match(c.regressions[0].reason, /contaminated/)
})

test("unscored → failed is not a fix either", () => {
  const c = compareRuns(run([r(1, "unscored")]), run([r(1, "failed", "verdict")]))
  assert.equal(c.ok, false)
  assert.deepEqual(c.fixes, [])
  assert.deepEqual(c.regressions.map((x) => x.key), ["review-code#1"])
})

test("a case that recovered is reported as fixed, not as noise", () => {
  const c = compareRuns(run([r(1, "failed")]), run([r(1, "passed")]))
  assert.equal(c.ok, true)
  assert.deepEqual(c.fixes.map((x) => x.key), ["review-code#1"])
})

test("a case missing from the run is reported, because silence is not a pass", () => {
  const c = compareRuns(run([r(1, "passed"), r(3, "passed")]), run([r(1, "passed")]))
  assert.equal(c.ok, false)
  assert.deepEqual(c.missing.map((x) => x.key), ["review-code#3"])
})

test("a new case is informational", () => {
  const c = compareRuns(run([r(1, "passed")]), run([r(1, "passed"), r(4, "passed")]))
  assert.equal(c.ok, true)
  assert.deepEqual(c.added.map((x) => x.key), ["review-code#4"])
})

test("summarizeRun counts outcomes and drops nothing but the transcript", () => {
  const s = run([r(1, "passed"), r(2, "failed"), r(3, "unscored")], { level: "behavior" })
  assert.deepEqual(s.counts, { passed: 1, failed: 1, unscored: 1, contaminated: 0 })
  assert.equal(s.level, "behavior")
  assert.ok(s.finishedAt)
})

test("summarizeRun reports contaminated repetitions apart and never as failed", () => {
  const s = run([
    r(1, "passed"),
    { ...r(2, "unscored", "every repetition contaminated"), contaminated: true },
    { ...r(3, "failed", "0/1 clean repetitions passed"), contaminated: 2 },
  ])
  assert.deepEqual(s.counts, { passed: 1, failed: 1, unscored: 1, contaminated: 3 })
})

test("a contaminated pass becoming unscored is a regression, not a neutral drop", () => {
  const c = compareRuns(run([r(1, "passed")]), run([r(1, "unscored", "every repetition contaminated — read …/skills/x/SKILL.md")]))
  assert.equal(c.ok, false)
  assert.equal(c.regressions[0].to, "unscored")
  assert.match(c.regressions[0].reason, /contaminated/)
})
