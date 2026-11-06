// result.mjs — when a case counts as passed, and why it did not.
//
// The old rule was `exit === 0 && failedAsserts === 0`, which passes a case that
// asserts nothing and never asked whether the skill under review was the skill
// that ran. Unscored is its own outcome on purpose: it must fail the run without
// being mistaken for a behaviour regression.

export const PASSED = "passed"
export const FAILED = "failed"
export const UNSCORED = "unscored"

export function classify({ exit, asserts, skillGate = null }) {
  if (exit !== 0) return { status: FAILED, reason: `exit ${exit}` }
  if (!asserts.length) return { status: UNSCORED, reason: "no assertions — nothing was checked" }
  const failed = asserts.filter((a) => !a.pass)
  if (failed.length) {
    return {
      status: FAILED,
      reason: `${failed.length}/${asserts.length} assertion(s) failed: ${failed.map((a) => `${a.kind} ${a.arg}`).join(", ")}`,
    }
  }
  if (skillGate && !skillGate.ok) return { status: FAILED, reason: skillGate.reason }
  return { status: PASSED, reason: "" }
}

// A repetition that read an installed skill or the eval corpus is not evidence
// about the skill under test, whichever arm it ran in. It keeps its assertions
// (so the run is still readable) but its status becomes `failed` — never a new
// status, because every aggregator, baseline and comparison already knows what
// `failed` means, and the contamination is the field that names the reason.
export function contaminate(result, leak = []) {
  const paths = [...new Set(leak.map((l) => l.path))]
  const contaminated = paths.length > 0
  const reason = contaminated
    ? `contaminated — read ${paths.join(", ")}${result.reason ? `; ${result.reason}` : ""}`
    : result.reason
  return {
    ...result,
    leak: leak.map(({ tool, path }) => ({ tool, path })),
    contaminated,
    status: contaminated ? FAILED : result.status,
    reason,
  }
}

// A case artifact carries either a boolean (single draw) or the count of its
// contaminated repetitions (a repeated case), so the summary reads both.
export function contaminatedReps(result) {
  if (typeof result.contaminated === "number") return result.contaminated
  if (result.contaminated === true) return 1
  return (result.repetitions ?? []).filter((r) => r.contaminated).length
}

export function summarize(results) {
  const count = { passed: 0, failed: 0, unscored: 0, contaminated: 0 }
  for (const r of results) count[r.status] = (count[r.status] ?? 0) + 1
  count.contaminated = results.reduce((n, r) => n + contaminatedReps(r), 0)
  return { ...count, total: results.length }
}

// The per-case artifact the console, the JSON file and the replay tool read.
// Built here once: three hand-built copies in the runner had already drifted.
export function caseResult(skill, c, fields = {}) {
  return {
    skill: skill.id,
    case: c.n,
    title: c.title,
    prompt: c.prompt,
    ...fields,
  }
}

// A single run of a non-deterministic agent is one draw, not a measurement.
// Repetitions turn it into a pass rate; the case still passes by default only
// when every repetition passed, so a flake is visible instead of averaged away.
// A contaminated repetition never counts as a pass: it stays in the denominator
// (the published rate is `passed/total`, not `passed/clean`) and is reported
// apart from failures, with the path that leaked.
export function aggregateReps(reps, minPass = 1) {
  const total = reps.length
  const contaminated = reps.filter((r) => r.contaminated).length
  const passed = reps.filter((r) => r.status === PASSED && !r.contaminated).length
  const unscored = reps.filter((r) => r.status === UNSCORED).length
  const passRate = total ? passed / total : 0
  const failedReason = reps.find((r) => r.status === FAILED && !r.contaminated)?.reason ?? ""
  const leaked = [...new Set(reps.flatMap((r) => (r.leak ?? []).map((l) => l.path)))]
  const contamination = contaminated
    ? `${contaminated}/${total} repetition(s) contaminated${leaked.length ? ` (${leaked.join(", ")})` : ""}`
    : ""

  if (total && contaminated === total) {
    return { status: FAILED, passRate, passed, total, contaminated, reason: contamination }
  }
  if (total && unscored === total) return { status: UNSCORED, passRate, passed, total, contaminated, reason: "no repetition was scored" }
  if (passRate >= minPass) {
    return {
      status: PASSED,
      passRate,
      passed,
      total,
      contaminated,
      reason: [passed === total ? "" : `${passed}/${total} repetitions passed (min ${minPass})`, contamination].filter(Boolean).join("; "),
    }
  }
  return {
    status: FAILED,
    passRate,
    passed,
    total,
    contaminated,
    reason: [`${passed}/${total} repetitions passed (min ${minPass})${failedReason ? `: ${failedReason}` : ""}`, contamination]
      .filter(Boolean)
      .join("; "),
  }
}
