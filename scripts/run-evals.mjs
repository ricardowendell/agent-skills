#!/usr/bin/env node
// run-evals.mjs — run the prose evals in a skill's references/evals.md.
//
// For each numbered case it stages the fixture and the skill under review in an
// isolated scratch directory, runs `opencode run` there, and checks the case's
// machine-checkable assertions against the resulting filesystem and transcript.
// Prose expectations stay human-checked; a run only passes when it was actually
// scored (>= 1 assertion) and the skill that loaded was the one under review.
//
// Usage:
//   node scripts/run-evals.mjs --list --check      # validate every case (CI)
//   node scripts/run-evals.mjs --skill review-code --run
//   node scripts/run-evals.mjs --case 2 --run
//   node scripts/run-evals.mjs --level full --run
//
// Flags:
//   --skill <id>        limit to one skill
//   --case <n>          limit to one case number
//   --run               execute (default is a dry run)
//   --list              list parsed cases
//   --check             exit 1 on validation errors (unknown kind, no prompt)
//   --agent <name>      agent to use (default: build)
//   --model <ref>       model override, provider/model#variant
//   --timeout <sec>     per-case timeout (default: 600)
//   --level <name>      smoke | behavior (default) | full
//                         smoke    parse + validate + stage, no model
//                         behavior cases without `needs: gates`
//                         full     every runnable case
//   --concurrency <n>   override the level's concurrency
//   --root <dir>        skill root to discover (CI passes the checkout)
//   --no-skill          control arm: do not stage the skill and deny the skill
//                       tool, so the same case can be measured without it
//   --judge <model>     grade the expect: lines with a judge model (opt-in; it
//                       can fail a case that passed, never rescue one)
//   --judge-threshold   minimum judge score (default 0.8)
//   --repeat <n>        run each selected case n times (default 1); the case
//                       passes only when every repetition does
//   --stop <p>/<f>      stop a repeated case after p clean passes with zero
//                       failures or f failures (default 5/3 when repeat > 5)
//   --stall-seconds <n> kill a draw whose event stream is silent for n seconds
//                       (default 120); recorded as `stalled`, not `timeout`
//   --min-pass <ratio>  relax that to a rate, explicitly (default 1)
//   --tag <a,b>         only cases carrying every listed tag
//   --baseline <file>   compare this run against a stored run JSON
//   --save-baseline     store this run as baseline.json
//   --shared            run against the shared server: NOT isolated, the child
//                       inherits the launch directory. Needs --i-know.
//   --no-isolate        let the child see the real home, and with it every
//                       installed skill (only to reproduce runs made before
//                       isolation existed)
//
// Isolation: cases run with `--standalone` and a scrubbed child env (no
// OPENCODE*/AI_AGENT) so the agent honours the scratch cwd. The skill under
// review is copied to <scratch>/.opencode/skills/<id>/, which shadows any global
// install of the same id; each run records that copy's hash. The child also gets
// a throwaway home (see lib/evals/isolation.mjs): without it, every skill
// installed on the machine stays on the menu — 22 of them here, the one under
// review included — and a case can pass because *another* skill was chosen.
//
// Fixtures: `references/evals/<n>/` is copied into the scratch dir. A case that
// brings a `git.json` manifest is staged instead: `{ "base": "../base",
// "remove": ["docs/specs"], "branch": "feature", "message": "...", "patch":
// "change.patch" }` commits the base tree as `main`, prunes `remove`, applies
// the patch on `branch`, and leaves that branch checked out.
//
// Output: one directory per invocation under
// ~/.local/share/opencode/evals/runs/<timestamp>--<label>/; each case writes
// cases/<skill>--<n>/transcript.md (or transcript.r<i>.md) and result.json.

