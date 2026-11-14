#!/usr/bin/env node
// check-tdd-signature.mjs — print the test-first signature of a stored run.
//
// Thin CLI over `scripts/lib/tdd-signature.mjs`: it reads the transcripts the
// runner already wrote, never the scratch tree and never a model. A run
// directory may group its transcripts per repetition (`transcript.r1.md`) or
// per case (`transcript.md`); both shapes are read, ordered by repetition.
//
// Usage:
//   node scripts/check-tdd-signature.mjs <run-dir>...
//   node scripts/check-tdd-signature.mjs <run-dir> --json

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { signature } from "./lib/tdd-signature.mjs"

const USAGE = `Usage: node scripts/check-tdd-signature.mjs <run-dir>... [--json]

Read every stored transcript in the run directory and report, per draw, whether a
test file was written before the first source write, whether a test command
exited non-zero before it, and the lines added to source and to tests. Exit 2 for
a path that is not a readable run directory; the signature is a reading, not a
pass/fail gate.
`

// `transcript.r10.md` sorts after `transcript.r9.md`; the repetition is the key.
function repOf(name) {
  const m = /transcript(?:\.r(\d+))?\.md$/.exec(name)
  return m ? Number(m[1] ?? 1) : Number.POSITIVE_INFINITY
}

function transcriptsOf(caseDir) {
  return readdirSync(caseDir)
    .filter((name) => /^transcript(?:\.r\d+)?\.md$/.test(name))
    .sort((a, b) => repOf(a) - repOf(b) || a.localeCompare(b))
    .map((name) => ({ name, rep: repOf(name), text: readFileSync(join(caseDir, name), "utf8") }))
}

function readRun(dir) {
  const casesDir = join(dir, "cases")
  if (!existsSync(casesDir)) return null
  const draws = []
  for (const entry of readdirSync(casesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    for (const t of transcriptsOf(join(casesDir, entry.name))) {
      draws.push({ case: entry.name, rep: t.rep, reading: signature(t.text) })
    }
  }
  return draws
}

function main(argv) {
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(USAGE)
    return 0
  }
  const json = argv.includes("--json")
  const dirs = argv.filter((a) => !a.startsWith("--")).map(resolve)

  const report = []
  let unreadable = false
  for (const dir of dirs) {
    const draws = readRun(dir)
    if (draws === null) {
      process.stderr.write(`not a readable run dir: ${dir} — no cases/\n`)
      unreadable = true
      continue
    }
    report.push({ dir, draws })
  }
  if (unreadable) return 2

  if (json) {
    process.stdout.write(`${JSON.stringify({ report }, null, 2)}\n`)
    return 0
  }

  for (const { dir, draws } of report) {
    process.stdout.write(`run ${dir}\n`)
    for (const draw of draws) {
      const r = draw.reading
      const tests = r.testFiles.length ? r.testFiles.join(",") : "-"
      const sources = r.sourceFiles.length ? r.sourceFiles.join(",") : "-"
      process.stdout.write(
        `  ${draw.case} r${draw.rep}: test-first=${r.testFirst ? "yes" : "no"} ` +
          `red-before=${r.redBeforeImplementation ? "yes" : "no"} ` +
          `added test=${r.added.test} source=${r.added.source} ` +
          `tests=${tests} sources=${sources}\n`,
      )
    }
    const n = draws.length
    const first = draws.filter((d) => d.reading.testFirst).length
    const red = draws.filter((d) => d.reading.redBeforeImplementation).length
    const addedTest = draws.reduce((sum, d) => sum + d.reading.added.test, 0)
    const addedSource = draws.reduce((sum, d) => sum + d.reading.added.source, 0)
    process.stdout.write(
      `  ${n} draw(s): test-first ${first}/${n}, red-before-implementation ${red}/${n}, ` +
        `added test=${addedTest} source=${addedSource}\n`,
    )
  }
  return 0
}

process.exitCode = main(process.argv.slice(2))
