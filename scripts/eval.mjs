#!/usr/bin/env node
// eval.mjs — the one eval CLI: list, check, run, compare, inspect.
//
//   list [skill]               cases, no model
//   check [skill]              parse, validate, dry-stage every fixture
//   run <skill> [n]            one arm, one draw by default
//   compare <skill> <n>        none/candidate (+baseline with --against)
//   compare <run-dir-a> <run-dir-b>   whole-run regression diff
//   inspect <run-dir>          stored status, --replay/--leaks/--judge
//
// The ladder is the default: `run` is one draw, `compare` three per arm, five or
// more is the explicit promotion that may call itself evidence. Isolation is the
// contract reuse checks: standalone, a scrubbed child env, the skill pinned in
// the scratch and a throwaway home. Every invocation has its own run directory,
// and each draw is persisted before the next so `--resume` skips paid work. The
// old -> new flag mapping is in CONTRIBUTING.md; run-evals.mjs/replay-evals.mjs
// are gone rather than wrapped.

import { readdirSync, lstatSync, realpathSync, existsSync, mkdirSync, mkdtempSync, writeFileSync, appendFileSync, readFileSync, rmSync, symlinkSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { join, basename, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { homedir, tmpdir } from "node:os"
import { corpusDir, readEvals } from "./lib/evals/parse.mjs"
import { authProbe, scrubEnv } from "./lib/evals/agent.mjs"
import { corpusRoots, isolateHome, isolationRecord, probeIsolation, resumeIsolation, wrapCommand } from "./lib/evals/isolation.mjs"
import { denySkillTool, fixtureEntries, governedFiles, makeScratch, skillFileHashes, stageFixture, stageSkill, stagedTreeHash, textHash } from "./lib/evals/fixture.mjs"
import { oracleFindings, oracleWarnings } from "./lib/evals/assertions.mjs"
import { summarize, aggregateReps, caseResult, contaminate, isInfrastructure, resumeSkip, PASSED } from "./lib/evals/result.mjs"
import { executeCase } from "./lib/evals/execute.mjs"
import { leaksIn, DETECTOR_VERSION } from "./lib/evals/leak.mjs"
import { parseStop, runScheduled } from "./lib/evals/schedule.mjs"
import { createRun, openRun, listRuns, slug } from "./lib/evals/runs.mjs"
import { summarizeRun, scorecard, formatFailures, armScore, storedRunStatus, formatStoredStatus, storedHostRoots, isolationState, loadCases, transcriptPaths, readManifest, readRunDir, compareRuns, formatComparison } from "./lib/evals/report.mjs"
import { renderHeader, patchStatus, parseTranscript } from "./lib/evals/transcript.mjs"
import { REPLAYABLE } from "./lib/evals/kinds.mjs"
import { evaluateAssertions, skillGate } from "./lib/evals/assertions.mjs"
import { replyText, skillLoads } from "./lib/evals/events.mjs"
import { classify } from "./lib/evals/result.mjs"
import { rejudge } from "./lib/evals/rejudge.mjs"
import { armIdentity, gradingHash, gradingHashFromDraw, isolationContract, reuseDecision, armReplayable } from "./lib/evals/cache.mjs"

const COMMANDS = new Set(["list", "check", "run", "compare", "inspect"])

const opt = {
  command: null,
  positionals: [],
  root: null,
  model: null,
  agent: "build",
  case: null,
  skill: null,
  tags: [],
  level: "behavior",
  timeout: 600,
  stallSeconds: 120,
  judge: null,
  judgeBare: false,
  judgeThreshold: 0.8,
  json: false,
  verbose: false,
  resume: null,
  repeat: null,
  minPass: 1,
  stop: null,
  concurrency: null,
  arm: "with",
  against: null,
  refresh: false,
  dir: null,
  replay: false,
  leaks: false,
  all: false,
  changed: false,
  hostRoots: [],
}

const seen = new Set()
const unknown = []

function usage(message) {
  console.error(message)
  process.exit(2)
}

// A flag's value is the next token; a token that starts with `--` is the next
// flag. Swallowing it is how `--skill --list` selected every skill instead of
// failing.
function valueOf(flag, argv, i) {
  const v = argv[i + 1]
  if (v === undefined || v.startsWith("--")) usage(`${flag} needs a value`)
  return v
}

const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (!a.startsWith("-")) {
    if (!opt.command && COMMANDS.has(a)) opt.command = a
    else opt.positionals.push(a)
    continue
  }
  seen.add(a)
  if (a === "--root") opt.root = valueOf(a, argv, i++)
  else if (a === "--model") opt.model = valueOf(a, argv, i++)
  else if (a === "--agent") opt.agent = valueOf(a, argv, i++)
  else if (a === "--case") opt.case = Number(valueOf(a, argv, i++))
  else if (a === "--skill") opt.skill = valueOf(a, argv, i++)
  else if (a === "--tag") opt.tags.push(...valueOf(a, argv, i++).split(",").map((t) => t.trim()).filter(Boolean))
  else if (a === "--level") opt.level = valueOf(a, argv, i++)
  else if (a === "--timeout") opt.timeout = Number(valueOf(a, argv, i++))
  else if (a === "--stall-seconds") opt.stallSeconds = Number(valueOf(a, argv, i++))
  else if (a === "--judge") {
    const v = argv[i + 1]
    if (v !== undefined && !v.startsWith("-")) {
      opt.judge = v
      i++
    } else {
      opt.judge = "default"
      opt.judgeBare = true
    }
  } else if (a === "--judge-threshold") opt.judgeThreshold = Number(valueOf(a, argv, i++))
  else if (a === "--json") opt.json = true
  else if (a === "--verbose") opt.verbose = true
  else if (a === "--resume") opt.resume = valueOf(a, argv, i++)
  else if (a === "--repeat") opt.repeat = Number(valueOf(a, argv, i++))
  else if (a === "--min-pass") opt.minPass = Number(valueOf(a, argv, i++))
  else if (a === "--stop") opt.stop = valueOf(a, argv, i++)
  else if (a === "--concurrency") opt.concurrency = Number(valueOf(a, argv, i++))
  else if (a === "--arm") opt.arm = valueOf(a, argv, i++)
  else if (a === "--against") opt.against = valueOf(a, argv, i++)
  else if (a === "--refresh") opt.refresh = true
  else if (a === "--dir") opt.dir = resolve(valueOf(a, argv, i++))
  else if (a === "--replay") opt.replay = true
  else if (a === "--leaks") opt.leaks = true
  else if (a === "--all") opt.all = true
  else if (a === "--changed") opt.changed = true
  else if (a === "--host-root") opt.hostRoots.push(resolve(valueOf(a, argv, i++)))
  else if (a === "--quick") {
    usage(
      '--quick is gone: it appended "skip installs/builds/audit" to the prompt, which tested a different policy. Use --level behavior or --level smoke.',
    )
  } else unknown.push(a)
}

if (unknown.length) usage(`unknown flag ${unknown.join(", ")}`)
if (!opt.command) usage(`expected one of ${[...COMMANDS].join(", ")}`)
if (opt.case !== null && !(Number.isInteger(opt.case) && opt.case > 0)) usage(`--case expects a positive integer (got ${opt.case})`)
if (opt.concurrency !== null && !(Number.isInteger(opt.concurrency) && opt.concurrency > 0)) usage(`--concurrency expects a positive integer (got ${opt.concurrency})`)
if (!(Number.isFinite(opt.timeout) && opt.timeout > 0)) usage(`--timeout expects a positive number of seconds (got ${opt.timeout})`)
if (!(Number.isFinite(opt.judgeThreshold) && opt.judgeThreshold > 0 && opt.judgeThreshold <= 1)) usage(`--judge-threshold expects a ratio in (0, 1] (got ${opt.judgeThreshold})`)
if (!["smoke", "behavior", "full"].includes(opt.level)) usage(`unknown --level '${opt.level}' (expected smoke|behavior|full)`)
if (!["with", "without"].includes(opt.arm)) usage(`--arm expects with|without (got ${opt.arm})`)
if (opt.repeat !== null && !(Number.isInteger(opt.repeat) && opt.repeat > 0)) usage(`--repeat expects a positive integer (got ${opt.repeat})`)
if (!(opt.minPass > 0 && opt.minPass <= 1)) usage(`--min-pass expects a ratio in (0, 1] (got ${opt.minPass})`)
if (!(Number.isFinite(opt.stallSeconds) && opt.stallSeconds >= 0)) usage(`--stall-seconds expects a non-negative number of seconds (got ${opt.stallSeconds})`)
if (opt.stop !== null && parseStop(opt.stop) === null) usage(`--stop expects <passes>/<fails>, both integers (got ${opt.stop})`)

// A flag is accepted only where it means something; ignoring one is how the 921
// lines came back.
const ALLOWED = {
  list: ["--root", "--case", "--tag", "--level", "--json"],
  check: ["--root", "--case", "--tag", "--json"],
  run: ["--root", "--model", "--agent", "--case", "--tag", "--level", "--timeout", "--stall-seconds", "--judge", "--judge-threshold", "--json", "--verbose", "--resume", "--repeat", "--min-pass", "--stop", "--concurrency", "--arm"],
  compare: ["--root", "--model", "--agent", "--case", "--tag", "--level", "--timeout", "--stall-seconds", "--judge", "--judge-threshold", "--json", "--verbose", "--repeat", "--min-pass", "--stop", "--concurrency", "--against", "--refresh"],
  inspect: ["--root", "--skill", "--case", "--json", "--verbose", "--judge", "--judge-threshold", "--dir", "--replay", "--leaks", "--all", "--changed", "--host-root"],
}
const disallowed = [...seen].filter((flag) => !ALLOWED[opt.command].includes(flag))
if (disallowed.length) usage(`${disallowed.join(", ")} has no meaning for '${opt.command}' (see --help in CONTRIBUTING.md)`)
// Bare `--judge` means "the model under test" on run/compare; inspect requires one.
if (opt.command === "inspect" && opt.judgeBare) usage("--judge needs a model (or 'default')")

const positionalLimit = { list: 1, check: 1, run: 2, compare: 2, inspect: Infinity }[opt.command]
if (opt.positionals.length > positionalLimit) {
  usage(`'${opt.command}' takes ${positionalLimit === Infinity ? "run directories" : `at most ${positionalLimit} positional argument(s)`}`)
}

const HOME = homedir()
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OUT_ROOT = join(HOME, ".local/share/opencode/evals")
if (!opt.dir) opt.dir = OUT_ROOT

// The host corpus a control draw must not read: the checkout itself (`.git/`,
// `package.json` too), its subdirectories, and the sibling worktrees.
const hostRootsFor = (root) => [
  root,
  join(root, "docs"),
  join(root, "AGENTS.md"),
  join(root, "scripts"),
  join(root, "skills"),
  join(root, "runs"),
  join(root, ".lane/trees"),
]

// The checkout that holds the repo, even when launched from a worktree.
function mainCheckout() {
  const r = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: REPO, encoding: "utf8" })
  if (r.status === 0) {
    const common = r.stdout.trim()
    if (common) return dirname(common)
  }
  return REPO
}
const HOST_ROOTS = [...new Set([...hostRootsFor(mainCheckout()), ...hostRootsFor(REPO)])]

