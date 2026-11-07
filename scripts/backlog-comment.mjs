#!/usr/bin/env node
// backlog-comment.mjs — append a task comment safely (workaround for TASK-55).
//
// `backlog task edit --comment` truncates a comment at the first bare `---` line
// and silently drops the rest, including later comments. This command rewrites
// only the text before `<!-- COMMENTS:END -->`, so nothing already in the file
// can be lost. `--status` and `--check-ac` are safe and still go through the CLI.

import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { appendComment, countComments } from "./lib/backlog-comment.mjs"

const USAGE = `Usage: node scripts/backlog-comment.mjs <TASK-ID> <text> [options]

Append a comment to backlog/tasks/task-<N> -.md without the CLI parser that
drops everything after a bare "---" line (TASK-55).

Options:
  --dir <path>   tasks directory (default: backlog/tasks, relative to the repo)
  --at <iso>     timestamp for the record (default: now)
  --dry-run      print the result instead of writing

Exit codes: 0 written, 1 bad usage or task not found, 2 nothing to do.`

const argv = process.argv.slice(2)
const opt = { dir: "backlog/tasks", at: null, dryRun: false }
const positional = []
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === "--help" || a === "-h") {
    process.stdout.write(`${USAGE}\n`)
    process.exit(0)
  }
  if (a === "--dry-run") opt.dryRun = true
  else if (a === "--dir" || a === "--at") {
    const value = argv[++i]
    if (!value || value.startsWith("--")) {
      console.error(`${a} needs a value\n\n${USAGE}`)
      process.exit(1)
    }
    if (a === "--dir") opt.dir = value
    else opt.at = value
  } else if (a.startsWith("--")) {
    console.error(`unknown option '${a}'\n\n${USAGE}`)
    process.exit(1)
  } else positional.push(a)
}

if (positional.length < 2) {
  console.error(USAGE)
  process.exit(1)
}

const [taskId, ...rest] = positional
const body = rest.join(" ")
const match = taskId.match(/^TASK-(\d+)$/i)
if (!match) {
  console.error(`expected a task id like TASK-55, got '${taskId}'`)
  process.exit(1)
}

const dir = resolve(opt.dir)
const prefix = `task-${Number(match[1])} -`
let file
try {
  file = readdirSync(dir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".md"))
    .map((name) => join(dir, name))[0]
} catch {
  console.error(`cannot read ${dir}`)
  process.exit(1)
}
if (!file) {
  console.error(`no file for ${taskId} in ${dir}`)
  process.exit(1)
}

const before = readFileSync(file, "utf8")
const after = appendComment(before, body, opt.at ?? new Date())
const comments = countComments(after)

if (comments === 0) {
  console.error("refusing to write: the result has no comment record")
  process.exit(2)
}

if (opt.dryRun) {
  process.stdout.write(after)
  process.exit(0)
}

writeFileSync(file, after)
process.stdout.write(`${file} (${comments} comment${comments === 1 ? "" : "s"})\n`)
