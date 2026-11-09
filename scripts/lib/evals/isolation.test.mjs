import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { isolateHome, probeIsolation, wrapCommand } from "./isolation.mjs"

// A home shaped like the real one: skills next to the config, and the state the
// child is allowed to keep.
function fakeHome() {
  const home = mkdtempSync(join(tmpdir(), "iso-test-home-"))
  mkdirSync(join(home, ".config/opencode/skills/review-code"), { recursive: true })
  writeFileSync(join(home, ".config/opencode/skills/review-code/SKILL.md"), "---\nname: review-code\n---\n")
  mkdirSync(join(home, ".config/opencode/.retired-skills"), { recursive: true })
  mkdirSync(join(home, ".config/opencode/vendor"), { recursive: true })
  writeFileSync(join(home, ".config/opencode/opencode.json"), "{}")
  mkdirSync(join(home, ".local/share/opencode"), { recursive: true })
  writeFileSync(join(home, ".local/share/opencode/auth.json"), "{}")
  mkdirSync(join(home, ".secrets"), { recursive: true })
  writeFileSync(join(home, ".secrets/key"), "secret")
  return home
}

test("the isolated home keeps the state a run needs and drops the skills", () => {
  const home = fakeHome()
  const iso = isolateHome({ PATH: "/bin" }, { home, base: mkdtempSync(join(tmpdir(), "iso-test-base-")) })
  try {
    assert.notEqual(iso.env.HOME, home)
    assert.equal(iso.env.XDG_CONFIG_HOME, join(iso.env.HOME, ".config"))
    assert.equal(iso.env.PATH, "/bin", "the rest of the env is untouched")

    assert.equal(readFileSync(join(iso.env.HOME, ".local/share/opencode/auth.json"), "utf8"), "{}")
    assert.equal(readFileSync(join(iso.env.HOME, ".secrets/key"), "utf8"), "secret")

    const config = join(iso.env.XDG_CONFIG_HOME, "opencode")
    assert.ok(existsSync(join(config, "opencode.json")), "config entries are linked in")
    assert.deepEqual(
      readdirSync(config).sort(),
      [".retired-skills", "opencode.json", "skills", "vendor"].filter((e) => !/^(skills|\.retired-skills)$/.test(e)).sort(),
      "skills and .retired-skills are the only entries left out",
    )
  } finally {
    iso.cleanup()
  }
})

test("cleanup removes the links, never what they point at", () => {
  const home = fakeHome()
  const iso = isolateHome({}, { home, base: mkdtempSync(join(tmpdir(), "iso-test-base-")) })
  iso.cleanup()
  assert.equal(existsSync(iso.dir), false, "the throwaway home is gone")
  assert.equal(readFileSync(join(home, ".secrets/key"), "utf8"), "secret", "the real home is untouched")
  assert.ok(existsSync(join(home, ".config/opencode/skills/review-code/SKILL.md")))
})

test("a home without a config dir still yields a usable isolated home", () => {
  const home = mkdtempSync(join(tmpdir(), "iso-test-bare-"))
  const iso = isolateHome({}, { home, base: mkdtempSync(join(tmpdir(), "iso-test-base-")) })
  try {
    assert.ok(existsSync(iso.env.XDG_CONFIG_HOME))
    assert.deepEqual(readdirSync(join(iso.env.XDG_CONFIG_HOME, "opencode")), [])
  } finally {
    iso.cleanup()
  }
})

test("the isolated config keeps the user's settings and denies external directories", () => {
  const home = fakeHome()
  writeFileSync(
    join(home, ".config/opencode/opencode.json"),
    JSON.stringify({ model: "opencode-go/gpt-6-luna", permission: { bash: "ask" } }),
  )
  const iso = isolateHome({}, { home, base: mkdtempSync(join(tmpdir(), "iso-test-base-")) })
  try {
    const config = JSON.parse(readFileSync(join(iso.env.XDG_CONFIG_HOME, "opencode/opencode.json"), "utf8"))
    assert.equal(config.model, "opencode-go/gpt-6-luna", "the user's model survives")
    assert.equal(config.permission.bash, "ask", "an existing rule survives")
    assert.equal(config.permission.external_directory, "deny", "a read outside the scratch is denied")
    // The copy must not be the real file: the child would otherwise rewrite it.
    assert.equal(JSON.parse(readFileSync(join(home, ".config/opencode/opencode.json"), "utf8")).permission.external_directory, undefined)
  } finally {
    iso.cleanup()
  }
})

test("a config the merge cannot parse is linked as-is, not dropped", () => {
  const home = fakeHome()
  writeFileSync(join(home, ".config/opencode/opencode.json"), "{ not json")
  const iso = isolateHome({}, { home, base: mkdtempSync(join(tmpdir(), "iso-test-base-")) })
  try {
    assert.equal(readFileSync(join(iso.env.XDG_CONFIG_HOME, "opencode/opencode.json"), "utf8"), "{ not json")
  } finally {
    iso.cleanup()
  }
})

