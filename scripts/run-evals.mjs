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
//   --shared            run against the shared server: NOT isolated, the child
//                       inherits the launch directory. Needs --i-know.
//
// Isolation: cases run with `--standalone` and a scrubbed child env (no
// OPENCODE*/AI_AGENT) so the agent honours the scratch cwd. The skill under
// review is copied to <scratch>/.opencode/skills/<id>/, which shadows any global
// install of the same id; each run records that copy's hash.
//
// Fixtures: `references/evals/<n>/` is copied into the scratch dir. A case that
// brings a `git.json` manifest is staged instead: `{ "base": "../base",
// "remove": ["docs/specs"], "branch": "feature", "message": "...", "patch":
// "change.patch" }` commits the base tree as `main`, prunes `remove`, applies
// the patch on `branch`, and leaves that branch checked out.
//
// Output: transcripts under ~/.local/share/opencode/evals/<skill>/<n>.md

import { readdirSync, lstatSync, realpathSync, existsSync, mkdirSync, writeFileSync } from "node:fs"
import { spawn, spawnSync } from "node:child_process"
import { join, basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { homedir } from "node:os"
import { readEvals } from "./lib/evals/parse.mjs"
import { evaluateAssertions, replyText, skillGate, skillLoads, toolCalls, usageStats } from "./lib/evals/assertions.mjs"
import { stageFixture, stageSkill, snapshotTree, makeScratch } from "./lib/evals/fixture.mjs"
import { classify, summarize, PASSED, UNSCORED } from "./lib/evals/result.mjs"
import { summarizeRun, compareRuns, formatComparison, readRun } from "./lib/evals/report.mjs"

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
}
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === "--skill") opt.skill = argv[++i]
  else if (a === "--case") opt.case = Number(argv[++i])
  else if (a === "--run") opt.run = true
  else if (a === "--list") opt.list = true
  else if (a === "--check") opt.check = true
  else if (a === "--agent") opt.agent = argv[++i]
  else if (a === "--model") opt.model = argv[++i]
  else if (a === "--timeout") opt.timeout = Number(argv[++i])
  else if (a === "--standalone") opt.standalone = true
  else if (a === "--shared") opt.standalone = false
  else if (a === "--i-know") opt.iKnow = true
  else if (a === "--concurrency") opt.concurrency = Number(argv[++i])
  else if (a === "--level") opt.level = argv[++i]
  else if (a === "--root") opt.root = argv[++i]
  else if (a === "--baseline") opt.baseline = argv[++i]
  else if (a === "--save-baseline") opt.saveBaseline = true
  else if (a === "--quick") {
    console.error("--quick is gone: it appended \"skip installs/builds/audit\" to the prompt, which tested a different policy. Use --level behavior or --level smoke.")
    process.exit(1)
  } else if (a === "--full") opt.level = "full"
}

if (!["smoke", "behavior", "full"].includes(opt.level)) {
  console.error(`unknown --level '${opt.level}' (expected smoke|behavior|full)`)
  process.exit(1)
}
if (!opt.standalone && !opt.iKnow) {
  console.error("--shared runs the agent in your launch directory, not a scratch dir. Re-run with --i-know if that is what you want.")
  process.exit(1)
}
if (opt.concurrency === null) opt.concurrency = opt.level === "smoke" ? 1 : 4

const HOME = homedir()
const ROOTS = (
  opt.root
    ? [opt.root]
    : [join(HOME, ".agents/skills"), join(HOME, ".claude/skills"), join(HOME, ".codex/skills"), join(HOME, ".config/opencode/skills")]
).filter(existsSync)
const OUT_ROOT = join(HOME, ".local/share/opencode/evals")

const CHILD_ENV = { ...process.env }
for (const k of Object.keys(CHILD_ENV)) {
  if (/^OPENCODE/i.test(k) || k === "AI_AGENT") delete CHILD_ENV[k]
}

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

function repoSha() {
  const r = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: dirname(fileURLToPath(import.meta.url)), encoding: "utf8" })
  return r.status === 0 ? r.stdout.trim() : "unknown"
}

const skills = discoverEvals().filter((s) => !opt.skill || s.id === opt.skill)
if (!skills.length) {
  console.error(opt.skill ? `no skill "${opt.skill}" with references/evals.md` : "no skills with references/evals.md found")
  process.exit(1)
}

const plan = []
const warnings = []
const errors = []
for (const s of skills) {
  const parsed = readEvals(s.evals)
  errors.push(...parsed.errors.map((e) => `${s.id}: ${e}`))
  warnings.push(...parsed.warnings.map((w) => `${s.id}: ${w}`))
  for (const c of parsed.cases) {
    if (opt.case && c.n !== opt.case) continue
    plan.push({ skill: s, c })
  }
}