const PROBE = probeIsolation()

function installedRoots() {
  return [join(HOME, ".agents/skills"), join(HOME, ".claude/skills"), join(HOME, ".codex/skills"), join(HOME, ".config/opencode/skills")]
}

function rootsForDiscovery() {
  return (opt.root ? [opt.root] : installedRoots()).filter(existsSync)
}

const CORPUS_ROOTS = corpusRoots({ home: HOME, root: opt.root, hostRoots: HOST_ROOTS })

// Smoke stages only, so its record is the explicit "not applied" marker.
function wrapperFor(level) {
  if (level === "smoke" || !PROBE.enforced || CORPUS_ROOTS.length === 0) return null
  return wrapCommand({ command: "opencode", args: [], roots: CORPUS_ROOTS, mechanism: PROBE.mechanism })
}

function isolationRecordFor(level) {
  if (level === "smoke") return isolationRecord({ reason: "not applied: smoke stages only, no child draw" })
  if (!PROBE.enforced) return isolationRecord({ reason: PROBE.reason })
  if (CORPUS_ROOTS.length === 0) return isolationRecord({ reason: "not applied: no corpus roots found on this host" })
  return isolationRecord({ enforced: true, mechanism: PROBE.mechanism, reason: PROBE.reason })
}

let ISOLATION = null
// The child gets a home with the case in it, not the machine's skills.
function childEnvironment() {
  if (!ISOLATION) {
    ISOLATION = isolateHome(scrubEnv())
    process.once("exit", ISOLATION.cleanup)
  }
  return ISOLATION.env
}

function* skillDirs(dir, collected = new Set()) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const p = join(dir, e.name)
    let real
    try {
      real = lstatSync(p).isSymbolicLink() ? realpathSync(p) : p
    } catch {
      continue
    }
    if (collected.has(real)) continue
    if (existsSync(join(p, "SKILL.md"))) {
      collected.add(real)
      yield { id: basename(p), dir: p }
    } else if (e.isDirectory() || lstatSync(p).isSymbolicLink()) {
      yield* skillDirs(p, collected)
    }
  }
}

function discoverEvals() {
  const found = []
  const collected = new Set()
  for (const root of rootsForDiscovery()) {
    for (const { id, dir } of skillDirs(root)) {
      if (collected.has(id)) continue
      const evals = join(corpusDir(dir), "cases.md")
      if (existsSync(evals)) {
        collected.add(id)
        found.push({ id, dir, evals })
      }
    }
  }
  return found
}

// Every discovered skill, keyed by id: `stage:` can name a sibling with no evals.
function discoverSkillDirs() {
  const found = new Map()
  for (const root of rootsForDiscovery()) {
    for (const { id, dir } of skillDirs(root)) {
      if (!found.has(id)) found.set(id, { id, dir })
    }
  }
  return found
}

function repoSha() {
  const r = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: dirname(fileURLToPath(import.meta.url)), encoding: "utf8" })
  return r.status === 0 ? r.stdout.trim() : "unknown"
}

// Without --model the child inherits the config model; resolve it so the
// artifact is attributable.
function resolveModel() {
  if (opt.model) return opt.model
  try {
    const config = JSON.parse(readFileSync(join(HOME, ".config/opencode/opencode.json"), "utf8"))
    return config.model ? `${config.model} (config default)` : "default"
  } catch {
    return "default"
  }
}
const EFFECTIVE_MODEL = resolveModel()

