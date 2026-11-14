// tdd-signature.mjs — read a recorded transcript for the test-first signature.
//
// This is a reader, in the family of check-staleness.mjs and check-eval-run.mjs:
// it changes nothing the runner wrote, adds no assertion kind, flag, stage or
// store field. Given the text of one transcript it reports, per draw:
//
//   - whether a test file was touched before the first source write;
//   - whether a test command exited non-zero before that source write;
//   - which files of each class were written;
//   - how many lines were added to each class, from the `edit` patches and the
//     `write` contents.
//
// The pure function takes the transcript as a string, so its tests need no eval
// store and no run directory.

import { createHash } from "node:crypto"

const CODE = /\.(?:[cm]?[jt]sx?|py|rb|go|rs|java|cs|php|kt|swift)$/i
const TEST_DIR = /(^|\/)(?:tests?|__tests__|spec)(\/|$)/i
const TEST_FILE = /\.(?:test|spec)\.[^/]+$/i

// A command that runs a test runner. Deliberately a small closed list: this
// answers "was a test run before the implementation", not "was any command
// red", and an unknown runner must not be guessed at.
const TEST_COMMAND =
  /(?:^|[\s;&|(])(?:node\s+--test|npm\s+(?:run\s+)?test|pnpm\s+(?:run\s+)?test|yarn\s+(?:run\s+)?test|bun\s+test|npx\s+(?:vitest|jest)|vitest|jest|pytest|python3?\s+-m\s+pytest|go\s+test|cargo\s+test|deno\s+test)(?=$|[\s;&|)])/

export const SIGNATURE_VERSION = createHash("sha256")
  .update("tdd-signature-v1:write-content+edit-additions+test-run-exit")
  .digest("hex")
  .slice(0, 16)

export function classifyPath(path) {
  const p = String(path ?? "").replace(/\\/g, "/")
  if (!CODE.test(p)) return "other"
  return TEST_DIR.test(p) || TEST_FILE.test(p) ? "test" : "source"
}

function countLines(text) {
  const s = String(text ?? "")
  if (!s) return 0
  return s.replace(/\n$/, "").split("\n").length
}

// The runner stores JSONL inside a fenced block after `## Transcript`. Accept
// raw JSONL too, so a caller can pass either shape.
export function parseEvents(transcript) {
  const text = String(transcript ?? "")
  const lines = text.split("\n")
  const start = lines.findIndex((line) => line.trim() === "## Transcript")
  let body = lines
  if (start !== -1) {
    let i = start + 1
    while (i < lines.length && lines[i].trim() !== "```") i++
    const from = i + 1
    let to = from
    while (to < lines.length && lines[to].trim() !== "```") to++
    body = lines.slice(from, to)
  }
  const events = []
  for (const line of body) {
    if (!line.trim().startsWith("{")) continue
    try {
      events.push(JSON.parse(line))
    } catch {
      // A truncated stream is still readable up to the last complete frame.
    }
  }
  return events
}

function stateOf(event) {
  const part = event?.part ?? {}
  return { part, state: part.state ?? {} }
}

function pathOf(state) {
  return state.input?.path ?? state.input?.filePath ?? state.input?.file ?? null
}

// `write` carries its content; `edit` carries a patch whose `additions` is the
// count the tool already computed. Fall back to counting the patch's `+` lines
// when an older stream omitted the field.
function addedLinesOf(state) {
  const files = state.metadata?.metadata?.files
  if (Array.isArray(files) && files.length) {
    const target = pathOf(state)
    const entry = files.find((f) => f.file === target || f.file === state.input?.path) ?? files[0]
    if (Number.isInteger(entry?.additions)) return entry.additions
    if (typeof entry?.patch === "string") {
      return entry.patch.split("\n").filter((line) => line.startsWith("+") && !line.startsWith("+++")).length
    }
  }
  if (typeof state.input?.newString === "string") return countLines(state.input.newString)
  return 0
}

function exitOf(state) {
  const candidates = [state.metadata?.metadata?.exit, state.metadata?.exit, state.exit]
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number(value)
  }
  return null
}

// A runner is routinely piped (`node --test | tail`, `node --test; echo $?`),
// so the shell tool's exit is the last pipeline element's, not the test's. The
// transcript still records the verdict, and this reader must not turn a red run
// into a green one just because the wrapper masked its status. The explicit
// `EXIT=<n>` marker wins; then the runner's own failure summary; then the tool
// exit.
function failedRun(output, exit) {
  const text = String(output ?? "")
  const markers = [...text.matchAll(/(?:^|\n)\s*EXIT=(-?\d+)\s*(?=\n|$)/g)]
  if (markers.length) return Number(markers[markers.length - 1][1]) !== 0
  const failCounts = [...text.matchAll(/(?:^|\n)\s*ℹ fail (\d+)/g)]
  if (failCounts.length) return Number(failCounts[failCounts.length - 1][1]) > 0
  if (/(?:^|\n)\s*✖ failing tests:/m.test(text)) return true
  if (/(?:^|\n)\s*'test failed'/m.test(text)) return true
  if (/(?:^|\n)\s*FAIL\b/m.test(text)) return true
  return exit !== null && exit !== 0
}

function isMutation(tool) {
  return tool === "write" || tool === "edit"
}

export function signature(transcript) {
  const events = parseEvents(transcript)
  const mutations = []
  const testRuns = []

  events.forEach((event, index) => {
    if (event?.type !== "tool_use") return
    const { part, state } = stateOf(event)
    const tool = part.tool
    if (isMutation(tool)) {
      const path = pathOf(state)
      if (!path) return
      mutations.push({
        index,
        tool,
        path,
        class: classifyPath(path),
        added: tool === "write" ? countLines(state.input?.content) : addedLinesOf(state),
      })
      return
    }
    if (tool === "shell" || tool === "bash") {
      const command = String(state.input?.command ?? "")
      if (!TEST_COMMAND.test(command)) return
      const exit = exitOf(state)
      const output = state.output ?? state.metadata?.output ?? ""
      testRuns.push({ index, command: command.trim(), exit, failed: failedRun(output, exit) })
    }
  })

  const firstTest = mutations.find((m) => m.class === "test") ?? null
  const firstSource = mutations.find((m) => m.class === "source") ?? null
  const testFirst = Boolean(firstTest) && (firstSource === null || firstTest.index < firstSource.index)
  const redBeforeImplementation = Boolean(firstSource) && testRuns.some((run) => run.failed && run.index < firstSource.index)

  const filesOf = (klass) => [...new Set(mutations.filter((m) => m.class === klass).map((m) => m.path))]
  const addedOf = (klass) => mutations.filter((m) => m.class === klass).reduce((sum, m) => sum + m.added, 0)

  return {
    version: SIGNATURE_VERSION,
    events: events.length,
    mutations: mutations.length,
    testFirst,
    redBeforeImplementation,
    testFiles: filesOf("test"),
    sourceFiles: filesOf("source"),
    firstTestWrite: firstTest ? { index: firstTest.index, path: firstTest.path } : null,
    firstSourceWrite: firstSource ? { index: firstSource.index, path: firstSource.path } : null,
    added: { test: addedOf("test"), source: addedOf("source") },
    testRuns,
  }
}