for (const w of warnings) console.error(`warn: ${w}`)
for (const e of errors) console.error(`error: ${e}`)
if (errors.length && (opt.check || opt.run)) {
  console.error(`\n${errors.length} validation error(s); refusing to run.`)
  process.exit(1)
}

const runnable = plan.filter(({ c }) => c.status === "run")
const manual = plan.filter(({ c }) => c.status === "manual")
const skipped = opt.level === "behavior" ? runnable.filter(({ c }) => c.needs.includes("gates")) : []
const selected = runnable.filter((p) => !skipped.includes(p))

if (opt.list || !opt.run) {
  console.log(`Parsed ${plan.length} case(s): ${runnable.length} runnable, ${manual.length} manual\n`)
  for (const { skill, c } of plan) {
    const marks = [c.status === "manual" ? "manual" : "", c.needs.length ? `needs:${c.needs.join("+")}` : "", `${c.expect.length} expectations`]
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
console.log(
  `Isolation: standalone=${opt.standalone}` + (opt.standalone ? ", child env scrubbed (OPENCODE*, AI_AGENT), skill pinned in scratch\n" : " (--shared: NOT isolated)\n"),
)
console.log(`Level: ${opt.level} (concurrency=${opt.concurrency}, agent=${opt.agent}, model=${opt.model ?? "default"})\n`)

function runCase(skill, c) {
  const scratch = makeScratch(skill.id, c.n)
  const dir = join(OUT_ROOT, skill.id)
  mkdirSync(dir, { recursive: true })
  const file = join(dir, `${c.n}.md`)
  const started = Date.now()
  const meta = { skill: skill.id, case: c.n, repoSha: repoSha(), agent: opt.agent, model: opt.model ?? "default", level: opt.level }

  const writeFailure = (reason, err = "") => {
    writeFileSync(
      file,
      `# Eval: ${skill.id} case ${c.n}\n\n**Prompt:** ${c.prompt}\n\n**Scratch:** ${scratch}\n` +
        `**Status:** failed\n**Reason:** ${reason}\n\n\`\`\`\n${err}\n\`\`\`\n`,
    )
  }

  let pinned
  try {
    pinned = stageSkill(skill, scratch)
    stageFixture(skill, c, scratch)
  } catch (e) {
    writeFailure("fixture failed to stage", `${e.message}\n${e.stderr ?? ""}`)
    return Promise.resolve({
      skill: skill.id,
      case: c.n,
      status: "failed",
      reason: "fixture failed to stage",
      title: c.title,
      prompt: c.prompt,
      skillHash: null,
      assertions: [],
      transcript: file,
    })
  }
  const snapshot = snapshotTree(scratch)

  // smoke proves the fixture and the pinned skill stage cleanly, without a model.
  if (opt.level === "smoke") {
    writeFileSync(
      file,
      `# Eval: ${skill.id} case ${c.n}\n\n**Prompt:** ${c.prompt}\n\n**Scratch:** ${scratch}\n**Status:** staged\n` +
        `**Skill hash:** ${pinned.hash}\n**Repo:** ${meta.repoSha}  **Agent:** ${meta.agent}  **Level:** smoke\n\n` +
        `## Expectations (human-checked)\n\n${c.expect.map((e) => `- [ ] ${e}`).join("\n")}\n\n` +
        `## Assertions (auto-checked)\n\nnot run at --level smoke\n`,
    )
    return Promise.resolve({
      skill: skill.id,
      case: c.n,
      status: "staged",
      reason: "staged only (smoke)",
      title: c.title,
      prompt: c.prompt,
      skillHash: pinned.hash,
      assertions: [],
      execution: { durationMs: Date.now() - started },
      meta: { repoSha: meta.repoSha, agent: meta.agent, model: meta.model, level: meta.level },
      transcript: file,
    })
  }

  const args = ["run", "--format", "json", "--auto", "--agent", opt.agent]
  if (opt.standalone) args.push("--standalone")
  if (opt.model) args.push("--model", opt.model)
  args.push(c.prompt)

  return new Promise((resolve) => {
    // detached => the child leads its own process group, so we can kill the
    // whole tree. A lingering grandchild holding the stdout pipe can otherwise
    // keep 'close' from ever firing, so a hard timer guarantees resolution.
    const child = spawn("opencode", args, {
      cwd: scratch,
      // spawn's cwd does NOT update the inherited PWD, and opencode resolves its
      // project from PWD — so point it at the scratch dir explicitly.
      env: { ...CHILD_ENV, PWD: scratch, OLDPWD: scratch },
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let out = ""
    let err = ""
    let finished = false

    const killTree = () => {
      try {
        process.kill(-child.pid, "SIGKILL")
      } catch {
        try {
          child.kill("SIGKILL")
        } catch {}
      }
    }

    const finish = (code) => {
      if (finished) return
      finished = true
      clearTimeout(hardTimer)
      killTree()
      try {
        child.stdout?.removeAllListeners()
        child.stderr?.removeAllListeners()
        child.stdout?.destroy()
        child.stderr?.destroy()
        child.unref()
      } catch {}
      const durationMs = Date.now() - started
      const asserts = evaluateAssertions(c, scratch, out, replyText(out), snapshot)
      const gate = skillGate(out, scratch, skill.id)
      const verdict = classify({ exit: code, asserts, skillGate: gate })
      const usage = usageStats(out)
      const result = {
        skill: skill.id,
        case: c.n,
        status: verdict.status,
        reason: verdict.reason,
        title: c.title,
        prompt: c.prompt,
        skillHash: pinned.hash,
        skillGate: { ok: gate.ok, reason: gate.reason, loaded: skillLoads(out).map((l) => l.id) },
        assertions: asserts.map(({ kind, arg, pass, detail }) => ({ kind, arg, pass, detail })),
        execution: { exit: code, durationMs, tokens: usage.tokens, cost: usage.cost, steps: usage.steps, toolCalls: toolCalls(out).length },
        meta: { repoSha: meta.repoSha, agent: meta.agent, model: meta.model, level: meta.level },
        transcript: file,
      }
      writeFileSync(join(dir, `${c.n}.json`), JSON.stringify(result, null, 2))
      const assertBlock = asserts.length
        ? `## Assertions (auto-checked)\n\n${asserts
            .map((a) => `- [${a.pass ? "x" : " "}] ${a.kind} ${a.arg}${a.detail ? ` (${a.detail})` : ""}`)
            .join("\n")}\n\n`
        : "## Assertions (auto-checked)\n\nnone — case is unscored\n\n"
      writeFileSync(
        file,
        `# Eval: ${skill.id} case ${c.n}\n\n**Prompt:** ${c.prompt}\n\n` +
          `**Scratch:** ${scratch}\n**Exit:** ${code}\n**Status:** ${verdict.status}${verdict.reason ? ` — ${verdict.reason}` : ""}\n` +
          `**Skill:** ${gate.ok ? "loaded" : "MISSING"} (${gate.reason})\n**Skill hash:** ${pinned.hash}\n` +
          `**Repo:** ${meta.repoSha}  **Agent:** ${meta.agent}  **Model:** ${meta.model}  **Level:** ${meta.level}  **Duration:** ${durationMs}ms\n\n` +
          `## Expectations (human-checked)\n\n${c.expect.map((e) => `- [ ] ${e}`).join("\n")}\n\n` +
          assertBlock +
          `## Transcript\n\n\`\`\`\n${out}\n\`\`\`\n\n${err ? `## stderr\n\n\`\`\`\n${err}\n\`\`\`\n` : ""}`,
      )
      resolve(result)
    }

    const hardTimer = setTimeout(() => finish("timeout"), opt.timeout * 1000)
    child.stdout.on("data", (d) => (out += d))
    child.stderr.on("data", (d) => (err += d))
    child.on("close", (code) => finish(code ?? "closed"))
    child.on("error", (e) => {
      err += `spawn error: ${e.message}\n`
      finish("error")
    })
  })
}

const startedAt = Date.now()
const queue = [...selected]
const lanes = Math.max(1, Math.min(opt.concurrency, queue.length || 1))
const results = []
async function lane() {
  while (queue.length) {
    const { skill, c } = queue.shift()
    process.stdout.write(`→ ${skill.id} #${c.n}: ${c.prompt.replace(/\n/g, " ").slice(0, 56)}… `)
    const r = await runCase(skill, c)
    results.push(r)
    if (r.status === PASSED) ok++
    else if (r.status === UNSCORED) unscored++
    else fail++
    console.log(`${r.status}${r.reason ? ` (${r.reason})` : ""} — ${r.transcript}`)
  }
}
await Promise.all(Array.from({ length: lanes }, lane))

const totals = summarize(results)
console.log(
  `\n${totals.passed} passed, ${totals.failed} failed, ${totals.unscored} unscored` +
    (totals.staged ? `, ${totals.staged} staged` : "") +
    ` (of ${totals.total}). Transcripts in ${OUT_ROOT}`,
)
if (skipped.length) console.log(`${skipped.length} case(s) skipped at --level ${opt.level} (needs: gates).`)

const runFile = join(OUT_ROOT, "last-run.json")
const summary = summarizeRun({ results, repoSha: repoSha(), agent: opt.agent, model: opt.model ?? "default", level: opt.level, startedAt: new Date(startedAt).toISOString() })
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
  const target = opt.baseline ?? (opt.saveBaseline || opt.skill || opt.case ? null : join(OUT_ROOT, "baseline.json"))
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
