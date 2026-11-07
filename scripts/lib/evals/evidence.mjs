// evidence.mjs — a published claim must name evidence that exists and says what
// the claim says.
//
// The corpus cites run directories in `docs/evals/*.md`. Three failures cost
// review rounds: a directory that is not there, an unfinished run cited as
// finished, and a v1 run called `isolated=yes`. The rules are mechanical, so
// they live here and the CLI only reads the store.
//
// The module is pure: the caller resolves each token to a run record
// (`{ exists, status, detectorVersion, findings }`) and supplies the current
// detector version. `checkRun` stays in `runcheck.mjs`; this module only judges
// the citation against the record it is given.
//
// Markers are words on the citing line, not a section heading: a line that puts
// an unfinished run under a heading called "Unreadable" still has to say
// `unreadable` on the line, or the next reader copies the citation without the
// heading. Warnings use a wider set because "dirty" has several shapes.

export const COMPLETE_MARKERS = ["unfinished", "running", "discard", "history", "unreadable"]
export const DIRTY_MARKERS = ["dirty", "leak", "host", "stall", "contaminated", "discard", "history", "failure"]

// A run id is `2026-11-06T19-06-50--capture-idea`. The `[a-z0-9]` endpoints keep
// an abbreviated `…22-18-10--matrix--…` from being read as a directory; a
// trailing hyphen is prose, not an id.
export const RUN_TOKEN = /20\d\d-\d\d-\d\dT\d\d-\d\d-\d\d--[a-z0-9]+(?:-[a-z0-9]+)*/g

const markerRe = (markers) => new RegExp(`\\b(?:${markers.join("|")})\\b`, "i")

export function hasMarker(line, markers) {
  return markerRe(markers).test(String(line ?? ""))
}

function abbreviated(text, end) {
  // `--matrix--…` and `--matrix-…` are the corpus's shorthand for a range.
  return /^-*…/.test(String(text ?? "").slice(end))
}

export function scanCitations(text) {
  const out = []
  String(text ?? "")
    .split(/\r?\n/)
    .forEach((line, i) => {
      const tokens = []
      for (const m of line.matchAll(RUN_TOKEN)) {
        if (abbreviated(line, m.index + m[0].length)) continue
        tokens.push({ token: m[0], index: m.index })
      }
      if (tokens.length) out.push({ line: i + 1, text: line, tokens })
    })
  return out
}

// The run a claim is about: the nearest citation before the claim in the same
// line, else the nearest one after it. A long table row may name a historical
// run and a current one; picking the nearest token keeps the claim attached to
// the run it is describing.
function subjectToken(tokens, claimIndex) {
  const before = tokens.filter((t) => t.index < claimIndex)
  if (before.length) return before[before.length - 1]
  const after = tokens.filter((t) => t.index > claimIndex)
  return after.length ? after[0] : null
}

function isolatedClaimIndex(line) {
  const m = String(line ?? "").match(/\bisolated\s*=\s*yes\b/i)
  return m ? m.index : -1
}

// One citation → zero or more findings. `run` is the record the CLI read; a
// null `run` means the resolver did not know the token, which is the same as a
// missing directory.
export function checkCitation({ line, token, run, currentDetector, tokens = [] }) {
  const findings = []
  const add = (level, rule, message) => findings.push({ level, rule, token, message })

  if (!run || run.exists !== true) {
    add("error", "missing-run", `run directory ${token} does not exist`)
    return findings
  }

  if (run.status !== "completed" && !hasMarker(line, COMPLETE_MARKERS)) {
    add(
      "error",
      "unfinished-run",
      `run ${token} is ${run.status ?? "unfinished"}, cited as complete (add a marker: ${COMPLETE_MARKERS.join(", ")})`,
    )
  }

  const claim = isolatedClaimIndex(line)
  if (claim >= 0) {
    const subject = subjectToken(tokens, claim)
    if (subject?.token === token && run.detectorVersion !== currentDetector) {
      const recorded = run.detectorVersion ?? "none"
      add(
        "error",
        "stale-detector",
        `line claims isolated=yes for ${token}, recorded detector ${recorded} is not ${currentDetector ?? "current"}`,
      )
    }
  }

  if (run.status === "completed" && Number(run.findings) > 0 && !hasMarker(line, DIRTY_MARKERS)) {
    add(
      "warning",
      "dirty-run",
      `run ${token} has ${run.findings} finding(s), cited without a marker (${DIRTY_MARKERS.join(", ")})`,
    )
  }

  return findings
}

// `documents` is `[{ path, text }]`; `resolveRun(token)` returns the run record
// or null. Findings carry the document path and line so the CLI prints one line
// per citation.
export function checkDocuments({ documents = [], resolveRun, currentDetector = null } = {}) {
  const findings = []
  for (const doc of documents) {
    for (const citation of scanCitations(doc.text)) {
      for (const { token } of citation.tokens) {
        const run = typeof resolveRun === "function" ? resolveRun(token) : null
        const hits = checkCitation({
          line: citation.text,
          token,
          run,
          currentDetector,
          tokens: citation.tokens,
        })
        for (const hit of hits) findings.push({ ...hit, file: doc.path, line: citation.line })
      }
    }
  }
  return findings
}
