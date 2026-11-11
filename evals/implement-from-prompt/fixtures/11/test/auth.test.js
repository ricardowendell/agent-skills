import test from "node:test"
import assert from "node:assert/strict"
import { signIn } from "../src/login.js"

test("a verified account can sign in", () => {
  assert.equal(signIn({ emailVerified: true }).ok, true)
})

test("an unverified account cannot sign in", () => {
  assert.throws(() => signIn({ emailVerified: false }), /not verified/)
})
