#!/usr/bin/env node
// harness-health.mjs — one read-only table per release.
//
// It reads stored eval artefacts and pdlc run records and prints the same
// numbers twice for the same store. No model, no clock, no writes. The pure
// fold lives in `lib/evals/health.mjs`; this file only discovers paths, applies
// `--since`/`--until`, and chooses markdown or JSON.
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
  until: null,
  untilMs: null,
  json: false,
}

function fail(message) {
  console.error(message)
  process.exit(2)
}

// `Date.parse("2026-02-30")` rolls over instead of failing, so the shape and the
// round-trip are both checked. `--since` is a day, in UTC, matching `startedAt`.
function validDate(y, m, d) {
  const at = new Date(Date.UTC(y, m - 1, d))
  return at.getUTCFullYear() === y && at.getUTCMonth() === m - 1 && at.getUTCDate() === d
}

function parseSince(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  if (!validDate(y, m, d)) return null
  return Date.UTC(y, m - 1, d)
}

// `--until` is an inclusive upper bound. A date-only value means the end of
// that UTC day, so `--until 2026-11-06` includes every run started on the 6th;
// an ISO timestamp is exact. The date part of an ISO value is still checked
// against the calendar, because `Date.parse` rolls 2026-02-30 into March.
function parseUntil(value) {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (day) {
    const [, y, m, d] = day.map(Number)
    if (!validDate(y, m, d)) return null
    return Date.UTC(y, m - 1, d, 23, 59, 59, 999)
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!iso) return null
  const [, y, m, d, h, mi, s] = iso.map(Number)
  if (!validDate(y, m, d) || h > 23 || mi > 59 || s > 59) return null
  const at = Date.parse(value)
  return Number.isFinite(at) ? at : null
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
  } else if (arg === "--until") {
    const value = argv[++i]
    if (value === undefined || value.startsWith("--")) fail("--until needs a date or an ISO timestamp")
    opt.until = value
    opt.untilMs = parseUntil(value)
    if (opt.untilMs === null) fail(`--until expects YYYY-MM-DD or an ISO timestamp (got ${value})`)
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

// The window is closed on both ends and inclusive. A record or run without a
// parseable start is kept: dropping it would hide an unreadable artefact and
// make the report depend on which fields happened to be present.
function inWindow(value) {
  const at = Date.parse(value)
  if (!Number.isFinite(at)) return true
  if (opt.sinceMs !== null && at < opt.sinceMs) return false
  if (opt.untilMs !== null && at > opt.untilMs) return false
  return true
}

const filtered = runs.filter((run) => {
  if (run.error || !run.manifest) return true
  return inWindow(run.manifest.startedAt)
})

let pdlcRuns = {}
let pdlcError = null
try {
  const parsed = JSON.parse(readFileSync(opt.pdlc, "utf8"))
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("expected an object keyed by run id")
  }
  const windowed = {}
  for (const [id, record] of Object.entries(parsed)) {
    if (inWindow(record?.started_at ?? record?.startedAt)) windowed[id] = record
  }
  pdlcRuns = windowed
} catch (error) {
  pdlcError = error.code === "ENOENT" ? "not found" : `unreadable (${error.message})`
}

const report = {
  evals: evalHealth({ runs: filtered, unreadable }),
  pdlc: pdlcHealth({ runs: pdlcRuns, error: pdlcError, path: opt.pdlc }),
}

process.stdout.write(opt.json ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdown(report))
