// judge.mjs — optional semantic check over a case's expectations.
//
// Deterministic assertions cannot read whether a review explained each
// acceptance criterion, or whether it invented a rationale. A judge model scores
// every `expect:` line against the agent's own reply and its shell log.
//
// Rules that keep it honest:
//   - opt-in: it costs a model call per case, so it never runs by default;
//   - advisory in one direction only: it can fail a case that passed
//     deterministically, never rescue a case that failed;
//   - it sees expectations, the reply and the command log — never `why`, which
//     describes the scenario and would hand over the answer;
//   - it runs in an empty scratch dir with the skill tool denied, so it cannot
//     wander into the fixture and grade the code instead of the behaviour.

import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { agentArgs, runAgent, scrubEnv } from "./agent.mjs"
import { replyText } from "./events.mjs"

const SYSTEM = `You grade one agent run against a case's expectations.

For each expectation decide, from the evidence only:
- "met": the reply or the command log shows it happened.
- "not-met": it clearly did not happen, or the opposite happened.
- "unverifiable": the evidence does not say either way. Use this freely; do not
  guess from what a good run would look like.

Evidence must be one contiguous passage copied verbatim from the reply or the
command log. Never join two quotes with an ellipsis.

A line marked [NEGATIVE] describes a failure mode to avoid, not a requirement.
Mark it "met" when the reply shows the agent did not fall into it, and "not-met"
when it did. Do not require the failure to appear.

Answer with one JSON object and nothing else:
{"expectations":[{"i":1,"verdict":"met|not-met|unverifiable","evidence":"short quote or command"}],"score":0.0}
score is met / (met + not-met), ignoring unverifiable.`

// "Watch for:" lines name the failure the case exists to catch; requiring them
// to appear would score every good run as broken.
const isNegative = (text) => /^(watch for|avoid)\b/i.test(text.trim())

export function judgePrompt(c, { reply, shell = [] }) {
  const expectations = c.expect
    .map((e, i) => `${i + 1}. ${isNegative(e) ? "[NEGATIVE] " : ""}${e}`)
    .join("\n")
  const commands = shell.length ? shell.map((cmd) => `$ ${cmd}`).join("\n") : "(no shell commands)"
  return [
    SYSTEM,
    "",
    "## Expectations",
    expectations,
    "",
    "## Command log",
    "```",
    commands,
    "```",
    "",
    "## Reply",
    "```",
    reply.trim() || "(empty reply)",
    "```",
  ].join("\n")
}

// Every top-level JSON object in the text, balanced and string-aware — a nested
// object would defeat a non-greedy regex.
function jsonObjects(text) {
  const found = []
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "{") continue
    let depth = 0
    let inString = false
    let escaped = false
    for (let j = i; j < text.length; j++) {
      const ch = text[j]
      if (inString) {
        if (escaped) escaped = false
        else if (ch === "\\") escaped = true
        else if (ch === '"') inString = false
        continue
      }
      if (ch === '"') inString = true
      else if (ch === "{") depth++
      else if (ch === "}") {
        depth--
        if (depth === 0) {
          found.push(text.slice(i, j + 1))
          i = j
          break
        }
      }
    }
  }
  return found
}

// The last object in the stream wins: some providers print a preamble.
export function parseJudge(text) {
  if (!text) return null
  const candidates = jsonObjects(text)
  for (const raw of candidates.reverse()) {
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      continue
    }
    const verdicts = parsed?.expectations
    if (!Array.isArray(verdicts) || !verdicts.length) continue
    const clean = verdicts
      .map((v) => ({ i: Number(v?.i), verdict: String(v?.verdict ?? "").toLowerCase(), evidence: String(v?.evidence ?? "") }))
      .filter((v) => ["met", "not-met", "unverifiable"].includes(v.verdict))
    if (!clean.length) continue
    const met = clean.filter((v) => v.verdict === "met").length
    const unmet = clean.filter((v) => v.verdict === "not-met").length
    const score = met + unmet === 0 ? 0 : met / (met + unmet)
    return { verdicts: clean, score: typeof parsed.score === "number" ? parsed.score : score, met, unmet }
  }
  return null
}

