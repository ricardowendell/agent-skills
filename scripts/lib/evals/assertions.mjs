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
    const calls = toolCalls(out).filter((t) => t.tool === "shell" && re.test(String(t.input.command ?? "")))
    if (!calls.length) return push(false, "the command never ran")
    if (kind === "ran") return push(true, `${calls.length} run(s)`)
    const green = calls.filter((t) => t.exit === 0)
    return push(green.length > 0, `exit ${calls.map((t) => t.exit ?? "?").join(", ")}`)
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
