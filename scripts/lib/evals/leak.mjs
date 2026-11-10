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
// The eval store (`~/.local/share/opencode/evals`) is the answer key in bulk
// (SPEC-0052): every case's answer, every prior transcript and every result. It
// is `leak`, not `host`, and it is checked before the isolated-home exclusion —
// `isolateHome` symlinks the real `.local` into the throwaway home, so a path
// under `<isolated-home>/.local/share/opencode/evals` is the real store.
//
// This is the detector the runner records per repetition and the replay tool
// reads. Pure: it takes the tool calls, the scratch path and the host roots, and
// never touches the filesystem, so a transcript can be re-read without the run
// that made it.
//
// A fourth kind exists: `denied`. SPEC-0047's F0.1 control reached for the
// installed corpus under SPEC-0046's seatbelt and got `Operation not permitted`
// on every read, yet the detector recorded the path from the tool *input* and
// called the draw contaminated, so no probing control could ever be clean. The
// transcript is the record: when the call's output shows the denial for that
// path, the hit is an attempt the boundary stopped, not a read. The classifier
// is per path and per call, never per draw — a mixed shell call that is denied
// on one path and returns another keeps the successful read as a leak. A false
// `denied` would hide a real leak, so the fallback (no path named at all) also
// requires a non-zero exit and an output that carries no content.
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
  // The eval store holds the answer keys (`<skill>/<n>.md`), every prior
  // transcript and every result: the most direct oracle in the repository
  // (SPEC-0052). It is reached through the state dir the child keeps
  // (`~/.local/share/opencode/evals`), including via the throwaway home's
  // `.local` symlink, so it is a `leak` (an answer key), not `host`. The match
  // is the `evals` subtree only: `evals-archive`/`evals-backup` are not the
  // store and `auth.json` stays outside the rule.
  evalStore: "(?:^|/)\\.local/share/opencode/evals(?:/|$)",
  corpus: "/references/evals\\.md$",
  // The roots themselves are machine-specific and passed by the caller; this
  // rule pins the semantics: an absolute read inside one of them is a finding.
  hostCorpus: "absolute-host-corpus-read",
  // A corpus hit whose own call shows the denial for that path is an attempt,
  // not a read (SPEC-0048). It is a separate rule because it changes what
  // "clean" means, so a control from another detector is not citable.
  denied: "per-path-permission-denial",
  // Content counts only for the path it names (SPEC-0051). A hit is a read only
  // when the call returned *that* path's content: a non-shell result carrying a
  // body, a shell output line naming the path (or a child) without an error
  // marker and without a symlink arrow, or a direct read of the path whose body
  // came back. Sibling output, error lines and `ls` symlink listings are not
  // content for the path. SPEC-0050's two control draws were published as leaks
  // from exactly those shapes.
  content: "per-path-content-evidence",
  // Under an enforced boundary a corpus hit that came back with nothing for
  // that path is an attempt too, even when the transcript cannot name the
  // refusal: SPEC-0047's resumed control ran `ls … 2>/dev/null` and discarded
  // the only line that would have said `Operation not permitted`, so the v3
  // rule published a leak from a probe the profile stopped. The boundary, not
  // the transcript, is what makes the attempt impossible to succeed; the
  // canary proves it covers every root (SPEC-0049).
  enforcedAttempt: "enforced-corpus-attempt-is-denied",
}

export const DETECTOR_RULES = Object.freeze([
  RULES.absoluteOnly,
  RULES.scratchExcluded,
  RULES.isolatedHome,
  ...RULES.skillRoots,
  RULES.evalStore,
  RULES.corpus,
  RULES.hostCorpus,
  RULES.denied,
  RULES.content,
  RULES.enforcedAttempt,
])

export function detectorVersion(rules = DETECTOR_RULES) {
  return createHash("sha256").update(rules.join("\n")).digest("hex").slice(0, 16)
}

// Recorded in every draw's artifact. A later wave may cite an earlier control
// run only when this matches (SPEC-0020 AC-3).
export const DETECTOR_VERSION = detectorVersion()

// What a detector can prove, in order of what a claim needs. A version only
// answers "was this checked?" if it already had the capability the claim rests
// on; the digest alone is stricter than the claim (SPEC-0048). `host-reads` is
// what `isolated=yes` needs. `denied-split` is the v3 rule: it can only move a
// finding from `leak`/`host` to `denied`, so a v2 clean claim stays true. The
// v4 enforced rule (SPEC-0049) only extends that same direction, so it needs no
// new capability for `isolated=yes`.
export const DETECTOR_CAPABILITIES = Object.freeze(["host-reads", "denied-split"])

