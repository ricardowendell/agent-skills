// health.mjs — the per-release health report, folded over stored artefacts.
//
// One command has to answer "is the harness getting slower, dirtier or more
// expensive than the last release?". The answer is already in the artefacts:
// eval run manifests and case results, plus `.pdlc/runs.json`. There is no
// clock and no I/O here: the CLI reads, this module counts, and two reads of
// the same store must render the same text.
//
// Two case shapes are first-class:
//   - repeated: `repetitions[]` is the array of draws; the case-level
//     `passed`/`contaminated`/`infrastructure` fields are clean aggregates.
//   - single: one draw at the top level, discriminated by `execution`.
// An artefact that is neither, or a run without a manifest, is `unreadable`:
// it is named, never skipped in silence and never allowed to abort the report.

import { contaminatedReps, infrastructureReps } from "./result.mjs"
import { checkRun } from "./runcheck.mjs"

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value)

const count = (value) => (typeof value === "number" && Number.isFinite(value) ? value : 0)

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

const byId = (a, b) => compare(String(a?.id ?? ""), String(b?.id ?? ""))

// Infrastructure first, the same precedence `result.mjs` uses: a draw that
// stalled and leaked is counted once, as infrastructure, because the kill
// happened before any behaviour could be attributed to it.
function isInfrastructure(draw) {
  if (!isObject(draw)) return false
  if (draw.infrastructure === true) return true
  if (count(draw.infrastructure) > 0) return true
  return draw.status === "unscored" && /^infrastructure:/.test(String(draw.reason ?? ""))
}

function isContaminated(draw) {
  if (!isObject(draw)) return false
  if (draw.contaminated === true) return true
  return count(draw.contaminated) > 0
}

// Provenance is complete only when all three travel together. A run from before
// SPEC-0020 carries some or none of them; that is history, not comparable
// evidence, and it must not inflate the "complete" count.
function hasFullProvenance(draw) {
  return ["fixtureHash", "promptHash", "detectorVersion"].every(
    (key) => typeof draw?.[key] === "string" && draw[key].length > 0,
  )
}

// `execute` writes a non-empty `semantic.reason` when the judge failed the draw,
// and an empty string when it passed. Older or hand-built artefacts may only
// carry a score, so the threshold is the fallback.
function judgeFailed(semantic) {
  if (!isObject(semantic)) return false
  if (typeof semantic.reason === "string" && semantic.reason.trim()) return true
  return (
    typeof semantic.score === "number" &&
    typeof semantic.threshold === "number" &&
    semantic.score + 1e-9 < semantic.threshold
  )
}

function outcome(status) {
  return status === "passed" || status === "failed" || status === "unscored" || status === "staged"
    ? status
    : "unscored"
}

