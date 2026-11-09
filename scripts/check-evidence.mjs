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
import { checkRun, manifestIsolation } from "./lib/evals/runcheck.mjs"
import { DETECTOR_VERSION } from "./lib/evals/leak.mjs"
import { checkDocuments, tokenSegments } from "./lib/evals/evidence.mjs"

const USAGE = `Usage: node scripts/check-evidence.mjs [--store <runs-dir>] [--strict] [--json]

Scan docs/evals/*.md for run-directory tokens and check them against the local
store. Errors: a missing directory, a completed run with no cases/ or no case
results (empty-run), an unfinished run cited as complete, a line claiming
isolated=yes for a run whose recorded detector lacks the host-reads capability,
or a line claiming
isolated=yes for a run whose manifest records isolation.enforced: false
(unenforced-isolation; legacy manifests without the record keep the old rule).
Warnings: a run
with findings cited without a dirty/leak/host/stall marker, and a missing eval
store (missing-store); --strict makes a warning fatal.

Exit codes:
  0  no errors (warnings may print, including a missing store)
  1  at least one error, or a warning under --strict
  2  the docs could not be read
`

function option(argv, name) {
  const i = argv.indexOf(name)
  if (i < 0) return null
  const value = argv[i + 1]
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`)
  return value
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
  if (!manifest && !existsSync(casesDir)) {
    return { exists: true, unreadable: true, reason: "has no manifest.json and no cases/", findings: 1 }
  }

  const status = manifestError ? "unreadable" : (manifest?.status ?? "unfinished")
  // A completed manifest with no case results is not evidence about anything.
  // It used to read as a clean 0/0 because checkRun has nothing to reject; the
  // reviewer's empty-run case is this branch.
  if (status === "completed" && cases.length === 0) {
    return {
      exists: true,
      unreadable: true,
      status,
      reason: existsSync(casesDir) ? "has an empty cases/ (no result.json)" : "has no cases/ directory",
      detectorVersion: null,
      findings: 1,
    }
  }

  // SPEC-0046: prefer the richer record; a legacy manifest keeps the boolean.
  const isolation = manifest ? manifestIsolation(manifest) : null
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
    // The summary derivation can use the legacy boolean, but the citation guard
    // needs the raw field: only an explicit `enforced: true` object proves the
    // boundary, and a malformed record must be able to refute `isolated=yes`.
    isolation,
    isolationRecord: manifest?.params?.isolation,
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
    // A fresh checkout has no eval store. That is not an error in the normal
    // mode: the hook must not make a commit impossible on a machine that never
    // ran an eval. --strict turns the same condition into a failure.
    const level = strict ? "error" : "warning"
    const findings = [
      {
        level,
        rule: "missing-store",
        file: "",
        line: 0,
        message: `eval store not found: ${store}`,
      },
    ]
    if (json) {
      process.stdout.write(
        `${JSON.stringify(
          {
            ok: level === "warning",
            store,
            strict,
            currentDetector: DETECTOR_VERSION,
            summary: { documents: 0, errors: level === "error" ? 1 : 0, warnings: level === "warning" ? 1 : 0 },
            findings,
          },
          null,
          2,
        )}\n`,
      )
    } else {
      process.stdout.write(`${level} missing-store — eval store not found: ${store}\n`)
      process.stdout.write(
        `0 documents, ${level === "error" ? 1 : 0} errors, ${level === "warning" ? 1 : 0} warnings` +
          `${strict ? " (strict)" : ""}; current detector ${DETECTOR_VERSION}; store ${store}\n`,
      )
    }
    return strict ? 1 : 0
  }
  const storeNames = readdirSync(store, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)

  const documents = readDocuments(process.cwd())
  const cache = new Map()
  // An exact directory always wins. A token with exactly two segments
  // (timestamp + skill, no arm) may stand for a run whose arm was dropped by the
  // sentence, but only when the prefix has one candidate; zero or several are an
  // error that names the candidates. A token with an arm (three or more
  // segments) never falls back to a prefix: the arm is the identity, and
  // resolving `...--demo--nonexistent-arm` to `...--demo` is how a broken
  // citation passed review.
  const resolveDir = (token) => {
    const exact = join(store, token)
    if (existsSync(exact)) return { dir: exact }
    const segments = tokenSegments(token)
    if (segments.length !== 2) {
      const near = storeNames.filter((name) => name.startsWith(`${token}--`))
      return { error: true, candidates: near }
    }
    const candidates = storeNames.filter((name) => name.startsWith(`${token}--`))
    if (candidates.length === 1) return { dir: join(store, candidates[0]) }
    return { error: true, candidates }
  }
  const resolveRun = (token) => {
    if (!cache.has(token)) {
      const resolved = resolveDir(token)
      cache.set(token, resolved.dir ? inspectRun(resolved.dir) : { exists: false, candidates: resolved.candidates })
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
