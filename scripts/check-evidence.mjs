#!/usr/bin/env node
// check-evidence.mjs — every cited run directory must exist and mean what the
// sentence says.
//
// Model-free and filesystem-only: scan `docs/evals/*.md` for run-directory
// tokens, read each directory's manifest and case results, and apply the pure
// rules in `scripts/lib/evals/evidence.mjs`. The dirty verdict is `checkRun`
// from `runcheck.mjs`, so this CLI and `check-eval-run.mjs` cannot disagree
// about a run.

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { homedir } from "node:os"
import { join, resolve } from "node:path"
import { checkRun } from "./lib/evals/runcheck.mjs"
import { DETECTOR_VERSION } from "./lib/evals/leak.mjs"
import { checkDocuments } from "./lib/evals/evidence.mjs"

const USAGE = `Usage: node scripts/check-evidence.mjs [--store <runs-dir>] [--strict] [--json]

Scan docs/evals/*.md for run-directory tokens and check them against the local
store. Errors: a missing directory, an unfinished run cited as complete, or a
line claiming isolated=yes for a run whose recorded detector is not current.
Warnings: a run with findings cited without a dirty/leak/host/stall marker;
--strict makes a warning fatal.

Exit codes:
  0  no errors (warnings may print)
  1  at least one error, or a warning under --strict
  2  the docs or the store could not be read
`

function option(argv, name) {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : null
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"))
}

// Read a run the same way check-eval-run.mjs does: manifest for status/arm/
// isolation, every cases/*/result.json for the draws, then the shared rule.
// Structural incompleteness is counted as findings so a completed manifest with
// a missing result.json still warns as dirty rather than passing silently.
function inspectRun(dir) {
  if (!existsSync(dir)) return { exists: false }

  let manifest = null
  let manifestError = false
  const manifestPath = join(dir, "manifest.json")
  if (existsSync(manifestPath)) {
    try {
      manifest = readJson(manifestPath)
    } catch {
      manifestError = true
    }
  }

  const cases = []
  let structural = manifestError ? 1 : 0
  const casesDir = join(dir, "cases")
  if (existsSync(casesDir)) {
    for (const entry of readdirSync(casesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const file = join(casesDir, entry.name, "result.json")
      if (!existsSync(file)) {
        structural++
        continue
      }
      try {
        cases.push(readJson(file))
      } catch {
        structural++
      }
    }
  }
  if (!manifest && !existsSync(casesDir)) return { exists: true, status: "unreadable", detectorVersion: null, findings: 1 }

  const status = manifestError ? "unreadable" : (manifest?.status ?? "unfinished")
  const isolation = typeof manifest?.params?.isolate === "boolean" ? manifest.params.isolate : null
  const checked = checkRun({ arm: manifest?.arm ?? null, cases, isolation })

  const versions = []
  for (const c of cases) {
    if (c?.detectorVersion) versions.push(c.detectorVersion)
    if (Array.isArray(c?.repetitions)) {
      for (const r of c.repetitions) if (r?.detectorVersion) versions.push(r.detectorVersion)
    }
  }
  const detectorVersion = manifest?.detectorVersion ?? versions[0] ?? null

  return {
    exists: true,
    status,
    detectorVersion,
    findings: checked.counts.findings + structural,
  }
}

function readDocuments(root) {
  const dir = join(root, "docs", "evals")
  if (!existsSync(dir)) throw new Error(`no docs/evals directory under ${root}`)
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => ({ path: join("docs", "evals", name), text: readFileSync(join(dir, name), "utf8") }))
}

function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(USAGE)
    return 0
  }

  const strict = argv.includes("--strict")
  const json = argv.includes("--json")
  const store = resolve(option(argv, "--store") ?? join(homedir(), ".local", "share", "opencode", "evals", "runs"))
  if (!existsSync(store)) {
    process.stderr.write(`check-evidence: store not found: ${store}\n`)
    return 2
  }
  const storeNames = readdirSync(store, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)

  const documents = readDocuments(process.cwd())
  const cache = new Map()
  // The corpus cites a run as `timestamp--label` when the arm is obvious from
  // the sentence. Resolve an exact directory first; otherwise accept a unique
  // prefix or a unique timestamp+arm shorthand. An ambiguous token stays
  // missing: guessing between two runs would turn a citation into evidence it
  // does not have.
  const resolveDir = (token) => {
    const exact = join(store, token)
    if (existsSync(exact)) return exact
    const prefix = storeNames.filter((name) => name.startsWith(token))
    if (prefix.length === 1) return join(store, prefix[0])
    const split = token.indexOf("--", token.indexOf("T") + 1)
    if (split > 0) {
      const stamp = token.slice(0, split)
      const suffix = token.slice(split)
      const shorthand = storeNames.filter((name) => name.startsWith(stamp) && name.endsWith(suffix))
      if (shorthand.length === 1) return join(store, shorthand[0])
    }
    return null
  }
  const resolveRun = (token) => {
    if (!cache.has(token)) {
      const dir = resolveDir(token)
      cache.set(token, dir ? inspectRun(dir) : { exists: false })
    }
    return cache.get(token)
  }

  const findings = checkDocuments({ documents, resolveRun, currentDetector: DETECTOR_VERSION })
  const errors = findings.filter((f) => f.level === "error")
  const warnings = findings.filter((f) => f.level === "warning")

  if (json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: errors.length === 0 && !(strict && warnings.length > 0),
          store,
          strict,
          currentDetector: DETECTOR_VERSION,
          summary: { documents: documents.length, errors: errors.length, warnings: warnings.length },
          findings,
        },
        null,
        2,
      )}\n`,
    )
  } else {
    for (const f of findings) {
      process.stdout.write(`${f.level} ${f.file}:${f.line} ${f.rule} — ${f.message}\n`)
    }
    process.stdout.write(
      `${documents.length} documents, ${errors.length} errors, ${warnings.length} warnings` +
        `${strict ? " (strict)" : ""}; current detector ${DETECTOR_VERSION}; store ${store}\n`,
    )
  }

  return errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0
}

try {
  process.exitCode = main(process.argv.slice(2))
} catch (e) {
  process.stderr.write(`check-evidence: ${e.message}\n`)
  process.exitCode = 2
}