import { readdirSync, lstatSync, realpathSync, existsSync, mkdirSync, writeFileSync, appendFileSync, readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { join, basename, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { homedir } from "node:os"
import { readEvals } from "./lib/evals/parse.mjs"
import { scrubEnv } from "./lib/evals/agent.mjs"
import { isolateHome } from "./lib/evals/isolation.mjs"
import { stageFixture, stageSkill, makeScratch, denySkillTool, textHash } from "./lib/evals/fixture.mjs"
import { summarize, aggregateReps, caseResult, contaminate, PASSED, UNSCORED } from "./lib/evals/result.mjs"
import { executeCase } from "./lib/evals/execute.mjs"
import { leaksIn, DETECTOR_VERSION } from "./lib/evals/leak.mjs"
import { parseStop, runScheduled } from "./lib/evals/schedule.mjs"
import { createRun } from "./lib/evals/runs.mjs"
import { summarizeRun, compareRuns, formatComparison, readRun } from "./lib/evals/report.mjs"
import { renderHeader, patchStatus } from "./lib/evals/transcript.mjs"

const argv = process.argv.slice(2)
const opt = {
  skill: null,
  case: null,
  run: false,
  list: false,
  check: false,
  agent: "build",
  model: null,
  timeout: 600,
  standalone: true,
  iKnow: false,
  concurrency: null,
  level: "behavior",
  root: null,
  baseline: null,
  saveBaseline: false,
  noSkill: false,
  isolate: true,
  judge: null,
  judgeThreshold: 0.8,
  repeat: 1,
  minPass: 1,
  stop: null,
  stallSeconds: 120,
  tags: [],
}
const unknown = []
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  // A flag's value is the next token; a token that starts with `--` is the next
  // flag. Swallowing it is how `--skill --list` selected every skill instead of
  // failing.
  const value = (flag) => {
    const v = argv[i + 1]
    if (v === undefined || v.startsWith("--")) {
      console.error(`${flag} needs a value`)
      process.exit(1)
    }
    return argv[++i]
  }
  if (a === "--skill") opt.skill = value("--skill")
  else if (a === "--case") opt.case = Number(value("--case"))
  else if (a === "--run") opt.run = true
  else if (a === "--list") opt.list = true
  else if (a === "--check") opt.check = true
  else if (a === "--agent") opt.agent = value("--agent")
  else if (a === "--model") opt.model = value("--model")
  else if (a === "--timeout") opt.timeout = Number(value("--timeout"))
  else if (a === "--standalone") opt.standalone = true
  else if (a === "--shared") opt.standalone = false
  else if (a === "--i-know") opt.iKnow = true
  else if (a === "--concurrency") opt.concurrency = Number(value("--concurrency"))
  else if (a === "--level") opt.level = value("--level")
  else if (a === "--root") opt.root = value("--root")
  else if (a === "--baseline") opt.baseline = value("--baseline")
  else if (a === "--save-baseline") opt.saveBaseline = true
  else if (a === "--no-skill") opt.noSkill = true
  else if (a === "--no-isolate") opt.isolate = false
  else if (a === "--judge") {
    const v = argv[i + 1]
    if (v && !v.startsWith("--")) {
      opt.judge = v
      i++
    } else opt.judge = "default"
  }
  else if (a === "--judge-threshold") opt.judgeThreshold = Number(value("--judge-threshold"))
  else if (a === "--repeat") opt.repeat = Number(value("--repeat"))
  else if (a === "--stop") opt.stop = value("--stop")
  else if (a === "--stall-seconds") opt.stallSeconds = Number(value("--stall-seconds"))
  else if (a === "--tag") opt.tags.push(...value("--tag").split(",").map((t) => t.trim()).filter(Boolean))
  else if (a === "--min-pass") opt.minPass = Number(value("--min-pass"))
  else if (a === "--quick") {
    console.error("--quick is gone: it appended \"skip installs/builds/audit\" to the prompt, which tested a different policy. Use --level behavior or --level smoke.")
    process.exit(1)
  } else if (a === "--full") opt.level = "full"
  else unknown.push(a)
}

if (unknown.length) {
  console.error(`unknown flag ${unknown.join(", ")}`)
  process.exit(1)
}

function positiveInteger(flag, value) {
  if (!Number.isInteger(value) || value < 1) {
    console.error(`${flag} expects a positive integer (got ${value})`)
    process.exit(1)
  }
}

// `NaN` is falsy, so an unvalidated `--case abc` skipped its own filter and
// selected the whole corpus; a `NaN` lane count started zero lanes, ran nothing
// and still exited 0. Both are silent, so both are rejected here.
if (opt.case !== null) positiveInteger("--case", opt.case)
if (opt.concurrency !== null) positiveInteger("--concurrency", opt.concurrency)
if (!(Number.isFinite(opt.timeout) && opt.timeout > 0)) {
  console.error(`--timeout expects a positive number of seconds (got ${opt.timeout})`)
  process.exit(1)
}
if (!(Number.isFinite(opt.judgeThreshold) && opt.judgeThreshold > 0 && opt.judgeThreshold <= 1)) {
  console.error(`--judge-threshold expects a ratio in (0, 1] (got ${opt.judgeThreshold})`)
  process.exit(1)
}

if (!["smoke", "behavior", "full"].includes(opt.level)) {
  console.error(`unknown --level '${opt.level}' (expected smoke|behavior|full)`)
  process.exit(1)
}
if (!opt.standalone && !opt.iKnow) {
  console.error("--shared runs the agent in your launch directory, not a scratch dir. Re-run with --i-know if that is what you want.")
  process.exit(1)
}
if (!Number.isInteger(opt.repeat) || opt.repeat < 1) {
  console.error(`--repeat expects a positive integer (got ${opt.repeat})`)
  process.exit(1)
}
if (!(opt.minPass > 0 && opt.minPass <= 1)) {
  console.error(`--min-pass expects a ratio in (0, 1] (got ${opt.minPass})`)
  process.exit(1)
}
if (!(Number.isFinite(opt.stallSeconds) && opt.stallSeconds >= 0)) {
  console.error(`--stall-seconds expects a non-negative number of seconds (got ${opt.stallSeconds})`)
  process.exit(1)
}
if (opt.stop !== null && parseStop(opt.stop) === null) {
  console.error(`--stop expects <passes>/<fails>, both integers (got ${opt.stop})`)
  process.exit(1)
}
if (opt.concurrency === null) opt.concurrency = opt.level === "smoke" ? 1 : 4

// The stop rule is a default, not a claim: enable it only where a rate is not
// being measured. Above five draws, five clean passes (or three failures) is
// enough separation; at or below five the full count already is the answer.
const STOP = opt.level === "smoke" ? null : opt.stop !== null ? parseStop(opt.stop) : opt.repeat > 5 ? { passes: 5, fails: 3 } : null

const HOME = homedir()
// The host corpus: the checkout the runner lives in, plus its sibling worktrees.
// A control draw that reads any of these has not been isolated, even when it
// never touched an installed skill. Absolute by construction, and recorded in
// the manifest so the replay can re-judge the run without guessing.
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const hostRootsFor = (root) => [
  // The checkout itself, not just the known subdirectories: `git -C <checkout>
  // log`, `.git/`, `CONTRIBUTING.md`, `package.json` and `.pdlc/` are host
  // corpus too, and "read nothing outside the scratch" has to mean all of it.
  root,
  join(root, "docs"),
  join(root, "AGENTS.md"),
  join(root, "scripts"),
  join(root, "skills"),
  join(root, "runs"),
  join(root, ".lane/trees"),
]
// The checkout that holds the repo, even when the runner itself is launched from
// a worktree: the main worktree's `docs/` and the sibling trees are still the
// host corpus.
function mainCheckout() {
  const r = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: REPO, encoding: "utf8" })
  if (r.status === 0) {
    const common = r.stdout.trim()
    if (common) return dirname(common)
  }
  return REPO
}
const HOST_ROOTS = [...new Set([...hostRootsFor(mainCheckout()), ...hostRootsFor(REPO)])]
const ROOTS = (
  opt.root
    ? [opt.root]
    : [join(HOME, ".agents/skills"), join(HOME, ".claude/skills"), join(HOME, ".codex/skills"), join(HOME, ".config/opencode/skills")]
).filter(existsSync)
const OUT_ROOT = join(HOME, ".local/share/opencode/evals")
// One directory per invocation, named after the selection it covers. Created
// lazily so --list and dry runs never leave an empty run behind.
const LABEL = opt.skill ?? (opt.tags.length ? opt.tags.join("+") : "all")
let RUN = null
const run = () =>
  (RUN ??= createRun({
    root: OUT_ROOT,
    label: LABEL,
    arm: opt.noSkill ? "without-skill" : "with-skill",
    model: opt.model,
    agent: opt.agent,
    level: opt.level,
    repoSha: repoSha(),
    params: {
      concurrency: opt.concurrency,
      repeat: opt.repeat,
      stop: STOP,
      stallMs: opt.stallSeconds * 1000,
      // The checker may only say `isolated=yes` when the run itself records that
      // the child got a scratch cwd and a throwaway home. `--shared` or
      // `--no-isolate` writes false, and the verdict stays `unknown`.
      isolate: opt.isolate && opt.standalone,
      // Machine-specific, so the run carries them: the replay must judge the
      // transcript against the checkout that produced it, not its own.
      hostRoots: HOST_ROOTS,
    },
  }))

