// schedule.mjs — run the draws of every case through one lane pool.
//
// The old runner limited *cases*: `lanes = min(concurrency, cases)`, so
// `--case 1 --repeat 12` ran its twelve draws one after another even though each
// has its own scratch. Here a draw is the unit of work and `concurrency` is the
// number of draws in flight, whether they belong to one case or many.
//
// The artifact must not depend on completion order. A draw gets its index when
// it is scheduled (`r1`, `r2`, …); results are collected into that slot, sorted
// by it at the end, and `sequence` is read in index order. Wall-time jitter then
// changes when a draw finishes, never what the run says.
//
// The stop rule is checked after every completion. Draws already in flight are
// allowed to finish (killing them would cost the same money and lose the
// observation); no *new* draw is scheduled once the rule fires. `stoppedEarly`
// is true only when at least one draw of the case was never scheduled.

export const PASS_KIND = "pass"
export const FAIL_KIND = "fail"
export const CONTAMINATED_KIND = "contaminated"
export const INFRASTRUCTURE_KIND = "infrastructure"
export const UNSCORED_KIND = "unscored"

// `5/3` means five clean passes with zero failures, or three failures. A zero
// failure ceiling disables the failure arm (the documented `5/0` fallback: stop
// only after five clean passes).
export function parseStop(value) {
  if (typeof value !== "string") return null
  const match = /^(\d+)\/(\d+)$/.exec(value.trim())
  if (!match) return null
  const passes = Number(match[1])
  const fails = Number(match[2])
  if (!Number.isInteger(passes) || passes < 1) return null
  if (!Number.isInteger(fails) || fails < 0) return null
  return { passes, fails }
}

export function stopReached({ passes, fails }, stop) {
  if (!stop) return false
  if (stop.fails > 0 && fails >= stop.fails) return true
  return passes >= stop.passes && fails === 0
}

// The observed outcome of one draw, from the artifact's point of view.
// Infrastructure is not behaviour (SPEC-0020 F4): it is its own kind so a stop
// rule cannot count it as a pass or a failure.
export function drawKind(result) {
  if (result?.infrastructure) return INFRASTRUCTURE_KIND
  if (result?.contaminated) return CONTAMINATED_KIND
  if (result?.status === "passed") return PASS_KIND
  if (result?.status === "failed") return FAIL_KIND
  return UNSCORED_KIND
}

const SEQUENCE_KINDS = new Set([PASS_KIND, FAIL_KIND, CONTAMINATED_KIND])

function record(state, index, result) {
  state.results.push({ index, result })
  const kind = drawKind(result)
  state.sequence.push({ index, kind })
  if (kind === PASS_KIND) state.passes++
  else if (kind === FAIL_KIND) state.fails++
  else if (kind === CONTAMINATED_KIND) state.contaminated++
  else if (kind === INFRASTRUCTURE_KIND) state.infrastructure++
  else state.unscored++
}

function finalize(state) {
  const ordered = [...state.results].sort((a, b) => a.index - b.index)
  return {
    item: state.item,
    results: ordered.map((entry) => entry.result),
    indexes: ordered.map((entry) => entry.index),
    // Only behavioural observations belong in the published sequence; an
    // infrastructure draw is recorded in `repetitions` and counted apart.
    sequence: [...state.sequence]
      .sort((a, b) => a.index - b.index)
      .filter((entry) => SEQUENCE_KINDS.has(entry.kind))
      .map((entry) => entry.kind),
    passes: state.passes,
    fails: state.fails,
    contaminated: state.contaminated,
    infrastructure: state.infrastructure,
    unscored: state.unscored,
    ran: ordered.length,
    stoppedEarly: state.stopped && ordered.length < state.item.times,
  }
}

// `cases: [{ ..., times }]`, `runDraw(caseItem & { rep, index })`.
// Resolves to one state per case, in input order, never rejection-mixed with a
// partial artifact: the first thrown error rejects the whole run.
export async function runScheduled({ cases = [], concurrency = 1, runDraw, stop = null }) {
  const limit = Math.max(1, Math.floor(concurrency))
  const states = cases.map((item, ci) => ({
    ci,
    item,
    next: 1,
    results: [],
    sequence: [],
    passes: 0,
    fails: 0,
    contaminated: 0,
    infrastructure: 0,
    unscored: 0,
    stopped: false,
  }))

  return new Promise((resolve, reject) => {
    let active = 0
    let settled = false
    let cursor = 0

    // Round-robin, so a case with twelve draws cannot starve a case with one
    // while occupying every lane. `cursor` advances past the case just picked.
    const pick = () => {
      for (let k = 0; k < states.length; k++) {
        const idx = (cursor + k) % states.length
        const state = states[idx]
        if (state.stopped || state.next > state.item.times) continue
        cursor = (idx + 1) % states.length
        return state
      }
      return null
    }

    const pump = () => {
      if (settled) return
      while (active < limit) {
        const state = pick()
        if (!state) break
        const index = state.next++
        active++
        Promise.resolve()
          .then(() => runDraw({ ...state.item, rep: state.item.times > 1 ? { index } : null, index }))
          .then(
            (result) => {
              active--
              record(state, index, result)
              if (!state.stopped && stopReached(state, stop)) state.stopped = true
              pump()
            },
            (error) => {
              if (settled) return
              settled = true
              reject(error)
            },
          )
      }
      if (active === 0 && !pick()) {
        settled = true
        resolve(states.map(finalize))
      }
    }

    pump()
  })
}
