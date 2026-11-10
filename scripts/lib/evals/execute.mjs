// execute.mjs — run one case and decide whether it passed.
//
// This is the whole contract: given a case and an arm, stage it, run the agent,
// evaluate the assertions, apply the judge if asked, and return a result. The
// CLI adds transcripts and lanes; the Promptfoo provider adds metadata. Neither
// re-implements staging, the gate or the classification — when they did, the two
// front ends could disagree about what passed, which defeats the point of
// measuring.

import { evaluateAssertions, oracleFindings, skillGate } from "./assertions.mjs"
import { evidenceLedger, providerError, replyText, skillLoads, toolCalls, usageStats } from "./events.mjs"
import {
  denySkillTool,
  governedFiles,
  makeScratch,
  skillFileHashes,
  snapshotTree,
  stageFixture,
  stageSkill,
  textHash,
} from "./fixture.mjs"
import { agentArgs, runAgent } from "./agent.mjs"
import { classify } from "./result.mjs"
import { evidenceCorpus, judgePrompt, runJudge, judgeOutcome } from "./judge.mjs"
import { DETECTOR_VERSION } from "./leak.mjs"

// The exact exits the harness produces, not the model. A retry is capped at one
// (SPEC-0020: "an infrastructure retry doubles the cost; cap it at one") and the
// count is recorded so a cell that retried often is visible.
const INFRASTRUCTURE_EXITS = new Set(["timeout", "stalled"])

// The gate answers "was the skill under review the artefact that ran?" — a
// trigger case opts out, the control arm answers the inverse question. For a
// behavioural case the `skillGate` itself accepts a direct read of the staged
// SKILL.md (origin `read`); a trigger case never reaches it.
function gateFor({ c, out, scratch, skillId, arm }) {
  if (c.gate === "off") {
    return { ok: true, reason: "case does not gate on the skill (trigger/routing case)", loads: skillLoads(out), source: null }
  }
  if (arm === "without-skill") {
    const loads = skillLoads(out)
    return {
      ok: loads.length === 0,
      reason: loads.length ? `loaded ${loads.map((l) => l.id).join(", ")} although --no-skill` : "no skill loaded (control arm)",
      loads,
      source: null,
    }
  }
  return skillGate(out, scratch, skillId)
}