// Known legacy digests and the capabilities they actually had. v1 never looked
// for the host checkout; v2 added it; v3 added the per-path `denied` split. An
// unknown digest has no map entry and is not credited with anything.
const LEGACY_CAPABILITIES = Object.freeze({
  a31d58f79a6c7038: Object.freeze([]),
  "71bfb85a91cd68ab": Object.freeze(["host-reads"]),
  d8478beab04a4e3e: Object.freeze(["host-reads", "denied-split"]),
  // SPEC-0051 added the per-path content rule; v4 already had the two
  // capabilities its clean claims rest on, so a clean v4 run stays citable.
  d3e95ef948f983b7: Object.freeze(["host-reads", "denied-split"]),
  // SPEC-0052 adds the eval store as corpus. v5 looked for host reads and the
  // denied split, so its clean claims keep their two capabilities; the store
  // rule narrows what "clean" means without adding a capability (AC-5).
  def64b2d6a1baa6e: Object.freeze(["host-reads", "denied-split"]),
})

export function capabilitiesOf(version) {
  if (typeof version !== "string" || version === "") return null
  if (version === DETECTOR_VERSION) return DETECTOR_CAPABILITIES
  return LEGACY_CAPABILITIES[version] ?? null
}

export function hasCapability(version, capability) {
  const capabilities = capabilitiesOf(version)
  return Array.isArray(capabilities) && capabilities.includes(capability)
}

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

// The eval store is the answer key too (SPEC-0052). It must be tested before
// the throwaway-home exclusion: `isolateHome` symlinks the real `.local` into
// the scratch home, so `<isolated-home>/.local/share/opencode/evals/…` reaches
// the real store even though the rest of that home reaches nothing.
const EVAL_STORE = new RegExp(RULES.evalStore)

function isEvalStore(path) {
  return EVAL_STORE.test(path)
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
  if (inside(path, scratch)) return null
  // Before the isolated-home exclusion: the store is reachable through the
  // throwaway home's `.local` symlink, so silence there would be exactly the
  // hole SPEC-0052 closes. A fixture that stages a store path inside the
  // scratch stays clean (checked above).
  if (isEvalStore(path)) return { kind: "leak" }
  if (ISOLATED_HOME.test(path)) return null
  if (isSkillRoot(path) || isCorpus(path)) return { kind: "leak" }
  const root = hostRootOf(path, hostRoots)
  return root ? { kind: "host", root } : null
}

