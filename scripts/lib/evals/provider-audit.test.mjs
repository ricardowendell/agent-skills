import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { auditStore, formatAudit } from "./provider-audit.mjs"

// The audit is the TASK-54 gate: old transcripts can carry a provider abort while
// the result says only `failed — exit 1`. These cases pin the three facts the
// report must expose: recorded, infrastructure, retried.
function maybeWrite(dir, rel, value) {
  if (value === null) return
  const file = join(dir, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value))
}

function transcript(type = "provider.go-limit") {
  return `${JSON.stringify({ type: "error", error: { type, message: "overloaded", status: 429 } })}\n`
}

function store() {
  const root = mkdtempSync(join(tmpdir(), "provider-audit-"))

  // A draw written after TASK-38: the per-draw file records the abort.
  const a = join(root, "run-a/cases/demo--01")
  maybeWrite(a, "transcript.r1.md", transcript())
  maybeWrite(a, "draws/r1.json", {
    status: "failed",
    execution: { attempts: 1, error: { type: "provider.go-limit" } },
  })

  // An old aggregate: the transcript aborted, the repetition never recorded it.
  const b = join(root, "run-b/cases/demo--01")
  maybeWrite(b, "transcript.r2.md", transcript("provider.rate-limit"))
  maybeWrite(b, "result.json", {
    status: "failed",
    repetitions: [
      { status: "passed", execution: { attempts: 1 } },
      { status: "failed", execution: { attempts: 1 } },
    ],
  })

  // A retry that succeeded: the abort is in the record, but the draw passed.
  const c = join(root, "run-c/cases/demo--01")
  maybeWrite(c, "transcript.r1.md", transcript("provider.transport"))
  maybeWrite(c, "draws/r1.json", {
    status: "passed",
    execution: { attempts: 2, error: { type: "provider.transport" } },
  })

  // A clean transcript is counted but is not an abort row.
  const d = join(root, "run-d/cases/demo--01")
  maybeWrite(d, "transcript.r1.md", `${JSON.stringify({ type: "text", part: { text: "done" } })}\n`)

  // A transcript without any result.json is still reported, as missing.
  const e = join(root, "run-e/cases/demo--01")
  maybeWrite(e, "transcript.r1.md", transcript("provider.go-limit"))

  return root
}

test("the audit separates recorded, unrecorded and retried aborts", () => {
  const root = store()
  const result = auditStore(root)

  assert.equal(result.transcripts, 5)
  assert.equal(result.aborts, 4)
  assert.equal(result.unrecorded, 2, "run-b and run-e never recorded the error")
  assert.equal(result.retried, 1, "run-c retried once")

  const byRun = Object.fromEntries(result.rows.map((r) => [r.run, r]))
  assert.deepEqual(
    Object.keys(byRun).sort(),
    ["run-a", "run-b", "run-c", "run-e"],
  )

  assert.equal(byRun["run-a"].recorded, "provider.go-limit")
  assert.equal(byRun["run-a"].source, "draw")
  assert.equal(byRun["run-a"].retried, false)

  assert.equal(byRun["run-b"].recorded, null)
  assert.equal(byRun["run-b"].source, "result")
  assert.equal(byRun["run-b"].resultStatus, "failed")

  assert.equal(byRun["run-c"].recorded, "provider.transport")
  assert.equal(byRun["run-c"].retried, true)
  assert.equal(byRun["run-c"].resultStatus, "passed")

  assert.equal(byRun["run-e"].source, "missing")
  assert.equal(byRun["run-e"].recorded, null)
})

test("the report is one deterministic line per abort", () => {
  const result = auditStore(store())
  const line = formatAudit(result.rows.find((r) => r.run === "run-b"))
  assert.match(line, /^run-b\/demo--01 r2 provider\.rate-limit /)
  assert.match(line, /recorded=no infrastructure=no retried=no status=failed \(result\)$/)
  assert.equal(formatAudit(result.rows.find((r) => r.run === "run-c")), formatAudit(result.rows.find((r) => r.run === "run-c")))
})