export async function executeCase({
  skill,
  c,
  scratch,
  arm = "with-skill",
  // Sibling skills the case declares with `stage: <id>`. They are staged the
  // same way as the arm's skill so a cross-skill routing case has both on the
  // menu; the control arm ignores them (nothing is staged there).
  siblings = [],
  model,
  agent = "build",
  standalone = true,
  timeoutMs = 600000,
  stallMs = 120000,
  env = process.env,
  judge = null,
  maxInfraRetries = 1,
  // The result of `wrapCommand` over the bare child command. Its `args` end
  // with that command (`sandbox-exec -p <profile> opencode`), so the agent args
  // are appended after it: one wrapper covers the first attempt and the retry,
  // and a retry can never downgrade to the unenforced launch.
  wrapper = null,
  // Injected so the contract can be tested without spawning a model. Same
  // seam `judge.mjs` uses; the default keeps every caller unchanged.
  spawnAgent = runAgent,
}) {
  // Staging is part of an attempt, not of the case: a retry must not inherit a
  // fixture the dead draw may have written into. The first attempt uses the
  // caller's scratch; a retry gets a fresh one and is re-staged there, so
  // `unchanged`/`changed` and the provenance describe the attempt that counted.
  const stageAttempt = (target) => {
    let attemptPinned = { hash: null }
    let stagedSkills = []
    const attemptFixture = stageFixture(skill, c, target)
    // SPEC-0057: a snapshot assertion no part of the fixture can satisfy is an
    // authoring error, not a red cell worth paying for. Existence assertions are
    // warnings instead: the draw is allowed to create the file. This runs before
    // the agent starts.
    const dead = oracleFindings(c, target).filter((f) => f.level === "error")
    if (dead.length) {
      const detail = dead.map((d) => `${d.kind} ${d.arg} (${d.reason})`).join("; ")
      throw new Error(`case ${c.n}: assertion target not produced by the fixture: ${detail}`)
    }
    if (arm === "without-skill") denySkillTool(target)
    else {
      attemptPinned = stageSkill(skill, target)
      // A declared sibling is a menu entry, not a dependency: stage it exactly
      // as the arm's skill and hash the copy the agent could see. The control
      // arm never reaches here, so a declaration cannot leak into it.
      stagedSkills = siblings.map((sibling) => {
        const { id, hash } = stageSkill(sibling, target)
        return { id, hash }
      })
    }
    // SPEC-0057: hash the governed files as the attempt is staged, not after the
    // draw. A skill edited mid-draw would otherwise record post-draw hashes and
    // could hide the staleness the next check should find.
    const governs = governedFiles(skill.dir, c.governs)
    const skillHashes = skillFileHashes(skill.dir, governs)
    return {
      pinned: attemptPinned,
      stagedSkills,
      fixture: attemptFixture,
      snapshot: snapshotTree(target),
      governs,
      skillHashes,
    }
  }

  let scratchUsed = scratch
  let staged = stageAttempt(scratchUsed)
  const args = agentArgs({ prompt: c.prompt, model, agent, standalone })
  const spawnOnce = async () => {
    const started = Date.now()
    const launch = wrapper
      ? { command: wrapper.command, args: [...wrapper.args, ...args] }
      : { args }
    const result = await spawnAgent({ ...launch, cwd: scratchUsed, env, timeoutMs, stallMs })
    return { ...result, durationMs: Date.now() - started }
  }

  let attempt = await spawnOnce()
  let infraRetries = 0
  // Hard ceiling: the spec allows one retry, not a caller-supplied budget.
  const retryCap = Math.min(1, Math.max(0, maxInfraRetries))
  while (INFRASTRUCTURE_EXITS.has(attempt.code) && infraRetries < retryCap) {
    // A failed restage leaves the original infra verdict intact rather than
    // turning a harness event into a behavioural failure.
    let nextScratch
    let nextStage
    try {
      nextScratch = makeScratch(skill.id, c.n)
      nextStage = stageAttempt(nextScratch)
    } catch {
      break
    }
    scratchUsed = nextScratch
    staged = nextStage
    infraRetries++
    attempt = await spawnOnce()
  }
  // The final attempt owns the duration; a retry must not hide the slow draw it
  // replaced behind a sum of both.
  const { out, err, code, durationMs } = attempt
  // The final attempt owns the governed hashes too: a retry re-stages and
  // re-hashes, so provenance describes the attempt that counted.
  const { pinned, stagedSkills, fixture, snapshot, governs, skillHashes } = staged
  const provenance = {
    fixtureHash: fixture.hash,
    promptHash: textHash(c.prompt),
    detectorVersion: DETECTOR_VERSION,
  }

  const asserts = evaluateAssertions(c, scratchUsed, out, replyText(out), snapshot)
  const gate = gateFor({ c, out, scratch: scratchUsed, skillId: skill.id, arm })
  const abort = providerError(out)
  const verdict = classify({ exit: code, asserts, skillGate: gate, providerError: abort })
  const usage = usageStats(out)

  let result = {
    skill: skill.id,
    case: c.n,
    status: verdict.status,
    reason: verdict.reason,
    title: c.title,
    prompt: c.prompt,
    ...provenance,
    infrastructure: Boolean(verdict.infrastructure),
    infrastructureReason: verdict.infrastructureReason ?? null,
    skillHash: pinned.hash,
    // `skillHash` keeps the tree hash so every stored manifest and citation stays
    // valid; `skillHashes` is the per-file evidence staleness compares against.
    skillHashes,
    governs,
    // The arm's skill hash stays `skillHash`; the declared stages are reported
    // apart so `skillGate` keeps answering only "did the arm's skill load".
    stagedSkills,
    // `source` says how the load was proven — the `skill` tool or a direct read
    // of the staged SKILL.md — so a later reader can tell the two apart.
    skillGate: {
      ok: gate.ok,
      reason: gate.reason,
      source: gate.source ?? null,
      loaded: (gate.loads ?? skillLoads(out)).map((l) => l.id),
    },
    assertions: asserts.map(({ kind, arg, pass, detail }) => ({ kind, arg, pass, detail })),
    execution: {
      exit: code,
      durationMs,
      attempts: infraRetries + 1,
      retries: infraRetries,
      // The provider error, when the stream carried one; `null` for a clean exit.
      // It is recorded even if the draw recovered, so an audit can see it.
      error: abort,
      tokens: usage.tokens,
      cost: usage.cost,
      steps: usage.steps,
      toolCalls: toolCalls(out).length,
    },
    arm,
  }

  let judged = null
  // Same rule in every front end: the judge can fail a case that passed, never
  // rescue one that did not.
  if (judge && result.status === "passed") {
    // One corpus, built once, and the prompt is rendered from exactly it: the
    // ledger and the reply. There is no second, unbudgeted rendering of the
    // stream that the judge could quote from and the matcher never see.
    const reply = replyText(out)
    const ledger = evidenceLedger(out)
    const corpus = evidenceCorpus(reply, ledger)
    const threshold = judge.threshold ?? 0.8
    const run = await runJudge({ model: judge.model, prompt: judgePrompt(c, { reply, ledger }), source: corpus, env, timeout: Math.min(Math.round(timeoutMs / 1000), 300), spawnAgent })
    const outcome = judgeOutcome(run.parsed, threshold)
    judged = { outcome, parsed: run.parsed, threshold, model: judge.model }
    result = {
      ...result,
      status: outcome.ok ? result.status : "failed",
      reason: outcome.ok ? result.reason : outcome.reason,
      semantic: {
        model: judge.model,
        selfJudged: Boolean(judge.selfJudged),
        threshold,
        score: outcome.score,
        expectations: run.parsed?.verdicts ?? [],
        reason: outcome.reason,
      },
    }
  }

  return { result, out, err, code, pinned, stagedSkills, gate, asserts, verdict, usage, judged, durationMs, scratch: scratchUsed }
}
