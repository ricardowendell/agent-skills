import test from "node:test"
import assert from "node:assert/strict"
import { splitLines, splitColumns } from "../src/csv.js"

test("splitLines numbers lines from one and drops blank ones", () => {
  assert.deepEqual(splitLines("a\n\nb\n"), [
    { line: 1, text: "a" },
    { line: 3, text: "b" },
  ])
})

test("splitColumns trims each cell", () => {
  assert.deepEqual(splitColumns(" 1, 2 ,3 "), ["1", "2", "3"])
})
