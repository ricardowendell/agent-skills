import assert from "node:assert/strict";
import { test } from "node:test";
import { greet } from "../src/index.ts";

test("greets", () => {
  assert.equal(greet("pnpm"), "hello, pnpm");
});
