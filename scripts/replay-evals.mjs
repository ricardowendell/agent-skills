#!/usr/bin/env node
// replay-evals.mjs — re-evaluate recorded transcripts without a new agent draw.
//
// Every assertion that reads the transcript (`reply`, `noreply`, `verdict`,
// `tool`, `notool`, `ran`, `ranpass`, `skill`, `notskill`, `noskill`) can be
// re-evaluated from a stored run. That is what makes changing an assertion
// cheap: the alternative is one agent run per case per change, and minutes per
// case is not a loop anyone closes.
//
// `--judge <model>` takes the same stored transcripts and calls the semantic
// judge again over the reply and the rebuilt tool-call ledger. It spends judge
// turns, never an agent draw, and prints the per-draw verdicts, a per-case tally
// and the provenance it measured. Nothing is written into the run directory;
// `--json` is the artifact and requires `--judge`.
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
//   node scripts/replay-evals.mjs --run 2026-11-05T11-45-57
//                                                 # one stored run (prefix match)
//   node scripts/replay-evals.mjs --judge opencode-go/gpt-6-luna [--json]
//                                                 # re-judge stored draws, no agent run
//   node scripts/replay-evals.mjs --leaks <run-dir…>
//                                                 # re-run the leak detector over the
//                                                 # stored transcripts: no model,
//                                                 # no write into the run directory
//   node scripts/replay-evals.mjs --leaks --all    # same, over every stored run

import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { homedir } from "node:os"
import { spawnSync } from "node:child_process"
import { corpusDir, parseCases } from "./lib/evals/parse.mjs"
import { REPLAYABLE } from "./lib/evals/kinds.mjs"
import { evaluateAssertions, skillGate } from "./lib/evals/assertions.mjs"
import { replyText, skillLoads } from "./lib/evals/events.mjs"
import { classify } from "./lib/evals/result.mjs"
import { listRuns } from "./lib/evals/runs.mjs"
import { parseTranscript } from "./lib/evals/transcript.mjs"
import { rejudge } from "./lib/evals/rejudge.mjs"
import { leaksIn, DETECTOR_VERSION } from "./lib/evals/leak.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OUT_ROOT = join(homedir(), ".local/share/opencode/evals")

const opt = {
  dir: OUT_ROOT,
  root: join(REPO, "skills"),
  skill: null,
  case: null,
  run: null,
  changed: false,
  quiet: false,
  judge: null,
  json: false,
  leaks: false,
  all: false,
  hostRoots: [],
  runs: [],
}
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === "--dir") opt.dir = resolve(argv[++i])
  else if (a === "--root") opt.root = resolve(argv[++i])
  else if (a === "--skill") opt.skill = argv[++i]
  else if (a === "--case") opt.case = Number(argv[++i])
  else if (a === "--run") {
    const value = argv[++i]
    if (value === undefined || value.startsWith("--")) {
      console.error("--run needs a run id (prefix match)")
      process.exit(2)
    }
    opt.run = value
  }
  else if (a === "--changed") opt.changed = true
  else if (a === "--quiet") opt.quiet = true
  else if (a === "--json") opt.json = true
  else if (a === "--leaks") opt.leaks = true
  else if (a === "--all") opt.all = true
  else if (a === "--host-root") {
    const value = argv[++i]
    if (value === undefined || value.startsWith("--")) {
      console.error("--host-root needs a directory")
      process.exit(2)
    }
    opt.hostRoots.push(resolve(value))
  }
  else if (a === "--judge") {
    const value = argv[++i]
    if (value === undefined || value.startsWith("--")) {
      console.error("--judge needs a model (or 'default')")
      process.exit(2)
    }
    opt.judge = value
  } else if (!a.startsWith("-")) {
    // Positional arguments are run directories for `--leaks`; every other mode
    // keeps its flag-only interface.
    opt.runs.push(resolve(a))
  } else {
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

// `--json` is the re-judge artifact; without `--judge` there is no artifact to
// emit, and silently replaying in text mode hides the mistake.
if (opt.json && !opt.judge) {
  console.error("--json needs --judge")
  process.exit(2)
}

if (opt.leaks && opt.judge) {
  console.error("--leaks is model-free; drop --judge")
  process.exit(2)
}

if (!opt.leaks && opt.runs.length) {
  console.error("positional run directories are only accepted with --leaks")
  process.exit(2)
}

// The host corpus the runner recorded. Pre-SPEC-0028 manifests do not carry it,
// so the replay falls back to the checkout this script was cloned from: the
// main worktree (via the common git dir) and this checkout. Both are derived,
// not typed; a machine-specific list still comes from the manifest when present.
function hostRootsFor(root) {
  return [
    // The checkout itself: `.git/`, `CONTRIBUTING.md`, `package.json`, `.pdlc/`
    // and anything else outside the scratch are host corpus, not just the
    // five documented subdirectories.
    root,
    join(root, "docs"),
    join(root, "AGENTS.md"),
    join(root, "scripts"),
    join(root, "skills"),
    join(root, "runs"),
    join(root, ".lane/trees"),
  ]
}

function mainCheckout() {
  const r = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
    cwd: REPO,
    encoding: "utf8",
  })
  if (r.status === 0) {
    const common = r.stdout.trim()
    if (common) return dirname(common)
  }
  return REPO
}

