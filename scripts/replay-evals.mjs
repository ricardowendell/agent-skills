#!/usr/bin/env node
// replay-evals.mjs — re-judge recorded transcripts without calling a model.
//
// Every assertion that reads the transcript (`reply`, `noreply`, `verdict`,
// `tool`, `notool`, `ran`, `ranpass`, `skill`, `notskill`, `noskill`) can be
// re-evaluated from a stored run. That is what makes changing an assertion
// cheap: the alternative is one agent run per case per change, and minutes per
// case is not a loop anyone closes.
//
// Filesystem assertions (`file`, `nofile`, `filematch`, `unchanged`, `changed`)
// are reported as skipped: they need the scratch tree, and `unchanged` needs the
// pre-run snapshot, which the transcript does not carry.
//
// Two things replay cannot settle, and does not pretend to:
//   - a verdict that came from `--judge` (the run was recorded with a model's
//     score, which the transcript does not contain);
//   - a case whose assertions changed after the run was recorded. A difference
//     is a prompt to look, not a bug report.
//
// Usage:
//   node scripts/replay-evals.mjs                 # all recorded runs
//   node scripts/replay-evals.mjs --skill review-code --case 3
//   node scripts/replay-evals.mjs --changed       # exit 1 when a verdict moves
//   node scripts/replay-evals.mjs --dir <path>    # default: ~/.local/share/opencode/evals

import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { homedir } from "node:os"
import { parseCases } from "./lib/evals/parse.mjs"
import { REPLAYABLE } from "./lib/evals/kinds.mjs"
import { evaluateAssertions, skillGate } from "./lib/evals/assertions.mjs"
import { replyText, skillLoads } from "./lib/evals/events.mjs"
import { classify } from "./lib/evals/result.mjs"
import { listRuns } from "./lib/evals/runs.mjs"
import { parseTranscript } from "./lib/evals/transcript.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OUT_ROOT = join(homedir(), ".local/share/opencode/evals")

const opt = { dir: OUT_ROOT, root: join(REPO, "skills"), skill: null, case: null, changed: false, quiet: false }
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === "--dir") opt.dir = resolve(argv[++i])
  else if (a === "--root") opt.root = resolve(argv[++i])
  else if (a === "--skill") opt.skill = argv[++i]
  else if (a === "--case") opt.case = Number(argv[++i])
  else if (a === "--changed") opt.changed = true
  else if (a === "--quiet") opt.quiet = true
  else {
    console.error(`unknown flag ${a}`)
    process.exit(2)
  }
}

// `NaN` is falsy: `--case abc` used to skip its own filter and replay every
// transcript. Same defect as the runner, same refusal.
if (opt.case !== null && !(Number.isInteger(opt.case) && opt.case > 0)) {
  console.error(`--case expects a positive integer (got ${opt.case})`)
  process.exit(2)
}

function loadCases(root) {
  const map = new Map()
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = join(root, entry.name, "references/evals.md")
    if (!existsSync(file)) continue
    for (const c of parseCases(readFileSync(file, "utf8")).cases) map.set(`${entry.name}#${c.n}`, c)
  }
  return map
}

const cases = loadCases(opt.root)
const verdicts = []
let scanned = 0
let missing = 0

// Two layouts coexist: the flat `<skill>[--model][--arm]/<n>.md` written before
// runs got their own directory, and `runs/<id>/cases/<n>/transcript*.md`.
function transcriptPaths() {
  const found = []
  for (const dir of readdirSync(opt.dir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    if (dir.name === "runs") {
      for (const run of listRuns(opt.dir)) {
        const cases = join(run, "cases")
        if (!existsSync(cases)) continue
        for (const c of readdirSync(cases)) {
          const cdir = join(cases, c)
          if (!existsSync(cdir)) continue
          for (const file of readdirSync(cdir)) {
            if (file.startsWith("transcript") && file.endsWith(".md")) found.push({ label: `${run.split("/").pop()}/${c}/${file}`, path: join(cdir, file) })
          }
        }
      }
      continue
    }
    for (const file of readdirSync(join(opt.dir, dir.name))) {
      if (file.endsWith(".md")) found.push({ label: `${dir.name}/${file}`, path: join(opt.dir, dir.name, file) })
    }
  }
  return found
}

for (const { label, path } of transcriptPaths()) {
  if (opt.skill && !label.includes(opt.skill)) continue
  {
    const parsed = parseTranscript(readFileSync(path, "utf8"))
    if (!parsed) continue
    if (opt.case !== null && parsed.n !== opt.case) continue
    scanned++
    const c = cases.get(`${parsed.skill}#${parsed.n}`)
    if (!c) {
      missing++
      continue
    }
    const replayed = c.assert.filter((a) => REPLAYABLE.has(a.kind))
    const skipped = c.assert.filter((a) => !REPLAYABLE.has(a.kind))
    if (!replayed.length || parsed.recorded === "staged") {
      // Nothing in the transcript decides this case; a verdict here would be
      // an artefact of the tool, not a difference in the run.
      verdicts.push({ id: `${parsed.skill}#${parsed.n}`, file: label, recorded: parsed.recorded, now: null, skipped: skipped.length, why: parsed.recorded === "staged" ? "smoke run" : "filesystem only" })
      continue
    }
    const asserts = evaluateAssertions({ ...c, assert: replayed }, parsed.scratch, parsed.text, replyText(parsed.text), null)
    const gate =
      c.gate === "off"
        ? { ok: true, reason: "gate off" }
        : parsed.arm === "without-skill"
          ? { ok: skillLoads(parsed.text).length === 0, reason: "control arm" }
          : skillGate(parsed.text, parsed.scratch, parsed.skill)
    const verdict = classify({ exit: parsed.exit, asserts, skillGate: gate })
    verdicts.push({
      id: `${parsed.skill}#${parsed.n}`,
      file: label,
      recorded: parsed.recorded,
      now: verdict.status,
      reason: verdict.reason,
      skipped: skipped.length,
      failed: asserts.filter((a) => !a.pass).map((a) => `${a.kind} ${a.arg}`),
      loads: skillLoads(parsed.text).map((l) => l.id),
    })
  }
}

for (const v of verdicts) {
  const moved = v.recorded && v.recorded !== v.now ? ` ${v.recorded} -> ${v.now}` : ""
  if (v.now === null) continue
  if (opt.quiet && !moved) continue
  const skip = v.skipped ? `  (${v.skipped} filesystem assertion(s) skipped)` : ""
  console.log(`${v.file}  ${v.now}${moved}${skip}`)
  if (v.failed.length) console.log(`    failed: ${v.failed.join(", ")}`)
  if (v.reason) console.log(`    ${v.reason.slice(0, 160)}`)
}

const replayedCount = verdicts.filter((v) => v.now !== null).length
const unreplayable = verdicts.length - replayedCount
const moved = verdicts.filter((v) => v.now !== null && v.recorded && v.recorded !== v.now)
console.log(
  `\nReplayed ${scanned} transcript(s)` +
    (missing ? `, ${missing} with no matching case (renamed or removed)` : "") +
    (unreplayable ? `, ${unreplayable} decided only by filesystem assertions (not replayable)` : "") +
    `; ${moved.length} verdict(s) differ from what was recorded.`,
)
process.exit(opt.changed && moved.length ? 1 : 0)
