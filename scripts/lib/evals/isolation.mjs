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

import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"

// What a run may legitimately need from the real home: provider auth and state
// (`~/.local/share/opencode`), the credentials file the config points at, the
// runtime, and git's identity. Anything not listed stays invisible.
const SHARED = [".local", ".secrets", ".bun", ".gitconfig", ".npm"]

// The whole point. `skills` is the corpus, and `.retired-skills` is still on
// disk next to it.
const HIDDEN = /^(skills|\.retired-skills)$/

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
      symlinkSync(join(src, entry), join(config, entry))
    }
  }

  return {
    dir,
    env: { ...env, HOME: dir, XDG_CONFIG_HOME: join(dir, ".config") },
    // rmSync does not follow symlinks, so the real home survives this.
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  }
}
