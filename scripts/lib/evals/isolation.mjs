// isolation.mjs — give the child agent a home that holds nothing but the case.
//
// OpenCode discovers skills from the user's home (`~/.agents/skills`,
// `~/.claude/skills`, `~/.codex/skills`, `~/.config/opencode/skills`), so a
// scratch dir alone does not isolate a run: every installed skill stays on the
// menu. Measured here, a bare scratch dir still offered 22 skills, including the
// one under review. That gave a 23% rate of runs that never loaded the skill at
// all — indistinguishable from "the skill did not help" — and it made the
// near-miss case pass for the wrong reason, since another skill could be chosen
// and the case only recorded that *this* one was not.
//
// So the child gets a throwaway home: the config entries it needs are symlinked
// in (plugins, vendor, node_modules, json), the shared state dirs are symlinked
// out (auth, secrets, bun, git identity), and `skills` is the one entry left
// behind. Nothing is copied except directories, and cleanup removes links, never
// their targets.

import {
  accessSync,
  constants,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { homedir, tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

// What a run may legitimately need from the real home: provider auth and state
// (`~/.local/share/opencode`), the credentials file the config points at, the
// runtime, and git's identity. Anything not listed stays invisible.
const SHARED = [".local", ".secrets", ".bun", ".gitconfig", ".npm"]

// The whole point. `skills` is the corpus, and `.retired-skills` is still on
// disk next to it.
const HIDDEN = /^(skills|\.retired-skills)$/

// The control arm must not read the installed copy of the skill it is measuring.
// `external_directory: deny` is a rule on tool reads, not an OS boundary: the
// child still runs as this user. Detection (`leak.mjs`) is the guarantee; this
// key is the preference, and a run that hits a legitimate read of the fixture or
// the state dir is the signal to drop it.
const DENY_EXTERNAL = { external_directory: "deny" }

// The real `opencode.json` is copied and merged rather than symlinked, because
// the permission has to be added without losing the user's providers, plugins
// and model. A config the merge cannot parse is linked as-is: a broken run is
// worse than an isolated run, and the detector still records what happened.
function linkConfig(src, dest) {
  let config
  try {
    config = JSON.parse(readFileSync(src, "utf8"))
  } catch {
    symlinkSync(src, dest)
    return
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    symlinkSync(src, dest)
    return
  }
  const permission =
    config.permission && typeof config.permission === "object" && !Array.isArray(config.permission) ? config.permission : {}
  writeFileSync(dest, JSON.stringify({ ...config, permission: { ...permission, ...DENY_EXTERNAL } }, null, 2))
}

export function isolateHome(env = process.env, { home = homedir(), base = tmpdir() } = {}) {
  const dir = mkdtempSync(join(base, "opencode-eval-home-"))
  const config = join(dir, ".config/opencode")
  mkdirSync(join(dir, ".config"), { recursive: true })

  for (const name of SHARED) {
    const src = join(home, name)
    if (existsSync(src)) symlinkSync(src, join(dir, name))
  }

  mkdirSync(config, { recursive: true })
  const src = join(home, ".config/opencode")
  if (existsSync(src)) {
    for (const entry of readdirSync(src)) {
      if (HIDDEN.test(entry)) continue
      if (entry === "opencode.json") linkConfig(join(src, entry), join(config, entry))
      else symlinkSync(join(src, entry), join(config, entry))
    }
  }

  return {
    dir,
    env: { ...env, HOME: dir, XDG_CONFIG_HOME: join(dir, ".config") },
    // rmSync does not follow symlinks, so the real home survives this.
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  }
}

// Where OpenCode discovers installed skills. The control arm must be denied all
// four regardless of which root the runner was pointed at: `--root skills` is the
// documented invocation and only changes discovery, never what counts as corpus.
export function installedSkillRoots(home = homedir()) {
  return [
    join(home, ".agents/skills"),
    join(home, ".claude/skills"),
    join(home, ".codex/skills"),
    join(home, ".config/opencode/skills"),
  ]
}

// The eval store is the answer key: every case's `<skill>/<n>.md`, every prior
// transcript and result, and `baseline.json`/`last-run.json`. It sits under the
// state dir the child keeps (`~/.local/share/opencode`), so it is reachable
// through the very `.local` symlink the throwaway home inherits (SPEC-0052).
// The deny is scoped to the `evals` subtree: `auth.json` and the rest of
// `.local` stay reachable.
export function evalStoreRoot(home = homedir()) {
  return join(home, ".local/share/opencode/evals")
}

// The full deny list: every installed root (always), the eval store (always),
// the explicit `--root` when given, and the host roots the runner already
// records. Deduplicated by both the typed path and its real path, because
// seatbelt matches the resolved path and a symlinked root (`~/.claude/skills`,
// or `~/.local` through the throwaway home) would otherwise miss its target.
export function corpusRoots({
  home = homedir(),
  root = null,
  hostRoots = [],
  exists = existsSync,
  realpath = realpathSync,
} = {}) {
  // `.retired-skills` is the same corpus under a different name: `isolateHome`
  // hides it from the config, so a child that can still read it sees the skill
  // text anyway. Include the sibling of every installed root.
  const installed = installedSkillRoots(home).flatMap((skills) => [skills, join(dirname(skills), ".retired-skills")])
  // The store is corpus in its own right: a control that reads it reads the
  // answer (SPEC-0052). Derive it from `home` in one place so the boundary and
  // the detector cannot disagree about which path the store is.
  const store = evalStoreRoot(home)
  const seen = new Set()
  const out = []
  for (const candidate of [...installed, store, ...(root ? [root] : []), ...hostRoots]) {
    if (!candidate) continue
    const absolute = resolve(candidate)
    if (!exists(absolute)) continue
    let real = absolute
    try {
      real = realpath(absolute)
    } catch {}
    for (const path of [absolute, real]) {
      if (seen.has(path)) continue
      seen.add(path)
      out.push(path)
    }
  }
  return out
}

// The manifest record. `enforced: true` is a claim that a mechanism was actually
// applied, so a caller that asks for it without one is downgraded rather than
// allowed to write a lie.
export function isolationRecord({ enforced = false, mechanism = null, reason = "" } = {}) {
  if (enforced === true && mechanism) return { enforced: true, mechanism, reason }
  if (enforced === true) {
    return { enforced: false, mechanism: null, reason: `${reason || "enforcement claimed"}; no mechanism was applied` }
  }
  return { enforced: false, mechanism: null, reason: reason || "not enforced" }
}

// A resumed run may mix draws made under different boundaries. The record
// belongs to the draw (SPEC-0067): a set of draws is only `enforced: true` when
// every one of them proves it, and a draw with no record is *unproven*, never
// "not enforced". The old wording asserted the second from the absence of the
// first; that is the failure this record exists to prevent.
export const RESUMED_LEGACY_REASON = "resumed legacy run — earlier draws carry no enforcement record"

// The string the pre-SPEC-0067 writer stored. A reader may restate it as the
// fact it can support ("no record"), but it must never repeat the assertion.
export const ASSERTED_LEGACY_REASON = "resumed legacy run — earlier draws were not enforced"

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value)
const namedMechanism = (value) => typeof value === "string" && value.trim() !== ""
const proven = (record) => record?.enforced === true && namedMechanism(record.mechanism)

// The draw's own record: `{ enforced, mechanism, reason }` or `null` for a draw
// written before the probe existed. Absence stays absence.
export function drawIsolation(draw) {
  const record = draw?.isolation
  return isRecord(record) ? record : null
}

// Fold a set of draws into one summary. `r3` is the label a draw has in the run
// directory (`rep`), so the reason points at something a reader can open.
//
// A draw with no field is *unrecorded*: absence has two causes (a build before
// the probe, or a build with the probe but before per-draw recording) and this
// fold cannot tell them apart, so it states neither. The parenthetical
// "(built before the enforcement probe)" is only permissible when a caller can
// prove the build's order from the draw itself; no such evidence is threaded
// here, so the reason never guesses.
export function summarizeDrawIsolation(draws = []) {
  const entries = (Array.isArray(draws) ? draws : [])
    .filter(Boolean)
    .map((draw, i) => ({ record: drawIsolation(draw), label: `r${draw.rep ?? draw.index ?? i + 1}` }))
  const recorded = entries.filter((e) => e.record)
  // No draw carries a record: the caller falls back to the manifest. Returning
  // an empty summary here would turn "no evidence" into a verdict.
  if (!recorded.length) return null
  const provenEntries = recorded.filter((e) => proven(e.record))
  const unproven = recorded.filter((e) => !proven(e.record))
  const unrecorded = entries.filter((e) => !e.record)
  const mechanisms = (list) => [...new Set(list.map((e) => e.record.mechanism))].join(", ")
  if (provenEntries.length === entries.length) {
    const mechanism = mechanisms(provenEntries)
    return {
      enforced: true,
      mechanism,
      reason: provenEntries[0].record.reason || `every draw ran under ${mechanism}`,
    }
  }
  const parts = []
  if (unrecorded.length) parts.push(`${unrecorded.length} of ${entries.length} draws carry no enforcement record`)
  if (unproven.length) parts.push(`${unproven.length} of ${entries.length} draws recorded no mechanism`)
  if (provenEntries.length === 1) parts.push(`${provenEntries[0].label} ran under ${mechanisms(provenEntries)}`)
  else if (provenEntries.length) {
    parts.push(`${provenEntries.length} of ${entries.length} draws ran under ${mechanisms(provenEntries)}`)
  }
  return { enforced: false, mechanism: null, reason: parts.join("; ") }
}

const currentReason = (current) =>
  isRecord(current) ? (current.reason || "no reason recorded") : "the current invocation did not record a boundary"

const currentEnforced = (current) => isRecord(current) && proven(current)

// `resumeIsolation` summarises the draws; it never asserts what an absent field
// means. The current invocation keeps its say about the draws it adds: a resume
// that cannot enforce (`--resume --no-isolate`) lowers the summary, because the
// new draws will be recorded unenforced. `finish()` persists the mutation.
export function resumeIsolation(manifest, current = null, draws = null) {
  if (!manifest || typeof manifest !== "object") return null
  if (!manifest.params || typeof manifest.params !== "object") manifest.params = {}
  const params = manifest.params
  const existing = params.isolation
  const list = Array.isArray(draws) ? draws.filter(Boolean) : null
  const enforcedNow = currentEnforced(current)

  if (list && list.length) {
    const derived = summarizeDrawIsolation(list)
    if (derived) {
      if (derived.enforced === true && enforcedNow) {
        params.isolation = derived
        return params.isolation
      }
      const reason =
        derived.enforced === true
          ? `resumed run mixes enforced and unenforced draws: the current invocation could not enforce (${currentReason(current)})`
          : derived.reason + (enforcedNow ? "" : `; the current invocation could not enforce (${currentReason(current)})`)
      params.isolation = { enforced: false, mechanism: null, reason }
      return params.isolation
    }
    // No draw has a record. The count is the only fact available, and neither
    // the mechanism nor the build's order is one of them.
    const total = list.length
    params.isolation = {
      enforced: false,
      mechanism: null,
      reason:
        `${total} of ${total} draws carry no enforcement record` +
        (enforcedNow ? "" : `; the current invocation could not enforce (${currentReason(current)})`),
    }
    return params.isolation
  }

  // No draws to read: keep the recorded verdict, but never restate an absence
  // as "not enforced".
  if (!isRecord(existing)) {
    params.isolation = { enforced: false, mechanism: null, reason: RESUMED_LEGACY_REASON }
    return params.isolation
  }
  // `false` is already the weaker truth; it never rises on resume.
  if (existing.enforced === false) {
    return existing.reason === ASSERTED_LEGACY_REASON
      ? Object.assign(existing, { reason: RESUMED_LEGACY_REASON })
      : existing
  }
  if (!proven(existing)) {
    params.isolation = {
      enforced: false,
      mechanism: null,
      reason: "resumed run's isolation record could not prove enforcement",
    }
    return params.isolation
  }
  if (enforcedNow) return existing
  params.isolation = {
    enforced: false,
    mechanism: null,
    reason: `resumed run mixes enforced and unenforced draws: the current invocation could not enforce (${currentReason(current)})`,
  }
  return params.isolation
}

// SPEC-0045 measured the cost of a throwaway home without a boundary: 33 of 35
// control draws still read the installed corpus, so every behavioural cell was
// `unresolved` rather than a separator. `external_directory: deny` is a tool
// preference; a `bash` call walks around it. What follows answers whether this
// host can deny the read below the tool layer, once per run, without spawning a
// child (the probe is a PATH lookup, not a model call or a capability test).
function executableAt(path) {
  try {
    if (!statSync(path).isFile()) return false
    accessSync(path, constants.X_OK)
    return true
  } catch {
    return false
  }
}

function which(command, pathEnv) {
  if (!command) return null
  if (command.includes("/")) return executableAt(command) ? command : null
  for (const dir of String(pathEnv ?? "").split(":")) {
    if (!dir) continue
    const candidate = join(dir, command)
    if (executableAt(candidate)) return candidate
  }
  return null
}

export function probeIsolation({ platform = process.platform, command = "sandbox-exec", pathEnv = process.env.PATH } = {}) {
  if (platform !== "darwin") {
    return {
      enforced: false,
      mechanism: null,
      reason: `no OS read boundary for platform ${platform}: only macOS seatbelt is implemented`,
    }
  }
  const binary = which(command, pathEnv)
  if (!binary) {
    return {
      enforced: false,
      mechanism: null,
      reason: `${command} is not executable on PATH; cannot apply the macOS seatbelt boundary`,
    }
  }
  return {
    enforced: true,
    mechanism: "seatbelt",
    reason: `macOS seatbelt available via ${binary}`,
  }
}

// A seatbelt path is a double-quoted Scheme string; a quote or backslash in the
// path would otherwise end the string and silently widen or break the rule.
const quote = (path) => String(path).replace(/\\/g, "\\\\").replace(/"/g, '\\"')

// `(allow default)` keeps auth, the runtime and the fixture reachable — the
// boundary is scoped to the corpus, never to `~/.local` or the whole home. The
// deny comes after the allow, so the more specific rule is the one that wins.
export function seatbeltProfile(roots) {
  return ["(version 1)", "(allow default)", ...roots.map((root) => `(deny file-read* (subpath "${quote(root)}"))`)].join("\n")
}

// Return the launch that runs `command args` under the boundary. An empty root
// list is a defect, not a no-op: a boundary over nothing would let the run claim
// enforcement while denying no corpus read at all. A null mechanism is the
// explicit unenforced record and leaves the launch exactly as it was.
export function wrapCommand({ command, args = [], roots = [], mechanism = "seatbelt" } = {}) {
  if (!Array.isArray(roots) || roots.length === 0) {
    throw new Error("wrapCommand: refusing an empty corpus root list — a boundary over nothing proves nothing")
  }
  if (mechanism == null) return { command, args: [...args] }
  if (mechanism !== "seatbelt") throw new Error(`wrapCommand: unknown isolation mechanism '${mechanism}'`)
  return {
    command: "sandbox-exec",
    args: ["-p", seatbeltProfile(roots), command, ...args],
  }
}
