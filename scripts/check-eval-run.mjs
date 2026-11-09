#!/usr/bin/env node
// check-eval-run.mjs — fail a published run that leaked or lost its load gate.
//
// Model-free and filesystem-only: read `manifest.json` for the arm and every
// `cases/*/result.json` for the draws, then apply the pure rule in
// `scripts/lib/evals/runcheck.mjs`. Exit 0 when every repetition has provenance,
// 1 when there is a finding, 2 when a path is not a readable run directory.

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { checkRun, isPreDetector, manifestIsolation } from "./lib/evals/runcheck.mjs"

const USAGE = `Usage: node scripts/check-eval-run.mjs <run-dir>...

Check one or more eval run directories for leaked reads, contamination, a lost
skill gate, missing provenance, an aborted draw (timeout, stall, provider limit)
or a run that never completed. The summary names
skillLeaks, hostReads and isolated=yes|no|unknown: "no" means a read was
detected, "yes" needs a v2 detector, a recorded isolated run (and, when the
manifest carries params.isolation, enforced: true) and at least one draw that
ran, and "unknown" is neither. The checker reads what the runner already wrote;
it does not call a model.

Exit codes:
  0  no findings (isolated may still be "unknown"; pre-detector warnings may print;
     a case that stopped before the requested repeat prints a stopped-early warning)
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
  let isolation = null
  let requested = null
  const structural = []
  const incomplete = (name, detail) => structural.push({ case: name, rep: 0, kind: "incomplete", detail })

  if (hasManifest) {
    try {
      const manifest = readJson(manifestPath)
      arm = manifest.arm ?? null
      startedAt = manifest.startedAt ?? null
      // The runner records whether the child got an isolated home and a scratch
      // cwd, and SPEC-0046 adds whether the corpus boundary was enforced. A
      // manifest without the richer record is legacy and keeps the boolean.
      isolation = manifestIsolation(manifest)
      // The requested repeat is what makes a short case readable as a stop,
      // rather than as a run that was always that size.
      requested = Number.isInteger(manifest.params?.repeat) ? manifest.params.repeat : null
      if (manifest.status !== "completed") {
        incomplete("manifest", `status ${manifest.status ?? "missing"}; run did not complete`)
      }
    } catch (e) {
      return { ok: false, reason: `manifest.json is not valid JSON: ${e.message}` }
    }
  }

  const cases = []
  let missing = 0
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
      if (!existsSync(file)) {
        missing++
        incomplete(entry.name, "case directory has no result.json")
        continue
      }
      try {
        cases.push(readJson(file))
      } catch (e) {
        return { ok: false, reason: `${file} is not valid JSON: ${e.message}` }
      }
    }
  }
  // A manifest with no cases, or an empty cases/, is not evidence about anything.
  if (cases.length === 0 && missing === 0) incomplete("cases", "run contains no case results")

  return { ok: true, arm, startedAt, isolation, requested, cases, structural }
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
    const checked = checkRun({ arm: run.arm, cases: run.cases, isolation: run.isolation, requested: run.requested })
    let findings = [...run.structural, ...checked.findings]
    let counts = { ...checked.counts, findings: findings.length }
    // A run with no `leak` field at all predates SPEC-0017. Warn per draw
    // instead of failing: the historical artefact is citable, not clean.
    let warnings = [...checked.warnings]
    if (preDetector) {
      const historical = findings
        .filter((f) => f.kind === "leak-missing")
        .map((f) => ({ ...f, detail: `${f.detail} (pre-SPEC-0017 artefact; run started before the detector)` }))
      warnings = [...historical, ...warnings]
      findings = findings.filter((f) => f.kind !== "leak-missing")
      counts = { ...counts, findings: findings.length }
    }
    for (const w of warnings) {
      const at = w.rep ? ` r${w.rep}` : ""
      process.stdout.write(`warn ${w.kind} ${w.case}${at} — ${w.detail}\n`)
    }
    for (const f of findings) {
      process.stdout.write(`${f.kind} ${f.case} r${f.rep} — ${f.detail}\n`)
    }
    process.stdout.write(
      `cases=${counts.cases} reps=${counts.reps} findings=${counts.findings} warnings=${warnings.length} ` +
        `skillLeaks=${counts.skillLeaks} hostReads=${counts.hostReads} isolated=${counts.isolated} (${dir})\n`,
    )
    if (findings.length) dirty = true
  }

  if (unreadable) return 2
  return dirty ? 1 : 0
}

process.exitCode = main(process.argv.slice(2))
