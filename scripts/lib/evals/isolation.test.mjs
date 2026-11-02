import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { isolateHome } from "./isolation.mjs"

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
