#!/usr/bin/env node
// Print the SHA-256 of a file.
// Used to stamp a spec into its implementation prompt (`spec_sha`) so
// docs-check can detect a prompt that is older than the spec it came from.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node spec-sha.mjs <file>");
  process.exit(1);
}
console.log(createHash("sha256").update(readFileSync(file)).digest("hex"));
