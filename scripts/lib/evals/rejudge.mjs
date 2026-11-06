// rejudge.mjs — re-run the semantic judge over stored draws, no agent draw.
//
// A stored `result.json` already contains the deterministic evidence (the
// assertions and the gate) and `transcript.r<i>.md` contains the JSONL stream the
// judge needs to see. Re-judging rebuilds the same prompt `execute.mjs` builds
// and calls the judge again; it never writes into the run directory, so a
// measurement can be repeated without turning the stored result into a moving
// target.
//
// The rule is the same as a live run: the judge can fail a deterministic pass,
// never rescue a deterministic failure. A draw that did not pass deterministically
// is reported as `skipped` and is never sent to the model.

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { runAgent } from "./agent.mjs"
import { classify } from "./result.mjs"
import { evidenceLedger, replyText } from "./events.mjs"
import { evidenceCorpus, judgeOutcome, judgePrompt, runJudge } from "./judge.mjs"
import { parseTranscript } from "./transcript.mjs"

function readResult(dir) {
  const file = join(dir, "result.json")
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, "utf8"))
  } catch {
    return null
  }
}

// The stored `status` may already have been changed by the judge. Recompute the
// deterministic verdict from the pieces the runner recorded, so a stored judge
// failure does not hide a draw that is eligible for re-judging, and a stored
// judge pass cannot rescue a deterministic failure.
function deterministic(rep) {
  if (rep?.infrastructure) return { ok: false, reason: "infrastructure" }
  if (rep?.contaminated) return { ok: false, reason: "contaminated" }
  const verdict = classify({
    exit: rep?.execution?.exit ?? 0,
    asserts: rep?.assertions ?? [],
    skillGate: rep?.skillGate ?? null,
  })
  return { ok: verdict.status === "passed", reason: verdict.status === "passed" ? "" : verdict.reason }
}

function drawsOf(result) {
  if (Array.isArray(result?.repetitions)) return result.repetitions
  return [{ ...result, rep: result?.rep ?? 1 }]
}

function transcriptFor(dir, rep) {
  const candidates = [`transcript.r${rep}.md`, "transcript.md"]
  for (const name of candidates) {
    const file = join(dir, name)
    if (existsSync(file)) return readFileSync(file, "utf8")
  }
  return null
}

function tallyOf(draws) {
  const count = (outcome) => draws.filter((d) => d.outcome === outcome).length
  // `skipped` covers two different things: a deterministic failure, which is a
  // finding about the run, and a draw replay cannot rebuild (no transcript). A
  // reader who sees only `0/0 judged` cannot tell which. Count them apart.
  const deterministicFailed = draws.filter((d) => d.outcome === "skipped" && /^deterministic\b/.test(d.reason)).length
  return {
    total: draws.length,
    judged: draws.filter((d) => d.outcome !== "skipped").length,
    passed: count("passed"),
    failed: count("failed"),
    skipped: count("skipped"),
    deterministicFailed,
  }
}

// What the artifact measured. The three hashes were introduced by SPEC-0020, so
// a stored run from before it has none of them; the report must say so instead
// of handing back a plausible-looking blank. Values are read from the draws
// first (they are per-attempt) and fall back to the case-level result.
const PROVENANCE = ["repoSha", "skillHash", "fixtureHash", "promptHash", "detectorVersion"]

function provenanceOf(result, reps) {
  const first = (read) => {
    for (const rep of reps) {
      const value = read(rep)
      if (value !== undefined && value !== null && value !== "") return value
    }
    const value = read(result)
    return value === undefined || value === "" ? null : (value ?? null)
  }
  const storedRepo = (r) => r?.repoSha ?? r?.meta?.repoSha
  const values = {
    repoSha: first(storedRepo),
    skillHash: first((r) => r?.skillHash),
    fixtureHash: first((r) => r?.fixtureHash),
    promptHash: first((r) => r?.promptHash),
    detectorVersion: first((r) => r?.detectorVersion),
  }
  const missing = PROVENANCE.filter((key) => values[key] === null)
  return { ...values, provenance: missing.length ? "partial" : "complete", missing }
}

// A judge reply that cannot be parsed is reported with its raw text: the stop
// condition in the spec is "report the raw reply", not "invent a verdict".
export async function rejudge({
  dir,
  c,
  model,
  threshold = 0.8,
  env = process.env,
  timeout = 300,
  spawnAgent = runAgent,
  runJudge: judgeRunner = runJudge,
}) {
  const result = readResult(dir)
  if (!result) throw new Error(`no readable result.json in ${dir}`)
  const reps = drawsOf(result)
  const draws = []

  for (const rep of reps) {
    const repNumber = Number(rep?.rep ?? draws.length + 1)
    const eligible = deterministic(rep)
    if (!eligible.ok) {
      draws.push({
        rep: repNumber,
        verdicts: [],
        score: 0,
        outcome: "skipped",
        reason: `deterministic: ${eligible.reason || "not passed"}`,
      })
      continue
    }

    const md = transcriptFor(dir, repNumber)
    if (md === null) {
      draws.push({ rep: repNumber, verdicts: [], score: 0, outcome: "skipped", reason: "no transcript" })
      continue
    }
    const parsedTranscript = parseTranscript(md)
    if (!parsedTranscript) {
      draws.push({ rep: repNumber, verdicts: [], score: 0, outcome: "skipped", reason: "unparseable transcript" })
      continue
    }

    const reply = replyText(parsedTranscript.text)
    const ledger = evidenceLedger(parsedTranscript.text)
    const run = await judgeRunner({
      model,
      prompt: judgePrompt(c, { reply, ledger }),
      source: evidenceCorpus(reply, ledger),
      env,
      timeout,
      spawnAgent,
    })
    const outcome = judgeOutcome(run.parsed, threshold)
    draws.push({
      rep: repNumber,
      verdicts: run.parsed?.verdicts ?? [],
      score: outcome.score,
      outcome: outcome.ok ? "passed" : "failed",
      reason: outcome.reason,
      raw: run.parsed ? undefined : run.reply,
    })
  }

  return {
    skill: result.skill,
    case: result.case,
    model,
    threshold,
    ...provenanceOf(result, reps),
    draws,
    tally: tallyOf(draws),
  }
}