function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function evalHealth({ runs = [], unreadable = [] } = {}) {
  const report = {
    runs: 0,
    unfinishedRuns: 0,
    unfinishedDraws: 0,
    cases: 0,
    draws: 0,
    shapes: { single: 0, repeated: 0 },
    passed: 0,
    failed: 0,
    unscored: 0,
    staged: 0,
    contaminated: 0,
    infrastructure: 0,
    eligibleDraws: 0,
    rateDenominator: 0,
    rate: null,
    gateMisses: 0,
    strict: { draws: 0, passed: 0, failed: 0, unscored: 0, staged: 0, rate: null },
    wallSeconds: 0,
    drawSeconds: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 },
    steps: 0,
    toolCalls: 0,
    judge: { runs: 0, failures: 0, deterministicPassJudgeFail: 0 },
    provenance: { complete: 0, partial: 0 },
    unreadable: [...unreadable],
  }

  let wallMs = 0
  let drawMs = 0

  for (const run of [...runs].sort(byId)) {
    if (!isObject(run) || run.error || !isObject(run.manifest)) {
      report.unreadable.push({
        id: String(run?.id ?? "?"),
        path: String(run?.dir ?? ""),
        reason: String(run?.error ?? "missing manifest.json"),
      })
      continue
    }

    report.runs++
    const completed = run.manifest.status === "completed"
    if (!completed) {
      // An unfinished run is work in flight, not evidence: it is named and its
      // draws stay out of both rates, and its (zero) wall time is not summed as
      // if the run had closed.
      report.unfinishedRuns++
    } else {
      const started = Date.parse(run.manifest.startedAt)
      const finished = Date.parse(run.manifest.finishedAt)
      if (Number.isFinite(started) && Number.isFinite(finished) && finished >= started) {
        wallMs += finished - started
      }
    }

    // One `checkRun` per completed run, as the checker does. Strictness is a
    // property of the draw, not of the whole run: a single gate miss must not
    // throw away every other draw in the same matrix.
    const findings = new Map()
    if (completed) {
      const readable = (run.cases ?? []).filter((c) => isObject(c) && isObject(c.result)).map((c) => c.result)
      for (const finding of checkRun({ arm: run.manifest.arm ?? null, cases: readable }).findings) {
        const key = `${finding.case}#${finding.rep}`
        findings.set(key, [...(findings.get(key) ?? []), finding.kind])
      }
    }

    for (const c of [...(run.cases ?? [])].sort(byId)) {
      if (!isObject(c) || c.error || !isObject(c.result)) {
        report.unreadable.push({
          id: `${run.id}/${c?.id ?? "?"}`,
          path: String(c?.dir ?? ""),
          reason: String(c?.error ?? "unreadable result.json"),
        })
        continue
      }

      const result = c.result
      const repeated = Array.isArray(result.repetitions)
      if (!repeated && !Object.prototype.hasOwnProperty.call(result, "execution")) {
        report.unreadable.push({
          id: `${run.id}/${c.id}`,
          path: String(c.dir ?? ""),
          reason: "neither repetitions nor execution",
        })
        continue
      }

      report.cases++
      if (repeated) report.shapes.repeated++
      else report.shapes.single++

      const draws = repeated ? result.repetitions : [result]
      report.draws += draws.length
      if (!completed) report.unfinishedDraws += draws.length

      const buckets = { passed: 0, failed: 0, unscored: 0, staged: 0 }
      let perContaminated = 0
      let perInfrastructure = 0

      for (let i = 0; i < draws.length; i++) {
        const draw = draws[i]
        if (!isObject(draw)) {
          report.unreadable.push({
            id: `${run.id}/${c.id}`,
            path: String(c.dir ?? ""),
            reason: "draw is not an object",
          })
          continue
        }

        const execution = isObject(draw.execution) ? draw.execution : {}
        drawMs += count(execution.durationMs)
        report.steps += count(execution.steps)
        report.toolCalls += count(execution.toolCalls)
        if (isObject(execution.tokens)) {
          for (const key of ["input", "output", "reasoning", "cacheRead", "cacheWrite"]) {
            report.tokens[key] += count(execution.tokens[key])
          }
        }

        if (isObject(draw.semantic)) {
          report.judge.runs++
          if (judgeFailed(draw.semantic)) {
            report.judge.failures++
            // The judge may only fail a draw that passed deterministically; that
            // subset is the one a skill author has to look at.
            const assertions = Array.isArray(draw.assertions) ? draw.assertions : []
            const gateOk = !isObject(draw.skillGate) || draw.skillGate.ok !== false
            const deterministicPass =
              assertions.length > 0 && assertions.every((a) => isObject(a) && a.pass === true) && gateOk
            if (deterministicPass && draw.status === "failed") report.judge.deterministicPassJudgeFail++
          }
        }

        // Everything below is evidence about a completed run. Usage and judge
        // counts stay raw; eligibility and strictness do not.
        if (!completed) continue

        if (hasFullProvenance(draw)) report.provenance.complete++
        else report.provenance.partial++

        const key = `${result.skill ?? "unknown"}#${result.case ?? "?"}#${draw.rep ?? draw.index ?? i + 1}`
        const drawFindings = findings.get(key) ?? []
        if (hasFullProvenance(draw) && drawFindings.length === 0) {
          report.strict.draws++
          if (draw.status === "passed") report.strict.passed++
          else if (draw.status === "failed") report.strict.failed++
          else if (draw.status === "unscored") report.strict.unscored++
          else if (draw.status === "staged") report.strict.staged++
        }

        // A dirty draw is excluded from the eligible buckets and counted apart.
        // Infrastructure wins over contamination, as in `result.mjs`.
        if (isInfrastructure(draw)) {
          perInfrastructure++
        } else if (isContaminated(draw)) {
          perContaminated++
        } else {
          buckets[outcome(draw.status)]++
          const arm = run.manifest.arm ?? draw.arm ?? null
          if (arm === "with-skill" && isObject(draw.skillGate) && draw.skillGate.ok !== true) {
            report.gateMisses++
          }
        }
      }

      if (!completed) continue

      // The case aggregate is authoritative for repeated cases. Older artefacts
      // (and hand-built fixtures) may carry only the counts and not the
      // per-draw flags; the excess is removed from the eligible buckets,
      // preferring the statuses a dirty draw is written with.
      const contaminated = Math.max(perContaminated, contaminatedReps(result))
      const infrastructure = Math.max(perInfrastructure, infrastructureReps(result))
      const excess = [
        Math.max(0, infrastructure - perInfrastructure),
        Math.max(0, contaminated - perContaminated),
      ]
      for (const n of excess) {
        let left = n
        for (const bucket of ["unscored", "failed", "passed", "staged"]) {
          const take = Math.min(left, buckets[bucket])
          buckets[bucket] -= take
          left -= take
          if (!left) break
        }
      }

      report.contaminated += contaminated
      report.infrastructure += infrastructure
      report.eligibleDraws += Math.max(0, draws.length - contaminated - infrastructure)
      report.passed += buckets.passed
      report.failed += buckets.failed
      report.unscored += buckets.unscored
      report.staged += buckets.staged
      report.rateDenominator += buckets.passed + buckets.failed + buckets.unscored
    }
  }

  // The eligible rate is the broad trend: clean of leaks and infrastructure,
  // including draws whose provenance is partial. Staged smoke draws are never
  // scored, so they stay out of the denominator. The strict rate is the one
  // `coverage.md` can compare: completed run, full provenance, no finding.
  report.rate = report.rateDenominator ? report.passed / report.rateDenominator : null
  const strictDenominator = report.strict.passed + report.strict.failed + report.strict.unscored
  report.strict.rate = strictDenominator ? report.strict.passed / strictDenominator : null
  report.wallSeconds = Math.round(wallMs / 1000)
  report.drawSeconds = Math.round(drawMs / 1000)
  report.unreadable.sort((a, b) => byId(a, b) || compare(String(a.path), String(b.path)))
  return report
}

