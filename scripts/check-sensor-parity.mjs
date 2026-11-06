#!/usr/bin/env node
// Parity check for the two docs-check sensors.
//
// Runs the JS (templates/ts/docs-check.mjs) and Python
// (templates/python/docs_check.py) implementations over each fixture in
// skills/bootstrap-project-harness/references/sensor-parity/ and asserts they
// produce identical output. Behavior is specified in references/docs-check.md.
import { spawnSync } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { findPython, formatTried } from "./lib/evals/interpreter.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const skill = join(here, "..", "skills", "bootstrap-project-harness")
const fixturesRoot = join(skill, "references", "sensor-parity")
const js = join(skill, "templates", "ts", "docs-check.mjs")
const py = join(skill, "templates", "python", "docs_check.py")

// A spawn failure is a result, not a missing string: formatting `r.stderr` when
// `spawnSync` failed printed `undefinedundefined` and looked like a diverging
// sensor. Keep stdout/stderr as strings so the comparison stays byte-exact.
function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8" })
  if (r.error) {
    return { code: null, stdout: "", stderr: `${cmd}: ${r.error.message}` }
  }
  const text = (value) => (typeof value === "string" ? value : "")
  return { code: r.status, stdout: text(r.stdout), stderr: text(r.stderr) }
}

if (!existsSync(fixturesRoot)) {
  console.error(`no fixtures at ${fixturesRoot}`)
  process.exit(1)
}

const fixtures = readdirSync(fixturesRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort()

if (fixtures.length === 0) {
  console.error("no parity fixtures found")
  process.exit(1)
}

// Resolve once, before the fixture loop, so a missing interpreter is one
// diagnosis and not one false parity failure per fixture. The default stays
// closed: a silent skip would hide exactly the drift this check exists for.
const python = findPython({ env: process.env })
if (!python.command) {
  const tried = formatTried(python.tried)
  if (process.env.PDLC_ALLOW_MISSING_PYTHON === "1") {
    console.log(`skip python: no usable interpreter found (tried: ${tried}); parity not checked`)
    process.exit(0)
  }
  console.error(
    `cannot check sensor parity: no usable Python 3 interpreter found (tried: ${tried}); set PDLC_PYTHON=/path/to/python3`,
  )
  process.exit(1)
}

console.log(`python ${python.version} (${python.command})`)

let failed = 0
for (const name of fixtures) {
  const cwd = join(fixturesRoot, name)
  const a = run("node", [js], cwd)
  const b = run(python.command, [py], cwd)
  const same = a.code === b.code && a.stdout === b.stdout && a.stderr === b.stderr
  if (same) {
    console.log(`ok   ${name} (exit ${a.code})`)
  } else {
    failed++
    console.error(`FAIL ${name}`)
    console.error(`  js  exit=${a.code}\n${a.stdout}${a.stderr}`)
    console.error(`  py  exit=${b.code}\n${b.stdout}${b.stderr}`)
  }
}

console.log(`\n${fixtures.length - failed}/${fixtures.length} fixtures in parity`)
process.exit(failed === 0 ? 0 : 1)