// A judge that is the model under test says so: the score is agreement, not quality.
const TARGET = EFFECTIVE_MODEL.replace(/ \(config default\)$/, "")
const JUDGE_MODEL = opt.judge ? (opt.judge === "default" ? TARGET : opt.judge) : null
const SELF_JUDGED = JUDGE_MODEL !== null && JUDGE_MODEL === TARGET

let authChecked = false
function ensureAuth() {
  if (authChecked) return
  authChecked = true
  const probe = authProbe({ model: EFFECTIVE_MODEL })
  if (!probe.ok) {
    console.error(`auth probe failed: ${probe.detail}`)
    process.exit(1)
  }
}

function judgeConfig() {
  return opt.judge ? { model: JUDGE_MODEL, threshold: opt.judgeThreshold, selfJudged: SELF_JUDGED } : null
}

// A reused draw is as good as a paid one once the caller has proven it safe.
function isRunDir(path) {
  if (!path) return false
  const dir = resolve(path)
  return existsSync(join(dir, "manifest.json")) && existsSync(join(dir, "cases"))
}

// `compare` has two forms: two run directories are the whole-run regression diff;
// `<skill> <n>` is the arm comparison. Directories are checked first.
function runDiffCommand(a, b) {
  // This form reads two directories; every other flag would be ignored (F1).
  const ignored = [...seen].filter((flag) => flag !== "--json")
  if (ignored.length) usage(`${ignored.join(", ")} cannot be used with compare <run-dir-a> <run-dir-b>`)
  const [baseline, current] = [resolve(a), resolve(b)]
  if (!isRunDir(baseline)) usage(`not a run directory (no manifest.json/cases): ${baseline}`)
  if (!isRunDir(current)) usage(`not a run directory (no manifest.json/cases): ${current}`)
  const before = readRunDir(baseline)
  const after = readRunDir(current)
  if (!before.results.length) usage(`no case results in ${baseline}`)
  if (!after.results.length) usage(`no case results in ${current}`)
  const comparison = compareRuns(before, after)
  if (opt.json) {
    console.log(JSON.stringify({ baseline, current, ...comparison }, null, 2))
  } else {
    console.log(formatComparison(comparison, baseline))
  }
  return comparison.ok ? 0 : 1
}

async function main() {
  if (opt.command === "inspect") return inspectCommand()
  if (opt.command === "compare" && isRunDir(opt.positionals[0]) && isRunDir(opt.positionals[1])) {
    return runDiffCommand(opt.positionals[0], opt.positionals[1])
  }

  const skillFilter = opt.positionals[0] ?? null
  if (opt.command === "run" || opt.command === "compare") {
    if (opt.command === "compare" && opt.positionals.length < 2) usage("compare needs <skill> <n>")
    const positional = opt.positionals[1] === undefined ? null : Number(opt.positionals[1])
    if (positional !== null && (!Number.isInteger(positional) || positional < 1)) {
      usage(`case number expects a positive integer (got ${opt.positionals[1]})`)
    }
    if (positional !== null) {
      if (opt.case !== null && opt.case !== positional) usage(`--case ${opt.case} and positional ${positional} disagree`)
      opt.case = positional
    }
  }

  const corpus = loadCorpus(skillFilter)
  for (const warning of corpus.warnings) console.error(`warn: ${warning}`)
  for (const error of corpus.errors) console.error(`error: ${error}`)
  if (corpus.errors.length && opt.command !== "list") {
    console.error(`\n${corpus.errors.length} validation error(s); refusing to run.`)
    return 1
  }

  if (opt.command === "list") return listCommand(corpus)
  if (opt.command === "check") return checkCommand(corpus)
  if (opt.command === "run") return runCommand(corpus)
  if (opt.command === "compare") return compareCommand(corpus)
  return 2
}

function loadCorpus(skillFilter) {
  const skills = discoverEvals().filter((s) => !skillFilter || s.id === skillFilter)
  if (!skills.length) {
    usage(skillFilter ? `no skill "${skillFilter}" with evals/${skillFilter}/cases.md` : "no skills with evals/<id>/cases.md found")
  }

  const known = discoverSkillDirs()
  const plan = []
  const warnings = []
  const errors = []
  for (const s of skills) {
    const parsed = readEvals(s.evals, s.id, { skillDir: s.dir })
    errors.push(...parsed.errors.map((e) => `${s.id}: ${e}`))
    warnings.push(...parsed.warnings.map((w) => `${s.id}: ${w}`))
    for (const c of parsed.cases) {
      // `stage:` is validated against every discovered skill, not the selection.
      for (const id of c.stage ?? []) {
        if (id === s.id) errors.push(`${s.id}: case ${c.n}: stage '${id}' names the skill under review`)
        else if (!known.has(id)) errors.push(`${s.id}: case ${c.n}: unknown stage '${id}'`)
      }
      // SPEC-0057: an existence target the fixture lacks is a warning the draw
      // may satisfy by creating it; the listing answers it without staging.
      for (const w of oracleWarnings(c, fixtureEntries(s, c))) {
        warnings.push(`${s.id}: case ${c.n}: ${w.kind} ${w.arg} — ${w.reason}`)
      }
      if (opt.case !== null && c.n !== opt.case) continue
      plan.push({ skill: s, c })
    }
  }

  const tagged = opt.tags.length ? plan.filter(({ c }) => opt.tags.every((t) => c.tags.includes(t))) : plan
  const runnable = tagged.filter(({ c }) => c.status === "run")
  const manual = tagged.filter(({ c }) => c.status === "manual")
  // `needs: gates` is skipped by a behavioural run but still checked and staged:
  // the declaration is validated by `check`, not silently dropped.
  const skipped = opt.level === "behavior" ? runnable.filter(({ c }) => c.needs.includes("gates")) : []
  const selected = runnable.filter((p) => !skipped.includes(p))
  return { skills, known, plan: tagged, runnable, manual, skipped, selected, warnings, errors }
}

function listCommand(corpus) {
  if (opt.json) {
    console.log(
      JSON.stringify(
        {
          cases: corpus.plan.map(({ skill, c }) => ({
            skill: skill.id,
            case: c.n,
            title: c.title,
            status: c.status,
            needs: c.needs,
            tags: c.tags,
            stage: c.stage,
            assertions: c.assert.length,
          })),
          parseable: corpus.plan.length,
          runnable: corpus.runnable.length,
          manual: corpus.manual.length,
        },
        null,
        2,
      ),
    )
    return 0
  }
  console.log(
    `Parsed ${corpus.plan.length} case(s)${opt.tags.length ? ` tagged ${opt.tags.join("+")}` : ""}: ${corpus.runnable.length} runnable, ${corpus.manual.length} manual\n`,
  )
  for (const { skill, c } of corpus.plan) {
    const marks = [
      c.status === "manual" ? "manual" : "",
      c.needs.length ? `needs:${c.needs.join("+")}` : "",
      c.tags.length ? `tags:${c.tags.join("+")}` : "",
      `${c.expect.length} expectations`,
    ]
      .filter(Boolean)
      .join("  ")
    const prompt = (c.prompt || c.title).replace(/\n/g, " ")
    console.log(`  ${skill.id} #${c.n}: ${prompt.slice(0, 64)}${prompt.length > 64 ? "…" : ""}  [${marks}]`)
  }
  if (opt.level === "behavior" && corpus.skipped.length) {
    console.log(`\n${corpus.skipped.length} case(s) skipped at --level behavior (needs: gates).`)
  }
  return 0
}

