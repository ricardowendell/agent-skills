import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { KINDS, ASSERT_KINDS, REPLAYABLE } from "./kinds.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

test("every kind names a scope the replay tool understands", () => {
  for (const k of KINDS) assert.ok(["transcript", "filesystem"].includes(k.scope), `${k.name}: ${k.scope}`)
})

test("no kind is declared twice", () => {
  assert.equal(ASSERT_KINDS.size, KINDS.length)
})

test("REPLAYABLE is exactly the transcript kinds and never a kind parse rejects", () => {
  const transcript = new Set(KINDS.filter((k) => k.scope === "transcript").map((k) => k.name))
  assert.deepEqual([...REPLAYABLE].sort(), [...transcript].sort())
  for (const kind of REPLAYABLE) assert.ok(ASSERT_KINDS.has(kind), `${kind} is replayable but not accepted`)
})

// The README is the human list; a kind the registry accepts but the README does
// not is a kind no case author can find.
test("the README table documents exactly the registry", () => {
  const md = readFileSync(join(REPO, "README.md"), "utf8")
  const section = md.split("### Assertions")[1]?.split("\n### ")[0] ?? ""
  const rows = [...section.matchAll(/^\|([^|]+)\|/gm)].map((m) => m[1])
  const documented = new Set(rows.flatMap((cell) => [...cell.matchAll(/`([a-z]+)`/g)].map((m) => m[1])))
  assert.deepEqual([...documented].sort(), [...ASSERT_KINDS].sort())
})
