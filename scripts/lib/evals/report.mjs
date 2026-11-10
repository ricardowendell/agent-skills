// report.mjs — the run artifact and the comparison against a stored baseline.
//
// A run writes one JSON per case plus a summary. Comparing two summaries is what
// turns "today's suite is green" into "this change did not regress the skill":
// a case that moved from passed to failed is a regression even when the totals
// look similar, and a case that moved the other way is worth naming too.

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { basename, join } from "node:path"
import { contaminatedReps, infrastructureReps, isInfrastructure } from "./result.mjs"
import { corpusDir, parseCases } from "./parse.mjs"
import { listRuns } from "./runs.mjs"

export const key = (r) => `${r.skill}#${r.case}`

// `counts.contaminated` is a repetition count, not a case count: a case that was
// re-run five times can have one contaminated draw without changing its verdict.
// A contaminated draw is `unscored` (or excluded from the clean denominator),
// never folded into `failed`; the case status comes from the clean draws only.
export function summarizeRun({ results, ...meta }) {
  const counts = results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {})
  return {
    ...meta,
    finishedAt: new Date().toISOString(),
    counts: {
      ...counts,
      contaminated: results.reduce((n, r) => n + contaminatedReps(r), 0),
      infrastructure: results.reduce((n, r) => n + infrastructureReps(r), 0),
    },
    results: results.map(({ transcript, ...rest }) => rest),
  }
}

// Regressions are strict on purpose: `unscored` is not a pass, a case that
// disappeared from the run is reported as missing, and only a transition into
// `passed` is a fix. A failure that becomes `unscored` lost its evidence (a
// contaminated re-run lands there); it is not an improvement.
export function compareRuns(baseline, current) {
  const before = new Map((baseline.results ?? []).map((r) => [key(r), r]))
  const after = new Map((current.results ?? []).map((r) => [key(r), r]))
  const regressions = []
  const fixes = []
  const added = []
  const missing = []

  for (const [k, now] of after) {
    const was = before.get(k)
    if (!was) {
      added.push({ key: k, status: now.status })
      continue
    }
    if (was.status === now.status) continue
    if (now.status === "passed") fixes.push({ key: k, from: was.status, to: now.status })
    else regressions.push({ key: k, from: was.status, to: now.status, reason: now.reason })
  }
  for (const k of before.keys()) if (!after.has(k)) missing.push({ key: k, status: before.get(k).status })

  return { regressions, fixes, added, missing, ok: regressions.length === 0 && missing.length === 0 }
}

export function formatComparison({ regressions, fixes, added, missing, ok }, baselinePath) {
  const lines = [`Baseline: ${baselinePath}`]
  for (const r of regressions) lines.push(`  REGRESSION ${r.key}: ${r.from} → ${r.to}${r.reason ? ` (${r.reason})` : ""}`)
  for (const f of fixes) lines.push(`  fixed      ${f.key}: ${f.from} → ${f.to}`)
  for (const a of added) lines.push(`  new        ${a.key}: ${a.status}`)
  for (const m of missing) lines.push(`  missing    ${m.key}: was ${m.status}, not run now`)
  if (ok) lines.push("  no regressions")
  return lines.join("\n")
}

// A whole run directory as the comparison expects it: the manifest's provenance
// plus every stored case result. `summary.json` is the manifest, not a run
// summary, so the results are read from `cases/*/result.json` instead.
export function readRunDir(dir) {
  const manifest = readManifest(dir)
  const casesDir = join(dir, "cases")
  const results = []
  if (existsSync(casesDir)) {
    for (const entry of readdirSync(casesDir).sort()) {
      const file = join(casesDir, entry, "result.json")
      if (!existsSync(file)) continue
      try {
        results.push(JSON.parse(readFileSync(file, "utf8")))
      } catch {}
    }
  }
  return { ...(manifest ?? {}), results }
}

// The draw ladder is a label, not a threshold: 1–3 draws point at a direction,
// 5+ may be published. Four is still screening — the promotion is explicit
// (`--repeat 5`), never an accident of rounding.
export function drawLabel(repeat) {
  return repeat >= 5 ? "evidence" : "screening"
}

// A case artifact carries either one draw or a `repetitions` array. The
// scorecard reads both without a second shape.
export function drawsOf(result) {
  if (!result) return []
  return Array.isArray(result.repetitions) ? result.repetitions : [result]
}

// The five token counters the stream reports. Cache reads count: the scorecard
// is a cost proxy, not a billing statement.
function tokenTotal(draw) {
  const t = draw?.execution?.tokens ?? {}
  return ["input", "output", "reasoning", "cacheRead", "cacheWrite"].reduce((n, key) => n + (Number(t[key]) || 0), 0)
}

