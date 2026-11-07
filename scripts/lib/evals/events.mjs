// events.mjs — read the JSONL stream `opencode run --format json` emits.
//
// Kept apart from assertions.mjs so the runner, the replay tool and the judge
// read a transcript through one implementation. The judge used to parse the
// stream by hand, which is how two consumers end up disagreeing about what the
// agent said.

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

// The assistant's own words, without tool output or the skill's text — so
// `reply`/`verdict` cannot be satisfied by the skill's own template.
export function replyText(out) {
  const parts = []
  for (const ev of events(out)) {
    if (ev.type === "text" && ev.part?.text) parts.push(ev.part.text)
  }
  return parts.join("\n")
}

// A provider-level abort is not a draw of behaviour: the agent never got a
// verdict. `opencode` emits a top-level `{ type: "error", error: { type:
// "provider.go-limit" | "provider.rate-limit", ... } }`; the message names the
// overloaded upstream when the type is rate-limit. The result records it so the
// checker can classify the draw without reading the transcript.
export function providerError(out) {
  for (const ev of events(out)) {
    if (ev.type !== "error" || !ev.error) continue
    const type = typeof ev.error.type === "string" ? ev.error.type : ""
    if (!type.startsWith("provider.")) continue
    return {
      type,
      message: typeof ev.error.message === "string" ? ev.error.message : "",
      status: Number.isInteger(ev.error.status) ? ev.error.status : null,
    }
  }
  return null
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
        output: st.output ?? "",
        exit: st.metadata?.metadata?.exit,
        status: st.status,
        start: ev.part.time?.start ?? ev.timestamp,
        end: ev.part.time?.end ?? ev.timestamp,
      }
    })
}

// A compact, stable rendering of what the run *did*, for the judge. The command
// log only ever had the first line of each shell call, so a read, an edit or a
// write was invisible and expectations that lived there came back unverifiable.
//
// The ledger is a presentation of the same stream `toolCalls` reads, not a second
// source of truth: the judge prompt and the evidence check both get the one
// string. Bodies are deliberately absent for `read` (the file was opened, which
// is the fact under test; what it said is the fixture's answer) and present for
// `write` (the assertion is often about the test the run wrote). Long values are
// clipped deterministically and the whole ledger shares one budget, so two calls
// on the same stream produce the same text.
const LEDGER_BUDGET = 6000
const SHELL_TAIL_LINES = 10
const EDIT_LINE_MAX = 200
const WRITE_BUDGET = 1200
const WRITE_LINES = 40
const TRUNCATED = "… [ledger truncated]"

function clip(text, max) {
  const value = String(text ?? "")
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(0, max - 1))}…`
}

function changedLines(sign, text, maxLines = 12) {
  const all = String(text ?? "").split("\n")
  const shown = all.slice(0, maxLines).map((line) => `${sign} ${clip(line, EDIT_LINE_MAX)}`)
  if (all.length > maxLines) shown.push(`${sign} … (${all.length - maxLines} more line(s))`)
  return shown
}

function ledgerEntry(t) {
  const input = t.input ?? {}
  const path = input.path ?? input.filePath ?? input.filename ?? "(unknown path)"
  switch (t.tool) {
    case "skill": {
      const id = input.id ?? input.name ?? t.meta?.name ?? "(unknown)"
      const directory = t.meta?.directory ?? input.directory ?? ""
      return `skill: ${id}${directory ? ` (dir: ${directory})` : ""}`
    }
    case "read":
      // No output, ever: the point is that the file was read, not what it says.
      return `read: ${path}`
    case "glob":
      return `glob: ${input.pattern ?? ""}`
    case "grep": {
      const where = input.path ? ` in ${input.path}` : ""
      return `grep: ${input.pattern ?? ""}${where}`
    }
    case "edit": {
      const lines = [`edit: ${path}`]
      if (typeof input.oldString === "string") lines.push(...changedLines("-", input.oldString))
      if (typeof input.newString === "string") lines.push(...changedLines("+", input.newString))
      return lines.join("\n")
    }
    case "write": {
      const lines = [`write: ${path}`]
      const content = String(input.content ?? "").split("\n")
      lines.push(...content.slice(0, WRITE_LINES).map((line) => `  ${clip(line, EDIT_LINE_MAX)}`))
      if (content.length > WRITE_LINES) lines.push(`  … (${content.length - WRITE_LINES} more line(s))`)
      return clip(lines.join("\n"), WRITE_BUDGET)
    }
    case "shell": {
      // Byte-identical to the old command-log line, so a quote the judge took
      // from either section is found in the one corpus `verifyEvidence` reads.
      const command = String(input.command ?? "").split("\n")[0]
      const lines = [`$ ${command}  [exit ${t.exit ?? "?"}]`]
      const output = String(t.output ?? "").trim()
      if (output) {
        for (const line of output.split("\n").slice(-SHELL_TAIL_LINES)) lines.push(`  ${clip(line, EDIT_LINE_MAX)}`)
      }
      return lines.join("\n")
    }
    default: {
      const first = Object.entries(input)[0]
      return first ? `${t.tool}: ${first[0]}=${clip(first[1], EDIT_LINE_MAX)}` : String(t.tool)
    }
  }
}

export function evidenceLedger(out, { budget = LEDGER_BUDGET } = {}) {
  const entries = toolCalls(out).map(ledgerEntry)
  let text = ""
  for (const entry of entries) {
    const separator = text ? "\n" : ""
    if (text.length + separator.length + entry.length <= budget) {
      text += separator + entry
      continue
    }
    // The marker counts against the same ceiling. The old fallback appended
    // `separator + TRUNCATED` whenever no room was left for the entry, so a
    // ledger already at the budget came back longer than it: 6000 became 6011.
    // Clip what was written instead of overshooting.
    const room = budget - text.length - separator.length - TRUNCATED.length
    if (room >= 1) return `${text}${separator}${entry.slice(0, room)}${TRUNCATED}`
    const tail = `${separator}${TRUNCATED}`
    if (text.length + tail.length <= budget) return text + tail
    return `${text}${text ? "\n" : ""}${TRUNCATED}`.slice(0, Math.max(0, budget))
  }
  return text
}

// Which skill OpenCode actually loaded, and from where. `directory` is the
// decided fact: a project-local copy shadows the global install, so a directory
// outside the scratch dir means the run tested a different skill than the one
// under review.
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
