// assertions.mjs — the machine-checked half of a case.
//
// Every filesystem kind takes a glob (see glob.mjs) and every kind that compares
// against the staged tree fails when the pattern matches nothing: a wildcard with
// no effect must never read as a pass.
//
//   file <glob>            at least one match
//   nofile <glob>          no match
//   dir <glob>             at least one directory
//   nodir <glob>           no directory
//   filematch <glob> <re>  at least one matching file's content matches re
//   reply <re>             the assistant's own text matches re
//   noreply <re>           ...does not match
//   verdict APPROVE|REJECT|WITHHELD  the reply's verdict line names this stance
//   unchanged <glob>       every match exists and is byte-identical to staging
//   changed <glob>         at least one match, all differ from staging
//   ran <re>               a shell command matching re was executed
//   ranpass <re>           ...and at least one of those executions exited 0
//   tool <name>            the named tool was used
//   notool <name>          it was not
//   skill <id>             the id's skill was loaded
//   notskill <id>          it was not (other skills may load: routing, not silence)
//   noskill                no skill was loaded at all

import { readFileSync, realpathSync } from "node:fs"
import { createHash } from "node:crypto"
import { join } from "node:path"
import { expand } from "./glob.mjs"

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

// The assistant's own words, without tool output or the skill's text — so
// `reply`/`verdict` cannot be satisfied by the skill's own template.
export function replyText(out) {
  const parts = []
  for (const ev of events(out)) {
    if (ev.type === "text" && ev.part?.text) parts.push(ev.part.text)
  }
  return parts.join("\n")
}

export function events(out) {
  const list = []
  for (const line of out.split("\n")) {
    const s = line.trim()
    if (!s.startsWith("{")) continue
    try {
      list.push(JSON.parse(s))
    } catch {}
  }
  return list
}

// Tool calls with what they ran, their exit status and timing. `exit` is absent
// for non-shell tools, so `undefined` means "not applicable", not "failed".
export function toolCalls(out) {
  return events(out)
    .filter((ev) => ev.type === "tool_use" && ev.part?.state)
    .map((ev) => {
      const st = ev.part.state
      return {
        tool: ev.part.tool,
        input: st.input ?? {},
        meta: st.metadata?.metadata ?? {},
        exit: st.metadata?.metadata?.exit,
        status: st.status,
        start: ev.part.time?.start ?? ev.timestamp,
        end: ev.part.time?.end ?? ev.timestamp,
      }
    })
}

// Which skill OpenCode actually loaded, and from where. `directory` is the
// decided fact: a project-local copy shadows the global install, so a directory
// outside the scratch dir means the run tested a different skill than the one
// under review.
// Token and cost totals, already present in the `step-finish` events. Both
// spellings appear in the stream, so normalise `step_finish` before comparing.
export function usageStats(out) {
  const tokens = { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 }
  let cost = 0
  let steps = 0
  for (const ev of events(out)) {
    const type = String(ev.type ?? "").replace(/_/g, "-")
    if (type !== "step-finish") continue
    steps++
    const t = ev.part?.tokens ?? {}
    tokens.input += t.input ?? 0
    tokens.output += t.output ?? 0
    tokens.reasoning += t.reasoning ?? 0
    tokens.cacheRead += t.cache?.read ?? 0
    tokens.cacheWrite += t.cache?.write ?? 0
    cost += ev.part?.cost ?? 0
  }
  return { tokens, cost, steps }
}

export function skillLoads(out) {
  // An errored attempt is not a load: a denied or failed `skill` call must never
  // satisfy `assert: skill` or the gate.
  return toolCalls(out)
    .filter((t) => t.tool === "skill" && t.status === "completed")
    .map((t) => ({
      id: t.input.id ?? t.input.name ?? t.meta.name ?? "",
      directory: t.meta.directory ?? t.input.directory ?? "",
      status: t.status,
    }))
}

export function skillGate(out, scratch, expectedId) {
  const loads = skillLoads(out)
  if (!loads.length) return { ok: false, reason: `skill '${expectedId}' was not loaded`, loads }
  const hit = loads.find((l) => l.id === expectedId || !expectedId)
  if (!hit) return { ok: false, reason: `loaded ${loads.map((l) => l.id).join(", ")} instead of '${expectedId}'`, loads }
  // Provenance lives here, not in the `skill` assertion: an id match from the
  // global install would mean the run tested something other than the checkout.
  if (!isInside(scratch, hit.directory)) {
    return { ok: false, reason: `'${hit.id}' loaded from ${hit.directory || "an unknown path"}, outside the scratch dir`, loads }
  }
  return { ok: true, reason: `loaded ${hit.id}`, loads }
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
    results.push(check(kind, arg, { c, scratch, out, text, snapshot }))
  }
  return results
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
export function isInside(root, candidate) {
  if (!candidate) return false
  const real = (p) => {
    try {
      return realpathSync(p).replace(/\/+$/, "")
    } catch {
      return p.replace(/\/+$/, "")
    }
  }
  const raw = (p) => p.replace(/\/+$/, "")
  const a = real(root)
  const b = real(candidate)
  if (b === a || b.startsWith(a + "/")) return true
  // realpath only succeeds on paths that exist; fall back to the literal form
  // so a not-yet-created candidate still compares correctly.
  return candidate === raw(root) || candidate.startsWith(raw(root) + "/")
}

export function safeRegex(pattern, flags = "") {
  try {
    return new RegExp(pattern, flags)
  } catch {
    return null
  }
}
