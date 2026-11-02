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
import { stageFixture, stageSkill, denySkillTool, snapshotTree } from "./fixture.mjs"
import { agentArgs, runAgent } from "./agent.mjs"
import { classify } from "./result.mjs"
import { judgePrompt, runJudge, judgeOutcome } from "./judge.mjs"

export const ARMS = ["with-skill", "without-skill"]

// The gate answers "was the skill under review the artefact that ran?" — a
// trigger case opts out, the control arm answers the inverse question.
export function gateFor({ c, out, scratch, skillId, arm }) {
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
  env = process.env,
  judge = null,
}) {
  let pinned = { hash: null }
  stageFixture(skill, c, scratch)
  if (arm === "without-skill") denySkillTool(scratch)
  else pinned = stageSkill(skill, scratch)
  const snapshot = snapshotTree(scratch)

  const started = Date.now()
  const args = agentArgs({ prompt: c.prompt, model, agent, standalone })
  const { out, err, code } = await runAgent({ args, cwd: scratch, env, timeoutMs })
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
    skillHash: pinned.hash,
    skillGate: { ok: gate.ok, reason: gate.reason, loaded: skillLoads(out).map((l) => l.id) },
    assertions: asserts.map(({ kind, arg, pass, detail }) => ({ kind, arg, pass, detail })),
    execution: { exit: code, durationMs, tokens: usage.tokens, cost: usage.cost, steps: usage.steps, toolCalls: toolCalls(out).length },
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
