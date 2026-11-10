import { expect, test } from "bun:test";
import { greet } from "../src/index.ts";

test("greets", () => {
  expect(greet("bun")).toBe("hello, bun");
});