// A tiny pool for staging: `check` does no model work, but a corpus of git
// fixtures is slow enough to want the same four lanes a run uses.
async function pool(items, limit, fn) {
  const results = new Array(items.length)
  let cursor = 0
  const lanes = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index])
    }
  })
  await Promise.all(lanes)
  return results
}

// `check` is `--level smoke` for the whole corpus: no model, no run directory.
async function checkCommand(corpus) {
  const findings = [...corpus.errors]
  const targets = corpus.runnable
  const results = await pool(targets, 4, async ({ skill, c }) => {
    const scratch = makeScratch(skill.id, c.n)
    try {
      stageFixture(skill, c, scratch)
      const dead = oracleFindings(c, scratch).filter((f) => f.level === "error")
      for (const d of dead) findings.push(`${skill.id}: case ${c.n}: ${d.kind} ${d.arg} (${d.reason})`)
      const governs = governedFiles(skill.dir, c.governs)
      skillFileHashes(skill.dir, governs)
      stageSkill(skill, scratch)
      for (const sibling of siblingsFor(corpus.known, c)) stageSkill(sibling, scratch)
      denySkillTool(scratch)
      return dead.length ? null : `${skill.id} #${c.n}`
    } catch (e) {
      findings.push(`${skill.id}: case ${c.n}: ${e.message}`)
      return null
    } finally {
      rmSync(scratch, { recursive: true, force: true })
      rmSync(`${scratch}-origin.git`, { recursive: true, force: true })
    }
  })
  const staged = results.filter(Boolean).length

  if (opt.json) {
    console.log(
      JSON.stringify(
        {
          parsed: corpus.plan.length,
          runnable: corpus.runnable.length,
          manual: corpus.manual.length,
          staged,
          warnings: corpus.warnings,
          findings,
        },
        null,
        2,
      ),
    )
  } else {
    console.log(
      `Parsed ${corpus.plan.length} case(s): ${corpus.runnable.length} runnable, ${corpus.manual.length} manual; ${staged} fixture(s) staged.`,
    )
    for (const finding of findings) console.error(`finding: ${finding}`)
    console.log(findings.length ? `\n${findings.length} finding(s).` : "\nNo findings.")
  }
  return findings.length ? 1 : 0
}

function siblingsFor(known, c) {
  return (c.stage ?? []).map((id) => known.get(id)).filter(Boolean)
}

// Smoke proves the fixture and the skill stage cleanly; every other level stages
// inside executeCase.
async function runCase(ctx, c, rep = null) {
  const { skill, run, level, arm } = ctx
  const scratch = makeScratch(skill.id, c.n)
  const file = run.transcriptPath(skill.id, c.n, rep)
  const index = rep?.index ?? 1
  // Persist the draw before the next starts: `--resume` reads it back.
  const save = (result) => {
    run.writeDraw(skill.id, c.n, index, result)
    return result
  }
  mkdirSync(dirname(file), { recursive: true })
  const started = Date.now()
  const meta = { skill: skill.id, case: c.n, repoSha: repoSha(), agent: opt.agent, model: EFFECTIVE_MODEL, level }

  const writeFailure = (reason, err = "") => {
    writeFileSync(
      file,
      renderHeader({ skill: skill.id, n: c.n, prompt: c.prompt, scratch, status: "failed", reason }) + `\n\n\`\`\`\n${err}\n\`\`\`\n`,
    )
  }

  if (level === "smoke") {
    let pinned = { hash: null }
    let stagedSkills = []
    let fixture = { hash: null }
    let governs = []
    let skillHashes = {}
    try {
      fixture = stageFixture(skill, c, scratch)
      // Smoke is where a snapshot assertion no fixture can satisfy is cheapest
      // to catch (SPEC-0057).
      const dead = oracleFindings(c, scratch).filter((f) => f.level === "error")
      if (dead.length) {
        const detail = dead.map((d) => `${d.kind} ${d.arg} (${d.reason})`).join("; ")
        throw new Error(`case ${c.n}: assertion target not produced by the fixture: ${detail}`)
      }
      governs = governedFiles(skill.dir, c.governs)
      skillHashes = skillFileHashes(skill.dir, governs)
      if (arm === "without-skill") denySkillTool(scratch)
      else {
        pinned = stageSkill(skill, scratch)
        stagedSkills = ctx.siblings.map(({ id, dir }) => ({ id, hash: stageSkill({ id, dir }, scratch).hash }))
      }
    } catch (e) {
      writeFailure("fixture failed to stage", `${e.message}\n${e.stderr ?? ""}`)
      return save(
        caseResult(skill, c, {
          status: "failed",
          reason: "fixture failed to stage",
          skillHash: null,
          fixtureHash: null,
          promptHash: textHash(c.prompt),
          detectorVersion: DETECTOR_VERSION,
          assertions: [],
          transcript: file,
        }),
      )
    }
    writeFileSync(
      file,
      renderHeader({
        skill: skill.id,
        n: c.n,
        prompt: c.prompt,
        scratch,
        status: "staged",
        reason: "staged only (smoke)",
        skillHash: pinned.hash,
        meta: { repoSha: meta.repoSha, agent: meta.agent, level: "smoke" },
      }) +
        `\n\n## Expectations (human-checked)\n\n${c.expect.map((e) => `- [ ] ${e}`).join("\n")}\n\n` +
        `## Assertions (auto-checked)\n\nnot run at --level smoke\n`,
    )
    return save(
      caseResult(skill, c, {
        status: "staged",
        reason: "staged only (smoke)",
        skillHash: pinned.hash,
        skillHashes,
        governs,
        stagedSkills,
        fixtureHash: fixture.hash,
        promptHash: textHash(c.prompt),
        detectorVersion: DETECTOR_VERSION,
        // SPEC-0067: the draw says which boundary it ran under. A smoke draw
        // never ran a child, so its record says that instead of claiming one.
        isolation: ctx.isolation,
        assertions: [],
        execution: { durationMs: Date.now() - started },
        meta: { repoSha: meta.repoSha, agent: meta.agent, model: meta.model, level: meta.level },
        transcript: file,
      }),
    )
  }

  let exec
  try {
    exec = await executeCase({
      skill,
      c,
      scratch,
      arm,
      siblings: ctx.siblings,
      model: opt.model,
      agent: opt.agent,
      standalone: true,
      timeoutMs: opt.timeout * 1000,
      stallMs: opt.stallSeconds * 1000,
      env: childEnvironment(),
      wrapper: ctx.wrapper,
      judge: ctx.judge,
    })
  } catch (e) {
    writeFailure("fixture failed to stage", `${e.message}\n${e.stderr ?? ""}`)
    return save(
      caseResult(skill, c, {
        status: "failed",
        reason: "fixture failed to stage",
        skillHash: null,
        fixtureHash: null,
        promptHash: textHash(c.prompt),
        detectorVersion: DETECTOR_VERSION,
        assertions: [],
        transcript: file,
      }),
    )
  }

  // A retry re-stages in a fresh scratch, so the leak check and transcript must
  // point at the attempt that produced this result.
  const { result: core, out, err, code, pinned: staged, gate, asserts, judged, durationMs, scratch: finalScratch } = exec
  // The leak is per draw: this transcript and this scratch.
  const leaks = leaksIn(out, finalScratch ?? scratch, HOST_ROOTS, { enforced: ctx.isolation.enforced === true })
  const clean = contaminate(core, leaks, { all: !rep })
  const skillLabel =
    arm === "without-skill"
      ? `**Skill:** ${gate.ok ? "not loaded (control arm)" : "LOADED — the control arm is broken"} (${gate.reason})`
      : `**Skill:** ${gate.ok ? "loaded" : "MISSING"} (${gate.reason})`

  const result = caseResult(skill, c, {
    ...clean,
    // `leaks` keeps the `kind` per entry so the checker separates a leak, a host
    // read and a denied attempt (SPEC-0048).
    leak: leaks,
    // SPEC-0067: the boundary this draw itself ran under, so a resumed cell can
    // be read per draw instead of trusting one manifest verdict.
    isolation: ctx.isolation,
    ...(rep ? { rep: rep.index } : {}),
    meta: { repoSha: meta.repoSha, agent: meta.agent, model: meta.model, level: meta.level },
    transcript: file,
  })

  const assertBlock = asserts.length
    ? `## Assertions (auto-checked)\n\n${asserts
        .map((a) => `- [${a.pass ? "x" : " "}] ${a.kind} ${a.arg}${a.detail ? ` (${a.detail})` : ""}`)
        .join("\n")}\n\n`
    : "## Assertions (auto-checked)\n\nnone — case is unscored\n\n"
  writeFileSync(
    file,
    renderHeader({
      skill: skill.id,
      n: c.n,
      prompt: c.prompt,
      scratch: finalScratch ?? scratch,
      exit: code,
      status: result.status,
      reason: result.reason,
      skillLine: skillLabel,
      skillHash: staged.hash,
      meta: { repoSha: meta.repoSha, agent: meta.agent, model: meta.model, level: meta.level },
      durationMs,
    }) +
      `\n\n## Expectations (human-checked)\n\n${c.expect.map((e) => `- [ ] ${e}`).join("\n")}\n\n` +
      assertBlock +
      `## Transcript\n\n\`\`\`\n${out}\n\`\`\`\n\n${err ? `## stderr\n\n\`\`\`\n${err}\n\`\`\`\n` : ""}`,
  )

  if (judged) {
    const { outcome, parsed, threshold } = judged
    const section =
      `\n## Semantic check (${JUDGE_MODEL})\n\n` +
      `**Score:** ${outcome.score.toFixed(2)} (threshold ${threshold}) — ${outcome.ok ? "ok" : outcome.reason}\n\n` +
      (parsed?.verdicts ?? []).map((v) => `- [${v.verdict === "met" ? "x" : " "}] ${v.i}: ${v.verdict}${v.evidence ? ` — ${v.evidence}` : ""}`).join("\n") +
      "\n"
    appendFileSync(file, section)
    patchHeader(file, result)
  }
  return save(result)
}

