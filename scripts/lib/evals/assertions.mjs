// assertions.mjs — the machine-checked half of a case.
//
// The vocabulary (every kind, its scope and its contract) lives in kinds.mjs;
// this file implements the checks. Every filesystem kind takes a glob (see
// glob.mjs) and every kind that compares against the staged tree fails when the
// pattern matches nothing: a wildcard with no effect must never read as a pass.

import { readFileSync, realpathSync } from "node:fs"
import { createHash } from "node:crypto"
import { dirname, isAbsolute, join, relative, sep } from "node:path"
import { expand, toRegExp } from "./glob.mjs"
import { replyText, skillLoads, toolCalls } from "./events.mjs"
import { VERDICT_BLOCKERS, VERDICT_FORMS } from "./kinds.mjs"

// Accents and case are decoration too: `Aprovação` and `aprovacao` are one word.
// Markdown emphasis is stripped before matching so a bolded stance is the same
// stance; the line itself is never trimmed to a prefix, because a verdict line
// is often prose ("compliant — approve", "changes requested — one defect").
function normaliseVerdict(line) {
  return line
    .replace(/[*_`]/g, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

// Longest first, so a phrase that prefixes another is tried before it. Compiled
// once: the table is closed at module load, so a typo in it is a startup failure,
// not a silently dead branch of the matcher.
const FORM_MATCHERS = VERDICT_FORMS.slice()
  .sort((a, b) => b[0].length - a[0].length)
  .map(([phrase, name]) => ({
    phrase,
    name,
    re: new RegExp(`(?:^|[^a-z])${escapeRe(phrase)}(?![a-z])`, "g"),
  }))

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// The guard applies to the whole clause the form sits in, so a negator does not
// have to be the word immediately before it: `unable to approve`, `not able to
// approve`, `not at all blocking` and `if the tests were fixed, approve` are all
// blocked. A clause boundary resets it, so a later clause can state a stance.
const CLAUSE_BOUNDARIES = [".", ";", ":", "—", "–"]

function clauseBefore(text, start) {
  const before = text.slice(0, start)
  let cut = -1
  for (const boundary of CLAUSE_BOUNDARIES) cut = Math.max(cut, before.lastIndexOf(boundary))
  return cut === -1 ? before : before.slice(cut + 1)
}

const BLOCKER_RE = new RegExp(
  `(?:^|[^a-z])(?:${VERDICT_BLOCKERS.map((b) => escapeRe(normaliseVerdict(b)))
    .sort((a, b) => b.length - a.length)
    .join("|")})(?![a-z])`,
)

function blockedBefore(text, start) {
  return BLOCKER_RE.test(clauseBefore(text, start))
}

// The stance a verdict line states. Every form in the line is read, and the
// stance is the polarity the line commits to: **a rejection wins over an
// approval** when both appear, because a line that names a blocking finding is
// not an approval whatever its first clause says (`Approve the tests; reject the
// change`, `approved, but do not merge`, the #9 r4 shape). Within one polarity
// the earliest form decides, which is unobservable once the polarity is named.
// No unnegated form means no stance: the line is reported by its first word, so a
// near-miss reads as what it literally says instead of as its surface reading.
function stance(line) {
  const text = normaliseVerdict(line)
  const found = new Set()
  for (const { phrase, name, re } of FORM_MATCHERS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      if (!blockedBefore(text, m.index + m[0].length - phrase.length)) found.add(name)
      if (re.lastIndex === m.index) re.lastIndex++
    }
  }
  if (found.has("REJECT")) return "REJECT"
  if (found.has("WITHHELD")) return "WITHHELD"
  if (found.has("APPROVE")) return "APPROVE"
  const first = /^[a-z]+/.exec(text)
  return first ? first[0].toUpperCase() : ""
}

// A behavioural case can be carried by the staged skill even when the `skill`
// tool is never called: the agent opens the copied SKILL.md and follows it.
// That is a load for the gate, but only the scratch copy. A read outside the
// scratch is the global install or a stale copy — contamination, not a load —
// and a trigger case keeps the tool call as its signal (`gate: off`).
function stagedSkillRead(out, scratch, expectedId) {
  const root = realPath(scratch)
  for (const t of toolCalls(out)) {
    if (t.tool !== "read" || t.status !== "completed") continue
    const raw = t.input.filePath ?? t.input.path ?? t.input.filename
    if (typeof raw !== "string" || !raw) continue
    const candidate = realPath(isAbsolute(raw) ? raw : join(scratch, raw))
    if (!isInside(scratch, candidate)) continue
    const parts = relative(root, candidate).split(sep)
    // <scratch>/.opencode/skills/<id>/SKILL.md
    if (parts.length !== 4) continue
    if (parts[0] !== ".opencode" || parts[1] !== "skills" || parts[3] !== "SKILL.md") continue
    if (expectedId && parts[2] !== expectedId) continue
    return { id: parts[2], directory: join(scratch, ".opencode", "skills", parts[2]), status: t.status }
  }
  return null
}

export function skillGate(out, scratch, expectedId) {
  const loads = skillLoads(out)
  let hit = loads.find((l) => l.id === expectedId || !expectedId)
  let source = "tool"
  if (!hit) {
    const read = stagedSkillRead(out, scratch, expectedId)
    if (read) {
      hit = read
      source = "read"
    }
  }
  if (!hit) {
    if (!loads.length) return { ok: false, reason: `skill '${expectedId}' was not loaded`, loads, source: null }
    return { ok: false, reason: `loaded ${loads.map((l) => l.id).join(", ")} instead of '${expectedId}'`, loads, source: null }
  }
  // Provenance lives here, not in the `skill` assertion: an id match from the
  // global install would mean the run tested something other than the checkout.
  if (!isInside(scratch, hit.directory)) {
    return { ok: false, reason: `'${hit.id}' loaded from ${hit.directory || "an unknown path"}, outside the scratch dir`, loads, source: null }
  }
  return {
    ok: true,
    reason: source === "read" ? `read ${hit.id}/SKILL.md from the scratch dir` : `loaded ${hit.id}`,
    loads: source === "read" ? [...loads, { ...hit, source }] : loads,
    source,
  }
}

function md5(file) {
  try {
    return createHash("md5").update(readFileSync(file)).digest("hex")
  } catch {
    return null
  }
}

export function evaluateAssertions(c, scratch, out, text = replyText(out), snapshot = new Map()) {
  const results = []
  for (const { kind, arg } of c.assert || []) {
    results.push(check(kind, arg, { scratch, out, text, snapshot }))
  }
  return results
}

// The literal directory an assertion's target lives in. `filematch` carries
// `<glob> <regex>`, so the regex is not part of the path. `docs/backlog/*`
// lives in `docs/backlog`; `src/*.js` lives in `src`; `AGENTS.md` in `.`.
export function targetDirectory(arg, kind) {
  let glob = String(arg ?? "").trim()
  if (kind === "filematch") {
    const sp = glob.indexOf(" ")
    if (sp !== -1) glob = glob.slice(0, sp)
  }
  const wildcard = glob.search(/[*?[{]/)
  if (wildcard === -1) return dirname(glob) || "."
  const prefix = glob.slice(0, wildcard)
  if (prefix.endsWith("/")) return prefix.slice(0, -1) || "."
  return dirname(prefix) || "."
}

// An oracle check with two severities, because an eval draw is allowed to create
// the file it is then checked for. `unchanged`/`changed` compare against the
// staged snapshot, so a target that is not staged can never be produced by the
// agent either: those are errors. `file`/`dir`/`filematch` may legitimately name
// a path the draw creates, so a missing staged match is a warning, not a
// rejection of a correct case (the SPEC-0055 case-9 class is caught by the
// missing-base error in `stageFixture`). `nofile`/`nodir` assert an absence;
// there is nothing to produce and they are not checked.
const EXISTENCE_KINDS = new Set(["file", "dir", "filematch"])
const SNAPSHOT_KINDS = new Set(["unchanged", "changed"])

export function oracleFindings(c, scratch) {
  const findings = []
  for (const { kind, arg } of c.assert || []) {
    if (!SNAPSHOT_KINDS.has(kind) && !EXISTENCE_KINDS.has(kind)) continue
    const glob = kind === "filematch" ? String(arg ?? "").split(" ")[0] : String(arg ?? "").trim()
    if (!glob) continue
    if (SNAPSHOT_KINDS.has(kind)) {
      if (!expand(scratch, glob).some((e) => !e.isDir)) {
        findings.push({
          level: "error",
          kind,
          arg,
          reason: `no staged file matches ${glob}`,
          directory: targetDirectory(arg, kind),
        })
      }
      continue
    }
    const hits = expand(scratch, glob)
    const hit = kind === "dir" ? hits.some((e) => e.isDir) : hits.some((e) => !e.isDir)
    if (!hit) {
      findings.push({
        level: "warning",
        kind,
        arg,
        reason: "unverified target: the draw must create it",
        directory: targetDirectory(arg, kind),
      })
    }
  }
  return findings
}

// The same warning rules against a fixture listing, so `--list --check` can
// print them without staging a single case. A stage-time pass remains the
// authoritative check; this one is an authoring view of the same rule.
export function oracleWarnings(c, entries) {
  const findings = []
  for (const { kind, arg } of c.assert || []) {
    if (!EXISTENCE_KINDS.has(kind)) continue
    const glob = kind === "filematch" ? String(arg ?? "").split(" ")[0] : String(arg ?? "").trim()
    if (!glob) continue
    const re = toRegExp(glob)
    const hit = entries.some((e) => (kind === "dir" ? e.isDir : !e.isDir) && re.test(e.rel))
    if (!hit) {
      findings.push({
        level: "warning",
        kind,
        arg,
        reason: "unverified target: the draw must create it",
        directory: targetDirectory(arg, kind),
      })
    }
  }
  return findings
}

// A shell call is not one command: `npm test 2>&1; echo "exit: $?"` is two, and
// the second owns the status. Splitting is quote-aware (and keeps redirections
// such as `2>&1` whole) so the matcher can tell which command the gate is.
// This is not a shell parser: pipes, `;`, `&&`, `||`, newlines and background
// `&` are the separators the corpus uses.
function splitCommands(command) {
  const text = String(command ?? "")
  const parts = []
  let cur = ""
  let quote = null
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      cur += ch
      if (ch === "\\" && quote === '"' && i + 1 < text.length) cur += text[++i]
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      cur += ch
      continue
    }
    if (ch === "\\") {
      cur += ch
      if (i + 1 < text.length) cur += text[++i]
      continue
    }
    if (ch === ";") {
      parts.push(cur)
      cur = ""
      continue
    }
    if (ch === "\n") {
      parts.push(cur)
      cur = ""
      continue
    }
    if (ch === "&") {
      // `2>&1` and `&>file` are redirections, not backgrounds.
      if (text[i + 1] === ">" || />\s*$/.test(cur)) {
        cur += ch
        continue
      }
      if (text[i + 1] === "&") i++
      parts.push(cur)
      cur = ""
      continue
    }
    if (ch === "|") {
      if (text[i + 1] === "|") i++
      parts.push(cur)
      cur = ""
      continue
    }
    cur += ch
  }
  parts.push(cur)
  return parts.map((p) => p.trim()).filter(Boolean)
}

// The command word and its arguments, with leading `FOO=bar` assignments removed.
function words(text) {
  const found = String(text ?? "").match(/"(?:[^"\\]|\\.)*"|'[^']*'|[^\s]+/g) ?? []
  return found.map((w) => (w.length > 1 && (w[0] === '"' || w[0] === "'") && w[0] === w[w.length - 1] ? w.slice(1, -1) : w))
}

// The `package.json` script a package-manager invocation names, if any. The
// alias set is the corpus's, not the package manager's: `yarn install` resolves
// only if the fixture happens to define that script.
function scriptName(text) {
  const list = words(text)
  let i = 0
  while (i < list.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(list[i])) i++
  const exe = list[i]
  if (!exe) return null
  const base = exe.split("/").pop()
  const rest = list.slice(i + 1)
  const at = (n) => rest[n] ?? null
  if (base === "npm") {
    if (at(0) === "run" || at(0) === "run-script") return at(1)
    if (at(0) === "test" || at(0) === "start") return at(0)
    return null
  }
  if (base === "yarn" || base === "pnpm" || base === "bun") {
    return at(0) === "run" ? at(1) : at(0)
  }
  return null
}

// A missing, unreadable or non-JSON manifest leaves the call literal: the
// expansion adds evidence, it never invents it.
function readScripts(scratch) {
  try {
    const parsed = JSON.parse(readFileSync(join(scratch, "package.json"), "utf8"))
    const scripts = parsed?.scripts
    if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) return {}
    const out = {}
    for (const [name, body] of Object.entries(scripts)) if (typeof body === "string") out[name] = body
    return out
  } catch {
    return {}
  }
}

