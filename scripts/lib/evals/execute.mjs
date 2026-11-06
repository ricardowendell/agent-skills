// execute.mjs — run one case and decide whether it passed.
//
// This is the whole contract: given a case and an arm, stage it, run the agent,
// evaluate the assertions, apply the judge if asked, and return a result. The
// CLI adds transcripts and lanes; the Promptfoo provider adds metadata. Neither
// re-implements staging, the gate or the classification — when they did, the two
// front ends could disagree about what passed, which defeats the point of
// measuring.

import { evaluateAssertions, skillGate } from "./assertions.mjs"
import { replyText, skillLoads, toolCalls, usageStats } from "./events.mjs"
import { stageFixture, stageSkill, denySkillTool, snapshotTree, textHash } from "./fixture.mjs"
import { agentArgs, runAgent } from "./agent.mjs"
import { classify } from "./result.mjs"
import { judgePrompt, runJudge, judgeOutcome } from "./judge.mjs"
import { DETECTOR_VERSION } from "./leak.mjs"

// The exact exits the harness produces, not the model. A retry is capped at one
// (SPEC-0020: "an infrastructure retry doubles the cost; cap it at one") and the
// count is recorded so a cell that retried often is visible.
const INFRASTRUCTURE_EXITS = new Set(["timeout", "stalled"])

// The gate answers "was the skill under review the artefact that ran?" — a
// trigger case opts out, the control arm answers the inverse question.
function gateFor({ c, out, scratch, skillId, arm }) {
  if (c.gate === "off") return { ok: true, reason: "case does not gate on the skill (trigger/routing case)" }
  if (arm === "without-skill") {
    const loads = skillLoads(out)
    return {
      ok: loads.length === 0,
      reason: loads.length ? `loaded ${loads.map((l) => l.id).join(", ")} although --no-skill` : "no skill loaded (control arm)",
    }
  }
  return skillGate(out, scratch, skillId)
}

export async function executeCase({
  skill,
  c,
  scratch,
  arm = "with-skill",
  model,
  agent = "build",
  standalone = true,
  timeoutMs = 600000,
  stallMs = 120000,
  env = process.env,
  judge = null,
  maxInfraRetries = 1,
  // Injected so the contract can be tested without spawning a model. Same
  // seam `judge.mjs` uses; the default keeps every caller unchanged.
  spawnAgent = runAgent,
}) {
  let pinned = { hash: null }
  const fixture = stageFixture(skill, c, scratch)
  if (arm === "without-skill") denySkillTool(scratch)
  else pinned = stageSkill(skill, scratch)
  const snapshot = snapshotTree(scratch)
  const provenance = {
    fixtureHash: fixture.hash,
    promptHash: textHash(c.prompt),
    detectorVersion: DETECTOR_VERSION,
  }

  const started = Date.now()
  const args = agentArgs({ prompt: c.prompt, model, agent, standalone })
  const spawnOnce = () => spawnAgent({ args, cwd: scratch, env, timeoutMs, stallMs })
  let attempt = await spawnOnce()
  let infraRetries = 0
  // Hard ceiling: the spec allows one retry, not a caller-supplied budget.
  const retryCap = Math.min(1, Math.max(0, maxInfraRetries))
  while (INFRASTRUCTURE_EXITS.has(attempt.code) && infraRetries < retryCap) {
    infraRetries++
    attempt = await spawnOnce()
  }
  const { out, err, code } = attempt
  const durationMs = Date.now() - started

  const asserts = evaluateAssertions(c, scratch, out, replyText(out), snapshot)
  const gate = gateFor({ c, out, scratch, skillId: skill.id, arm })
  const verdict = classify({ exit: code, asserts, skillGate: gate })
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
    skillGate: { ok: gate.ok, reason: gate.reason, loaded: skillLoads(out).map((l) => l.id) },
    assertions: asserts.map(({ kind, arg, pass, detail }) => ({ kind, arg, pass, detail })),
    execution: {
      exit: code,
      durationMs,
      retries: infraRetries,
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
    const reply = replyText(out)
    const shell = toolCalls(out)
      .filter((t) => t.tool === "shell")
      .map((t) => `${String(t.input.command ?? "").split("\n")[0]}  [exit ${t.exit ?? "?"}]`)
    const threshold = judge.threshold ?? 0.8
    const run = await runJudge({ model: judge.model, prompt: judgePrompt(c, { reply, shell }), source: [reply, ...shell].join("\n"), env, timeout: Math.min(Math.round(timeoutMs / 1000), 300) })
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

  return { result, out, err, code, pinned, gate, asserts, verdict, usage, judged, durationMs }
}