// One token per whitespace/quoted/punctuation-delimited word: enough to read a
// `read` input, a shell command line, and a tool's metadata with one scanner.
const TOKEN = /[^\s"'`()[\]{}<>;,|&]+/g

// The denial markers a permission layer writes. The marker alone says nothing
// about *which* path was refused, so it only counts when the same line names the
// hit path (or the directory that contains it). `cat a b` can be denied on `a`
// and return `b`; calling both `denied` would hide the successful read.
const DENIAL = /Operation not permitted|permission denied|\bEPERM\b|\bEACCES\b/i

// A path occurrence counts only on a token boundary: `/a/b` inside `/a/b/c` is a
// child, not the path, and must not borrow its denial. `child: true` is the
// content rule's version: a listing that names `…/skills/alpha` proves the
// `…/skills` menu was read, while a denial must name the path itself.
function namesPath(line, path, { child = false } = {}) {
  if (!path) return false
  const needle = norm(path)
  if (!needle) return false
  const hay = norm(line)
  let from = 0
  for (;;) {
    const at = hay.indexOf(needle, from)
    if (at < 0) return false
    const before = at === 0 ? "" : hay[at - 1]
    const after = hay[at + needle.length] ?? ""
    const afterSlash = hay[at + needle.length + 1] ?? ""
    const edge = (c) => c === "" || !/[A-Za-z0-9._/-]/.test(c)
    // A directory named with a trailing separator (`…/skills/:`) is the same
    // path as `…/skills`; a child (`…/skills/review-code`) is not, unless the
    // caller asks for children.
    if (edge(before) && (edge(after) || (after === "/" && (child || edge(afterSlash))))) return true
    from = at + 1
  }
}

function outputOf(call) {
  return typeof call.output === "string" ? call.output : ""
}

// Filesystem errors and an `ls -l` symlink line (`source -> target`) never
// evidence a successful read. SPEC-0050 measured both: a `cat` that returned
// `No such file or directory` and a skills listing whose only line was
// `…/commands -> …` were published as leaks because the line named the path.
const CONTENT_ERROR =
  /No such file or directory|permission denied|Operation not permitted|\bEPERM\b|\bEACCES\b|Is a directory|Not a directory/i

// Did this call return *this* path's content? A non-shell result carries the
// body it read. For a shell call, evaluate the markers per line: a call can open
// with an unrelated error (the zshenv `no such file or directory` noise) and
// still return a real body, so only the lines that name the path (or a child)
// outside an error/arrow count. A direct read (`cat P`, `sed … P`) with a
// non-empty remainder after dropping error/arrow lines is content too; it is
// accepted only when every segment naming the path is a content read, not a
// probe (`ls`/`find`/`test`), so SPEC-0050's capture-idea shape does not count.
export function contentFor(call, path) {
  if (!call || !path) return false
  if (call.tool !== "shell") {
    if (call.status === "error") return false
    const out = outputOf(call).trim()
    // `No files found` is the tool's empty result, not a listing.
    return out !== "" && !/^No files found$/i.test(out)
  }
  const lines = outputOf(call)
    .split("\n")
    .filter((line) => !CONTENT_ERROR.test(line) && !line.includes(" -> "))
  if (lines.some((line) => namesPath(line, path, { child: true }))) return true
  const segments = segmentsFor(call, path)
  if (!segments.length || segments.some((segment) => PROBE.test(segment))) return false
  return lines.some((line) => line.trim() !== "")
}

const dirOf = (path) => {
  const clean = norm(path)
  const at = clean.lastIndexOf("/")
  return at > 0 ? clean.slice(0, at) : clean
}

function denialLines(call) {
  return outputOf(call)
    .split("\n")
    .filter((line) => DENIAL.test(line))
}

// The conservative fallback from the spec's open question: when the output names
// no path at all, accept `denied` only for a non-zero exit, a denial marker, and
// an output that carries nothing but denial lines. Any content, or any other
// absolute path, disables the fallback — the read may have succeeded.
function denialWithoutPath(call) {
  const exit = call.exit
  if (!Number.isInteger(exit) || exit === 0) return false
  const lines = denialLines(call)
  if (!lines.length) return false
  const text = outputOf(call)
  for (const m of text.matchAll(TOKEN)) if (m[0].startsWith("/")) return false
  return text
    .split("\n")
    .filter((line) => line.trim())
    .every((line) => DENIAL.test(line))
}

// A denial naming the hit path itself. It wins even when the same call returned
// other content: `cat A B` can return B and still refuse A.
function exactDenial(call, path) {
  return denialLines(call).some((line) => namesPath(line, path))
}

// A denial naming the directory denies a path inside it only when the call
// returned nothing. If content came back, the child may have been read even
// though the parent listing failed (repro: `ls /dir/alpha; cat
// /dir/alpha/SKILL.md` returns the body and refuses the listing).
function dirDenial(call, path) {
  const dir = dirOf(path)
  if (!dir || dir === norm(path)) return false
  return denialLines(call).some((line) => namesPath(line, dir))
}

// The shell segments that name this path. `2>/dev/null` on a probe discards the
// very line that would say what happened, and the segment's stdout can be empty
// while another command in the same call printed something. That is the F0.1
// shape (`ls …/skills 2>/dev/null | head; echo …`), so it counts as "nothing came
// back" and lets the transcript fallback use the denial recorded elsewhere.
const SEGMENT_SPLIT = /[;\n]|&&|\|\|/
const PROBE = /\b(?:ls|stat|test|find|readlink)\b/
const SUPPRESSED = /2>\s*\/dev\/null/

function segmentsFor(call, path) {
  const text = [...strings(call.input ?? {}), ...strings(call.meta ?? {})].join("\n")
  const needle = norm(path)
  return text.split(SEGMENT_SPLIT).filter((segment) => norm(segment).includes(needle))
}

function suppressedProbe(call, path) {
  const segments = segmentsFor(call, path)
  return (
    segments.length > 0 &&
    segments.every((segment) => SUPPRESSED.test(segment) && PROBE.test(segment))
  )
}

// Did this call return nothing for the path? An empty output always qualifies; a
// probe whose stderr was discarded qualifies because the call cannot show either
// a result or the refusal. A non-shell tool that completed with content did
// return the path's contents and never qualifies.
function returnedNothing(call, path) {
  if (outputOf(call).trim() === "") return true
  return suppressedProbe(call, path)
}

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
// every artefact written before the host rules contains. A `denied` hit is the
// same shape plus `kind: "denied"`.
//
// A denial is judged per call and per path, never by applying one call's denial
// to every call that names the path. A later successful `cat P` must stay a
// leak even when an earlier call was refused; a false `denied` hides a real
// leak. The transcript only supplies the fallback: when this call returned
// nothing for the path (an empty result, or a probe that discarded stderr), a
// denial recorded for the same path elsewhere may classify it as denied — that
// is the F0.1 control shape. A path with any successful read wins over a denied
// entry, because a read happened.
//
// SPEC-0049 threads the run's enforcement state. Under `enforced: true` the
// residual case — a corpus hit the call returned nothing for, with no denial
// line that names it — is the suppressed probe the boundary measured on
// 2026-11-09T10-59-41: an attempt, `denied`, not a leak. Without enforcement the
// v2 rule stands: the read could have succeeded, so the attempt counts as a
// leak. A call that returned that path's content (`contentFor`) is still a leak
// in both modes; the enforced rule never promotes a read to `denied`.
export function findLeaks(calls, scratch, hostRoots = [], { enforced = false } = {}) {
  // First pass: every corpus path any call shows an exact denial for. This is
  // only the fallback input; it never overrides a call that returned content.
  const deniedElsewhere = new Set()
  for (const call of calls) {
    const text = [...strings(call.input ?? {}), ...strings(call.meta ?? {})].join("\n")
    for (const m of text.matchAll(TOKEN)) {
      const path = m[0].replace(/[.:]+$/, "")
      if (!classifies(path, scratch, hostRoots)) continue
      if (exactDenial(call, path)) deniedElsewhere.add(norm(path))
    }
  }

  // Per normalized path: did any call read it, and is there a denial? Leak wins
  // so a real read is never dropped.
  const byPath = new Map()
  for (const call of calls) {
    const text = [...strings(call.input ?? {}), ...strings(call.meta ?? {})].join("\n")
    for (const m of text.matchAll(TOKEN)) {
      const path = m[0].replace(/[.:]+$/, "")
      const hit = classifies(path, scratch, hostRoots)
      if (!hit) continue
      const nothing = returnedNothing(call, path)
      let kind
      if (exactDenial(call, path) || denialWithoutPath(call)) kind = "denied"
      else if (dirDenial(call, path) && nothing) kind = "denied"
      // Content counts only for the path it names (SPEC-0051). Sibling output,
      // an ENOENT/permission line and an `ls` symlink listing are not a read of
      // this path; the denial and fallback rules below still decide those.
      else if (contentFor(call, path)) kind = "leak"
      // The cross-call fallback only applies when this call returned nothing for
      // the path. A call that returned *something* (a body, even one that does
      // not name the path) must not be turned into `denied` by another call's
      // refusal: a false `denied` hides a real read (SPEC-0048 repro 1).
      else if (nothing && deniedElsewhere.has(norm(path))) kind = "denied"
      // Nothing came back for this path and no denial proof names it. Under
      // enforcement that is the boundary doing its job: the suppressed probe is
      // an attempt (`denied`), not a read. Without enforcement the read could
      // have succeeded, so it stays a leak (SPEC-0049).
      else kind = enforced ? "denied" : "leak"

      const key = norm(path)
      const entry = byPath.get(key) ?? { path, tool: call.tool, kind: "denied", root: hit.root, seen: false }
      if (kind === "leak" && entry.kind !== "leak") {
        entry.kind = "leak"
        entry.tool = call.tool
        entry.root = hit.root
      } else if (!entry.seen) {
        entry.path = path
        entry.root = hit.root
      }
      entry.seen = true
      byPath.set(key, entry)
    }
  }

  const hits = []
  for (const entry of byPath.values()) {
    if (entry.kind === "denied") hits.push({ tool: entry.tool, path: entry.path, kind: "denied" })
    else if (entry.root) hits.push({ tool: entry.tool, path: entry.path, kind: "host", root: entry.root })
    else hits.push({ tool: entry.tool, path: entry.path })
  }
  return hits
}

// Convenience for callers holding the raw JSONL stream instead of parsed calls.
// A missing or non-string stream is an empty transcript, not a crash: a run that
// never produced output still has to be scored (and must not be called clean by
// accident).
export function leaksIn(out, scratch, hostRoots = [], { enforced = false } = {}) {
  if (typeof out !== "string" || out === "") return []
  return findLeaks(toolCalls(out), scratch, hostRoots, { enforced })
}

// The caller's form named in the spec: `leak({ calls, scratch, hostRoots })`.
// It is the same pure detector, with the arguments named so the runner, the
// replay and the tests cannot disagree about their order.
export function leak({ calls = [], scratch = null, hostRoots = [], enforced = false } = {}) {
  return findLeaks(calls, scratch, hostRoots, { enforced })
}
