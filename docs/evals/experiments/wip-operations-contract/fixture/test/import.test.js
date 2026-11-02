// The acceptance oracle for SPEC-0014. It fails until `src/import.js` exists.
// Do not weaken it: every assertion here is an AC, and the ACs are the contract.
import test from "node:test"
import assert from "node:assert/strict"
import { importRows } from "../src/import.js"

test("AC-1 imports one row per data line", () => {
  assert.deepEqual(importRows("a,b,c\n1,2,3\n4,5,6\n"), [
    ["1", "2", "3"],
    ["4", "5", "6"],
  ])
})

test("AC-2 rejects a short row and names its line number", () => {
  assert.throws(() => importRows("a,b,c\n1,2\n"), /line 2\b/i)
})

test("AC-3 ignores blank lines, including trailing ones", () => {
  assert.deepEqual(importRows("a,b,c\n1,2,3\n\n"), [["1", "2", "3"]])
})
