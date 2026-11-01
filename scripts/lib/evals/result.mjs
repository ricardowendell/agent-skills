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

export function summarize(results) {
  const count = { passed: 0, failed: 0, unscored: 0 }
  for (const r of results) count[r.status] = (count[r.status] ?? 0) + 1
  return { ...count, total: results.length }
}

// A single run of a non-deterministic agent is one draw, not a measurement.
// Repetitions turn it into a pass rate; the case still passes by default only
// when every repetition passed, so a flake is visible instead of averaged away.
export function aggregateReps(reps, minPass = 1) {
  const total = reps.length
  const passed = reps.filter((r) => r.status === PASSED).length
  const unscored = reps.filter((r) => r.status === UNSCORED).length
  const passRate = total ? passed / total : 0
  const failedReason = reps.find((r) => r.status === FAILED)?.reason ?? ""

  if (total && unscored === total) return { status: UNSCORED, passRate, passed, total, reason: "no repetition was scored" }
  if (passRate >= minPass) {
    return {
      status: PASSED,
      passRate,
      passed,
      total,
      reason: passed === total ? "" : `${passed}/${total} repetitions passed (min ${minPass})`,
    }
  }
  return {
    status: FAILED,
    passRate,
    passed,
    total,
    reason: `${passed}/${total} repetitions passed (min ${minPass})${failedReason ? `: ${failedReason}` : ""}`,
  }
}
