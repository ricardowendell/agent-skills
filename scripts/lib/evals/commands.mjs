// commands.mjs — what a shell call actually ran, and whose status it owns.
//
// Split out of assertions.mjs (SPEC-0081) with no semantic change: splitting a
// call into commands, expanding the fixture's package scripts, and reading the
// effect-aware exit that decides whether the matched command owns the status.

import { readFileSync } from "node:fs"
import { join } from "node:path"

// A shell call is not one command: `npm test 2>&1; echo "exit: $?"` is two, and
// the second owns the status. Splitting is quote-aware (and keeps redirections
// such as `2>&1` whole) so the matcher can tell which command the gate is.
// This is not a shell parser: pipes, `;`, `&&`, `||`, newlines and background
// `&` are the separators the corpus uses.
// Each part carries the operator that precedes it (`;`, `\n`, `&&`, `||`, `|`,
// `|&`, `&`, or null for the first). The operator is what decides whether a
// `$?` printed after the gate belongs to the gate or to the stage that took its
// status — `;` can hand `$?` to the gate, a pipe and an `&&`/`||` chain cannot.
function parseCommands(command) {
  const text = String(command ?? "")
  const parts = []
  let cur = ""
  let quote = null
  let nextSep = null
  const flush = (sep) => {
    const trimmed = cur.trim()
    if (trimmed) parts.push({ text: trimmed, sep: nextSep })
    cur = ""
    nextSep = sep
  }
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
      flush(";")
      continue
    }
    if (ch === "\n") {
      flush("\n")
      continue
    }
    if (ch === "&") {
      // `2>&1` and `&>file` are redirections, not backgrounds.
      if (text[i + 1] === ">" || />\s*$/.test(cur)) {
        cur += ch
        continue
      }
      const op = text[i + 1] === "&" ? "&&" : "&"
      if (op === "&&") i++
      flush(op)
      continue
    }
    if (ch === "|") {
      const op = text[i + 1] === "|" ? "||" : text[i + 1] === "&" ? "|&" : "|"
      i += op.length - 1
      flush(op)
      continue
    }
    cur += ch
  }
  flush(null)
  return parts
}

function splitCommands(command) {
  return parseCommands(command).map((p) => p.text)
}

// An `echo`/`printf` that reports the previous command's status. `$?`,
// `${?}`, `$status` (zsh) and the `pipestatus` arrays are the forms the corpus
// prints. The operator before it decides whose status it is.
function isStatusEcho(segment) {
  const list = words(segment)
  const exe = (list[0] ?? "").split("/").pop()
  if (exe !== "echo" && exe !== "printf") return false
  return /\$(?:\?|\{\?\}|\{PIPESTATUS\[|pipestatus\[|status\b)|\bPIPESTATUS\b|\bpipestatus\b/i.test(segment)
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
  const parts = parseCommands(literal)
  const scripts = readScripts(scratch)
  const entries = []
  const seen = new Set()
  const add = (form, segment, gateLast, attributable) => {
    if (typeof form !== "string") return
    const key = `${segment}\u0000${form}\u0000${gateLast}\u0000${attributable}`
    if (seen.has(key)) return
    seen.add(key)
    entries.push({ form, segment, gateLast, attributable })
  }
  const lastHere = (parsed, i) => i === parsed.length - 1
  // The gate's status reaches a printed `$?` only when nothing took it after
  // the invocation: it is either the last command, or a `;`/newline separates it
  // from an echo/printf of `$?`. A pipe or `&&`/`||` chain owns the status.
  const statusHere = (parsed, i) =>
    lastHere(parsed, i) ||
    ((parsed[i + 1].sep === ";" || parsed[i + 1].sep === "\n") && isStatusEcho(parsed[i + 1].text))

  // A single-command call is the gate entire. A compound call is matched one
  // command at a time, so a wrapper cannot lend the gate its status.
  if (parts.length <= 1) add(literal, parts[0]?.text ?? literal, true, true)
  parts.forEach((p, i) => add(p.text, p.text, lastHere(parts, i), statusHere(parts, i)))

  const walk = (text, segment, containerLast, containerAttrib, depth, ancestors) => {
    if (depth > SCRIPT_DEPTH) return
    const local = parseCommands(text)
    local.forEach((p, i) => {
      const name = scriptName(p.text)
      if (!name || !Object.prototype.hasOwnProperty.call(scripts, name) || ancestors.has(name)) return
      const next = new Set(ancestors)
      next.add(name)
      const last = containerLast && lastHere(local, i)
      const attrib = containerAttrib && statusHere(local, i)
      const body = scripts[name]
      const bodyParts = parseCommands(body)
      if (!bodyParts.length) add(body, segment, last, attrib)
      bodyParts.forEach((bp, j) =>
        add(bp.text, segment, last && lastHere(bodyParts, j), attrib && statusHere(bodyParts, j)),
      )
      walk(body, segment, last, attrib, depth + 1, next)
    })
  }
  parts.forEach((p, i) => walk(p.text, p.text, lastHere(parts, i), statusHere(parts, i), 1, new Set()))
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
// command of the call, the recorded exit is the gate's. Otherwise a printed
// status is used only when the gate's own status reaches it (`gateLast` false
// but `attributable` true, the `; echo "…$?"` shape); a pipe or an `&&`/`||`
// chain owns `$?`, so that shape skips the printed value and reads the runner's
// counters. A red last verdict block beats any green printed status, as a guard
// against a mis-attributed `$?`. Nothing readable is unknown, and unknown is not
// a pass. A non-zero recorded exit is already a red gate, so it is kept as the
// conservative reading rather than rewritten to unknown (this is what preserves
// the existing `events.test.mjs` stream).
export function effectiveExit(call, { gateLast = true, attributable = true } = {}) {
  const recorded = Number.isInteger(call?.exit) ? call.exit : null
  if (gateLast) return { code: recorded, why: recorded === null ? "no recorded exit" : "recorded exit" }
  if (recorded !== null && recorded !== 0) return { code: recorded, why: "wrapper failed" }
  const summary = summaryExit(call?.output)
  if (summary === 1) return { code: 1, why: "runner summary" }
  if (attributable) {
    const printed = printedExit(call?.output)
    if (printed !== null) return { code: printed, why: "printed status" }
  }
  if (summary === 0) return { code: 0, why: "runner summary" }
  return { code: null, why: "exit masked, no recorded status" }
}
export { commandEntries, parseCommands }
