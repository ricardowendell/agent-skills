#!/usr/bin/env node
// harness-health.mjs — one read-only table per release.
//
// It reads stored eval artefacts and pdlc run records and prints the same
// numbers twice for the same store. No model, no clock, no writes. The pure
// fold lives in `lib/evals/health.mjs`; this file only discovers paths, applies
// `--since`, and chooses markdown or JSON.
//
// The report is evidence, not a gate: a red number does not fail a build.

import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { homedir } from "node:os"
import { evalHealth, pdlcHealth, renderMarkdown } from "./lib/evals/health.mjs"

const opt = {
  runs: join(homedir(), ".local/share/opencode/evals"),
  pdlc: resolve(".pdlc/runs.json"),
  since: null,
  sinceMs: null,
  json: false,
}

function fail(message) {
  console.error(message)
  process.exit(2)
}

// `Date.parse("2026-02-30")` rolls over instead of failing, so the shape and the
// round-trip are both checked. `--since` is a day, in UTC, matching `startedAt`.
function parseSince(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  const at = new Date(Date.UTC(y, m - 1, d))
  if (at.getUTCFullYear() !== y || at.getUTCMonth() !== m - 1 || at.getUTCDate() !== d) return null
  return at.getTime()
}

const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i]
  if (arg === "--runs") {
    const value = argv[++i]
    if (value === undefined || value.startsWith("--")) fail("--runs needs a directory")
    opt.runs = resolve(value)
  } else if (arg === "--pdlc") {
    const value = argv[++i]
    if (value === undefined || value.startsWith("--")) fail("--pdlc needs a file")
    opt.pdlc = resolve(value)
  } else if (arg === "--since") {
    const value = argv[++i]
    if (value === undefined || value.startsWith("--")) fail("--since needs YYYY-MM-DD")
    opt.since = value
    opt.sinceMs = parseSince(value)
    if (opt.sinceMs === null) fail(`--since expects YYYY-MM-DD (got ${value})`)
  } else if (arg === "--json") {
    opt.json = true
  } else {
    fail(`unknown flag ${arg}`)
  }
}

function readRun(dir, id) {
  const manifestPath = join(dir, "manifest.json")
  if (!existsSync(manifestPath)) {
    return { id, dir, manifest: null, error: "missing manifest.json", cases: [] }
  }

  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
  } catch (error) {
    return { id, dir, manifest: null, error: `unreadable manifest.json (${error.message})`, cases: [] }
  }
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { id, dir, manifest: null, error: "manifest.json is not an object", cases: [] }
  }

  const cases = []
  const casesDir = join(dir, "cases")
  if (existsSync(casesDir)) {
    const names = readdirSync(casesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
    for (const name of names) {
      const caseDir = join(casesDir, name)
      const resultPath = join(caseDir, "result.json")
      if (!existsSync(resultPath)) {
        cases.push({ id: name, dir: caseDir, result: null, error: "missing result.json" })
        continue
      }
      try {
        cases.push({ id: name, dir: caseDir, result: JSON.parse(readFileSync(resultPath, "utf8")) })
      } catch (error) {
        cases.push({ id: name, dir: caseDir, result: null, error: `unreadable result.json (${error.message})` })
      }
    }
  }
  return { id, dir, manifest, cases }
}

const runsRoot = join(opt.runs, "runs")
const unreadable = []
let runs = []
if (!existsSync(runsRoot)) {
  unreadable.push({ id: "runs", path: runsRoot, reason: "runs directory not found" })
} else {
  const names = readdirSync(runsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  runs = names.map((name) => readRun(join(runsRoot, name), name))
}

// A run that cannot be read is named even under `--since`: there is no
// `startedAt` to filter on, and dropping it would hide the unreadable artefact.
const filtered = runs.filter((run) => {
  if (!opt.sinceMs || run.error || !run.manifest) return true
  const started = Date.parse(run.manifest.startedAt)
  return !Number.isFinite(started) || started >= opt.sinceMs
})

let pdlcRuns = {}
let pdlcError = null
try {
  const parsed = JSON.parse(readFileSync(opt.pdlc, "utf8"))
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("expected an object keyed by run id")
  }
  pdlcRuns = parsed
} catch (error) {
  pdlcError = error.code === "ENOENT" ? "not found" : `unreadable (${error.message})`
}

const report = {
  evals: evalHealth({ runs: filtered, unreadable }),
  pdlc: pdlcHealth({ runs: pdlcRuns, error: pdlcError, path: opt.pdlc }),
}

process.stdout.write(opt.json ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdown(report))