// Without --model the child inherits the config's `model`, so the artifact would
// say "default" and a matrix row would be unattributable. Resolve it by hand.
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

// A judge that is the model under test grades its own homework. It still runs —
// it is the only option without a second provider — but the artifact and the
// console say so, because the score is evidence of agreement, not of quality.
const TARGET = EFFECTIVE_MODEL.replace(/ \(config default\)$/, "")
const JUDGE_MODEL = opt.judge ? (opt.judge === "default" ? TARGET : opt.judge) : null
const SELF_JUDGED = JUDGE_MODEL !== null && JUDGE_MODEL === TARGET

// The child gets a home with the case in it, not the machine's skills. The
// parent keeps the real one for run output and skill discovery.
const ISOLATION = opt.isolate ? isolateHome(scrubEnv()) : null
const CHILD_ENV = ISOLATION?.env ?? scrubEnv()
if (ISOLATION) process.once("exit", ISOLATION.cleanup)

function* skillDirs(dir, seen = new Set()) {
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
    if (seen.has(real)) continue
    if (existsSync(join(p, "SKILL.md"))) {
      seen.add(real)
      yield { id: basename(p), dir: p }
    } else if (e.isDirectory() || lstatSync(p).isSymbolicLink()) {
      yield* skillDirs(p, seen)
    }
  }
}

