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

import { accessSync, constants, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"

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
