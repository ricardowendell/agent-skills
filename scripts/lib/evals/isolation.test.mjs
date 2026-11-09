import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  corpusRoots,
  installedSkillRoots,
  isolateHome,
  isolationRecord,
  probeIsolation,
  resumeIsolation,
  wrapCommand,
} from "./isolation.mjs"
import { openRun } from "./runs.mjs"

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

// SPEC-0046 P1: `--root skills` changes discovery, not what counts as corpus.
// The old ROOTS construction dropped the four installed roots whenever a root
// was passed, so the documented control invocation wrote `enforced: true` while
// `~/.config/opencode/skills/*/SKILL.md` stayed readable.
test("corpusRoots keeps every installed root when an explicit --root is given", () => {
  const home = mkdtempSync(join(tmpdir(), "iso-corpus-root-"))
  try {
    for (const root of installedSkillRoots(home)) mkdirSync(root, { recursive: true })
    const repoSkills = join(home, "repo/skills")
    const hostDocs = join(home, "repo/docs")
    mkdirSync(repoSkills, { recursive: true })
    mkdirSync(hostDocs, { recursive: true })

    const roots = corpusRoots({ home, root: repoSkills, hostRoots: [hostDocs] })

    for (const installed of installedSkillRoots(home)) {
      assert.ok(roots.includes(realpathSync(installed)), `missing installed root ${installed}: ${roots.join(", ")}`)
    }
    assert.ok(roots.includes(realpathSync(repoSkills)), "the explicit --root is added")
    assert.ok(roots.includes(realpathSync(hostDocs)), "the host roots are added")
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test("corpusRoots includes the .retired-skills sibling of an installed root", () => {
  const home = mkdtempSync(join(tmpdir(), "iso-corpus-retired-"))
  try {
    for (const root of installedSkillRoots(home)) mkdirSync(root, { recursive: true })
    const retired = join(home, ".config/opencode/.retired-skills")
    mkdirSync(retired, { recursive: true })

    const roots = corpusRoots({ home })
    assert.ok(roots.includes(realpathSync(retired)), `missing retired corpus ${retired}: ${roots.join(", ")}`)
    assert.equal(
      roots.includes(join(home, ".agents/.retired-skills")),
      false,
      "an absent sibling is not invented",
    )
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test("corpusRoots deduplicates repeated and symlinked roots", () => {
  const home = mkdtempSync(join(tmpdir(), "iso-corpus-dedup-"))
  try {
    for (const root of installedSkillRoots(home)) mkdirSync(root, { recursive: true })
    const repeated = join(home, ".agents/skills")
    const roots = corpusRoots({
      home,
      hostRoots: [repeated, repeated, join(home, ".agents/skills")],
    })
    assert.equal(new Set(roots).size, roots.length, `duplicate paths: ${roots.join(", ")}`)
    assert.equal(roots.filter((r) => r === repeated).length, 1, "the typed path appears once")
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

// SPEC-0046 P2: the manifest writer must not be able to claim a boundary with
// no mechanism, and a resumed legacy run must not look enforced.
test("an isolation record cannot claim enforcement without a mechanism", () => {
  const bogus = isolationRecord({ enforced: true, mechanism: null, reason: "claimed" })
  assert.equal(bogus.enforced, false)
  assert.equal(bogus.mechanism, null)
  assert.match(bogus.reason, /no mechanism was applied/)
  assert.deepEqual(isolationRecord(), { enforced: false, mechanism: null, reason: "not enforced" })

  const real = isolationRecord({ enforced: true, mechanism: "seatbelt", reason: "available" })
  assert.equal(real.enforced, true)
  assert.notEqual(real.mechanism, null, "enforced: true implies a mechanism")
})

const ENFORCED_NOW = { enforced: true, mechanism: "seatbelt", reason: "available" }
const UNENFORCED_NOW = { enforced: false, mechanism: null, reason: "not applied: --no-isolate" }

test("resuming keeps only the weaker isolation truth", () => {
  // Legacy manifest: no record at all.
  const legacy = { params: { isolate: true } }
  assert.deepEqual(resumeIsolation(legacy, ENFORCED_NOW), {
    enforced: false,
    mechanism: null,
    reason: "resumed legacy run — earlier draws were not enforced",
  })
  assert.deepEqual(legacy.params.isolation, resumeIsolation(legacy, ENFORCED_NOW), "idempotent once recorded")

  // Both sides enforced: the recorded boundary survives.
  const enforced = {
    params: { isolate: true, isolation: { enforced: true, mechanism: "seatbelt", reason: "available" } },
  }
  assert.equal(resumeIsolation(enforced, ENFORCED_NOW).enforced, true)

  // Recorded enforced but the current invocation cannot enforce: downgrade.
  const mixed = {
    params: { isolate: true, isolation: { enforced: true, mechanism: "seatbelt", reason: "available" } },
  }
  const downgraded = resumeIsolation(mixed, UNENFORCED_NOW)
  assert.equal(downgraded.enforced, false)
  assert.equal(downgraded.mechanism, null)
  assert.match(downgraded.reason, /mixes enforced and unenforced draws/)
  assert.match(downgraded.reason, /--no-isolate/)

  // A false record never rises, even when the new draws are enforced.
  const weak = { params: { isolation: { enforced: false, mechanism: null, reason: "platform linux" } } }
  assert.equal(resumeIsolation(weak, ENFORCED_NOW).enforced, false)

  // No params at all still gets the weaker record.
  const bare = {}
  assert.equal(resumeIsolation(bare, ENFORCED_NOW).enforced, false)
  assert.equal(bare.params.isolation.mechanism, null)

  // A malformed record cannot prove enforcement.
  const malformed = { params: { isolation: {} } }
  assert.equal(resumeIsolation(malformed, ENFORCED_NOW).enforced, false)

  // `enforced: true` without a named mechanism is malformed too.
  for (const mechanism of [null, ""]) {
    const nameless = { params: { isolation: { enforced: true, mechanism, reason: "claimed" } } }
    const downgradedNameless = resumeIsolation(nameless, ENFORCED_NOW)
    assert.equal(downgradedNameless.enforced, false, `mechanism=${JSON.stringify(mechanism)}`)
    assert.equal(downgradedNameless.mechanism, null)
  }

  // A current record that claims enforcement without a mechanism cannot keep a
  // previously enforced manifest.
  const enforcedAgain = {
    params: { isolation: { enforced: true, mechanism: "seatbelt", reason: "available" } },
  }
  assert.equal(
    resumeIsolation(enforcedAgain, { enforced: true, mechanism: null, reason: "claimed" }).enforced,
    false,
  )
})

test("the resume downgrade reaches the manifest written by finish()", () => {
  const dir = mkdtempSync(join(tmpdir(), "iso-resume-finish-"))
  try {
    writeFileSync(
      join(dir, "manifest.json"),
      JSON.stringify({
        run: "demo",
        status: "completed",
        params: { isolate: true, isolation: { enforced: true, mechanism: "seatbelt", reason: "available" } },
      }),
    )
    const run = openRun(dir)
    resumeIsolation(run.manifest, UNENFORCED_NOW)
    run.finish()

    const written = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"))
    assert.equal(written.params.isolation.enforced, false)
    assert.match(written.params.isolation.reason, /mixes enforced and unenforced draws/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// SPEC-0046 P2: the synthetic canary proves the profile shape; this one proves
// the profile is broad enough for the real corpus on this host. It skips with a
// reason when no installed skill is present, never passes silently.
test("the canary denies a real installed corpus file", (t) => {
  const probe = probeIsolation()
  if (!probe.enforced) {
    t.skip(`the boundary is not available on this host: ${probe.reason}; cannot prove the real deny`)
    return
  }
  const roots = corpusRoots({ home: homedir(), hostRoots: [] })
  let target = null
  for (const root of roots) {
    let entries
    try {
      entries = readdirSync(root, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const candidate = join(root, entry.name, "SKILL.md")
      if (existsSync(candidate)) {
        target = candidate
        break
      }
    }
    if (target) break
  }
  if (!target) {
    t.skip(`no installed corpus file under ${roots.join(", ")}; cannot prove the real deny`)
    return
  }
  const script = 'process.stdout.write(require("node:fs").readFileSync(process.argv[1], "utf8"))'
  const allowed = spawnSync(process.execPath, ["-e", script, target], { encoding: "utf8" })
  assert.equal(allowed.status, 0, `installed corpus ${target} must be readable without the boundary: ${allowed.stderr}`)

  const wrapped = wrapCommand({
    command: process.execPath,
    args: ["-e", script, target],
    roots,
    mechanism: probe.mechanism,
  })
  const denied = spawnSync(wrapped.command, wrapped.args, { encoding: "utf8" })
  assert.notEqual(denied.status, 0, `reading installed corpus ${target} must fail under the boundary`)
  assert.doesNotMatch(denied.stdout, /^---/)
  // A sandbox-exec launch failure (bad profile, missing binary) is also
  // non-zero; without this the test would pass for the wrong reason.
  assert.match(denied.stderr, /Operation not permitted|permission denied/i)
})

// A full run needs a provider; `opencode --version` needs none. This is the
// cheapest proof that the child binary starts and resolves its config while the
// checkout (which holds the `commands` symlink) is denied. It is not a draw.
test("the wrapped child starts and resolves its config under the boundary", (t) => {
  const probe = probeIsolation()
  if (!probe.enforced) {
    t.skip(`the boundary is not available on this host: ${probe.reason}; cannot smoke the launcher`)
    return
  }
  const opencode = String(process.env.PATH ?? "")
    .split(":")
    .map((dir) => join(dir, "opencode"))
    .find((candidate) => existsSync(candidate))
  if (!opencode) {
    t.skip("opencode is not on PATH; cannot smoke the launcher")
    return
  }
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
  const roots = corpusRoots({ home: homedir(), hostRoots: [repo] })
  const cwd = mkdtempSync(join(tmpdir(), "iso-launch-smoke-"))
  try {
    const wrapped = wrapCommand({ command: opencode, args: ["--version"], roots, mechanism: probe.mechanism })
    const result = spawnSync(wrapped.command, wrapped.args, { cwd, encoding: "utf8", timeout: 30000 })
    assert.equal(result.status, 0, `opencode --version failed under the boundary: ${result.stderr}`)
    assert.match(`${result.stdout}${result.stderr}`, /\d+\.\d+/)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
