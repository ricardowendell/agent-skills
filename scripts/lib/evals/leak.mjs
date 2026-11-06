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
//
// Two paths deliberately do not count. `~/…` does not reach the real install:
// `isolateHome` gives the child a throwaway `HOME`, so `~/.agents/skills` is a
// directory that does not exist — a `glob` there finds nothing, and flagging it
// is a false positive. An absolute path under `opencode-eval-home-*` is that same
// throwaway home, already expanded by the shell. Neither can reach the machine's
// installed copy; only an absolute path outside both is evidence. (`--no-isolate`
// restores the real home for replaying pre-isolation runs, and those are not
// measurements.)

import { toolCalls } from "./events.mjs"

// Recorded in every draw's artifact. A later wave may cite an earlier control
// run only when this matches (SPEC-0020 AC-3): a change to what counts as a leak
// changes the meaning of "clean".
export const DETECTOR_VERSION = "leak-v1"

// macOS reports the same tmp dir as both `/var/…` and `/private/var/…`; the
// scratch header usually records one and the tool the other.
const norm = (p) => String(p).replace(/^\/private(?=\/)/, "").replace(/\/+$/, "")

function inside(path, scratch) {
  if (!scratch) return false
  const a = norm(path)
  const b = norm(scratch)
  return a === b || a.startsWith(`${b}/`)
}

// `mkdtempSync(join(base, "opencode-eval-home-"))` in isolation.mjs. A path under
// it is the child's throwaway home, not the user's install.
const ISOLATED_HOME = /(?:^|\/)opencode-eval-home-[^/]+(?:\/|$)/

// The roots that mean "an installed skill": the four discovery dirs the runner
// knows, plus a stale copy under the OS tmp dir (`…/T/opencode/**/skills`). The
// bare root counts too — `ls …/.agents/skills` reads the skill menu even without
// naming an id. A new install path is a detector change, backed by a test.
function isSkillRoot(path) {
  return (
    /(?:^|\/)(?:\.agents|\.claude|\.codex)\/skills(?:\/|$)/.test(path) ||
    /(?:^|\/)\.config\/opencode\/skills(?:\/|$)/.test(path) ||
    /(?:^|\/)T\/opencode\/(?:[^/]+\/)*skills(?:\/|$)/.test(path)
  )
}

// `references/evals.md` is the answer key, wherever it is outside the scratch.
function isCorpus(path) {
  return /\/references\/evals\.md$/.test(path)
}

function classifies(path, scratch) {
  // Only an absolute path can be outside the scratch *and* outside the throwaway
  // home. A relative `references/evals.md` resolves inside the scratch, where
  // reading it is legitimate; `~/…` resolves inside the isolated home.
  if (!path.startsWith("/")) return false
  if (ISOLATED_HOME.test(path)) return false
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
// A missing or non-string stream is an empty transcript, not a crash: a run that
// never produced output still has to be scored (and must not be called clean by
// accident).
export function leaksIn(out, scratch) {
  if (typeof out !== "string" || out === "") return []
  return findLeaks(toolCalls(out), scratch)
}
