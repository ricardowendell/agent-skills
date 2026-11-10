#!/usr/bin/env node
// Print the SHA-256 of a file.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node spec-sha.mjs <file>");
  process.exit(1);
}
console.log(createHash("sha256").update(readFileSync(file)).digest("hex"));
