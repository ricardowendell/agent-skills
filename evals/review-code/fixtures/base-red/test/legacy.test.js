import { test } from "node:test"
import assert from "node:assert/strict"

import { subtotal } from "../src/cart.js"

// Pre-existing failure: the packaging fee is not implemented yet.
test("subtotal includes the packaging fee", () => {
  assert.equal(subtotal([{ price: 10, qty: 2 }]), 22)
})
