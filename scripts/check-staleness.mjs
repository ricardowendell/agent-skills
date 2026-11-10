#!/usr/bin/env node
// check-staleness.mjs — is a published eval cell still describing the checkout?
//
// `skillHash` was written and printed but never compared (SPEC-0057). A cell in
// `docs/evals/coverage.md` cites a run directory; that run's case result records
// the hashes of the files that governed it. This command reads only those stored
// result manifests — never `baseline.json` or `last-run.json`, which are not
// evidence — and compares the recorded hashes with the working tree.
//
// The output is a report by default. `--check` exits 1 when any cited cell is
// stale or an uncited citation is present, but it is not wired into CI or
// `docs/pipeline.md` yet: the first run is red on purpose, and promoting it to a
// gate is a follow-up after a clean pass.
//
// Usage:
//   node scripts/check-staleness.mjs
//   node scripts/check-staleness.mjs --check
//   node scripts/check-staleness.mjs --coverage docs/evals/coverage.md \
//     --store ~/.local/share/opencode/evals/runs --skills skills --json

import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { homedir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { stagedTreeHash } from "./lib/evals/fixture.mjs"
import { RUN_TOKEN } from "./lib/evals/evidence.mjs"
import { corpusDir, parseCases } from "./lib/evals/parse.mjs"

const USAGE = `Usage: node scripts/check-staleness.mjs [--check] [--store <runs-dir>] [--coverage <file>] [--skills <dir>] [--json] [--help]

For every cell cited in coverage.md, compare the governed hashes recorded by the
cited run with the working tree. Default: report, exit 0. --check: exit 1 when
any cited cell is stale or an uncited citation is present.
`

const sha256File = (file) => createHash("sha256").update(readFileSync(file)).digest("hex")
const cellKey = (skill, n) => `${skill}#${n}`

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"))
}

