// leak.mjs — did the child reach a skill (or the eval corpus) outside the scratch?
//
// `--no-skill` denies the `skill` tool and stages nothing, but the child still
// runs as this user: it can read the installed copy at `~/.agents/skills/<id>`,
// a stale copy under `$TMPDIR/opencode/…/skills`, or the answer key at
// `references/evals.md`. Three published control draws did exactly that and were
// scored as passes, because the gate only watched the `skill` tool.
//
// This is the detector the runner records per repetition and the replay tool
// reads. Pure: it takes the tool calls and the scratch path, and never touches
// the filesystem, so a transcript can be re-read without the run that made it.

import { toolCalls } from "./events.mjs"

// macOS reports the same tmp dir as both `/var/…` and `/private/var/…`; the
// scratch header usually records one and the tool the other.
const norm = (p) => String(p).replace(/^\/private(?=\/)/, "").replace(/\/+$/, "")

function inside(path, scratch) {
  if (!scratch) return false
  const a = norm(path)
  const b = norm(scratch)
  return a === b || a.startsWith(`${b}/`)
}

// The roots that mean "an installed skill": the four discovery dirs the runner
// knows, plus a stale copy under the OS tmp dir (`…/T/opencode/**/skills`). A
// new install path is a detector change, backed by a test — not a guess.
function isSkillRoot(path) {
  return (
    /(?:^|\/)(?:\.agents|\.claude|\.codex)\/skills\/[^/]+/.test(path) ||
    /(?:^|\/)\.config\/opencode\/skills\/[^/]+/.test(path) ||
    /(?:^|\/)T\/opencode\/(?:[^/]+\/)*skills\/[^/]+/.test(path)
  )
}

// `references/evals.md` is the answer key, wherever it is outside the scratch.
function isCorpus(path) {
  return /\/references\/evals\.md$/.test(path)
}

function classifies(path, scratch) {
  // Only absolute paths can be outside the scratch: a relative
  // `references/evals.md` resolves inside it, where reading it is legitimate.
  if (!(path.startsWith("/") || path.startsWith("~"))) return false
  if (inside(path, scratch)) return false
  return isSkillRoot(path) || isCorpus(path)
}

// One token per whitespace/quoted/punctuation-delimited word: enough to read a
// `read` input, a shell command line, and a tool's metadata with one scanner.
const TOKEN = /[^\s"'`()[\]{}<>;,|&]+/g

function strings(value, out = []) {
  if (typeof value === "string") out.push(value)
  else if (Array.isArray(value)) for (const v of value) strings(v, out)
  else if (value && typeof value === "object") for (const v of Object.values(value)) strings(v, out)
  return out
}

// `{ tool, path }` per external skill/corpus read, deduplicated. The staged
// skill (`<scratch>/.opencode/skills/<id>`) and the fixture stay inside the
// scratch, so neither ever appears.
export function findLeaks(calls, scratch) {
  const hits = []
  const seen = new Set()
  for (const call of calls) {
    const text = [...strings(call.input ?? {}), ...strings(call.meta ?? {})].join("\n")
    for (const m of text.matchAll(TOKEN)) {
      const path = m[0].replace(/[.:]+$/, "")
      if (!classifies(path, scratch)) continue
      const key = `${call.tool}\u0000${path}`
      if (seen.has(key)) continue
      seen.add(key)
      hits.push({ tool: call.tool, path })
    }
  }
  return hits
}

// Convenience for callers holding the raw JSONL stream instead of parsed calls.
export function leaksIn(out, scratch) {
  return findLeaks(toolCalls(out), scratch)
}