// The header is written before the judge runs, so the status line has to be
// rewritten once the semantic verdict lands.
function patchHeader(file, { status, reason }) {
  writeFileSync(file, patchStatus(readFileSync(file, "utf8"), status, reason))
}

// The case artifact is written once, after every draw: no draw touches it.
function finalizeCase(state, { run, minPass }) {
  const { skill, c } = state.item
  const reps = state.results
  const first = reps[0]
  const provenance = {
    fixtureHash: first?.fixtureHash ?? null,
    promptHash: first?.promptHash ?? null,
    detectorVersion: first?.detectorVersion ?? null,
  }

  if (state.item.times === 1) {
    const single = { ...first, sequence: state.sequence, stoppedEarly: false }
    run.writeResult(skill.id, c.n, single)
    return { ...single, transcript: run.transcriptPath(skill.id, c.n, null), repLine: "" }
  }

  // One verdict from a non-deterministic agent is one draw. The case passes only
  // when every repetition does, unless --min-pass says otherwise out loud.
  const agg = aggregateReps(reps, minPass)
  const artifact = caseResult(skill, c, {
    status: agg.status,
    reason: agg.reason,
    passRate: agg.passRate,
    passed: agg.passed,
    reps: agg.total,
    contaminated: agg.contaminated,
    infrastructure: agg.infrastructure,
    denied: reps.reduce((n, r) => n + (r.denied ?? 0), 0),
    stoppedEarly: state.stoppedEarly,
    sequence: state.sequence,
    ...provenance,
    skillHash: first?.skillHash ?? null,
    skillHashes: first?.skillHashes ?? {},
    governs: first?.governs ?? [],
    stagedSkills: first?.stagedSkills ?? [],
    arm: first?.arm,
    meta: first?.meta ?? {},
    repetitions: reps,
  })
  run.writeResult(skill.id, c.n, artifact)
  // The console summary drops the per-repetition array; the artifact keeps it.
  const { repetitions: _reps, ...summary } = artifact
  const repLine = reps
    .map((r, i) => `r${state.indexes[i] ?? i + 1}:${r.infrastructure ? "infrastructure" : r.contaminated ? "contaminated" : r.status}`)
    .join(" ")
  return {
    ...summary,
    transcript: run.transcriptPath(skill.id, c.n, { index: 1 }),
    repLine,
  }
}

// Why a stored draw was discarded. The field was added after the first stalled
// runs, so an older artifact only carries it in the reason; an unknown status is
// named by itself rather than guessed as infrastructure.
function discardedReason(draw) {
  if (draw?.infrastructureReason) return draw.infrastructureReason
  const match = /^infrastructure:\s*(.+)$/.exec(draw?.reason ?? "")
  if (match) return match[1]
  return draw?.status ?? "unknown"
}

// `--resume` says what it reused and which slots it refused to reuse, so a
// resumed wave is never silently a different wave. It prints either way, or an
// all-reused resume is indistinguishable from an older build that had no line.
// stderr keeps `--json` stdout one document; the label already names the skill,
// so a slot is `#<case> r<index>`. The noun comes from the draws, not the
// message: a future re-runnable status is "discarded", not "infrastructure".
function reportResume({ reran, reused }) {
  if (!reran.length) {
    console.error(`resume: reusing ${reused} draw(s), 0 re-run`)
    return
  }
  const slots = [...reran]
    .sort((a, b) => a.case - b.case || a.index - b.index)
    .map((r) => `#${r.case} r${r.index}, ${discardedReason(r.draw)}`)
  const noun = reran.every((r) => isInfrastructure(r.draw)) ? "infrastructure" : "discarded"
  console.error(`resume: re-running ${slots.length} ${noun} ${slots.length === 1 ? "draw" : "draws"} (${slots.join("; ")})`)
}

