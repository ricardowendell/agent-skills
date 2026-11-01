// report.mjs — the run artifact and the comparison against a stored baseline.
//
// A run writes one JSON per case plus a summary. Comparing two summaries is what
// turns "today's suite is green" into "this change did not regress the skill":
// a case that moved from passed to failed is a regression even when the totals
// look similar, and a case that moved the other way is worth naming too.

import { readFileSync } from "node:fs"

export const key = (r) => `${r.skill}#${r.case}`

export function summarizeRun({ results, ...meta }) {
  return {
    ...meta,
    finishedAt: new Date().toISOString(),
    counts: results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {}),
    results: results.map(({ transcript, ...rest }) => rest),
  }
}

// Regressions are strict on purpose: `unscored` is not a pass, and a case that
// disappeared from the run is reported as missing, not as fine.
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
    else if (was.status === "passed") regressions.push({ key: k, from: was.status, to: now.status, reason: now.reason })
    else fixes.push({ key: k, from: was.status, to: now.status })
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

export function readRun(path) {
  return JSON.parse(readFileSync(path, "utf8"))
}
