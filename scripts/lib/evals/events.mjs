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
