#!/usr/bin/env node
// Print the tool calls a recorded transcript actually made.
//
// The runner stores the raw JSONL inside the `## Transcript` fence. Reading it
// back is the only honest way to know which files a run read: the fixture is
// available whether or not the agent opened it.

import { readFileSync } from "node:fs"

const file = process.argv[2]
if (!file) {
  console.error("usage: node read-trace.mjs <transcript.md>")
  process.exit(1)
}

const md = readFileSync(file, "utf8")
const start = md.indexOf("## Transcript")
if (start === -1) {
  console.error("no '## Transcript' section")
  process.exit(2)
}

const lines = md.slice(start).split("\n")
const events = []
let inFence = false
for (const line of lines) {
  if (line.trim() === "```") {
    inFence = !inFence
    continue
  }
  if (!inFence) continue
  try {
    events.push(JSON.parse(line))
  } catch {}
}

const calls = events.filter((e) => e.type === "tool_use" && e.part?.state)
const reads = []
for (const e of calls) {
  const tool = e.part.tool
  const input = e.part.state.input ?? {}
  if (tool === "read") reads.push(input.filePath ?? input.path ?? "?")
  else if (tool === "grep") reads.push(`grep ${input.pattern ?? ""} ${input.path ?? ""}`.trim())
  else if (tool === "glob") reads.push(`glob ${input.pattern ?? ""} ${input.path ?? ""}`.trim())
}

console.log(JSON.stringify({ toolCalls: calls.length, reads }, null, 2))
