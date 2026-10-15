#!/usr/bin/env node
// run-evals.mjs — run the prose evals in a skill's references/evals.md.
//
// Semi-automated v1: for each numbered case it runs the prompt with `opencode run`
// inside an isolated scratch directory and saves the full transcript for review.
// Expectations stay human-checked (no automatic pass/fail yet).
//
// Usage:
//   node ~/.config/opencode/scripts/run-evals.mjs                    # all skills, all cases (dry unless --run)
//   node ~/.config/opencode/scripts/run-evals.mjs --skill graphify
//   node ~/.config/opencode/scripts/run-evals.mjs --case 2 --run
//   node ~/.config/opencode/scripts/run-evals.mjs --list             # list parsed cases only
//   node ~/.config/opencode/scripts/run-evals.mjs --run              # actually execute (default is dry-run)
//
// Flags:
//   --skill <id>      limit to one skill
//   --case <n>        limit to one case number
//   --run             execute (otherwise prints the plan / dry-run)
//   --agent <name>    agent to use (default: build)
//   --model <ref>     model override, provider/model#variant
//   --timeout <sec>   per-case timeout (default: 600)
//   --shared          use the shared service instead of a private server
//                     (NOT isolated — the child inherits the launch directory)
//   --level <fast|full>  fast (default): --quick + concurrency 8, proves behaviour;
//                        full: runs the audit commands, concurrency 4, slower
//   --full               shorthand for --level full
//   --concurrency <n>    override the level's concurrency
//   --quick              override: scaffold only (skip installs/builds/audit)
//
// Isolation: cases run with `--standalone` and a scrubbed child env (no
// OPENCODE*/AI_AGENT) so the agent honours the scratch cwd. Without this the
// child attaches to the shared server and edits the directory you launched from.
//
// Output: transcripts under ~/.local/share/opencode/evals/<skill>/<n>.md

import { readFileSync, readdirSync, lstatSync, realpathSync, existsSync, mkdtempSync, cpSync, mkdirSync, writeFileSync } from "node:fs"
import { spawn } from "node:child_process"
import { join, basename, dirname } from "node:path"
import { homedir, tmpdir } from "node:os"

const argv = process.argv.slice(2)
const opt = { skill: null, case: null, run: false, list: false, agent: "build", model: null, timeout: 600, standalone: true, concurrency: null, quick: null, level: "fast", root: null }
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === "--skill") opt.skill = argv[++i]
  else if (a === "--case") opt.case = Number(argv[++i])
  else if (a === "--run") opt.run = true
  else if (a === "--list") opt.list = true
  else if (a === "--agent") opt.agent = argv[++i]
  else if (a === "--model") opt.model = argv[++i]
  else if (a === "--timeout") opt.timeout = Number(argv[++i])
  else if (a === "--standalone") opt.standalone = true
  else if (a === "--shared") opt.standalone = false
  else if (a === "--concurrency") opt.concurrency = Number(argv[++i])
  else if (a === "--quick") opt.quick = true
  else if (a === "--level") opt.level = argv[++i]
  else if (a === "--full") opt.level = "full"
  else if (a === "--root") opt.root = argv[++i]
}

// Resolve level defaults (explicit --quick/--concurrency win).
if (opt.level !== "fast" && opt.level !== "full") {
  console.error(`unknown --level '${opt.level}' (expected fast|full)`)
  process.exit(1)
}
if (opt.quick === null) opt.quick = opt.level === "fast"
if (opt.concurrency === null) opt.concurrency = opt.level === "fast" ? 8 : 4

const HOME = homedir()
// --root <dir> overrides discovery (for CI, where the repo is not under HOME).
const ROOTS = (
  opt.root
    ? [opt.root]
    : [
        join(HOME, ".agents/skills"),
        join(HOME, ".claude/skills"),
        join(HOME, ".codex/skills"),
        join(HOME, ".config/opencode/skills"),
      ]
).filter(existsSync)
const OUT_ROOT = join(HOME, ".local/share/opencode/evals")

// Scrub the vars that make `opencode run` attach to the invoking session's
// server/project instead of the scratch cwd — the cause of eval runs editing
// the launch directory.
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

