import test from "node:test"
import assert from "node:assert/strict"
import { slugify } from "../src/slug.js"

test("lowercases and joins words with one hyphen", () => {
  assert.equal(slugify("Hello World"), "hello-world")
})

test("trims the input", () => {
  assert.equal(slugify("  Hello World  "), "hello-world")
})
