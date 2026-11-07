#!/usr/bin/env node
// audit-provider-aborts.mjs — list stored draw transcripts with a provider abort.
//
// Read-only and model-free. For every `transcript*.md` in the store it detects a
// `provider.*` error and reports whether the matching result recorded it, whether
// the draw was classified as infrastructure, and whether the runner retried.
// Old artefacts predate `execution.error`, so a transcript can abort while its
// result still says `failed — exit 1`; this is the command that finds them.

import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join, resolve } from "node:path"
import { auditStore, formatAudit, summarizeAudit } from "./lib/evals/provider-audit.mjs"

const USAGE = `Usage: node scripts/audit-provider-aborts.mjs [--dir <store>] [--json]

List every stored transcript carrying a provider.* abort and compare it with its
result. "recorded" is the error in result.json/draws (TASK-52); "infrastructure"
is the runner's behavioural exclusion; "retried" is execution.attempts > 1.
The store defaults to ~/.local/share/opencode/evals/runs. Exit 0 is normal: this
is an audit, not a gate.`

const argv = process.argv.slice(2)
const opt = { dir: join(homedir(), ".local/share/opencode/evals/runs"), json: false }
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === "--help" || a === "-h") {
    process.stdout.write(`${USAGE}\n`)
    process.exit(0)
  }
  if (a === "--json") opt.json = true
  else if (a === "--dir") {
    const value = argv[++i]
    if (!value || value.startsWith("--")) {
      console.error("--dir needs a path")
      process.exit(2)
    }
    opt.dir = resolve(value)
  } else {
    console.error(`unknown argument '${a}'\n\n${USAGE}`)
    process.exit(2)
  }
}

if (!existsSync(opt.dir)) {
  console.error(`store not found: ${opt.dir}`)
  process.exit(2)
}

const result = auditStore(opt.dir)
if (opt.json) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
} else {
  for (const row of result.rows) process.stdout.write(`${formatAudit(row)}\n`)
  process.stdout.write(`${summarizeAudit(result)}\n`)
}
