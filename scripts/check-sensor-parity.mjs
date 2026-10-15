#!/usr/bin/env node
// Parity check for the two docs-check sensors.
//
// Runs the JS (templates/ts/docs-check.mjs) and Python
// (templates/python/docs_check.py) implementations over each fixture in
// skills/bootstrap-project-harness/references/sensor-parity/ and asserts they
// produce identical output. Behavior is specified in references/docs-check.md.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const skill = join(here, "..", "skills", "bootstrap-project-harness");
const fixturesRoot = join(skill, "references", "sensor-parity");
const js = join(skill, "templates", "ts", "docs-check.mjs");
const py = join(skill, "templates", "python", "docs_check.py");

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

if (!existsSync(fixturesRoot)) {
  console.error(`no fixtures at ${fixturesRoot}`);
  process.exit(1);
}

const fixtures = readdirSync(fixturesRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

if (fixtures.length === 0) {
  console.error("no parity fixtures found");
  process.exit(1);
}

let failed = 0;
for (const name of fixtures) {
  const cwd = join(fixturesRoot, name);
  const a = run("node", [js], cwd);
  const b = run("python3", [py], cwd);
  const same =
    a.code === b.code && a.stdout === b.stdout && a.stderr === b.stderr;
  if (same) {
    console.log(`ok   ${name} (exit ${a.code})`);
  } else {
    failed++;
    console.error(`FAIL ${name}`);
    console.error(`  js  exit=${a.code}\n${a.stdout}${a.stderr}`);
    console.error(`  py  exit=${b.code}\n${b.stdout}${b.stderr}`);
  }
}

console.log(`\n${fixtures.length - failed}/${fixtures.length} fixtures in parity`);
process.exit(failed === 0 ? 0 : 1);