// A judge can invent the quote it calls evidence. Only `met` is checked: a
// not-met that cannot be pointed at keeps failing (closing the gap the other way
// would let a judge's mistake rescue a case), while an unfound quote becomes
// unverifiable, which removes it from the score instead of counting for it.
export function verifyEvidence(parsed, source) {
  if (!parsed) return parsed
  const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase()
  const hay = norm(source)
  // Judges often cite several passages joined by "..." anyway, so the check is
  // per segment and forgiving: one short unquoted aside must not sink a verdict
  // whose other half is right there. Most of the evidence has to be findable.
  const segments = (evidence) =>
    String(evidence ?? "")
      .split(/\.\.\.|…|\s\|\s|;\s/)
      .map(norm)
      .map((part) => part.replace(/^[a-z ]{0,12}:\s*/, "").replace(/^[`"']+/, "").replace(/[`"']+$/, ""))
      .filter((s) => s.length >= 8)
  const verdicts = parsed.verdicts.map((v) => {
    if (v.verdict !== "met") return v
    const parts = segments(v.evidence)
    const found = parts.filter((p) => hay.includes(p)).length
    if (parts.length && found / parts.length >= 0.5) return v
    return { ...v, verdict: "unverifiable", unverified: true }
  })
  const met = verdicts.filter((v) => v.verdict === "met").length
  const unmet = verdicts.filter((v) => v.verdict === "not-met").length
  const score = met + unmet === 0 ? 0 : met / (met + unmet)
  return { ...parsed, verdicts, met, unmet, score, unverified: verdicts.filter((v) => v.unverified).length }
}

export function judgeOutcome(parsed, threshold) {
  if (!parsed) return { ok: false, score: 0, reason: "judge returned no parsable verdict" }
  const unmet = parsed.verdicts.filter((v) => v.verdict === "not-met")
  if (unmet.length) {
    return {
      ok: false,
      score: parsed.score,
      reason: `judge: expectation(s) ${unmet.map((v) => v.i).join(", ")} not met`,
      unmet,
    }
  }
  // "Absence of evidence is a finding, not a pass": a required expectation the
  // judge could not verify leaves the case unproven, however many others passed.
  const unverified = parsed.verdicts.filter((v) => v.verdict === "unverifiable")
  if (unverified.length) {
    return {
      ok: false,
      score: parsed.score,
      reason: `judge: expectation(s) ${unverified.map((v) => v.i).join(", ")} could not be verified`,
      unmet: [],
      unverified,
    }
  }
  if (parsed.score + 1e-9 < threshold) {
    return { ok: false, score: parsed.score, reason: `judge score ${parsed.score.toFixed(2)} < ${threshold}`, unmet: [] }
  }
  return { ok: true, score: parsed.score, reason: "", unmet: [] }
}

// A judge run needs no repo and no skill: a bare scratch dir with the skill tool
// denied keeps it from reading the fixture and grading the wrong artefact. It
// goes through the same runner as the case it grades, so the isolation cannot
// drift between the two.
export async function runJudge({ model, prompt, source, timeout = 300, env = process.env, spawnAgent = runAgent }) {
  const scratch = mkdtempSync(join(tmpdir(), "eval-judge-"))
  mkdirSync(join(scratch, ".opencode"), { recursive: true })
  writeFileSync(join(scratch, ".opencode/opencode.json"), JSON.stringify({ tools: { skill: false } }))

  const { code, out } = await spawnAgent({
    args: agentArgs({ prompt, model: model && model !== "default" ? model : null, agent: "build" }),
    cwd: scratch,
    env: scrubEnv(env),
    timeoutMs: timeout * 1000,
  })
  const reply = replyText(out)
  return { code, reply, parsed: verifyEvidence(parseJudge(reply), source ?? reply) }
}