const SCRIPT_DEPTH = 3

// Every command a shell call names, and whether that command owns the call's
// exit status. The literal is always present; a script body adds itself and
// whatever it invokes, capped at three levels with a per-chain visited set so a
// cycle ends the expansion instead of the process.
function commandEntries(command, scratch) {
  const literal = String(command ?? "")
  const parts = splitCommands(literal)
  const scripts = readScripts(scratch)
  const entries = []
  const seen = new Set()
  const add = (form, segment, gateLast) => {
    if (typeof form !== "string") return
    const key = `${segment}\u0000${form}\u0000${gateLast}`
    if (seen.has(key)) return
    seen.add(key)
    entries.push({ form, segment, gateLast })
  }

  // A single-command call is the gate entire. A compound call is matched one
  // command at a time, so a wrapper cannot lend the gate its status.
  if (parts.length <= 1) add(literal, parts[0] ?? literal, true)
  parts.forEach((part, i) => add(part, part, i === parts.length - 1))

  const walk = (text, segment, containerLast, depth, ancestors) => {
    if (depth > SCRIPT_DEPTH) return
    const local = splitCommands(text)
    local.forEach((part, i) => {
      const name = scriptName(part)
      if (!name || !Object.prototype.hasOwnProperty.call(scripts, name) || ancestors.has(name)) return
      const next = new Set(ancestors)
      next.add(name)
      const last = containerLast && i === local.length - 1
      const body = scripts[name]
      const bodyParts = splitCommands(body)
      if (!bodyParts.length) add(body, segment, last)
      bodyParts.forEach((bp, j) => add(bp, segment, last && j === bodyParts.length - 1))
      walk(body, segment, last, depth + 1, next)
    })
  }
  parts.forEach((part, i) => walk(part, part, i === parts.length - 1, 1, new Set()))
  return entries
}