// SPEC-0046 — the capability probe is a PATH lookup, never a spawn: a run must
// not pay for a child just to learn whether a boundary exists.
test("the probe is unenforced on a platform with no OS boundary", () => {
  const probe = probeIsolation({ platform: "linux", command: "sandbox-exec", pathEnv: "/usr/bin" })
  assert.deepEqual(probe, {
    enforced: false,
    mechanism: null,
    reason: "no OS read boundary for platform linux: only macOS seatbelt is implemented",
  })
})

test("the probe names seatbelt only when the binary is executable", () => {
  const dir = mkdtempSync(join(tmpdir(), "iso-probe-"))
  try {
    const binary = join(dir, "sandbox-exec")
    writeFileSync(binary, "#!/bin/sh\nexit 1\n")
    chmodSync(binary, 0o755)
    assert.deepEqual(probeIsolation({ platform: "darwin", command: "sandbox-exec", pathEnv: dir }), {
      enforced: true,
      mechanism: "seatbelt",
      reason: `macOS seatbelt available via ${binary}`,
    })
    const missing = probeIsolation({ platform: "darwin", command: "sandbox-exec", pathEnv: join(dir, "nope") })
    assert.equal(missing.enforced, false)
    assert.equal(missing.mechanism, null)
    assert.match(missing.reason, /not executable on PATH/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("wrapCommand prepends sandbox-exec and one deny per corpus root", () => {
  const wrapped = wrapCommand({
    command: "opencode",
    args: ["run", "prompt"],
    roots: ["/Users/me/.agents/skills", "/Users/me/.claude/skills"],
    mechanism: "seatbelt",
  })
  assert.equal(wrapped.command, "sandbox-exec")
  assert.deepEqual(wrapped.args.slice(0, 2), ["-p", wrapped.args[1]])
  assert.equal(wrapped.args[2], "opencode")
  assert.deepEqual(wrapped.args.slice(3), ["run", "prompt"])
  assert.match(wrapped.args[1], /^\(version 1\)\n\(allow default\)\n/)
  assert.match(wrapped.args[1], /\(deny file-read\* \(subpath "\/Users\/me\/\.agents\/skills"\)\)/)
  assert.match(wrapped.args[1], /\(deny file-read\* \(subpath "\/Users\/me\/\.claude\/skills"\)\)/)
})

test("wrapCommand refuses a boundary over nothing and leaves a null mechanism alone", () => {
  assert.throws(() => wrapCommand({ command: "opencode", args: [], roots: [], mechanism: "seatbelt" }), /empty corpus root list/)
  assert.deepEqual(wrapCommand({ command: "opencode", args: ["run"], roots: ["/x"], mechanism: null }), {
    command: "opencode",
    args: ["run"],
  })
})

// The canary is the point of the layer. The same deterministic read must fail
// under the wrapper and succeed without it; a skip is explicit and names why,
// so it can never pass silently on a host where the boundary does not exist.
test("the canary reads a known corpus path: denied under the boundary, allowed without it", (t) => {
  const probe = probeIsolation()
  if (!probe.enforced) {
    t.skip(`the boundary is not available on this host: ${probe.reason}; the canary cannot be proven`)
    return
  }
  const base = mkdtempSync(join(tmpdir(), "iso-canary-"))
  try {
    const corpus = join(base, "corpus")
    mkdirSync(corpus)
    writeFileSync(join(corpus, "SKILL.md"), "installed corpus\n")
    // /tmp and $TMPDIR are symlinks on macOS; seatbelt matches the resolved
    // path, so the canary must name the real one or it would pass for the wrong
    // reason (the read was never denied).
    const realCorpus = realpathSync(corpus)
    const target = join(realCorpus, "SKILL.md")
    const script = 'process.stdout.write(require("node:fs").readFileSync(process.argv[1], "utf8"))'

    const allowed = spawnSync(process.execPath, ["-e", script, target], { encoding: "utf8" })
    assert.equal(allowed.status, 0, `the canary path ${target} must be readable without the boundary: ${allowed.stderr}`)
    assert.match(allowed.stdout, /installed corpus/)

    const wrapped = wrapCommand({
      command: process.execPath,
      args: ["-e", script, target],
      roots: [realCorpus],
      mechanism: probe.mechanism,
    })
    const denied = spawnSync(wrapped.command, wrapped.args, { encoding: "utf8" })
    assert.notEqual(denied.status, 0, `reading ${target} must fail under the ${probe.mechanism} boundary`)
    assert.doesNotMatch(denied.stdout, /installed corpus/)
    assert.match(denied.stderr, /Operation not permitted|permission denied/i)
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
})
