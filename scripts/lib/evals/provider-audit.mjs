// provider-audit.mjs — find stored draws that aborted on a provider error.
//
// TASK-52 classifies a provider abort in a new draw, but the old artefacts have
// no `execution.error`: a transcript can carry `provider.go-limit` while its
// result.json says `failed — exit 1`, and `check-eval-run` then calls the run
// clean because nothing recorded the abort. This module reads the transcript and
// says, per draw, whether the result recorded the error, whether the runner
// classified it as infrastructure, and whether it retried.
//
// Read-only and deterministic: no model, no write into the store. It answers the
// audit question; it does not change a stored result or a published number.

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { basename, dirname, join, relative, sep } from "node:path"
import { providerError } from "./events.mjs"

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"))
  } catch {
    return null
  }
}

function walk(dir) {
  const out = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(path))
    else out.push(path)
  }
  return out
}

// The transcript is a markdown file with the JSONL stream inside; the parser
// only needs the event lines, the same shape `providerError` reads.
function streamOf(file) {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .join("\n")
}

// A per-draw result is `draws/rN.json` when the run was written after TASK-38;
// an older run only has the aggregate `result.json`, whose `repetitions[N-1]` is
// the same record. Either way the answer is one record.
function resultFor(caseDir, rep) {
  const draw = join(caseDir, "draws", `r${rep}.json`)
  if (existsSync(draw)) return { record: readJson(draw), source: "draw" }
  const aggregate = join(caseDir, "result.json")
  if (!existsSync(aggregate)) return { record: null, source: "missing" }
  const parsed = readJson(aggregate)
  if (!parsed) return { record: null, source: "unreadable" }
  return { record: parsed.repetitions?.[rep - 1] ?? parsed, source: "result" }
}

export function auditTranscript(root, file) {
  const m = basename(file).match(/^transcript(?:\.r(\d+))?\.md$/)
  if (!m) return null
  const rep = m[1] ? Number(m[1]) : 1
  const error = providerError(streamOf(file))
  if (!error) return null

  const caseDir = dirname(file)
  const { record, source } = resultFor(caseDir, rep)
  const execution = record?.execution ?? {}
  const recorded = execution.error ?? null
  const infrastructure = record?.infrastructure === true || record?.status === "unscored"
  return {
    run: relative(root, file).split(sep)[0],
    case: basename(caseDir),
    rep,
    file: relative(root, file),
    type: error.type,
    message: error.message,
    httpStatus: error.status,
    // The three facts the audit needs: was the abort recorded, was it excluded
    // from behaviour, and did a retry succeed after it?
    recorded: recorded?.type ?? null,
    infrastructure,
    retried: (execution.attempts ?? 1) > 1,
    resultStatus: record?.status ?? null,
    source,
  }
}

export function auditStore(root) {
  const files = walk(root)
    .filter((file) => /^transcript(?:\.r\d+)?\.md$/.test(basename(file)))
    .sort()
  const rows = []
  for (const file of files) {
    const row = auditTranscript(root, file)
    if (row) rows.push(row)
  }
  return {
    transcripts: files.length,
    aborts: rows.length,
    unrecorded: rows.filter((r) => !r.recorded).length,
    retried: rows.filter((r) => r.retried).length,
    rows,
  }
}

export function formatAudit(row) {
  return (
    `${row.run}/${row.case} r${row.rep} ${row.type} ` +
    `recorded=${row.recorded ?? "no"} infrastructure=${row.infrastructure ? "yes" : "no"} ` +
    `retried=${row.retried ? "yes" : "no"} status=${row.resultStatus ?? "missing"} (${row.source})`
  )
}

export function summarizeAudit(result) {
  return (
    `transcripts=${result.transcripts} aborts=${result.aborts} ` +
    `unrecorded=${result.unrecorded} retried=${result.retried}`
  )
}
