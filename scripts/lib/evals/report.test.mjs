import test from "node:test"
import assert from "node:assert/strict"
import { armScore, compareRuns, drawLabel, formatDuration, formatFailures, formatTokens, scorecard, summarizeRun } from "./report.mjs"

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
  assert.deepEqual(s.counts, { passed: 1, failed: 1, unscored: 1, contaminated: 0, infrastructure: 0 })
  assert.equal(s.level, "behavior")
  assert.ok(s.finishedAt)
})

test("summarizeRun reports contaminated repetitions apart and never as failed", () => {
  const s = run([
    r(1, "passed"),
    { ...r(2, "unscored", "every repetition contaminated"), contaminated: true },
    { ...r(3, "failed", "0/1 clean repetitions passed"), contaminated: 2 },
  ])
  assert.deepEqual(s.counts, { passed: 1, failed: 1, unscored: 1, contaminated: 3, infrastructure: 0 })
})

test("summarizeRun counts infrastructure draws apart and never as failed", () => {
  const s = run([
    r(1, "passed"),
    { ...r(2, "unscored", "infrastructure: timeout"), infrastructure: true },
  ])
  assert.deepEqual(s.counts, { passed: 1, unscored: 1, contaminated: 0, infrastructure: 1 })
})

test("a contaminated pass becoming unscored is a regression, not a neutral drop", () => {
  const c = compareRuns(run([r(1, "passed")]), run([r(1, "unscored", "every repetition contaminated — read …/skills/x/SKILL.md")]))
  assert.equal(c.ok, false)
  assert.equal(c.regressions[0].to, "unscored")
  assert.match(c.regressions[0].reason, /contaminated/)
})

// The draw ladder is a label, not a promise: 1–3 draws point at a direction and
// 5+ may be published. Four is still screening.
test("the scorecard labels 1–3 draws screening and 5+ evidence", () => {
  assert.equal(drawLabel(1), "screening")
  assert.equal(drawLabel(3), "screening")
  assert.equal(drawLabel(4), "screening")
  assert.equal(drawLabel(5), "evidence")
  assert.equal(drawLabel(12), "evidence")
})

const repeated = (skill, n, statuses) => ({
  skill,
  case: n,
  status: statuses.filter((s) => s === "passed").length === statuses.length ? "passed" : "failed",
  reps: statuses.length,
  passed: statuses.filter((s) => s === "passed").length,
  repetitions: statuses.map((status, i) => ({
    rep: i + 1,
    status,
    reason: status === "failed" ? "verdict REJECT" : "",
    assertions: [{ kind: "verdict", arg: "REJECT", pass: status === "passed" }],
    execution: { durationMs: 100000 + i * 1000, tokens: { input: 1000, output: 200 } },
  })),
})

test("armScore prints numerator and denominator over the clean draws", () => {
  const score = armScore(repeated("review-code", 7, ["passed", "passed", "failed"]))
  assert.deepEqual(score.valid, [3, 3])
  assert.deepEqual(score.passed, [2, 3])
  assert.equal(score.status, "failed")
  assert.equal(score.tokens, 1200)
})

test("a contaminated or infrastructure draw is excluded from both sides", () => {
  const result = repeated("review-code", 7, ["passed", "passed", "passed"])
  result.repetitions[1].contaminated = true
  result.repetitions[2].infrastructure = true
  const score = armScore(result)
  assert.deepEqual(score.valid, [1, 3])
  assert.deepEqual(score.passed, [1, 1])
  assert.equal(score.status, "passed")
})

test("the scorecard is one screen with both arms and the movement", () => {
  const none = armScore(repeated("review-code", 7, ["failed", "failed"]))
  const candidate = armScore(repeated("review-code", 7, ["passed", "passed"]))
  const text = scorecard({
    skill: "review-code",
    n: 7,
    model: "agentworks/deepseek-v4-1-flash",
    repeat: 5,
    arms: [
      { arm: "none", score: none },
      { arm: "candidate", score: candidate },
    ],
  })
  const lines = text.split("\n")
  assert.equal(lines.length, 4, text)
  assert.match(lines[0], /review-code #7\s+agentworks\/deepseek-v4-1-flash\s+evidence \(5\/arm\)/)
  assert.match(lines[1], /arm\s+valid\s+passed\s+tokens\s+median\s+result/)
  assert.match(lines[2], /none\s+2\/2\s+0\/2/)
  assert.match(lines[3], /candidate\s+2\/2\s+2\/2/)
  assert.match(lines[3], /-> improves/)
})

test("a skipped arm shows a dash instead of inventing a number", () => {
  const score = armScore({ skill: "x", case: 1, status: "staged", assertions: [] })
  assert.equal(formatTokens(score.tokens), "0")
  assert.equal(formatDuration(score.durationMs), "—")
  assert.equal(formatTokens(null), "—")
  assert.equal(formatTokens(61200), "61.2k")
  assert.equal(formatDuration(112000), "112s")
  assert.equal(formatDuration(650000), "10.8m")
})

test("verbose failures name the draw and the assertion", () => {
  const score = armScore(repeated("review-code", 7, ["passed", "failed"]))
  const text = formatFailures([{ arm: "none", score }])
  assert.match(text, /none r2: failed — verdict REJECT/)
})