function defaultHostRoots() {
  return [...new Set([...hostRootsFor(mainCheckout()), ...hostRootsFor(REPO)])]
}

function readManifest(runDir) {
  try {
    return JSON.parse(readFileSync(join(runDir, "manifest.json"), "utf8"))
  } catch {
    return null
  }
}

// SPEC-0046: the explicit record is the only evidence of enforcement.
// `params.isolate: true` says the child got a throwaway home, not that the
// corpus read was denied, so a manifest without `params.isolation` is reported
// as `legacy` and is never upgraded to `enforced`.
function isolationState(manifest) {
  const record = manifest?.params?.isolation
  if (record && typeof record === "object" && !Array.isArray(record)) {
    return record.enforced === true
      ? { state: "enforced", mechanism: record.mechanism ?? "unknown" }
      : { state: "unenforced", mechanism: null }
  }
  return { state: "legacy", mechanism: null }
}

function manifestHostRoots(manifest) {
  const roots = manifest?.hostRoots ?? manifest?.params?.hostRoots
  if (Array.isArray(roots)) {
    const valid = roots.filter((r) => typeof r === "string" && r.startsWith("/"))
    if (valid.length) return valid
  }
  return null
}

// `--leaks` re-judges what the stored transcripts actually did. It reads only;
// nothing is written into the run directory and no model is called.
if (opt.leaks) {
  // No default store scan here: "0 cells, 0 dirty" from a mistyped path would
  // read as a clean bill. `--all` is the explicit request for the whole store.
  if (!opt.runs.length && !opt.all) {
    console.error("--leaks needs one or more run directories, or --all to scan the store")
    console.error(`usage: node scripts/replay-evals.mjs --leaks <run-dir…> | --leaks --all [--dir ${OUT_ROOT}]`)
    process.exit(2)
  }
  const dirs = (opt.runs.length ? opt.runs : listRuns(opt.dir)).slice().sort()
  if (!dirs.length) {
    console.error(`no run directories found in ${opt.dir}`)
    process.exit(2)
  }
  const fallback = defaultHostRoots()
  // A named directory is a claim about that directory, so a broken one is exit 2.
  // A store scan is a survey: unfinished runs (manifest-only, `status: running`)
  // are named as skipped, not turned into a failed run.
  const explicit = opt.runs.length > 0
  let cells = 0
  let dirty = 0
  let unreadable = 0
  let skipped = 0
  for (const runDir of dirs) {
    const manifest = readManifest(runDir)
    if (!explicit && manifest && manifest.status !== "completed") {
      console.error(`skipped ${runDir} — manifest status ${manifest.status ?? "missing"}`)
      skipped++
      continue
    }
    if (!existsSync(runDir)) {
      if (explicit) console.error(`not a readable run dir: ${runDir}`)
      unreadable += explicit ? 1 : 0
      skipped += explicit ? 0 : 1
      continue
    }
    const casesDir = join(runDir, "cases")
    if (!existsSync(casesDir)) {
      if (explicit) console.error(`not a run dir (no cases/): ${runDir}`)
      unreadable += explicit ? 1 : 0
      skipped += explicit ? 0 : 1
      continue
    }
    const name = runDir.replace(/\/+$/, "").split("/").pop()
    const iso = isolationState(manifest)
    console.log(`${name}  isolation=${iso.state}${iso.mechanism ? `(${iso.mechanism})` : ""}`)
    const hostRoots = opt.hostRoots.length ? opt.hostRoots : manifestHostRoots(manifest) ?? fallback
    const byCell = new Map()
    for (const c of readdirSync(casesDir)) {
      const cdir = join(casesDir, c)
      if (!existsSync(cdir)) continue
      for (const file of readdirSync(cdir)) {
        if (!file.startsWith("transcript") || !file.endsWith(".md")) continue
        const parsed = parseTranscript(readFileSync(join(cdir, file), "utf8"))
        if (!parsed) continue
        if (opt.skill && parsed.skill !== opt.skill) continue
        if (opt.case !== null && parsed.n !== opt.case) continue
        const key = `${parsed.skill}#${parsed.n}`
        // SPEC-0048: a denied corpus attempt is recorded apart from a read. The
        // replay must apply the same split as a fresh draw, or re-judging a
        // stored transcript would say `dirty` where the runner said clean.
        const entry = byCell.get(key) ?? { draws: 0, leak: false, host: false, denied: 0 }
        entry.draws++
        let drawDenied = false
        for (const hit of leaksIn(parsed.text, parsed.scratch, hostRoots, { enforced: iso.state === "enforced" })) {
          if (hit.kind === "host") entry.host = true
          else if (hit.kind === "denied") drawDenied = true
          else entry.leak = true
        }
        if (drawDenied) entry.denied++
        byCell.set(key, entry)
      }
    }
    if (!byCell.size) {
      if (explicit) console.error(`no transcripts in run dir: ${runDir}`)
      unreadable += explicit ? 1 : 0
      skipped += explicit ? 0 : 1
      continue
    }
    for (const [cell, entry] of [...byCell.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      cells++
      const rules = [entry.leak ? "leak" : "", entry.host ? "host" : ""].filter(Boolean)
      if (rules.length) dirty++
      const verdict = rules.length ? `dirty(${rules.join(",")})` : "clean"
      const denied = entry.denied ? `  deniedDraws=${entry.denied}` : ""
      // The same three-state rule as `runcheck`: a read denies isolation, and a
      // clean cell is `yes` only when the manifest proves the boundary. The
      // re-judged with-skill cell can then state it without the stale-detector
      // guard that the stored v2 artefact fails.
      const isolated = rules.length ? "no" : iso.state === "enforced" && entry.draws > 0 ? "yes" : "unknown"
      console.log(`${name}  ${cell} → ${verdict}  [${entry.draws} draw(s)]  isolated=${isolated}${denied}`)
    }
  }
  if (unreadable) {
    console.error(`\n${unreadable} unreadable/invalid run dir(s); replay incomplete, no clean verdict.`)
    process.exit(2)
  }
  console.log(
    `\nDetector ${DETECTOR_VERSION}: ${cells} cell(s), ${dirty} dirty` +
      (skipped ? `, skipped=${skipped}` : "") +
      `. No model, no write.`,
  )
  process.exit(0)
}

function loadCases(root) {
  const map = new Map()
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = join(corpusDir(join(root, entry.name)), "cases.md")
    if (!existsSync(file)) continue
    for (const c of parseCases(readFileSync(file, "utf8"), entry.name).cases) map.set(`${entry.name}#${c.n}`, c)
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

// `--judge` is a separate path: a case is one unit even though it has one
// transcript per draw, and the judge must see the rebuilt ledger for each one.
// It writes nothing into the run directory; the only artifact is stdout.
if (opt.judge) {
  const seen = new Set()
  const reports = []
  for (const { label, path } of transcriptPaths()) {
    if (opt.skill && !label.includes(opt.skill)) continue
    // Prefix on the run directory's own name, as documented. `includes` matched
    // a run id that merely appeared anywhere in the label.
    if (opt.run && !label.startsWith(opt.run)) continue
    const dir = dirname(path)
    if (seen.has(dir)) continue
    seen.add(dir)
    const resultPath = join(dir, "result.json")
    if (!existsSync(resultPath)) continue
    let stored
    try {
      stored = JSON.parse(readFileSync(resultPath, "utf8"))
    } catch {
      continue
    }
    if (opt.case !== null && stored.case !== opt.case) continue
    const c = cases.get(`${stored.skill}#${stored.case}`)
    if (!c) {
      missing++
      continue
    }
    const report = await rejudge({ dir, c, model: opt.judge })
    reports.push({ id: `${stored.skill}#${stored.case}`, dir: label, ...report })
    if (opt.json) continue
    console.log(`\n${label}  ${stored.skill}#${stored.case}`)
    for (const d of report.draws) {
      const score = typeof d.score === "number" ? d.score.toFixed(2) : "?"
      console.log(`  r${d.rep}  ${d.outcome}  score ${score}${d.reason ? `  ${d.reason}` : ""}`)
      for (const v of d.verdicts) {
        const evidence = String(v.evidence ?? "").replace(/\s+/g, " ").slice(0, 140)
        console.log(`    ${v.i}: ${v.verdict}${evidence ? ` — ${evidence}` : ""}`)
      }
    }
    // The artifact must say what it measured: two stored runs from before
    // SPEC-0020 carry no fixture/prompt/detector hash, and a bare tally would
    // make them look comparable to a run that does.
    console.log(
      `  provenance: ${report.provenance}` +
        (report.missing.length ? ` (missing ${report.missing.join(", ")})` : "") +
        `  repo ${report.repoSha ?? "?"}  skill ${report.skillHash ? `${report.skillHash.slice(0, 12)}…` : "?"}`,
    )
    const t = report.tally
    const rebuilt = t.skipped - t.deterministicFailed
    console.log(
      `  tally: ${t.passed}/${t.total} judged passed` +
        (t.failed ? `, ${t.failed} failed` : "") +
        (t.deterministicFailed ? `, ${t.deterministicFailed} skipped (deterministic failures)` : "") +
        (rebuilt ? `, ${rebuilt} skipped (no transcript)` : ""),
    )
  }
  if (opt.json) console.log(JSON.stringify(reports, null, 2))
  if (missing) console.error(`${missing} case(s) had no matching eval definition`)
  process.exit(0)
}

for (const { label, path } of transcriptPaths()) {
  if (opt.skill && !label.includes(opt.skill)) continue
  if (opt.run && !label.startsWith(opt.run)) continue
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
