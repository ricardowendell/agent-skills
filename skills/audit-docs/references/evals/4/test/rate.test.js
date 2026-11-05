import { test } from "node:test"
import assert from "node:assert/strict"

import { applyRate } from "../src/rate.js"

test("applies a positive rate", () => {
  assert.equal(applyRate(100, 0.2), 120)
})

test("allows a negative rate for a credit", () => {
  assert.equal(applyRate(100, -0.1), 90)
})