// `resolveCommands` is the public shape of the resolver: the literal command
// plus every form reachable through the fixture's `package.json` `scripts`.
export function resolveCommands(command, scratch) {
  const literal = String(command ?? "")
  const forms = [literal]
  for (const { form } of commandEntries(command, scratch)) if (!forms.includes(form)) forms.push(form)
  return forms
}

// `exit: N`, `EXIT: N`, `exit code N`, `NAME-exit: N`, `GATE_EXIT=0` and the
// values a `$?`/`${pipestatus[…]}`, `$?` echo writes — the status a command
// printed for itself. Last match wins: a command that reports more than once
// ends with its final status.
const PRINTED_EXIT = /\b(?:[A-Za-z0-9_.-]*[-_])?exit(?:\s+code)?\s*(?:[:=]\s*)?(-?\d+)\b/gi

function printedExit(output) {
  const text = String(output ?? "")
  PRINTED_EXIT.lastIndex = 0
  let last = null
  let m
  while ((m = PRINTED_EXIT.exec(text))) {
    last = Number(m[1])
    if (PRINTED_EXIT.lastIndex === m.index) PRINTED_EXIT.lastIndex++
  }
  return last
}

// A test runner's own counters. `✖` is deliberately absent: node's TAP output
// uses it for skipped and todo tests too, so only the counts decide.
const SUMMARY_LINE =
  /^(?:\s*(?:ℹ|#)\s*(?:tests|suites|pass|fail|cancelled|skipped|todo|duration_ms)\b|\s*Tests:|\s*npm ERR!)/

function lastSummaryBlock(output) {
  const lines = String(output ?? "").split("\n")
  let current = []
  let last = []
  for (const line of lines) {
    if (SUMMARY_LINE.test(line)) {
      current.push(line)
      last = current
    } else {
      current = []
    }
  }
  return last.join("\n")
}

// The runner's verdict from the last counter block in the output. A later run
// replaces an earlier one, so a pre-fix red and a post-fix green read green.
function summaryExit(output) {
  const block = lastSummaryBlock(output)
  if (!block) return null
  if (/\bnpm ERR!/.test(block)) return 1
  if (/(?:^|\n)\s*(?:ℹ|#)\s*fail\s+[1-9]\d*/.test(block)) return 1
  if (/Tests:.*\b[1-9]\d*\s+failed/.test(block)) return 1
  if (/(?:^|\n)\s*(?:ℹ|#)\s*pass\s+[1-9]\d*/.test(block)) return 0
  if (/Tests:.*\b\d+\s+passed/.test(block)) return 0
  return null
}

// The gate's status, not the wrapper's. When the matched command is the last
// command of the call, the recorded exit is the gate's. Otherwise the recorded
// exit belongs to whatever came after — `; echo "exit: $?"`, `| tail`, `|| true`
// — and the status is read from the output: an explicit printed code first, then
// the runner's own counters. Nothing readable is unknown, and unknown is not a
// pass. A non-zero recorded exit is already a red gate, so it is kept as the
// conservative reading rather than rewritten to unknown (this is what preserves
// the existing `events.test.mjs` stream).
export function effectiveExit(call, { gateLast = true } = {}) {
  const recorded = Number.isInteger(call?.exit) ? call.exit : null
  if (gateLast) return { code: recorded, why: recorded === null ? "no recorded exit" : "recorded exit" }
  if (recorded !== null && recorded !== 0) return { code: recorded, why: "wrapper failed" }
  const printed = printedExit(call?.output)
  if (printed !== null) return { code: printed, why: "printed status" }
  const summary = summaryExit(call?.output)
  if (summary !== null) return { code: summary, why: "runner summary" }
  return { code: null, why: "exit masked, no recorded status" }
}

function check(kind, arg, { scratch, out, text, snapshot }) {
  const push = (pass, detail = "") => ({ kind, arg, pass, detail })

  if (kind === "reply" || kind === "noreply") {
    // Case-insensitive: the case is about what was said, not its capitalisation.
    const re = safeRegex(arg, "i")
    if (!re) return push(false, "invalid regex")
    const hit = re.test(text)
    return push(kind === "reply" ? hit : !hit)
  }

  if (kind === "verdict") {
    // Tolerate markdown decoration: the contract is the stance, not the styling.
    const label = /^\s*(?:[#>*_`-]+\s*)*(?:verdict|veredicto|parecer)\s*:?\s*/im.exec(text)
    if (!label) return push(false, "no VERDICT: line in the reply")
    // Only the rest of that line counts, or the next one when the label is a
    // heading — a word further down the reply is prose, not the verdict.
    const after = text.slice(label.index + label[0].length).split("\n")
    const rest = (after[0].trim() || after.slice(1).find((l) => l.trim()) || "").trim()
    const got = stance(rest)
    if (!got) return push(false, "VERDICT: line names no stance")
    return push(got === stance(arg), `got ${got}`)
  }

  if (kind === "ran" || kind === "ranpass") {
    const re = safeRegex(arg)
    if (!re) return push(false, "invalid regex")
    // `ran` and `ranpass` share the resolver: the kinds differ on exit status,
    // not on what counts as running the gate.
    const hits = []
    for (const call of toolCalls(out)) {
      if (call.tool !== "shell") continue
      const entries = commandEntries(String(call.input.command ?? ""), scratch).filter((e) => re.test(e.form))
      if (entries.length) hits.push({ call, entries })
    }
    if (!hits.length) return push(false, "the command never ran")
    if (kind === "ran") return push(true, `${hits.length} run(s)`)
    // One verdict per call: the gate is green only if one of its invocations is
    // the last command and exited 0. Otherwise report the most specific status,
    // and the fail-closed phrase when the mask printed nothing.
    const codes = hits.map(({ call, entries }) => {
      const exits = entries.map((e) => effectiveExit(call, { gateLast: e.gateLast }))
      if (exits.some((e) => e.code === 0)) return 0
      return exits.find((e) => e.code !== null)?.code ?? null
    })
    const green = codes.filter((code) => code === 0)
    const detail = codes.map((code) => (code === null ? "exit masked, no recorded status" : `exit ${code}`)).join(", ")
    return push(green.length > 0, detail)
  }

  if (kind === "tool" || kind === "notool") {
    const used = toolCalls(out).filter((t) => t.tool === arg.trim())
    if (kind === "tool") return push(used.length > 0, used.length ? `${used.length} call(s)` : "never used")
    return push(used.length === 0, used.length ? `${used.length} call(s)` : "")
  }

  // `skill` is routing evidence: did this id get chosen? Provenance (is it the
  // checkout's copy?) is the case gate's job, not this assertion's.
  if (kind === "skill" || kind === "notskill") {
    const loads = skillLoads(out)
    const hit = loads.find((l) => l.id === arg.trim())
    if (kind === "skill") return push(!!hit, hit ? `from ${hit.directory || "unknown path"}` : "not loaded")
    return push(!hit, hit ? `loaded from ${hit.directory || "unknown path"}` : "")
  }

  if (kind === "noskill") {
    const loads = skillLoads(out)
    return push(loads.length === 0, loads.length ? `loaded ${loads.map((l) => l.id).join(", ")}` : "")
  }

  if (kind === "filematch") {
    const sp = arg.indexOf(" ")
    if (sp === -1) return push(false, "missing regex")
    const glob = arg.slice(0, sp)
    const re = safeRegex(arg.slice(sp + 1).trim())
    if (!re) return push(false, "invalid regex")
    const files = expand(scratch, glob).filter((e) => !e.isDir)
    if (!files.length) return push(false, `no file matches ${glob}`)
    const hit = files.some(({ rel }) => {
      try {
        return re.test(readFileSync(join(scratch, rel), "utf8"))
      } catch {
        return false
      }
    })
    return push(hit, hit ? "" : `${files.length} file(s) matched the path, none the content`)
  }

  if (kind === "changed" || kind === "unchanged") {
    const files = expand(scratch, arg).filter((e) => !e.isDir)
    if (!files.length) return push(false, `no file matches ${arg}`)
    const bad = []
    for (const { rel } of files) {
      const now = md5(join(scratch, rel))
      const before = snapshot.get(rel) ?? null
      if (before === null) bad.push(`${rel}: not in staging`)
      else if (kind === "unchanged" && now !== before) bad.push(`${rel}: modified`)
      else if (kind === "changed" && now === before) bad.push(`${rel}: untouched`)
      if (now === null) bad.push(`${rel}: missing`)
    }
    return push(bad.length === 0, bad.join("; "))
  }

  // Whole-tree kinds.
  const entries = expand(scratch, arg)
  if (kind === "file") {
    const hit = entries.some((e) => !e.isDir)
    return push(hit, hit ? "" : `nothing matches ${arg}`)
  }
  if (kind === "nofile") {
    const hit = entries.filter((e) => !e.isDir)
    return push(hit.length === 0, hit.length ? `exists: ${hit.map((e) => e.rel).join(", ")}` : "")
  }
  if (kind === "dir" || kind === "nodir") {
    const dirs = entries.filter((e) => e.isDir)
    if (kind === "dir") return push(dirs.length > 0, dirs.length ? "" : `no directory matches ${arg}`)
    return push(dirs.length === 0, dirs.length ? `exists: ${dirs.map((e) => e.rel).join(", ")}` : "")
  }

  return push(false, `unknown assert kind '${kind}'`)
}

// Both sides are realpathed: macOS tmpdir is /var/..., while the agent reports
// /private/var/..., and a symlinked scratch would otherwise read as "outside".
// A path that does not exist yet falls back to its literal form.
function realPath(p) {
  try {
    return realpathSync(p).replace(/\/+$/, "")
  } catch {
    return p.replace(/\/+$/, "")
  }
}

function isInside(root, candidate) {
  if (!candidate) return false
  const a = realPath(root)
  const b = realPath(candidate)
  if (b === a || b.startsWith(a + "/")) return true
  // realpath only succeeds on paths that exist; fall back to the literal form
  // so a not-yet-created candidate still compares correctly.
  return candidate === root.replace(/\/+$/, "") || candidate.startsWith(root.replace(/\/+$/, "") + "/")
}

export function safeRegex(pattern, flags = "") {
  try {
    return new RegExp(pattern, flags)
  } catch {
    return null
  }
}