function durationSeconds(record) {
  if (!isObject(record)) return null
  if (typeof record.duration === "number" && Number.isFinite(record.duration)) return record.duration
  const started = Date.parse(record.started_at ?? record.startedAt)
  const finished = Date.parse(record.finished_at ?? record.finishedAt)
  if (Number.isFinite(started) && Number.isFinite(finished) && finished >= started) {
    return (finished - started) / 1000
  }
  return null
}

export function pdlcHealth({ runs = {}, error = null, path = "" } = {}) {
  const entries = Array.isArray(runs)
    ? runs.map((record, i) => [String(record?.run_id ?? record?.runId ?? i), record])
    : isObject(runs)
      ? Object.entries(runs)
      : []

  const report = {
    runs: 0,
    byStatus: {},
    retries: 0,
    gateFailures: 0,
    failedGates: [],
    medianDurationSeconds: null,
    durations: 0,
    unreadable: [],
  }

  if (error) {
    report.unreadable.push({ id: "pdlc", path: String(path), reason: String(error) })
    return report
  }

  const durations = []
  for (const [id, record] of entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    report.runs++
    const status = typeof record?.status === "string" ? record.status : "unknown"
    report.byStatus[status] = (report.byStatus[status] ?? 0) + 1

    if (count(record?.attempts) > 1) report.retries++

    const gates = Array.isArray(record?.gates) ? record.gates : []
    const red = gates.filter((gate) => gate && gate.ok === false)
    if (red.length) {
      report.gateFailures++
      for (const gate of red) {
        report.failedGates.push({ id, name: String(gate.name ?? "?"), exit: gate.exit ?? null })
      }
    }

    const duration = durationSeconds(record)
    if (duration !== null) durations.push(duration)
  }

  report.failedGates.sort((a, b) => byId(a, b) || compare(String(a.name), String(b.name)))
  report.durations = durations.length
  const middle = median(durations)
  report.medianDurationSeconds = middle === null ? null : Math.round(middle)
  return report
}

