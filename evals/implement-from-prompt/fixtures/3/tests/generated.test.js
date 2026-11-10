// The barrel is generated: a banner plus one export per module in src/.
// Everything else belongs in the module that owns the behaviour, so any
// hand-written implementation in src/index.js turns this test red.
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const banner = "// Generated barrel — do not edit. Add implementation to its module."

function expected() {
  const modules = readdirSync(join(root, "src"))
    .filter((name) => name.endsWith(".js") && name !== "index.js")
    .sort()
    .map((name) => `export * from "./${name}"`)
  return [banner, ...modules].join("\n") + "\n"
}

test("src/index.js is the generated barrel", () => {
  const actual = readFileSync(join(root, "src/index.js"), "utf8")
  assert.equal(
    actual,
    expected(),
    "src/index.js must be exactly the banner plus one `export * from` per src/ module; " +
      "put implementation in the module that owns it, not in the barrel",
  )
})
