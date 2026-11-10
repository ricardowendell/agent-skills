import { test } from "node:test"
import assert from "node:assert/strict"

import { subtotal } from "../src/cart.js"

test("subtotal multiplies price by quantity", () => {
  assert.equal(subtotal([{ price: 10, qty: 2 }]), 20)
})

test("subtotal of an empty cart is zero", () => {
  assert.equal(subtotal([]), 0)
})
