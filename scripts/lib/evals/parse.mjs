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
//      - stage: process-inbox    (a sibling skill the case expects on the menu;
//                                 repeatable. `--check` rejects an unknown id
//                                 and one that names the skill under review.)
//
// The bold line is a title for humans and never reaches the agent. `prompt` is
// the only text the agent sees; `why`, `expect`, `status`, `needs`, `tags` and
// `stage` exist to record intent without contaminating the run.
//
// Legacy syntax (pre-v2) is still read so unmigrated cases keep working:
// `1. **"prompt"** (note)` with bare bullets. The quoted
// bold text becomes the prompt, the parenthetical becomes `why`. That split is
// the fix — before, the parenthetical was concatenated onto the prompt.

import { existsSync, readFileSync, statSync } from "node:fs"
import { basename, dirname, isAbsolute, join, normalize, resolve } from "node:path"
import { ASSERT_KINDS } from "./kinds.mjs"
import { safeRegex } from "./assertions.mjs"

const STATUSES = new Set(["run", "manual"])
const FIELD = /^(prompt|expect|why|status|needs|tags|gate|stage|governs|assert):\s*(.*)$/
// Assertions whose argument (or, for filematch, its second half) is a regex.
const REGEX_KINDS = new Set(["reply", "noreply", "filematch", "ran", "ranpass"])
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
    stage: [],
    governs: [],
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
    stage: c.stage,
    governs: c.governs,
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
export function parseCases(md, selfId = null, { skillDir = null } = {}) {
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
          case "stage":
            cur.stage.push(value.trim())
            target = null
            break
          case "governs":
            cur.governs.push(...value.split(",").map((s) => s.trim()).filter(Boolean))
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

  return { cases, ...validate(cases, selfId, { skillDir }) }
}

// The eval corpus lives at `<skill>/references/evals.md`, so the skill under
// review is derivable without the caller passing it. An explicit id still wins
// for a corpus read from somewhere else.
export function readEvals(file, selfId = basename(dirname(dirname(file)))) {
  return parseCases(readFileSync(file, "utf8"), selfId, { skillDir: dirname(dirname(file)) })
}

// `skillDir` is the checkout whose `references/evals.md` was parsed. Without it
// (a bare `parseCases` call) the filesystem checks cannot run and are skipped;
// the CLI always passes it.
export function validate(cases, selfId = null, { skillDir = null } = {}) {
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
      if (arg && REGEX_KINDS.has(kind)) {
        // `filematch <glob> <regex>`: the glob is not a regex, the rest is.
        let pattern = arg
        if (kind === "filematch") {
          const sp = arg.indexOf(" ")
          if (sp === -1) errors.push(`${at}: assert 'filematch' has no regex ('${arg}')`)
          pattern = sp === -1 ? "" : arg.slice(sp + 1).trim()
        }
        if (pattern && !safeRegex(pattern)) {
          errors.push(`${at}: assert '${kind}' does not compile through safeRegex: ${pattern}`)
        }
      }
    }
    if (!c.assert.length && c.status !== "manual") warnings.push(`${at}: no assertions — it would score as unscored`)

    // SPEC-0057: a `governs:` entry must be a file in the skill, or the draw
    // would record a hash for something the checkout cannot answer for.
    if (skillDir) {
      for (const rel of c.governs ?? []) {
        const path = normalize(String(rel).replace(/^\.\//, ""))
        const inside = !isAbsolute(path) && !path.split(/[\\/]/).includes("..")
        const full = join(skillDir, path)
        if (!inside || !existsSync(full) || !statSync(full).isFile()) {
          errors.push(`${at}: governs '${rel}' is not a file in the skill`)
        }
      }
    }
    // The pointer itself is authoring data: `--list --check` can prove it
    // resolves without staging anything (SPEC-0057).
    if (skillDir) {
      const manifest = join(skillDir, "references/evals", String(c.n), "git.json")
      if (existsSync(manifest)) {
        let spec
        try {
          spec = JSON.parse(readFileSync(manifest, "utf8"))
        } catch (e) {
          errors.push(`${at}: git.json is not valid JSON (${e.message})`)
          spec = null
        }
        if (spec) {
          const base = spec.base ?? "."
          const resolved = resolve(dirname(manifest), base)
          if (!existsSync(resolved)) {
            errors.push(`${at}: git.json base '${base}' does not resolve (resolved ${resolved})`)
          }
        }
      }
    }

    // A `skill`/`notskill` assertion can only pass for a skill the run stages:
    // the one under review, or a sibling the case declares with `stage:`
    // (SPEC-0029). Without this, a case can assert a skill that is never on the
    // menu and read 0/N instead of failing at authoring time.
    if (selfId) {
      const declaredStages = new Set(c.stage)
      for (const { kind, arg } of c.assert) {
        if (kind !== "skill" && kind !== "notskill") continue
        if (arg !== selfId && !declaredStages.has(arg))
          errors.push(
            `${at}: assert '${kind} ${arg}' names a skill the run will not stage (assert '${selfId}' or add "- stage: ${arg}")`,
          )
      }
      const assertedSkills = new Set(
        c.assert.filter((a) => a.kind === "skill" || a.kind === "notskill").map((a) => a.arg),
      )
      for (const id of declaredStages) {
        if (!assertedSkills.has(id))
          warnings.push(`${at}: stage '${id}' has no skill/notskill assertion`)
      }
    }
  }

  const runnable = cases.filter((c) => c.status === "run")
  return { errors, warnings, runnable: runnable.length, manual: cases.length - runnable.length }
}
