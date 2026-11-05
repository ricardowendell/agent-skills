// assertions.mjs — the machine-checked half of a case.
//
// The vocabulary (every kind, its scope and its contract) lives in kinds.mjs;
// this file implements the checks. Every filesystem kind takes a glob (see
// glob.mjs) and every kind that compares against the staged tree fails when the
// pattern matches nothing: a wildcard with no effect must never read as a pass.

import { readFileSync, realpathSync } from "node:fs"
import { createHash } from "node:crypto"
import { join } from "node:path"
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
    results.push(check(kind, arg, { scratch, out, text, snapshot }))
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
function isInside(root, candidate) {
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