// Every draw of a selection through one lane pool, then one run artifact.
async function executeSelection({ items, arm, level, repeat, label, known, baseline = null, resumeDir = null }) {
  const started = Date.now()
  const isolation = isolationRecordFor(level)
  const wrapper = wrapperFor(level)
  if (level !== "smoke") ensureAuth()

  const concurrency = opt.concurrency ?? (level === "smoke" ? 1 : 4)
  const stop =
    level === "smoke" ? null : opt.stop !== null ? parseStop(opt.stop) : repeat > 5 ? { passes: 5, fails: 3 } : null

  const run = resumeDir
    ? openRun(resolve(resumeDir))
    : createRun({
        root: OUT_ROOT,
        label,
        arm,
        model: opt.model,
        agent: opt.agent,
        level,
        repoSha: repoSha(),
        params: {
          concurrency,
          repeat,
          stop,
          stallMs: opt.stallSeconds * 1000,
          // The checker may only say `isolated=yes` when the run itself records
          // that the child got a scratch cwd and a throwaway home.
          isolate: true,
          // SPEC-0046: `enforced` only when the wrapper reached the child.
          isolation,
          // Machine-specific, so the run carries them: the replay must judge the
          // transcript against the checkout that produced it, not its own.
          hostRoots: HOST_ROOTS,
          effectiveModel: EFFECTIVE_MODEL,
          baseline,
        },
      })
  // A mixed run records the weaker truth, so it cannot print `isolated=yes`.
  if (resumeDir) resumeIsolation(run.manifest, isolation)

  const scheduledItems = items.map(({ skill: itemSkill, c }) => ({ skill: itemSkill, c, times: level === "smoke" ? 1 : repeat }))
  // Slots the harness discarded in the original run: `--resume` re-runs them.
  const reran = []
  let reused = 0
  const scheduled = await runScheduled({
    cases: scheduledItems,
    concurrency,
    stop,
    runDraw: ({ skill: drawSkill, c, rep }) => {
      // A scored draw is already paid for: return it, do not stage or spawn. A
      // draw the harness discarded (infrastructure) is not a result; re-run it.
      if (resumeDir) {
        const cached = run.readDraw(drawSkill.id, c.n, rep?.index ?? 1)
        if (cached) {
          if (resumeSkip(cached)) {
            reused++
            return cached
          }
          reran.push({ case: c.n, index: rep?.index ?? 1, draw: cached })
        }
      }
      return runCase(
        {
          skill: drawSkill,
          run,
          level,
          arm,
          wrapper,
          isolation,
          siblings: siblingsFor(known, c),
          judge: judgeConfig(),
        },
        c,
        rep,
      )
    },
  })
  if (resumeDir) reportResume({ reran, reused })
  const results = scheduled.map((state) => finalizeCase(state, { run, minPass: opt.minPass }))
  const totals = summarize(results)
  // SPEC-0067: the summary is derived from the draws this invocation leaves
  // behind, including the ones it reused, and persisted by `finish()`. Run it
  // again here because the draws added after the first call now have records.
  if (resumeDir) {
    resumeIsolation(
      run.manifest,
      isolation,
      scheduled.flatMap((state) => state.results).filter((draw) => !isInfrastructure(draw)),
    )
  }

  run.finish({
    counts: {
      passed: totals.passed,
      failed: totals.failed,
      unscored: totals.unscored,
      staged: totals.staged ?? 0,
      contaminated: totals.contaminated,
      infrastructure: totals.infrastructure,
    },
  })
  const summary = summarizeRun({
    results,
    repoSha: repoSha(),
    agent: opt.agent,
    model: EFFECTIVE_MODEL,
    level,
    startedAt: new Date(started).toISOString(),
  })
  return { dir: run.dir, run, manifest: run.manifest, results, totals, summary }
}

function caseLine(result, { repeat = 1, level = "behavior" } = {}) {
  const reps = result.reps ?? 1
  const passed = result.passed ?? (result.status === PASSED ? 1 : 0)
  const excluded = (result.contaminated ?? 0) + (result.infrastructure ?? 0)
  const clean = result.reps !== undefined ? result.reps - excluded : null
  const rate = excluded
    ? ` [${passed}/${clean} clean, ${result.contaminated ?? 0} contaminated, ${result.infrastructure ?? 0} infrastructure]`
    : ` [${passed}/${reps}]`
  const label = level === "smoke" ? "staging" : reps >= 5 ? "evidence" : "screening"
  const stopped = result.stoppedEarly ? ` stopped early (${reps}/${repeat})` : ""
  return `${result.skill} #${result.case}: ${result.status}${rate} — ${label}${stopped}${result.reason ? ` (${result.reason})` : ""} — ${result.transcript}${result.repLine ? `\n     ${result.repLine}` : ""}`
}

async function runCommand(corpus) {
  const skillId = opt.positionals[0] ?? null
  const label = skillId ?? (opt.tags.length ? opt.tags.join("+") : "all")
  const repeat = opt.repeat ?? 1

  // A resumed run carries the arm, level and repeat of the invocation that
  // created it; a different value would index the wrong draws.
  let resumeDir = null
  if (opt.resume) {
    const dir = resolve(opt.resume)
    const manifestPath = join(dir, "manifest.json")
    if (!existsSync(manifestPath)) usage(`--resume: no manifest.json in ${dir}`)
    let manifest
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    } catch (e) {
      usage(`--resume: manifest.json is not valid JSON: ${e.message}`)
    }
    const arm = opt.arm === "without" ? "without-skill" : "with-skill"
    if (manifest.arm !== arm) usage(`--resume: run used arm ${manifest.arm}, got ${arm}`)
    if (manifest.level !== opt.level) usage(`--resume: run used --level ${manifest.level}, got ${opt.level}`)
    const recordedRepeat = manifest.params?.repeat ?? 1
    if (opt.repeat === null) opt.repeat = recordedRepeat
    else if (opt.repeat !== recordedRepeat) usage(`--resume: run used --repeat ${recordedRepeat}, got ${opt.repeat}`)
    if (manifest.label !== label) usage(`--resume: run selected '${manifest.label}', got '${label}'`)
    resumeDir = dir
  }

  if (!corpus.selected.length) {
    console.error(corpus.runnable.length ? "no runnable case selected at this level" : "no runnable case selected")
    return 1
  }

  const effectiveRepeat = opt.repeat ?? repeat
  const result = await executeSelection({
    items: corpus.selected,
    arm: opt.arm === "without" ? "without-skill" : "with-skill",
    level: opt.level,
    repeat: effectiveRepeat,
    label,
    known: corpus.known,
    resumeDir,
  })

  writeFileSync(join(OUT_ROOT, "last-run.json"), JSON.stringify(result.summary, null, 2))

  if (opt.json) {
    console.log(JSON.stringify(result.summary, null, 2))
    return result.totals.failed || result.totals.unscored ? 1 : 0
  }

  if (SELF_JUDGED) console.error(`judge: ${JUDGE_MODEL} is also the model under test (self-judged)`)
  console.log(
    `Isolation: standalone=true, child env scrubbed (OPENCODE*, AI_AGENT), home isolated, skill pinned in scratch\n`,
  )
  console.log(
    `Level: ${opt.level} (concurrency=${opt.concurrency ?? (opt.level === "smoke" ? 1 : 4)}, agent=${opt.agent}, model=${opt.model ?? "default"}, arm=${opt.arm === "without" ? "without-skill" : "with-skill"}` +
      `${opt.judge ? `, judge=${opt.judge}@${opt.judgeThreshold}` : ""}` +
      `${effectiveRepeat > 1 ? `, repeat=${effectiveRepeat}@min-pass=${opt.minPass}` : ""}` +
      `, stall=${opt.stallSeconds}s)\n`,
  )
  for (const r of result.results) console.log(caseLine(r, { repeat: effectiveRepeat, level: opt.level }))
  const totals = result.totals
  console.log(
    `\n${totals.passed} passed, ${totals.failed} failed, ${totals.unscored} unscored` +
      (totals.contaminated ? `, ${totals.contaminated} contaminated` : "") +
      (totals.infrastructure ? `, ${totals.infrastructure} infrastructure` : "") +
      (totals.staged ? `, ${totals.staged} staged` : "") +
      ` (of ${totals.total}).`,
  )
  if (corpus.skipped.length) console.log(`${corpus.skipped.length} case(s) skipped at --level ${opt.level} (needs: gates).`)
  console.error(`Run directory: ${result.dir}`)
  console.log(`Run artifact: ${join(OUT_ROOT, "last-run.json")}`)
  return totals.failed || totals.unscored ? 1 : 0
}