function median(values) {
  const clean = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
  if (!clean.length) return null
  const mid = Math.floor(clean.length / 2)
  return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2
}

// One arm of the scorecard. `valid` is the clean denominator the published rate
// uses, `passed` the numerator over it, and the result is the arm's verdict from
// its clean draws only — a contaminated or infrastructure draw is neither.
export function armScore(result) {
  const draws = drawsOf(result).filter(Boolean)
  const clean = draws.filter((draw) => !draw.contaminated && !isInfrastructure(draw))
  const passed = clean.filter((draw) => draw.status === "passed").length
  const status = !clean.length ? "unscored" : passed === clean.length ? "passed" : "failed"
  return {
    valid: [clean.length, draws.length],
    passed: [passed, clean.length],
    tokens: median(clean.map(tokenTotal)),
    durationMs: median(clean.map((draw) => draw?.execution?.durationMs)),
    status,
    draws,
  }
}

export function formatTokens(n) {
  if (!Number.isFinite(n)) return "—"
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(Math.round(n))
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms)) return "—"
  if (ms >= 600000) return `${(ms / 60000).toFixed(1)}m`
  return `${Math.round(ms / 1000)}s`
}

// Movement is read against the first arm (`none`), so the reader sees whether the
// skill moved the rate rather than only where each arm landed. It compares
// rates, not numerators: `5/5` and `4/4` are both 100% and a raw numerator would
// call the smaller denominator a regression. A zero denominator is unknown, not
// a win, so it produces no claim either way.
function passRate(score) {
  const [passed, clean] = score.passed
  return clean > 0 ? passed / clean : null
}

function movement(score, base) {
  if (!base) return ""
  const before = passRate(base)
  const after = passRate(score)
  if (before === null || after === null) return ""
  if (after > before) return "-> improves"
  if (after < before) return "-> regresses"
  return ""
}

function table(rows) {
  const widths = rows[0].map((_, i) => Math.max(...rows.map((row) => String(row[i]).length)))
  return rows
    .map((row) => row.map((cell, i) => (i === row.length - 1 ? String(cell) : String(cell).padEnd(widths[i]))).join("  ").trimEnd())
    .join("\n")
}

// One screen: a heading with the label and the arm count, then a row per arm with
// numerator and denominator. No second command is needed to read it.
export function scorecard({ skill, n, model, repeat, arms }) {
  const heading = `${skill} #${n}   ${model}   ${drawLabel(repeat)} (${repeat}/arm)`
  const base = arms.find((a) => a.arm === "none")?.score ?? arms[0]?.score ?? null
  const rows = [
    ["arm", "valid", "passed", "tokens", "median", "result"],
    ...arms.map(({ arm, score }) => [
      arm,
      `${score.valid[0]}/${score.valid[1]}`,
      `${score.passed[0]}/${score.passed[1]}`,
      formatTokens(score.tokens),
      formatDuration(score.durationMs),
      `${score.status}${movement(score, arm === "none" ? null : base) ? `  ${movement(score, arm === "none" ? null : base)}` : ""}`,
    ]),
  ]
  return [heading, table(rows)].join("\n")
}

// `--verbose` expands what the table compresses: every failing draw and the
// assertions that failed in it.
export function formatFailures(arms) {
  const lines = []
  for (const { arm, score } of arms) {
    const draws = score.draws ?? []
    draws.forEach((draw, i) => {
      const failed = (draw.assertions ?? []).filter((a) => !a.pass)
      const note = draw.infrastructure
        ? `infrastructure${draw.reason ? `: ${draw.reason}` : ""}`
        : draw.contaminated
          ? "contaminated"
          : failed.length
            ? failed.map((a) => `${a.kind} ${a.arg}`).join(", ")
            : null
      if (!note) return
      lines.push(`  ${arm} r${draw.rep ?? i + 1}: ${draw.status} — ${note}`)
    })
  }
  return lines.length ? lines.join("\n") : ""
}

// ---------------------------------------------------------------------------
// Reading a stored run back.
//
// `inspect` is a report over artefacts that already exist: it never stages,
// spawns or writes into the run directory. Keeping the readers here means the
// CLI has one place to ask "what did this run record?" and the scorecard, the
// summary and the inspection read the same files.
// ---------------------------------------------------------------------------

export function readManifest(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"))
  } catch {
    return null
  }
}

// SPEC-0046: the explicit record is the only evidence of enforcement.
// `params.isolate: true` says the child got a throwaway home, not that the
// corpus read was denied, so a manifest without `params.isolation` is reported
// as `legacy` and is never upgraded to `enforced`.
export function isolationState(manifest) {
  const record = manifest?.params?.isolation
  if (record && typeof record === "object" && !Array.isArray(record)) {
    return record.enforced === true
      ? { state: "enforced", mechanism: record.mechanism ?? "unknown" }
      : { state: "unenforced", mechanism: null }
  }
  return { state: "legacy", mechanism: null }
}

