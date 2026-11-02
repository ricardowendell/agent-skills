// The acceptance oracle for SPEC-0015 — deliberately partial.
//
// AC-1 and AC-3 are checked here. AC-2 (the rejection must name the *physical*
// line, so a blank line before the bad row shifts the number) is not: the spec
// says it, the oracle does not, and the probe in run.sh checks it on the
// produced module. The prompt is the only thing that can carry AC-2 to the
// implementer.
import test from "node:test"
import assert from "node:assert/strict"
import { importRows } from "../src/import.js"

test("AC-1 imports one row per data line", () => {
  assert.deepEqual(importRows("a,b,c\n1,2,3\n4,5,6\n"), [
    ["1", "2", "3"],
    ["4", "5", "6"],
  ])
})

test("AC-3 ignores blank lines, including trailing ones", () => {
  assert.deepEqual(importRows("a,b,c\n1,2,3\n\n"), [["1", "2", "3"]])
})
