// assertions.mjs — the machine-checked half of a case.
//
// The vocabulary (every kind, its scope and its contract) lives in kinds.mjs;
// this file implements the checks. Every filesystem kind takes a glob (see
// glob.mjs) and every kind that compares against the staged tree fails when the
// pattern matches nothing: a wildcard with no effect must never read as a pass.

import { existsSync, readFileSync, realpathSync } from "node:fs"
import { createHash } from "node:crypto"
import { dirname, isAbsolute, join, relative, sep } from "node:path"
import { expand } from "./glob.mjs"
import { replyText, skillLoads, toolCalls } from "./events.mjs"

// The stance vocabulary a `verdict` line is read with. Closed on purpose: a case
// gates a stance, not a language, and the harness only knows the words the cases
// have actually seen. Anything else still compares literally, so a new token is
// a case change, not a harness change.
const STANCES = [
  ["request changes", "REJECT"],
  ["request change", "REJECT"],
  ["approve", "APPROVE"],
  ["approved", "APPROVE"],
  ["aprovar", "APPROVE"],
  ["aprovado", "APPROVE"],
  ["aprovacao", "APPROVE"],
  ["reject", "REJECT"],
  ["rejected", "REJECT"],
  ["rejeitar", "REJECT"],
  ["rejeitado", "REJECT"],
  ["recusar", "REJECT"],
  ["recusado", "REJECT"],
  ["withheld", "WITHHELD"],
  ["withhold", "WITHHELD"],
  ["retido", "WITHHELD"],
  ["retida", "WITHHELD"],
  ["reter", "WITHHELD"],
]

// Accents and case are decoration too: `Aprovação` and `aprovacao` are one word.
function stance(line) {
  const words = line
    .replace(/[*_`]/g, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  for (const [phrase, name] of STANCES) {
    if (new RegExp(`^${phrase}\\b`).test(words)) return name
  }
  const first = /^[a-z]+/.exec(words)
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

// A stage-time oracle check, never an authoring one: `--list --check` must stay
// model-free and staging-free, but a smoke draw can afford to inspect the tree
// it just staged. The point is the SPEC-0055 case-9 failure — an assertion that
// no fixture can satisfy reads as a healthy red cell and spends paid draws.
//
// `unchanged`/`changed` compare against the staged snapshot, so a target that
// is not there can never be produced by the agent either: those are checked for
// every fixture. `file`/`dir`/`filematch` may legitimately name a path the agent
// creates, so they are checked only against a git fixture, where the base and
// the patch are the repository under review and a target outside both is dead.
// `nofile`/`nodir` assert an absence; there is nothing to produce, and every
// existing negative assertion is deliberately about a path the fixture does not
// create (the audit cases' `nofile docs/backlog/*`), so they are not findings.
const EXISTENCE_KINDS = new Set(["file", "dir", "filematch"])
const SNAPSHOT_KINDS = new Set(["unchanged", "changed"])

export function oracleFindings(c, scratch, { isGit = false } = {}) {
  const findings = []
  for (const { kind, arg } of c.assert || []) {
    if (!SNAPSHOT_KINDS.has(kind) && !EXISTENCE_KINDS.has(kind)) continue
    const glob =
      kind === "filematch" ? String(arg ?? "").split(" ")[0] : String(arg ?? "").trim()
    if (!glob) continue
    if (SNAPSHOT_KINDS.has(kind)) {
      if (!expand(scratch, glob).some((e) => !e.isDir)) {
        findings.push({ kind, arg, reason: `no staged file matches ${glob}`, directory: targetDirectory(arg, kind) })
      }
      continue
    }
    if (!isGit) continue
    const directory = targetDirectory(arg, kind)
    if (!existsSync(join(scratch, directory))) {
      findings.push({ kind, arg, reason: `no staged directory ${directory}`, directory })
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