function formatCount(value) {
  return String(count(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function formatSeconds(seconds) {
  if (seconds === null || seconds === undefined) return "n/a"
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = total % 60
  if (hours) return `${hours}h ${minutes}m ${rest}s`
  if (minutes) return `${minutes}m ${rest}s`
  return `${rest}s`
}

function formatRate(rate) {
  return rate === null ? "n/a" : `${(rate * 100).toFixed(1)}%`
}

function table(rows) {
  return ["| Metric | Value |", "| --- | --- |", ...rows.map(([name, value]) => `| ${name} | ${value} |`)]
}

export function renderMarkdown(report) {
  const evals = report.evals
  const pdlc = report.pdlc
  const lines = [
    "# Harness health",
    "",
    "Read-only report over stored eval artefacts and pdlc run records. It spends",
    "no model and writes nothing.",
    "",
    "## Evals",
    "",
    ...table([
      ["Runs", formatCount(evals.runs)],
      ["Unfinished runs", formatCount(evals.unfinishedRuns)],
      ["Cases", formatCount(evals.cases)],
      ["Shapes", `${formatCount(evals.shapes.single)} single, ${formatCount(evals.shapes.repeated)} repeated`],
      ["Draws", formatCount(evals.draws)],
      ["Unfinished draws", formatCount(evals.unfinishedDraws)],
      ["Passed (eligible)", formatCount(evals.passed)],
      ["Failed (eligible)", formatCount(evals.failed)],
      ["Unscored (eligible)", formatCount(evals.unscored)],
      ["Staged (eligible)", formatCount(evals.staged)],
      ["Contaminated", formatCount(evals.contaminated)],
      ["Infrastructure", formatCount(evals.infrastructure)],
      ["Eligible draws (not contaminated, not infrastructure)", formatCount(evals.eligibleDraws)],
      ["Rate denominator (eligible, non-staged)", formatCount(evals.rateDenominator)],
      ["Pass rate (eligible, non-staged)", formatRate(evals.rate)],
      ["Gate misses (eligible)", formatCount(evals.gateMisses)],
      ["Strict clean draws", formatCount(evals.strict.draws)],
      ["Strict passed / failed", `${formatCount(evals.strict.passed)} / ${formatCount(evals.strict.failed)}`],
      ["Strict pass rate", formatRate(evals.strict.rate)],
      ["Wall time", formatSeconds(evals.wallSeconds)],
      ["Sum of draw durations", formatSeconds(evals.drawSeconds)],
      [
        "Tokens (in / out / reasoning)",
        `${formatCount(evals.tokens.input)} / ${formatCount(evals.tokens.output)} / ${formatCount(evals.tokens.reasoning)}`,
      ],
      ["Cache (read / write)", `${formatCount(evals.tokens.cacheRead)} / ${formatCount(evals.tokens.cacheWrite)}`],
      ["Steps", formatCount(evals.steps)],
      ["Tool calls", formatCount(evals.toolCalls)],
      ["Judge runs", formatCount(evals.judge.runs)],
      ["Judge failures", formatCount(evals.judge.failures)],
      ["Deterministic pass, judge fail", formatCount(evals.judge.deterministicPassJudgeFail)],
      [
        "Provenance (completed draws)",
        `${formatCount(evals.provenance.complete)} complete, ${formatCount(evals.provenance.partial)} partial`,
      ],
    ]),
    "",
    "### Unreadable eval artefacts",
    "",
  ]

  if (!evals.unreadable.length) {
    lines.push("None.")
  } else {
    // The id is the run directory plus the case directory, which is enough to
    // find it in the store and keeps the published table machine-independent.
    for (const entry of evals.unreadable) {
      lines.push(`- \`${entry.id}\`: ${entry.reason}`)
    }
  }

  lines.push("", "## pdlc", "")

  if (pdlc.unreadable.length) {
    lines.push("### Unreadable pdlc file", "")
    for (const entry of pdlc.unreadable) {
      lines.push(`- \`${entry.path || entry.id}\`: ${entry.reason}`)
    }
  } else {
    const rows = [["Runs", formatCount(pdlc.runs)]]
    for (const status of Object.keys(pdlc.byStatus).sort()) {
      rows.push([status, formatCount(pdlc.byStatus[status])])
    }
    rows.push(
      ["Retries (attempts > 1)", formatCount(pdlc.retries)],
      ["Runs with a red gate", formatCount(pdlc.gateFailures)],
      ["Median duration", formatSeconds(pdlc.medianDurationSeconds)],
    )
    lines.push(...table(rows))
    if (pdlc.failedGates.length) {
      lines.push("", "### Red gates", "")
      for (const gate of pdlc.failedGates) {
        lines.push(`- \`${gate.id}\` — ${gate.name}${gate.exit === null ? "" : ` (exit ${gate.exit})`}`)
      }
    }
  }

  lines.push("")
  return `${lines.join("\n")}\n`
}