export function storedHostRoots(manifest, fallback = []) {
  const roots = manifest?.hostRoots ?? manifest?.params?.hostRoots
  if (Array.isArray(roots)) {
    const valid = roots.filter((r) => typeof r === "string" && r.startsWith("/"))
    if (valid.length) return valid
  }
  return fallback
}

export function loadCases(root) {
  const map = new Map()
  if (!existsSync(root)) return map
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = join(corpusDir(join(root, entry.name)), "cases.md")
    if (!existsSync(file)) continue
    for (const c of parseCases(readFileSync(file, "utf8"), entry.name).cases) map.set(`${entry.name}#${c.n}`, c)
  }
  return map
}

// Two layouts coexist: the flat `<skill>[--model][--arm]/<n>.md` written before
// runs got their own directory, and `runs/<id>/cases/<n>/transcript*.md`.
export function transcriptPaths({ dir, runDirs = [] }) {
  const found = []
  const caseFiles = (run, key) => {
    const casesDir = join(run, "cases")
    if (!existsSync(casesDir)) return
    for (const c of readdirSync(casesDir)) {
      const caseDir = join(casesDir, c)
      if (!existsSync(caseDir)) continue
      for (const file of readdirSync(caseDir)) {
        if (file.startsWith("transcript") && file.endsWith(".md")) {
          found.push({ label: `${key}/${c}/${file}`, path: join(caseDir, file), dir: run, caseDir })
        }
      }
    }
  }
  if (runDirs.length) {
    for (const run of runDirs) caseFiles(run, basename(run))
    return found
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (entry.name === "runs") {
      for (const run of listRuns(dir)) caseFiles(run, run.split("/").pop())
      continue
    }
    for (const file of readdirSync(join(dir, entry.name))) {
      if (file.endsWith(".md")) {
        found.push({ label: `${entry.name}/${file}`, path: join(dir, entry.name, file), dir: join(dir, entry.name), caseDir: join(dir, entry.name) })
      }
    }
  }
  return found
}

export function storedRunStatus(dir, { case: caseNumber = null, skill = null } = {}) {
  const manifest = readManifest(dir)
  const casesDir = join(dir, "cases")
  const cases = []
  if (existsSync(casesDir)) {
    for (const entry of readdirSync(casesDir).sort()) {
      const file = join(casesDir, entry, "result.json")
      if (!existsSync(file)) {
        cases.push({ case: entry, status: "missing", failures: [], note: "no result.json" })
        continue
      }
      let result
      try {
        result = JSON.parse(readFileSync(file, "utf8"))
      } catch {
        cases.push({ case: entry, status: "unreadable", failures: [], note: "result.json is not valid JSON" })
        continue
      }
      if (caseNumber !== null && result.case !== caseNumber) continue
      if (skill !== null && result.skill !== skill) continue
      const draws = result.repetitions ?? [result]
      const failures = draws.flatMap((draw, i) =>
        (draw.assertions ?? []).filter((a) => !a.pass).map((a) => ({ draw: draw.rep ?? i + 1, assertion: `${a.kind} ${a.arg}` })),
      )
      cases.push({
        case: `${result.skill}#${result.case}`,
        status: result.status,
        passed: result.passed,
        reps: result.reps ?? draws.length,
        stoppedEarly: Boolean(result.stoppedEarly),
        contaminated: result.contaminated,
        infrastructure: result.infrastructure,
        failures,
      })
    }
  }
  return { dir, manifest, cases }
}

export function formatStoredStatus({ dir, manifest, cases }, { verbose = false } = {}) {
  const lines = []
  const name = basename(dir.replace(/\/+$/, ""))
  const iso = isolationState(manifest)
  const counts = manifest?.counts ? JSON.stringify(manifest.counts) : "no counts"
  lines.push(
    `${name}  status=${manifest?.status ?? "missing"}  model=${manifest?.model ?? "?"}  level=${manifest?.level ?? "?"}  arm=${manifest?.arm ?? "?"}  isolation=${iso.state}  ${counts}`,
  )
  for (const c of cases) {
    const rate = c.reps ? ` [${c.passed ?? "?"}/${c.reps}]` : ""
    const requested = manifest?.params?.repeat ?? null
    const stopped = c.stoppedEarly ? ` stopped early (${c.reps}/${requested ?? "?"})` : ""
    lines.push(`  ${c.case}: ${c.status}${rate}${stopped}${c.note ? ` — ${c.note}` : ""}`)
    if (verbose || c.status === "failed") {
      for (const f of c.failures) lines.push(`    r${f.draw}: ${f.assertion}`)
    }
  }
  return lines.join("\n")
}