// Parse "N. **\"prompt\"**" cases from an evals.md file.
function parseCases(md) {
  const cases = []
  const lines = md.split("\n")
  let cur = null
  for (const line of lines) {
    const m = line.match(/^\s*(\d+)\.\s+\*\*(.+?)\*\*(.*)$/)
    if (m) {
      if (cur) cases.push(cur)
      const n = Number(m[1])
      let prompt = (m[2] + (m[3] ? " " + m[3].trim() : "")).trim()
      if (/^".*"$/.test(prompt)) prompt = prompt.slice(1, -1).trim()
      cur = { n, prompt, expect: [], assert: [] }
    } else if (cur && /^\s*[-*]\s+/.test(line)) {
      const item = line.replace(/^\s*[-*]\s+/, "").trim()
      const a = item.match(/^\[assert\]\s+(\w+)\s+(.+)$/)
      if (a) cur.assert.push({ kind: a[1], arg: a[2].trim() })
      else cur.expect.push(item)
    }
  }
  if (cur) cases.push(cur)
  return cases
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

// Evaluate optional machine-checkable assertions:
//   [assert] file <path>          scratch file exists
//   [assert] nofile <path>        scratch file absent
//   [assert] dir <path>           scratch directory exists
//   [assert] nodir <path>         scratch directory absent
//   [assert] filematch <path> <re>  scratch file content matches regex
//   [assert] grep <regex>         regex matches the transcript (see caveat)
//   [assert] nogrep <regex>       regex does not match the transcript
//   [assert] unchanged <path>     scratch file byte-identical to the fixture copy
//   [assert] changed <path>       scratch file differs from the fixture copy
//
// Caveat: the transcript contains the skill's own text, so grep against it can
// match this eval file. Prefer file/dir/filematch/unchanged assertions.
function evaluateAssertions(c, scratch, out) {
  const results = []
  for (const { kind, arg } of c.assert || []) {
    const p = join(scratch, arg)
    const fixture = join(c.skillDir, "references/evals", String(c.n), arg)
    let pass = false
    let detail = ""
    switch (kind) {
      case "file":
        pass = existsSync(p)
        break
      case "nofile":
        pass = !existsSync(p)
        break
      case "dir":
      case "nodir": {
        let isDir = false
        try {
          readdirSync(p)
          isDir = true
        } catch {}
        pass = kind === "dir" ? isDir : !isDir
        break
      }
      case "filematch": {
        const sp = arg.indexOf(" ")
        const fp = sp === -1 ? arg : arg.slice(0, sp)
        const re = sp === -1 ? null : new RegExp(arg.slice(sp + 1).trim())
        try {
          if (re && fp.includes("*")) {
            // Glob: pass if ANY file matching the pattern has content matching re.
            const dir = join(scratch, dirname(fp))
            const rx = new RegExp(
              "^" + basename(fp).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
            )
            let names = []
            try {
              names = readdirSync(dir)
            } catch {}
            pass = names.some((n) => rx.test(n) && re.test(readFileSync(join(dir, n), "utf8")))
          } else {
            const full = join(scratch, fp)
            pass = !!re && existsSync(full) && re.test(readFileSync(full, "utf8"))
          }
        } catch {
          pass = false
        }
        break
      }
      case "grep":
        pass = new RegExp(arg).test(out)
        break
      case "nogrep":
        pass = !new RegExp(arg).test(out)
        break
      case "unchanged":
      case "changed": {
        const a = existsSync(p) ? readFileSync(p) : null
        const b = existsSync(fixture) ? readFileSync(fixture) : null
        if (kind === "unchanged") pass = a !== null && b !== null && a.equals(b)
        else pass = a !== null && b !== null && !a.equals(b)
        break
      }
      default:
        detail = `unknown assert kind '${kind}'`
    }
    results.push({ kind, arg, pass, detail })
  }
  return results
}

function runCase(skill, c) {
  const scratch = mkdtempSync(join(tmpdir(), `eval-${skill.id}-${c.n}-`))
  const fixture = join(skill.dir, "references/evals", String(c.n))
  if (existsSync(fixture)) cpSync(fixture, scratch, { recursive: true })

  const args = ["run", "--format", "json", "--auto", "--agent", opt.agent]
  if (opt.standalone) args.push("--standalone")
  if (opt.model) args.push("--model", opt.model)
  const prompt = opt.quick
    ? `${c.prompt}\n\nWork fast: skip \`bun install\`, builds, and the full audit command list, and do not commit. Otherwise follow the skill's normal rules — including any step that requires user confirmation.`
    : c.prompt
  args.push(prompt)

  const dir = join(OUT_ROOT, skill.id)
  mkdirSync(dir, { recursive: true })
  const file = join(dir, `${c.n}.md`)

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
      // Release the pipe handles; otherwise a detached service holding them
      // keeps this process alive forever.
      try {
        child.stdout?.removeAllListeners()
        child.stderr?.removeAllListeners()
        child.stdout?.destroy()
        child.stderr?.destroy()
        child.unref()
      } catch {}
      const asserts = evaluateAssertions(c, scratch, out)
      const failedAsserts = asserts.filter((a) => !a.pass).length
      const assertBlock = asserts.length
        ? `## Assertions (auto-checked)\n\n${asserts
            .map((a) => `- [${a.pass ? "x" : " "}] ${a.kind} ${a.arg}${a.detail ? ` (${a.detail})` : ""}`)
            .join("\n")}\n\n`
        : ""
      writeFileSync(
        file,
        `# Eval: ${skill.id} case ${c.n}\n\n**Prompt:** ${c.prompt}\n\n` +
          `**Scratch:** ${scratch}\n**Exit:** ${code}\n**Assertions:** ${
            asserts.length - failedAsserts
          }/${asserts.length} passed\n\n` +
          `## Expectations (human-checked)\n\n${c.expect.map((e) => `- [ ] ${e}`).join("\n")}\n\n` +
          assertBlock +
          `## Transcript\n\n\`\`\`\n${out}\n\`\`\`\n\n${err ? `## stderr\n\n\`\`\`\n${err}\n\`\`\`\n` : ""}`,
      )
      resolve({ code, file, failedAsserts })
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

const skills = discoverEvals().filter((s) => !opt.skill || s.id === opt.skill)
if (!skills.length) {
  console.error(opt.skill ? `no skill "${opt.skill}" with references/evals.md` : "no skills with references/evals.md found")
  process.exit(1)
}

const plan = []
for (const s of skills) {
  const cases = parseCases(readFileSync(s.evals, "utf8")).filter((c) => !opt.case || c.n === opt.case)
  for (const c of cases) plan.push({ skill: s, c })
}

if (opt.list || !opt.run) {
  console.log(`Parsed ${plan.length} case(s):\n`)
  for (const { skill, c } of plan) {
    console.log(`  ${skill.id} #${c.n}: ${c.prompt.slice(0, 72)}${c.prompt.length > 72 ? "…" : ""}  [${c.expect.length} expectations]`)
  }
  if (!opt.run) console.log(`\nDry run. Re-run with --run to execute (agent=${opt.agent}, timeout=${opt.timeout}s).`)
  process.exit(0)
}

let ok = 0
let fail = 0
console.log(
  `Isolation: standalone=${opt.standalone}` +
    (opt.standalone
      ? ", child env scrubbed (OPENCODE*, AI_AGENT)\n"
      : " (--shared: NOT isolated — cases run in your launch directory!)\n"),
)
const queue = [...plan]
const lanes = Math.max(1, Math.min(opt.concurrency, queue.length))
console.log(`Level: ${opt.level} (quick=${opt.quick}, concurrency=${lanes})\n`)
async function lane() {
  while (queue.length) {
    const { skill, c } = queue.shift()
    c.skillDir = skill.dir
    process.stdout.write(`→ ${skill.id} #${c.n}: ${c.prompt.slice(0, 60)}… `)
    const r = await runCase(skill, c)
    const good = r.code === 0 && (r.failedAsserts ?? 0) === 0
    console.log(
      good
        ? `done (${r.file})`
        : `exit ${r.code}${r.failedAsserts ? `, ${r.failedAsserts} assert(s) failed` : ""} (${r.file})`,
    )
    good ? ok++ : fail++
  }
}
await Promise.all(Array.from({ length: lanes }, lane))
console.log(`\n${ok} ok, ${fail} failed. Transcripts in ${OUT_ROOT}`)
process.exit(fail ? 1 : 0)
