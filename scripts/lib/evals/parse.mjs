// parse.mjs — read a skill's references/evals.md into cases.
//
// Case syntax (v2):
//
//   1. **Review against SPEC-0007.**
//      - prompt: Review this branch against SPEC-0007.
//      - why: the diff satisfies every acceptance criterion
//      - expect: Fixes the range and head sha before reading code.
//      - assert: verdict APPROVE
//      - status: manual          (default: run)
//      - needs: gates            (skipped by --level behavior)
//      - tags: review, git
//
// The bold line is a title for humans and never reaches the agent. `prompt` is
// the only text the agent sees; `why`, `expect`, `status`, `needs` and `tags`
// exist to record intent without contaminating the run.
//
// Legacy syntax (pre-v2) is still read so the 39 existing cases keep working
// while they migrate: `1. **"prompt"** (note)` with bare bullets. The quoted
// bold text becomes the prompt, the parenthetical becomes `why`. That split is
// the fix — before, the parenthetical was concatenated onto the prompt.

import { readFileSync } from "node:fs"

// `grep`/`nogrep` are deliberately absent: they matched the skill's own text
// (a transcript contains the skill body), and no case uses them. Use reply,
// noreply, verdict or a filesystem check instead.
export const ASSERT_KINDS = new Set([
  "file",
  "nofile",
  "dir",
  "nodir",
  "filematch",
  "reply",
  "noreply",
  "verdict",
  "unchanged",
  "changed",
  "ran",
  "ranpass",
  "tool",
  "notool",
  "skill",
  "notskill",
  "noskill",
])

const STATUSES = new Set(["run", "manual"])
const FIELD = /^(prompt|expect|why|status|needs|tags|gate|assert):\s*(.*)$/
const CASE = /^\s*(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)$/
const BULLET = /^\s*[-*]\s+(.*)$/
const LEGACY_ASSERT = /^\[assert\]\s+(\w+)\s+(.+)$/

export function unquote(text) {
  const t = text.trim()
  const m = t.match(/^"([\s\S]*)"$/)
  return m ? m[1].trim() : t
}

// "(the diff satisfies every AC)" -> "the diff satisfies every AC"
function noteOf(rest) {
  const m = rest.trim().match(/^\(([\s\S]+)\)$/)
  return m ? m[1].trim() : rest.trim()
}

function emptyCase(n, title, note) {
  return {
    n,
    title,
    // Fields are collected as line arrays so a wrapped bullet survives.
    promptLines: [],
    promptExplicit: false,
    why: note,
    expect: [],
    assert: [],
    status: "run",
    gate: "auto",
    needs: [],
    tags: [],
  }
}

function finishCase(c) {
  const out = {
    n: c.n,
    title: c.title,
    prompt: c.promptLines.join("\n").trim(),
    why: c.why || "",
    expect: c.expect,
    assert: c.assert,
    status: c.status,
    gate: c.gate,
    needs: c.needs,
    tags: c.tags,
  }
  if (!c.promptExplicit) {
    // Legacy convention: the bold text was the prompt, written in quotes. An
    // unquoted bold line is a v2 title and must not be sent to the agent.
    if (/^\s*"/.test(c.title)) {
      out.prompt = unquote(c.title)
      out.legacy = true
    } else {
      out.prompt = ""
    }
  }
  return out
}

// Parse the markdown body. Returns cases plus validation findings; nothing here
// throws, so `--list` can report every problem in one pass.
export function parseCases(md) {
  const cases = []
  let cur = null
  let target = null // field receiving wrapped continuation lines

  const close = () => {
    if (cur) cases.push(finishCase(cur))
    cur = null
    target = null
  }

  for (const raw of md.split("\n")) {
    const line = raw.replace(/\s+$/, "")
    const c = line.match(CASE)
    if (c) {
      close()
      cur = emptyCase(Number(c[1]), c[2], noteOf(c[3] ?? ""))
      continue
    }
    if (!cur) continue
    if (!line.trim()) {
      target = null
      continue
    }

    const b = line.match(BULLET)
    if (b) {
      const item = b[1].trim()
      const legacy = item.match(LEGACY_ASSERT)
      if (legacy) {
        cur.assert.push({ kind: legacy[1], arg: legacy[2].trim() })
        target = null
        continue
      }
      const f = item.match(FIELD)
      if (f) {
        const [, key, value] = f
        switch (key) {
          case "prompt":
            cur.promptExplicit = true
            cur.promptLines = [value.trim()]
            target = "prompt"
            break
          case "why":
            cur.why = value.trim()
            target = null
            break
          case "status":
            cur.status = value.trim()
            target = null
            break
          case "gate":
            cur.gate = value.trim()
            target = null
            break
          case "needs":
            cur.needs.push(...value.split(",").map((s) => s.trim()).filter(Boolean))
            target = null
            break
          case "tags":
            cur.tags.push(...value.split(",").map((s) => s.trim()).filter(Boolean))
            target = null
            break
          case "expect":
            cur.expect.push(value.trim())
            target = "expect"
            break
          case "assert": {
            const sp = value.indexOf(" ")
            const kind = sp === -1 ? value.trim() : value.slice(0, sp)
            const rest = sp === -1 ? "" : value.slice(sp + 1).trim()
            cur.assert.push({ kind, arg: rest })
            target = null
            break
          }
        }
        continue
      }
      // Bare bullet: a legacy expectation.
      cur.expect.push(item)
      target = "expect"
      continue
    }

    if (target === "prompt") cur.promptLines.push(line.trim())
    else if (target === "expect" && cur.expect.length) cur.expect[cur.expect.length - 1] += " " + line.trim()
  }
  close()

  return { cases, ...validate(cases) }
}

export function readEvals(file) {
  return parseCases(readFileSync(file, "utf8"))
}

export function validate(cases) {
  const errors = []
  const warnings = []
  const seen = new Set()

  for (const c of cases) {
    const at = `case ${c.n}`
    if (seen.has(c.n)) errors.push(`${at}: duplicate case number`)
    seen.add(c.n)

    if (!STATUSES.has(c.status)) errors.push(`${at}: unknown status '${c.status}' (expected run|manual)`)
    if (!["auto", "off"].includes(c.gate)) errors.push(`${at}: unknown gate '${c.gate}' (expected auto|off)`)
    if (!c.prompt && c.status !== "manual") errors.push(`${at}: no prompt (add "- prompt:" or "- status: manual")`)
    if (c.legacy) warnings.push(`${at}: legacy syntax — the title is used as the prompt`)

    for (const { kind, arg } of c.assert) {
      if (!ASSERT_KINDS.has(kind)) errors.push(`${at}: unknown assert kind '${kind}'`)
      if (!arg) errors.push(`${at}: assert '${kind}' has no argument`)
    }
    if (!c.assert.length && c.status !== "manual") warnings.push(`${at}: no assertions — it would score as unscored`)
  }

  const runnable = cases.filter((c) => c.status === "run")
  return { errors, warnings, runnable: runnable.length, manual: cases.length - runnable.length }
}
