import test from "node:test"
import assert from "node:assert/strict"
import { total } from "../src/index.js"

test("applies the rate and rounds to cents", () => {
  assert.equal(total([{ price: 10, qty: 1 }], 0.2), 12)
})

test("rejects a non-finite rate", () => {
  assert.throws(() => total([{ price: 1, qty: 1 }], Number.NaN), RangeError)
})
