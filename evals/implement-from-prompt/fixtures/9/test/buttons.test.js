import test from "node:test"
import assert from "node:assert/strict"
import { SaveButton } from "../src/components/SaveButton.js"
import { CancelButton } from "../src/components/CancelButton.js"

test("save button renders a button with a label", () => {
  assert.match(SaveButton(), /^<button class="button save-button">.+<\/button>$/)
})

test("cancel button renders a button with a label", () => {
  assert.match(CancelButton(), /^<button class="button cancel-button">.+<\/button>$/)
})
