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
  const c = compareRuns(run([r(1, "passed")]), run([r(1, "unscored")]))
  assert.equal(c.ok, false)
  assert.equal(c.regressions[0].to, "unscored")
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

test("summarizeRun reports contaminated repetitions apart from pass and fail", () => {
  const s = run([
    r(1, "passed"),
    { ...r(2, "failed", "contaminated"), contaminated: true },
    { ...r(3, "failed", "1/2 contaminated"), contaminated: 1, repetitions: [{ status: "failed", contaminated: true }, { status: "passed" }] },
  ])
  assert.deepEqual(s.counts, { passed: 1, failed: 2, contaminated: 2 })
})

test("a contaminated pass becoming a failure is a regression, not a neutral drop", () => {
  const c = compareRuns(run([r(1, "passed")]), run([r(1, "failed", "contaminated — read …/skills/x/SKILL.md")]))
  assert.equal(c.ok, false)
  assert.equal(c.regressions[0].to, "failed")
  assert.match(c.regressions[0].reason, /contaminated/)
})