// The skill tree at a commit, with `<tmp>/evals -> <repo>/evals` so the staged
// skill is the one from the ref while its fixtures come from the checkout.
function exportSkillAt(ref, id) {
  const root = mkdtempSync(join(tmpdir(), `eval-baseline-${id}-`))
  const verify = spawnSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], { cwd: REPO, encoding: "utf8" })
  if (verify.status !== 0) throw new Error(`--against: '${ref}' is not a commit in ${REPO}`)
  const listing = spawnSync("git", ["ls-tree", "-r", ref, "--", `skills/${id}`], { cwd: REPO, encoding: "utf8" })
  if (listing.status !== 0) throw new Error(`--against: git ls-tree failed: ${listing.stderr.trim()}`)
  const rows = listing.stdout.split("\n").filter(Boolean)
  if (!rows.length) throw new Error(`--against: '${ref}' has no skills/${id}`)
  const dest = join(root, "skills", id)
  mkdirSync(dest, { recursive: true })
  for (const row of rows) {
    const tab = row.indexOf("\t")
    const [mode] = row.slice(0, tab).split(/\s+/)
    const path = row.slice(tab + 1)
    const rel = path.slice(`skills/${id}/`.length)
    const blob = spawnSync("git", ["show", `${ref}:${path}`], { cwd: REPO })
    if (blob.status !== 0) throw new Error(`--against: git show ${ref}:${path} failed`)
    const target = join(dest, rel)
    mkdirSync(dirname(target), { recursive: true })
    if (mode === "120000") symlinkSync(blob.stdout.toString().trim(), target)
    else writeFileSync(target, blob.stdout, { mode: mode === "100755" ? 0o755 : 0o644 })
  }
  symlinkSync(join(REPO, "evals"), join(root, "evals"))
  process.once("exit", () => rmSync(root, { recursive: true, force: true }))
  return { id, dir: dest }
}

function readCaseResult(dir, skillId, n) {
  const file = join(dir, "cases", `${slug(skillId)}--${String(n).padStart(2, "0")}`, "result.json")
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, "utf8"))
  } catch {
    return null
  }
}

// The identity `compare` reuses on. `skillHash` is null on the control arm: the
// skill under review is not staged there, so there is nothing to compare.
function currentIdentity({ skill, c, arm }) {
  let fixtureHash = null
  const scratch = makeScratch(skill.id, c.n)
  try {
    fixtureHash = stageFixture(skill, c, scratch).hash
  } finally {
    rmSync(scratch, { recursive: true, force: true })
    rmSync(`${scratch}-origin.git`, { recursive: true, force: true })
  }
  const isolation = isolationRecordFor("behavior")
  return armIdentity({
    model: EFFECTIVE_MODEL,
    promptHash: textHash(c.prompt),
    fixtureHash,
    // A judged arm is never reused: the stored draw records the score, not the
    // `expect:` text it was scored against, so the grading input is unknowable.
    gradingHash: opt.judge ? null : gradingHash({ assert: c.assert, gate: c.gate }),
    skillHash: arm === "without-skill" ? null : stagedTreeHash(skill.dir),
    isolation: isolationContract({ isolate: true, ...isolation }),
  })
}

function storedIdentity(dir, result) {
  const manifest = readManifest(dir) ?? {}
  const draw = (result.repetitions ?? [result])[0] ?? {}
  const record = manifest.params?.isolation
  return armIdentity({
    model: manifest.params?.effectiveModel ?? manifest.model,
    promptHash: draw.promptHash,
    fixtureHash: draw.fixtureHash,
    gradingHash: gradingHashFromDraw(draw),
    skillHash: draw.skillHash ?? null,
    isolation: isolationContract({ isolate: manifest.params?.isolate === true, ...(record ?? {}) }),
  })
}

function findReusable({ skill, c, arm, repeat, level, baseline, current }) {
  const runs = listRuns(OUT_ROOT).sort().reverse()
  for (const dir of runs) {
    const manifest = readManifest(dir)
    if (!manifest || manifest.status !== "completed") continue
    if (manifest.label !== skill.id || manifest.level !== level || manifest.arm !== arm) continue
    if ((manifest.params?.baseline ?? null) !== (baseline ?? null)) continue
    if ((manifest.params?.repeat ?? 1) !== repeat) continue
    const result = readCaseResult(dir, skill.id, c.n)
    if (!result) continue
    // A stopped-early or short arm is a different experiment, and a judged arm
    // carries a score the stored draw cannot justify to a non-judged compare.
    if (!armReplayable(result, { repeat }).reusable) continue
    const decision = reuseDecision({ current, stored: storedIdentity(dir, result), refresh: opt.refresh })
    if (decision.reuse) return { dir, result, decision }
  }
  return null
}

async function compareCommand(corpus) {
  if (corpus.plan.length !== 1) {
    usage("compare takes exactly one case (<skill> <n>)")
  }
  const { skill, c } = corpus.plan[0]
  if (c.status !== "run") usage(`case ${c.n} is manual; compare measures runnable cases`)
  const repeat = opt.repeat ?? 3
  const level = opt.level
  if (level === "smoke") usage("compare measures behaviour; use run --level smoke to prove staging")

  let baselineSkill = null
  if (opt.against) {
    try {
      baselineSkill = exportSkillAt(opt.against, skill.id)
    } catch (e) {
      console.error(e.message)
      return 1
    }
  }

  const definitions = [{ name: "none", arm: "without-skill", skill, baseline: null }]
  if (baselineSkill) definitions.push({ name: "baseline", arm: "with-skill", skill: baselineSkill, baseline: opt.against })
  definitions.push({ name: "candidate", arm: "with-skill", skill, baseline: null })

  const arms = []
  for (const definition of definitions) {
    const current = currentIdentity({ skill: definition.skill, c, arm: definition.arm })
    // Never reuse a judged arm; the identity is intentionally null for grading.
    const reusable = opt.judge ? null : findReusable({ skill: definition.skill, c, arm: definition.arm, repeat, level, baseline: definition.baseline, current })
    if (reusable) {
      console.error(`reused ${reusable.dir}`)
      arms.push({ arm: definition.name, dir: reusable.dir, reused: true, manifest: readManifest(reusable.dir), result: reusable.result })
      continue
    }
    const executed = await executeSelection({
      items: [{ skill: definition.skill, c }],
      arm: definition.arm,
      level,
      repeat,
      label: definition.skill.id,
      known: corpus.known,
      baseline: definition.baseline,
    })
    console.error(`ran ${executed.dir}`)
    arms.push({ arm: definition.name, dir: executed.dir, reused: false, manifest: executed.manifest, result: executed.results[0], summary: executed.summary })
  }

  const scored = arms.map(({ arm, result }) => ({ arm, score: armScore(result) }))
  const record = {
    skill: skill.id,
    case: c.n,
    model: EFFECTIVE_MODEL,
    level,
    repeat,
    label: repeat >= 5 ? "evidence" : "screening",
    arms: arms.map(({ arm, dir, reused, manifest, result, summary }) => ({
      arm,
      run: dir,
      reused,
      manifest,
      // The same `last-run.json` record `run` writes; the comparison wraps it
      // rather than inventing a second schema for a single arm.
      summary: summary ?? summarizeRun({ results: [result], repoSha: manifest?.repoSha, agent: opt.agent, model: EFFECTIVE_MODEL, level, startedAt: manifest?.startedAt }),
    })),
  }

  if (opt.json) {
    console.log(JSON.stringify(record, null, 2))
    return 0
  }
  console.log(scorecard({ skill: skill.id, n: c.n, model: EFFECTIVE_MODEL, repeat, arms: scored }))
  if (opt.verbose) {
    const failures = formatFailures(scored)
    if (failures) console.log(`\n${failures}`)
  }
  return 0
}

