#!/usr/bin/env node
// check-eval-run.mjs — fail a published run that leaked or lost its load gate.
//
// Model-free and filesystem-only: read `manifest.json` for the arm and every
// `cases/*/result.json` for the draws, then apply the pure rule in
// `scripts/lib/evals/runcheck.mjs`. Exit 0 when every repetition has provenance,
// 1 when there is a finding, 2 when a path is not a readable run directory.

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { checkRun, isPreDetector } from "./lib/evals/runcheck.mjs"

const USAGE = `Usage: node scripts/check-eval-run.mjs <run-dir>...

Check one or more eval run directories for leaked reads, contamination, a lost
skill gate, or missing provenance. The checker reads what the runner already
wrote; it does not call a model.

Exit codes:
  0  every repetition is clean
  1  at least one finding
  2  a path is not a readable eval run directory (no manifest.json and no cases/)
`

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"))
}

function readRun(dir) {
  const manifestPath = join(dir, "manifest.json")
  const casesDir = join(dir, "cases")
  const hasManifest = existsSync(manifestPath)
  const hasCases = existsSync(casesDir)
  if (!hasManifest && !hasCases) return { ok: false, reason: "no manifest.json and no cases/" }

  let arm = null
  let startedAt = null
  if (hasManifest) {
    try {
      const manifest = readJson(manifestPath)
      arm = manifest.arm ?? null
      startedAt = manifest.startedAt ?? null
    } catch (e) {
      return { ok: false, reason: `manifest.json is not valid JSON: ${e.message}` }
    }
  }

  const cases = []
  if (hasCases) {
    let entries
    try {
      entries = readdirSync(casesDir, { withFileTypes: true })
    } catch (e) {
      return { ok: false, reason: `cases/ is not readable: ${e.message}` }
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const file = join(casesDir, entry.name, "result.json")
      if (!existsSync(file)) continue
      try {
        cases.push(readJson(file))
      } catch (e) {
        return { ok: false, reason: `${file} is not valid JSON: ${e.message}` }
      }
    }
  }

  return { ok: true, arm, startedAt, cases }
}

function main(argv) {
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(USAGE)
    return 0
  }

  let unreadable = false
  let dirty = false

  for (const arg of argv) {
    const dir = resolve(arg)
    const run = readRun(dir)
    if (!run.ok) {
      process.stderr.write(`not a readable run dir: ${dir} — ${run.reason}\n`)
      unreadable = true
      continue
    }

    const preDetector = isPreDetector(run.cases, run.startedAt)
    let { findings, counts } = checkRun({ arm: run.arm, cases: run.cases })
    // A run with no `leak` field at all predates SPEC-0017. Warn per draw
    // instead of failing: the historical artefact is citable, not clean.
    let warnings = []
    if (preDetector) {
      warnings = findings.filter((f) => f.kind === "leak-missing")
      findings = findings.filter((f) => f.kind !== "leak-missing")
      counts = { ...counts, findings: findings.length }
    }
    for (const w of warnings) {
      process.stdout.write(`warn ${w.kind} ${w.case} r${w.rep} — ${w.detail}\n`)
    }
    for (const f of findings) {
      process.stdout.write(`${f.kind} ${f.case} r${f.rep} — ${f.detail}\n`)
    }
    process.stdout.write(`cases=${counts.cases} reps=${counts.reps} findings=${counts.findings} (${dir})\n`)
    if (findings.length) dirty = true
  }

  if (unreadable) return 2
  return dirty ? 1 : 0
}

process.exitCode = main(process.argv.slice(2))