function discoverEvals() {
  const found = []
  const seen = new Set()
  for (const root of ROOTS) {
    for (const { id, dir } of skillDirs(root)) {
      if (seen.has(id)) continue
      const evals = join(dir, "references/evals.md")
      if (existsSync(evals)) {
        seen.add(id)
        found.push({ id, dir, evals })
      }
    }
  }
  return found
}

// Every discovered skill, keyed by id, not only the ones with evals. A case may
// name a sibling with `stage:`; the id has to resolve to a real skill checkout
// even when that sibling carries no evals of its own. First root wins, the same
// order `discoverEvals` uses.
function discoverSkillDirs() {
  const found = new Map()
  for (const root of ROOTS) {
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

const skills = discoverEvals().filter((s) => !opt.skill || s.id === opt.skill)
if (!skills.length) {
  console.error(opt.skill ? `no skill "${opt.skill}" with references/evals.md` : "no skills with references/evals.md found")
  process.exit(1)
}

const SKILLS = discoverSkillDirs()
const plan = []
const warnings = []
const errors = []
for (const s of skills) {
  const parsed = readEvals(s.evals)
  errors.push(...parsed.errors.map((e) => `${s.id}: ${e}`))
  warnings.push(...parsed.warnings.map((w) => `${s.id}: ${w}`))
  for (const c of parsed.cases) {
    // `stage:` is validated against every discovered skill, not against the
    // `--case`/`--skill` selection: a bad declaration must fail `--check` even
    // when its case is not the one being run.
    for (const id of c.stage ?? []) {
      if (id === s.id) errors.push(`${s.id}: case ${c.n}: stage '${id}' names the skill under review`)
      else if (!SKILLS.has(id)) errors.push(`${s.id}: case ${c.n}: unknown stage '${id}'`)
    }
    if (opt.case !== null && c.n !== opt.case) continue
    plan.push({ skill: s, c })
  }
}

// The declared stages resolve to real checkouts; executeCase stages them next
// to the arm's skill. A case without `stage:` gets an empty list and behaves
// exactly as before.
const siblingsFor = (c) => (c.stage ?? []).map((id) => SKILLS.get(id)).filter(Boolean)

for (const w of warnings) console.error(`warn: ${w}`)
for (const e of errors) console.error(`error: ${e}`)
if (errors.length && (opt.check || opt.run)) {
  console.error(`\n${errors.length} validation error(s); refusing to run.`)
  process.exit(1)
}

const tagged = opt.tags.length ? plan.filter(({ c }) => opt.tags.every((t) => c.tags.includes(t))) : plan
const runnable = tagged.filter(({ c }) => c.status === "run")
const manual = tagged.filter(({ c }) => c.status === "manual")
const skipped = opt.level === "behavior" ? runnable.filter(({ c }) => c.needs.includes("gates")) : []
const selected = runnable.filter((p) => !skipped.includes(p))

if (opt.list || !opt.run) {
  console.log(`Parsed ${tagged.length} case(s)${opt.tags.length ? ` tagged ${opt.tags.join("+")}` : ""}: ${runnable.length} runnable, ${manual.length} manual\n`)
  for (const { skill, c } of tagged) {
    const marks = [c.status === "manual" ? "manual" : "", c.needs.length ? `needs:${c.needs.join("+")}` : "", c.tags.length ? `tags:${c.tags.join("+")}` : "", `${c.expect.length} expectations`]
      .filter(Boolean)
      .join("  ")
    const prompt = (c.prompt || c.title).replace(/\n/g, " ")
    console.log(`  ${skill.id} #${c.n}: ${prompt.slice(0, 64)}${prompt.length > 64 ? "…" : ""}  [${marks}]`)
  }
  if (opt.level === "behavior" && skipped.length) console.log(`\n${skipped.length} case(s) skipped at --level behavior (needs: gates).`)
  if (!opt.run) console.log(`\nDry run. Re-run with --run to execute (agent=${opt.agent}, level=${opt.level}, timeout=${opt.timeout}s).`)
  process.exit(opt.check && errors.length ? 1 : 0)
}

let ok = 0
let fail = 0
let unscored = 0
if (SELF_JUDGED) console.error(`judge: ${JUDGE_MODEL} is also the model under test (self-judged)`)
console.log(
  `Isolation: standalone=${opt.standalone}` +
    (opt.standalone ? `, child env scrubbed (OPENCODE*, AI_AGENT), home ${opt.isolate ? "isolated" : "inherited"}, skill pinned in scratch\n` : " (--shared: NOT isolated)\n"),
)
console.log(
  `Level: ${opt.level} (concurrency=${opt.concurrency}, agent=${opt.agent}, model=${opt.model ?? "default"}, arm=${opt.noSkill ? "without-skill" : "with-skill"}` +
    `${opt.judge ? `, judge=${opt.judge}@${opt.judgeThreshold}` : ""}` +
    `${opt.repeat > 1 ? `, repeat=${opt.repeat}@min-pass=${opt.minPass}${STOP ? `@stop=${STOP.passes}/${STOP.fails}` : ""}` : ""}` +
    `, stall=${opt.stallSeconds}s)\n`,
)

async function runCase(skill, c, rep = null) {
  const scratch = makeScratch(skill.id, c.n)
  const file = run().transcriptPath(skill.id, c.n, rep)
  mkdirSync(dirname(file), { recursive: true })
  const started = Date.now()
  const meta = { skill: skill.id, case: c.n, repoSha: repoSha(), agent: opt.agent, model: EFFECTIVE_MODEL, level: opt.level }

  const writeFailure = (reason, err = "") => {
    writeFileSync(
      file,
      renderHeader({ skill: skill.id, n: c.n, prompt: c.prompt, scratch, status: "failed", reason }) +
        `\n\n\`\`\`\n${err}\n\`\`\`\n`,
    )
  }

  // smoke proves the fixture and the pinned skill stage cleanly, without a model.
  // It stages for itself; every other level stages inside executeCase.
  if (opt.level === "smoke") {
    let pinned = { hash: null }
    let stagedSkills = []
    let fixture = { hash: null }
    try {
      fixture = stageFixture(skill, c, scratch)
      if (opt.noSkill) denySkillTool(scratch)
      else {
        pinned = stageSkill(skill, scratch)
        stagedSkills = siblingsFor(c).map(({ id, dir }) => ({ id, hash: stageSkill({ id, dir }, scratch).hash }))
      }
    } catch (e) {
      writeFailure("fixture failed to stage", `${e.message}\n${e.stderr ?? ""}`)
      return caseResult(skill, c, {
        status: "failed",
        reason: "fixture failed to stage",
        skillHash: null,
        fixtureHash: null,
        promptHash: textHash(c.prompt),
        detectorVersion: DETECTOR_VERSION,
        assertions: [],
        transcript: file,
      })
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
    return caseResult(skill, c, {
      status: "staged",
      reason: "staged only (smoke)",
      skillHash: pinned.hash,
      stagedSkills,
      fixtureHash: fixture.hash,
      promptHash: textHash(c.prompt),
      detectorVersion: DETECTOR_VERSION,
      assertions: [],
      execution: { durationMs: Date.now() - started },
      meta: { repoSha: meta.repoSha, agent: meta.agent, model: meta.model, level: meta.level },
      transcript: file,
    })
  }

  let exec
  try {
    exec = await executeCase({
      skill,
      c,
      scratch,
      arm: opt.noSkill ? "without-skill" : "with-skill",
      siblings: siblingsFor(c),
      model: opt.model,
      agent: opt.agent,
      standalone: opt.standalone,
      timeoutMs: opt.timeout * 1000,
      stallMs: opt.stallSeconds * 1000,
      env: CHILD_ENV,
      judge: opt.judge ? { model: JUDGE_MODEL, threshold: opt.judgeThreshold, selfJudged: SELF_JUDGED } : null,
    })
  } catch (e) {
    writeFailure("fixture failed to stage", `${e.message}\n${e.stderr ?? ""}`)
    return caseResult(skill, c, {
      status: "failed",
      reason: "fixture failed to stage",
      skillHash: null,
      fixtureHash: null,
      promptHash: textHash(c.prompt),
      detectorVersion: DETECTOR_VERSION,
      assertions: [],
      transcript: file,
    })
  }

  // A retry re-stages in a fresh scratch, so the leak check and the transcript
  // header must point at the attempt that actually produced this result.
  const { result: core, out, err, code, pinned: staged, gate, asserts, judged, durationMs, scratch: finalScratch } = exec
  // The leak is a property of this repetition's transcript and scratch, so it is
  // recorded here, per draw, not inferred later from a run summary. A single draw
  // is the whole case, so its reason says "every repetition contaminated".
  const leaks = leaksIn(out, finalScratch ?? scratch, HOST_ROOTS)
  const clean = contaminate(core, leaks, { all: !rep })
  const skillLabel = opt.noSkill
    ? `**Skill:** ${gate.ok ? "not loaded (control arm)" : "LOADED — the control arm is broken"} (${gate.reason})`
    : `**Skill:** ${gate.ok ? "loaded" : "MISSING"} (${gate.reason})`

  const result = caseResult(skill, c, {
    ...clean,
    // `contaminate` keeps the legacy `{ tool, path }` shape; the artifact needs
    // the kind so the checker can separate a skill leak from a host read.
    leak: leaks,
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
  return result
}

// The header is written before the judge runs, so the status line has to be
// rewritten once the semantic verdict lands.
function patchHeader(file, { status, reason }) {
  writeFileSync(file, patchStatus(readFileSync(file, "utf8"), status, reason))
}

// The case artifact is written once, after every draw it will ever run has run.
// That is what keeps a parallel run readable: no draw touches result.json and
// the final write is the only one (the same rule the serial runner followed).
function finalizeCase(state) {
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
    run().writeResult(skill.id, c.n, single)
    return { ...single, transcript: run().transcriptPath(skill.id, c.n, null), repLine: "" }
  }

  // Repetitions exist because one verdict from a non-deterministic agent is one
  // draw. The case passes only when every repetition does, unless --min-pass
  // says otherwise out loud.
  const agg = aggregateReps(reps, opt.minPass)
  const artifact = caseResult(skill, c, {
    status: agg.status,
    reason: agg.reason,
    passRate: agg.passRate,
    passed: agg.passed,
    reps: agg.total,
    contaminated: agg.contaminated,
    infrastructure: agg.infrastructure,
    stoppedEarly: state.stoppedEarly,
    sequence: state.sequence,
    ...provenance,
    skillHash: first?.skillHash ?? null,
    stagedSkills: first?.stagedSkills ?? [],
    arm: first?.arm,
    meta: first?.meta ?? {},
    repetitions: reps,
  })
  run().writeResult(skill.id, c.n, artifact)
  // The console summary drops the per-repetition array; the artifact keeps it.
  const { repetitions: _reps, ...summary } = artifact
  const repLine = reps
    .map((r, i) => `r${state.indexes[i] ?? i + 1}:${r.infrastructure ? "infrastructure" : r.contaminated ? "contaminated" : r.status}`)
    .join(" ")
  return {
    ...summary,
    transcript: run().transcriptPath(skill.id, c.n, { index: 1 }),
    repLine,
  }
}

const startedAt = Date.now()
// Every selected case enters the pool; a draw is the unit of work, so a single
// case with --repeat 12 still fills the lanes. Stop is null at smoke.
const items = selected.map(({ skill, c }) => ({
  skill,
  c,
  times: opt.level === "smoke" ? 1 : opt.repeat,
}))
const scheduled = await runScheduled({
  cases: items,
  concurrency: opt.concurrency,
  stop: STOP,
  runDraw: ({ skill, c, rep }) => runCase(skill, c, rep),
})

const results = []
for (const state of scheduled) {
  const r = finalizeCase(state)
  results.push(r)
  if (r.status === PASSED) ok++
  else if (r.status === UNSCORED) unscored++
  else fail++
  // The published rate excludes contaminated and infrastructure draws: show the
  // clean denominator when it differs from the raw draw count.
  const excluded = (r.contaminated ?? 0) + (r.infrastructure ?? 0)
  const clean = r.reps !== undefined ? r.reps - excluded : null
  const rate = r.reps
    ? excluded
      ? ` [${r.passed}/${clean} clean, ${r.contaminated ?? 0} contaminated, ${r.infrastructure ?? 0} infrastructure]`
      : ` [${r.passed}/${r.reps}]`
    : ""
  console.log(
    `${r.skill} #${r.case}: ${r.status}${rate}${r.reason ? ` (${r.reason})` : ""} — ${r.transcript}` + (r.repLine ? `\n     ${r.repLine}` : ""),
  )
}

const totals = summarize(results)
console.log(
  `\n${totals.passed} passed, ${totals.failed} failed, ${totals.unscored} unscored` +
    (totals.contaminated ? `, ${totals.contaminated} contaminated` : "") +
    (totals.infrastructure ? `, ${totals.infrastructure} infrastructure` : "") +
    (totals.staged ? `, ${totals.staged} staged` : "") +
    ` (of ${totals.total}). Transcripts in ${OUT_ROOT}`,
)
if (skipped.length) console.log(`${skipped.length} case(s) skipped at --level ${opt.level} (needs: gates).`)

const runFile = join(OUT_ROOT, "last-run.json")
if (RUN) {
  RUN.finish({
    counts: {
      passed: totals.passed,
      failed: totals.failed,
      unscored: totals.unscored,
      staged: totals.staged ?? 0,
      contaminated: totals.contaminated,
      infrastructure: totals.infrastructure,
    },
  })
  console.error(`Run directory: ${RUN.dir}`)
}
const summary = summarizeRun({ results, repoSha: repoSha(), agent: opt.agent, model: EFFECTIVE_MODEL, level: opt.level, startedAt: new Date(startedAt).toISOString() })
writeFileSync(runFile, JSON.stringify(summary, null, 2))
console.log(`Run artifact: ${runFile}`)

let regressed = false
if (opt.level === "smoke") {
  if (opt.baseline || opt.saveBaseline) console.error("baselines compare behaviour, not staging; skipping (--level smoke)")
} else {
  if (opt.saveBaseline) {
    writeFileSync(join(OUT_ROOT, "baseline.json"), JSON.stringify(summary, null, 2))
    console.log(`Baseline saved: ${join(OUT_ROOT, "baseline.json")}`)
  }
  // An explicit --baseline is strict (a case missing from the run is a hole);
  // the implicit baseline.json is advisory, so a targeted --case run does not
  // report every unselected case as missing.
  const filtered = Boolean(opt.skill || opt.case || opt.tags.length)
  const target = opt.baseline ?? (opt.saveBaseline || filtered ? null : join(OUT_ROOT, "baseline.json"))
  if (target && existsSync(target)) {
    const comparison = compareRuns(readRun(target), summary)
    console.log(`\n${formatComparison(comparison, target)}`)
    regressed = comparison.regressions.length > 0 || (Boolean(opt.baseline) && comparison.missing.length > 0)
  } else if (opt.baseline) {
    console.error(`no baseline at ${target} — run once with --save-baseline first`)
    regressed = true
  }
}

process.exit(totals.failed || totals.unscored || regressed ? 1 : 0)