// inspect — the stored run, read back without a new agent draw.

async function inspectCommand() {
  const dirs = opt.positionals.map((p) => resolve(p))

  if (opt.leaks && opt.judge) usage("--leaks is model-free; drop --judge")
  if ([opt.leaks, opt.replay, Boolean(opt.judge)].filter(Boolean).length > 1) {
    usage("inspect takes one of --replay, --leaks or --judge")
  }
  if (opt.leaks) {
    if (opt.json) usage("--leaks reports text; --json is for the status, replay and judge records")
    if (!dirs.length && !opt.all) {
      usage("--leaks needs one or more run directories, or --all to scan the store")
    }
    const targets = (dirs.length ? dirs : listRuns(opt.dir)).slice().sort()
    if (!targets.length) usage(`no run directories found in ${opt.dir}`)
    const fallback = HOST_ROOTS
    // A named directory is a claim, so a broken one fails. A store scan is a
    // survey: unfinished runs are named as skipped.
    const explicit = dirs.length > 0
    let cells = 0
    let dirty = 0
    let unreadable = 0
    let skipped = 0
    for (const runDir of targets) {
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
      const hostRoots = opt.hostRoots.length ? opt.hostRoots : storedHostRoots(manifest, fallback)
      const byCell = new Map()
      let sawTranscript = false
      for (const c of readdirSync(casesDir)) {
        const cdir = join(casesDir, c)
        if (!existsSync(cdir)) continue
        for (const file of readdirSync(cdir)) {
          if (!file.startsWith("transcript") || !file.endsWith(".md")) continue
          const parsed = parseTranscript(readFileSync(join(cdir, file), "utf8"))
          if (!parsed) continue
          sawTranscript = true
          if (opt.case !== null && parsed.n !== opt.case) continue
          if (opt.skill && parsed.skill !== opt.skill) continue
          const key = `${parsed.skill}#${parsed.n}`
          // SPEC-0048: a denied corpus attempt is recorded apart from a read. The
          // replay must apply the same split as a fresh draw.
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
      if (!sawTranscript) {
        if (explicit) console.error(`no transcripts in run dir: ${runDir}`)
        unreadable += explicit ? 1 : 0
        skipped += explicit ? 0 : 1
        continue
      }
      if (!byCell.size) continue
      for (const [cell, entry] of [...byCell.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        cells++
        const rules = [entry.leak ? "leak" : "", entry.host ? "host" : ""].filter(Boolean)
        if (rules.length) dirty++
        const verdict = rules.length ? `dirty(${rules.join(",")})` : "clean"
        const denied = entry.denied ? `  deniedDraws=${entry.denied}` : ""
        const isolated = rules.length ? "no" : iso.state === "enforced" && entry.draws > 0 ? "yes" : "unknown"
        console.log(`${name}  ${cell} → ${verdict}  [${entry.draws} draw(s)]  isolated=${isolated}${denied}`)
      }
    }
    if (unreadable) {
      console.error(`\n${unreadable} unreadable/invalid run dir(s); replay incomplete, no clean verdict.`)
      return 2
    }
    console.log(
      `\nDetector ${DETECTOR_VERSION}: ${cells} cell(s), ${dirty} dirty` + (skipped ? `, skipped=${skipped}` : "") + `. No model, no write.`,
    )
    return 0
  }

  if (opt.judge) {
    if (JUDGE_MODEL === TARGET) console.error(`judge: ${JUDGE_MODEL} is also the model under test (self-judged)`)
    const root = opt.root ?? join(REPO, "skills")
    const cases = loadCases(root)
    const seenDirs = new Set()
    const reports = []
    let missing = 0
    for (const { label, caseDir } of transcriptPaths({ dir: opt.dir, runDirs: dirs })) {
      if (seenDirs.has(caseDir)) continue
      seenDirs.add(caseDir)
      const resultPath = join(caseDir, "result.json")
      if (!existsSync(resultPath)) continue
      let stored
      try {
        stored = JSON.parse(readFileSync(resultPath, "utf8"))
      } catch {
        continue
      }
      if (opt.case !== null && stored.case !== opt.case) continue
      if (opt.skill && stored.skill !== opt.skill) continue
      const c = cases.get(`${stored.skill}#${stored.case}`)
      if (!c) {
        missing++
        continue
      }
      const report = await rejudge({ dir: caseDir, c, model: JUDGE_MODEL })
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
      // SPEC-0020 carry no fixture/prompt/detector hash.
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
    return 0
  }

  if (!opt.replay) {
    if (!dirs.length) usage("inspect needs a run directory (or --leaks/--replay/--judge)")
    const records = dirs.map((dir) => storedRunStatus(dir, { case: opt.case, skill: opt.skill }))
    if (opt.json) {
      console.log(JSON.stringify(records, null, 2))
      return 0
    }
    console.log(records.map((record) => formatStoredStatus(record, { verbose: opt.verbose })).join("\n"))
    return 0
  }

  const root = opt.root ?? join(REPO, "skills")
  const cases = loadCases(root)
  const verdicts = []
  let scanned = 0
  let missing = 0
  for (const { label, path } of transcriptPaths({ dir: opt.dir, runDirs: dirs })) {
    const parsed = parseTranscript(readFileSync(path, "utf8"))
    if (!parsed) continue
    if (opt.case !== null && parsed.n !== opt.case) continue
    if (opt.skill && parsed.skill !== opt.skill) continue
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
      verdicts.push({
        id: `${parsed.skill}#${parsed.n}`,
        file: label,
        recorded: parsed.recorded,
        now: null,
        skipped: skipped.length,
        why: parsed.recorded === "staged" ? "smoke run" : "filesystem only",
      })
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

  if (opt.json) {
    console.log(JSON.stringify(verdicts, null, 2))
    return opt.changed && verdicts.some((v) => v.now !== null && v.recorded && v.recorded !== v.now) ? 1 : 0
  }
  for (const v of verdicts) {
    const moved = v.recorded && v.recorded !== v.now ? ` ${v.recorded} -> ${v.now}` : ""
    if (v.now === null) continue
    if (!opt.verbose && !moved) continue
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
  return opt.changed && moved.length ? 1 : 0
}

process.exitCode = await main()