// Every case result in a run directory, keyed by cell. A run with no `cases/`
// contributes nothing; the citation is still resolved so the caller can report
// it rather than silently dropping it.
export function readRunCells(dir) {
  const casesDir = join(dir, "cases")
  if (!existsSync(casesDir)) return []
  const cells = []
  for (const entry of readdirSync(casesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = join(casesDir, entry.name, "result.json")
    if (!existsSync(file)) continue
    try {
      const result = readJson(file)
      if (!result?.skill || !Number.isInteger(result.case)) continue
      cells.push({ skill: result.skill, case: result.case, result })
    } catch {}
  }
  return cells
}

function range(a, b) {
  const out = []
  for (let n = a; n <= b; n++) out.push(n)
  return out
}

// A cell is cited in coverage.md. Two shapes count:
//   - a full run-directory token: the run's own case results are the cells it
//     publishes (a wave row cites one; an old `--matrix` run cites several);
//   - an explicit `skill #N`, `skill #N–#M` or `skill#N` in prose (the Known
//     holes and Decisions sections name cells this way).
// A bare `#N` is *not* a citation: it is usually another skill's case named in
// the same long table row, and guessing from it invents cells that were never
// published.
export function scanCitations(text, { store, storeRuns = [], knownSkills, manual = new Set() }) {
  const cited = new Map()
  const uncited = []
  const add = (skill, n, run = null) => {
    if (!knownSkills.has(skill) || !Number.isInteger(n)) return
    const key = cellKey(skill, n)
    // A manual case is design intent, not a measurement: there is no draw whose
    // hashes could go stale, so naming it would be noise.
    if (manual.has(key)) return
    let entry = cited.get(key)
    if (!entry) cited.set(key, (entry = { skill, case: n, runs: new Set() }))
    if (run) entry.runs.add(run)
  }

  // A bare timestamp has no `--skill` suffix (`coverage.md` abbreviates the run
  // that way in prose). Resolve it by unique prefix; if several directories
  // share the second, the citation is ambiguous and must be reported, never
  // guessed at from the whole store.
  const bareTimestamp = /(?<![\w-])(20\d{2}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})(?!--)(?![\w-])/g
  // The corpus also abbreviates a run to its bare time of day (`09-32-51`).
  // Match the same slot in the directory name (`slice(11, 19)`); a time is
  // unique per day here, but the rule stays the same: unique or `uncited`.
  // An ellipsis-prefixed token (`…10-45-29`) is the date-relative shorthand, not
  // a bare time: its date comes from the surrounding citation, so it is not
  // re-resolved from the clock alone and never becomes a guess.
  const timeOnly = /(?<![\w-…])(\d{2}-\d{2}-\d{2})(?!--)(?![\w-])/g
  const lines = String(text ?? "").split(/\r?\n/)
  lines.forEach((line, i) => {
    for (const m of line.matchAll(RUN_TOKEN)) {
      const run = m[1]
      const dir = join(store, run)
      if (!existsSync(dir)) continue
      for (const cell of readRunCells(dir)) add(cell.skill, cell.case, run)
    }
    for (const m of line.matchAll(bareTimestamp)) {
      const timestamp = m[1]
      const candidates = storeRuns.filter((name) => name.startsWith(`${timestamp}--`))
      if (candidates.length === 1) {
        for (const cell of readRunCells(join(store, candidates[0]))) add(cell.skill, cell.case, candidates[0])
      } else {
        uncited.push({ timestamp, line: i + 1, candidates })
      }
    }
    for (const m of line.matchAll(timeOnly)) {
      const time = m[1]
      const candidates = storeRuns.filter((name) => name.slice(11, 19) === time)
      if (candidates.length === 1) {
        for (const cell of readRunCells(join(store, candidates[0]))) add(cell.skill, cell.case, candidates[0])
      } else {
        uncited.push({ timestamp: time, line: i + 1, candidates })
      }
    }
    for (const m of line.matchAll(/`([a-z0-9-]+)`\s*#(\d+)(?:\s*[–-]\s*#?(\d+))?/g)) {
      const n = Number(m[2])
      const end = m[3] ? Number(m[3]) : n
      for (const value of range(n, end)) add(m[1], value)
    }
    for (const m of line.matchAll(/([a-z0-9-]+)#(\d+)/g)) add(m[1], Number(m[2]))
  })
  return { cited, uncited }
}

// Prefer a cited run that recorded governed hashes; a control arm may be the
// newest citation but records no `skillHash`, and its per-file hashes describe
// the same checkout. When no cited run carries hashes, fall back to the newest
// stored run for the cell (a historical citation can be abbreviated in prose).
function newestRunWithHashes(cells) {
  return [...cells].sort((a, b) => (a.run < b.run ? 1 : a.run > b.run ? -1 : 0)).find((c) => c.result.skillHash || c.result.skillHashes)
}

export function checkStaleness({ coverage, store, skillsRoot }) {
  const text = readFileSync(coverage, "utf8")
  const knownSkills = new Set(
    existsSync(skillsRoot)
      ? readdirSync(skillsRoot, { withFileTypes: true })
          .filter((e) => e.isDirectory() && existsSync(join(skillsRoot, e.name, "SKILL.md")))
          .map((e) => e.name)
      : [],
  )

  const storeRuns = existsSync(store)
    ? readdirSync(store, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : []
  const runCells = new Map()
  const cellsInRun = (run) => {
    if (!runCells.has(run)) runCells.set(run, readRunCells(join(store, run)))
    return runCells.get(run)
  }

  const manual = new Set()
  for (const skill of knownSkills) {
    const evals = join(corpusDir(join(skillsRoot, skill)), "cases.md")
    if (!existsSync(evals)) continue
    try {
      for (const c of parseCases(readFileSync(evals, "utf8"), skill).cases) {
        if (c.status === "manual") manual.add(cellKey(skill, c.n))
      }
    } catch {}
  }

  const { cited, uncited } = scanCitations(text, { store, storeRuns, knownSkills, manual })
  const results = []
  for (const [key, entry] of cited) {
    const candidates = []
    for (const run of entry.runs) {
      for (const cell of cellsInRun(run)) {
        if (cell.skill === entry.skill && cell.case === entry.case) candidates.push({ ...cell, run })
      }
    }
    // Only a cited run may decide a cell. Substituting the newest run from the
    // whole store would judge a cell against evidence the document never names.
    const chosen = newestRunWithHashes(candidates)
    results.push(judgeCell({ key, skill: entry.skill, n: entry.case, chosen, skillsRoot }))
  }
  results.sort((a, b) => a.cell.localeCompare(b.cell, undefined, { numeric: true }))
  return {
    coverage,
    store,
    skillsRoot,
    cited: results.length,
    stale: results.filter((r) => r.stale),
    uncited,
    cells: results,
  }
}

function judgeCell({ key, skill, n, chosen, skillsRoot }) {
  const base = { cell: key, skill, case: n, run: chosen?.run ?? null, stale: false, reason: "" }
  if (!chosen) return { ...base, stale: true, reason: "no recorded run" }
  const result = chosen.result
  const skillDir = join(skillsRoot, skill)
  if (!existsSync(skillDir)) return { ...base, stale: true, reason: `skill directory missing: ${skillDir}` }

  // Per-file evidence (SPEC-0057): compare exactly the files that governed the
  // draw, so a change outside `governs:` does not mark an unrelated cell stale.
  if (result.skillHashes && typeof result.skillHashes === "object") {
    const changed = []
    for (const [rel, recorded] of Object.entries(result.skillHashes)) {
      const file = join(skillDir, rel)
      if (!existsSync(file)) {
        changed.push(`missing ${rel}`)
        continue
      }
      let current
      try {
        current = sha256File(file)
      } catch {
        changed.push(`unreadable ${rel}`)
        continue
      }
      if (recorded !== current) changed.push(`changed ${rel}`)
    }
    if (changed.length) return { ...base, stale: true, reason: changed.join("; ") }
    if (!Object.keys(result.skillHashes).length) {
      return { ...base, stale: true, reason: "empty governed hash set" }
    }
    return base
  }

  // Legacy runs recorded only the staged tree hash, which is still the identity
  // every stored manifest and citation uses.
  if (result.skillHash) {
    const current = stagedTreeHash(skillDir)
    if (current !== result.skillHash) {
      return {
        ...base,
        stale: true,
        reason: `tree hash ${String(result.skillHash).slice(0, 12)} != ${current.slice(0, 12)}`,
      }
    }
    return base
  }
  return { ...base, stale: true, reason: "no governed hashes recorded" }
}

function option(argv, name) {
  const i = argv.indexOf(name)
  if (i < 0) return null
  const value = argv[i + 1]
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`)
  return value
}

function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(USAGE)
    return 0
  }
  const check = argv.includes("--check")
  const json = argv.includes("--json")
  const coverage = resolve(option(argv, "--coverage") ?? "docs/evals/coverage.md")
  const store = resolve(option(argv, "--store") ?? join(homedir(), ".local", "share", "opencode", "evals", "runs"))
  const skillsRoot = resolve(option(argv, "--skills") ?? "skills")

  const report = checkStaleness({ coverage, store, skillsRoot })

  if (json) {
    process.stdout.write(
      `${JSON.stringify({ ok: report.stale.length === 0 && report.uncited.length === 0, ...report }, null, 2)}\n`,
    )
  } else {
    for (const cell of report.stale) {
      process.stdout.write(`stale ${cell.cell} — ${cell.run ?? "no run"} (${cell.reason})\n`)
    }
    for (const entry of report.uncited) {
      const detail = entry.candidates.length
        ? `matches ${entry.candidates.length} run directories (${entry.candidates.join(", ")})`
        : "matches no run directory"
      process.stdout.write(`uncited ${entry.timestamp} — coverage.md:${entry.line} ${detail}\n`)
    }
    process.stdout.write(
      `${report.cited} cited cell(s), ${report.stale.length} stale, ` +
        `${report.uncited.length} uncited citation(s); coverage ${coverage}; store ${store}${check ? " (--check)" : ""}\n`,
    )
  }
  return check && (report.stale.length || report.uncited.length) ? 1 : 0
}

// Importable from the test without running the CLI.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main(process.argv.slice(2))
  } catch (e) {
    process.stderr.write(`check-staleness: ${e.message}\n`)
    process.exitCode = 2
  }
}
