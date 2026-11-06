// result.mjs — when a case counts as passed, and why it did not.
//
// The old rule was `exit === 0 && failedAsserts === 0`, which passes a case that
// asserts nothing and never asked whether the skill under review was the skill
// that ran. Unscored is its own outcome on purpose: it must fail the run without
// being mistaken for a behaviour regression.

export const PASSED = "passed"
export const FAILED = "failed"
export const UNSCORED = "unscored"

// A timeout or a stall says nothing about the model's behaviour: the process
// was killed by the harness (or stopped emitting), so the draw is infrastructure.
// It is unscored on purpose — never a pass, never a behavioural failure — and
// `reason` names which one so the checker can report it as incomplete evidence.
const INFRASTRUCTURE_EXITS = new Set(["timeout", "stalled"])

export function infrastructureReason(exit) {
  return INFRASTRUCTURE_EXITS.has(exit) ? `infrastructure: ${exit}` : null
}

export function classify({ exit, asserts, skillGate = null }) {
  const infra = infrastructureReason(exit)
  if (infra) return { status: UNSCORED, reason: infra, infrastructure: true, infrastructureReason: exit }
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
// (so the run is still readable) but is excluded from scoring: `unscored` is the
// harness's existing "not a pass, not a fail" bucket, and no new status is
// invented. `contaminated: true` names the reason; the aggregate reads only the
// clean draws.
export function contaminate(result, leak = [], { all = false } = {}) {
  const paths = [...new Set(leak.map((l) => l.path))]
  const contaminated = paths.length > 0
  const reason = contaminated
    ? `${all ? "every repetition contaminated" : "contaminated"} — read ${paths.join(", ")}${result.reason ? `; ${result.reason}` : ""}`
    : result.reason
  return {
    ...result,
    leak: leak.map(({ tool, path }) => ({ tool, path })),
    contaminated,
    status: contaminated ? UNSCORED : result.status,
    reason,
  }
}

// A case artifact carries either a boolean (single draw) or the count of its
// contaminated repetitions (a repeated case), so the summary reads both. A draw
// that is both infrastructure and contaminated is counted once, as
// infrastructure: the kill happened first and the leak cannot be attributed to a
// behavioural attempt that never finished.
export function contaminatedReps(result) {
  if (typeof result.contaminated === "number") return result.contaminated
  if (result.contaminated === true) return isInfrastructure(result) ? 0 : 1
  return (result.repetitions ?? []).filter((r) => r.contaminated && !isInfrastructure(r)).length
}

// Infrastructure draws are counted like contaminated ones: on the case artifact
// the count is a number, on a single draw it is a boolean, and older artifacts
// carry neither. A draw is infrastructure when it says so or when its unscored
// reason names it (the field was added after the first `stalled` runs).
export function isInfrastructure(result) {
  if (result?.infrastructure === true) return true
  if (typeof result?.infrastructure === "number" && result.infrastructure > 0) return true
  return result?.status === UNSCORED && /^infrastructure:/.test(result?.reason ?? "")
}

export function infrastructureReps(result) {
  if (typeof result.infrastructure === "number") return result.infrastructure
  if (result.infrastructure === true) return 1
  if (Array.isArray(result.repetitions)) return result.repetitions.filter((r) => isInfrastructure(r)).length
  return isInfrastructure(result) ? 1 : 0
}

// A case whose only draws were contaminated is `unscored`, never `failed`; the
// contaminated count is reported apart from the status counts. Infrastructure
// draws get their own count for the same reason: they are incomplete evidence,
// not behaviour. A mixed case takes the status of its clean draws (see
// `aggregateReps`), so `failed` always means the clean evidence failed.
export function summarize(results) {
  const count = { passed: 0, failed: 0, unscored: 0, contaminated: 0, infrastructure: 0 }
  for (const r of results) count[r.status] = (count[r.status] ?? 0) + 1
  count.contaminated = results.reduce((n, r) => n + contaminatedReps(r), 0)
  count.infrastructure = results.reduce((n, r) => n + infrastructureReps(r), 0)
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
// when every clean repetition passed, so a flake is visible instead of averaged
// away. A contaminated repetition is not evidence either way: it is removed from
// both the numerator and the denominator (`passed / (total − contaminated −
// infrastructure)`), and a case with no clean draw is `unscored`, never `failed`.
// Infrastructure draws follow the same denominator rule with their own count: a
// timeout is incomplete evidence, not a failed draw. The path that leaked is
// still named.
export function aggregateReps(reps, minPass = 1) {
  const total = reps.length
  const isInfraRep = (r) => isInfrastructure(r)
  const infrastructure = reps.filter(isInfraRep).length
  // Same precedence as `contaminatedReps`: infrastructure first, so a draw that
  // both stalled and leaked is counted once.
  const contaminated = reps.filter((r) => !isInfraRep(r) && r.contaminated).length
  const cleanReps = reps.filter((r) => !r.contaminated && !isInfraRep(r))
  const clean = cleanReps.length
  const passed = cleanReps.filter((r) => r.status === PASSED).length
  const unscored = cleanReps.filter((r) => r.status === UNSCORED).length
  const passRate = clean ? passed / clean : 0
  const failedReason = cleanReps.find((r) => r.status === FAILED)?.reason ?? ""
  const leaked = [...new Set(reps.flatMap((r) => (r.leak ?? []).map((l) => l.path)))]
  const contamination = contaminated
    ? `${contaminated}/${total} repetition(s) contaminated${leaked.length ? ` (${leaked.join(", ")})` : ""}`
    : ""
  const infra = infrastructure ? `${infrastructure}/${total} repetition(s) infrastructure` : ""

  if (total && clean === 0) {
    const reason =
      contaminated === total
        ? `every repetition contaminated${leaked.length ? ` (${leaked.join(", ")})` : ""}`
        : infrastructure === total
          ? "every repetition infrastructure — incomplete evidence"
          : "no clean repetition — every draw was contaminated or infrastructure"
    return { status: UNSCORED, passRate: 0, passed: 0, total, contaminated, infrastructure, reason }
  }
  if (clean && unscored === clean) {
    return {
      status: UNSCORED,
      passRate,
      passed,
      total,
      contaminated,
      infrastructure,
      reason: ["no repetition was scored", contamination, infra].filter(Boolean).join("; "),
    }
  }
  if (passRate >= minPass) {
    return {
      status: PASSED,
      passRate,
      passed,
      total,
      contaminated,
      infrastructure,
      reason: [passed === clean ? "" : `${passed}/${clean} repetitions passed (min ${minPass})`, contamination, infra]
        .filter(Boolean)
        .join("; "),
    }
  }
  return {
    status: FAILED,
    passRate,
    passed,
    total,
    contaminated,
    infrastructure,
    reason: [`${passed}/${clean} repetitions passed (min ${minPass})${failedReason ? `: ${failedReason}` : ""}`, contamination, infra]
      .filter(Boolean)
      .join("; "),
  }
}
