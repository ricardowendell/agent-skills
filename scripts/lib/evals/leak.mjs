// leak.mjs — did the child read anything outside the scratch?
//
// `--no-skill` denies the `skill` tool and stages nothing, but the child still
// runs as this user: it can read the installed copy at `~/.agents/skills/<id>`,
// a stale copy under `$TMPDIR/opencode/…/skills`, or the answer key at
// `references/evals.md`. Three published control draws did exactly that and were
// scored as passes, because the gate only watched the `skill` tool.
//
// The same hole existed one level up. A control draw can read the host checkout
// the runner lives in — `docs/`, the checkout `AGENTS.md`, `scripts/`, `skills/`,
// `runs/` — or a sibling worktree under `.lane/trees/`. That is the eval corpus,
// not the scratch, so it is a finding too, but a different kind: `leak` means an
// installed skill or the answer key, `host` means the host corpus. The caller
// passes the roots (`hostRoots`) because they are machine-specific; the runner
// records them in the run manifest and the replay derives them from it.
//
// This is the detector the runner records per repetition and the replay tool
// reads. Pure: it takes the tool calls, the scratch path and the host roots, and
// never touches the filesystem, so a transcript can be re-read without the run
// that made it.
//
// Two paths deliberately do not count. `~/…` does not reach the real install:
// `isolateHome` gives the child a throwaway `HOME`, so `~/.agents/skills` is a
// directory that does not exist — a `glob` there finds nothing, and flagging it
// is a false positive. An absolute path under `opencode-eval-home-*` is that same
// throwaway home, already expanded by the shell. Neither can reach the machine's
// installed copy; only an absolute path outside both is evidence. (`--no-isolate`
// restores the real home for replaying pre-isolation runs, and those are not
// measurements.)

import { createHash } from "node:crypto"
import { toolCalls } from "./events.mjs"

// The detector's identity is derived, not typed by hand. These strings are the
// rules that decide "clean"; changing one changes `DETECTOR_VERSION`, so a later
// wave cannot reuse an earlier control across a semantic change by accident.
// `leak.test.mjs` pins the digest as a golden: editing a rule without consciously
// updating the identifier fails the suite.
const RULES = {
  absoluteOnly: "absolute-path-only",
  scratchExcluded: "inside-scratch-excluded",
  isolatedHome: "(?:^|/)opencode-eval-home-[^/]+(?:/|$)",
  skillRoots: [
    "(?:^|/)(?:\\.agents|\\.claude|\\.codex)/skills(?:/|$)",
    "(?:^|/)\\.config/opencode/skills(?:/|$)",
    "(?:^|/)T/opencode/(?:[^/]+/)*skills(?:/|$)",
  ],
  corpus: "/references/evals\\.md$",
  // The roots themselves are machine-specific and passed by the caller; this
  // rule pins the semantics: an absolute read inside one of them is a finding.
  hostCorpus: "absolute-host-corpus-read",
}

export const DETECTOR_RULES = Object.freeze([
  RULES.absoluteOnly,
  RULES.scratchExcluded,
  RULES.isolatedHome,
  ...RULES.skillRoots,
  RULES.corpus,
  RULES.hostCorpus,
])

export function detectorVersion(rules = DETECTOR_RULES) {
  return createHash("sha256").update(rules.join("\n")).digest("hex").slice(0, 16)
}

// Recorded in every draw's artifact. A later wave may cite an earlier control
// run only when this matches (SPEC-0020 AC-3).
export const DETECTOR_VERSION = detectorVersion()

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
const ISOLATED_HOME = new RegExp(RULES.isolatedHome)

// The roots that mean "an installed skill": the four discovery dirs the runner
// knows, plus a stale copy under the OS tmp dir (`…/T/opencode/**/skills`). The
// bare root counts too — `ls …/.agents/skills` reads the skill menu even without
// naming an id. A new install path is a detector change, backed by a test.
const SKILL_ROOTS = RULES.skillRoots.map((source) => new RegExp(source))

function isSkillRoot(path) {
  return SKILL_ROOTS.some((re) => re.test(path))
}

// `references/evals.md` is the answer key, wherever it is outside the scratch.
const CORPUS = new RegExp(RULES.corpus)

function isCorpus(path) {
  return CORPUS.test(path)
}

// The host roots arrive as absolute paths (a directory or a file such as
// `AGENTS.md`). A path is inside one when it is equal or sits below it; the
// scratch check runs first, so a fixture that stages a `docs/` tree stays clean.
// Return the longest matching root, not the first: the caller usually passes the
// checkout root plus its known subdirectories, and the finding should name
// `docs/` for a `docs/specs/…` read, not the whole checkout.
function hostRootOf(path, hostRoots = []) {
  let best = null
  for (const root of hostRoots) {
    if (typeof root !== "string" || !root.startsWith("/")) continue
    if (!inside(path, root)) continue
    if (!best || norm(root).length > norm(best).length) best = root
  }
  return best
}

function classifies(path, scratch, hostRoots = []) {
  // Only an absolute path can be outside the scratch *and* outside the throwaway
  // home. A relative `references/evals.md` resolves inside the scratch, where
  // reading it is legitimate; `~/…` resolves inside the isolated home.
  if (!path.startsWith("/")) return null
  if (ISOLATED_HOME.test(path)) return null
  if (inside(path, scratch)) return null
  if (isSkillRoot(path) || isCorpus(path)) return { kind: "leak" }
  const root = hostRootOf(path, hostRoots)
  return root ? { kind: "host", root } : null
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
// scratch, so neither ever appears. A `host` hit carries its `kind` and the
// matching `root`; a `leak` hit keeps the original shape, which is also what
// every artefact written before the host rules contains.
export function findLeaks(calls, scratch, hostRoots = []) {
  const hits = []
  const seen = new Set()
  for (const call of calls) {
    const text = [...strings(call.input ?? {}), ...strings(call.meta ?? {})].join("\n")
    for (const m of text.matchAll(TOKEN)) {
      const path = m[0].replace(/[.:]+$/, "")
      const hit = classifies(path, scratch, hostRoots)
      if (!hit) continue
      const key = `${call.tool}\u0000${path}`
      if (seen.has(key)) continue
      seen.add(key)
      hits.push(
        hit.kind === "host"
          ? { tool: call.tool, path, kind: "host", root: hit.root }
          : { tool: call.tool, path },
      )
    }
  }
  return hits
}

// Convenience for callers holding the raw JSONL stream instead of parsed calls.
// A missing or non-string stream is an empty transcript, not a crash: a run that
// never produced output still has to be scored (and must not be called clean by
// accident).
export function leaksIn(out, scratch, hostRoots = []) {
  if (typeof out !== "string" || out === "") return []
  return findLeaks(toolCalls(out), scratch, hostRoots)
}

// The caller's form named in the spec: `leak({ calls, scratch, hostRoots })`.
// It is the same pure detector, with the arguments named so the runner, the
// replay and the tests cannot disagree about their order.
export function leak({ calls = [], scratch = null, hostRoots = [] } = {}) {
  return findLeaks(calls, scratch, hostRoots)
}
