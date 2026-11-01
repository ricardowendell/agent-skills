// provider.mjs — Promptfoo adapter over the repo's own eval library.
//
// Promptfoo owns the matrix, the repetition and the report; this file owns
// nothing. It stages the same fixture, pins the same skill, runs the same
// `opencode run` and classifies with the same rules as the CLI runner, then
// hands Promptfoo a status it can count. The single assertion on the Promptfoo
// side reads metadata.status, so the two front ends cannot disagree about what
// passed.
//
// Config (from promptfoo.yaml): { model, arm: "with-skill" | "without-skill", timeoutMs, judge }

import { existsSync, readFileSync } from "node:fs"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parseCases } from "../lib/evals/parse.mjs"
import { evaluateAssertions, replyText, skillGate, skillLoads, toolCalls, usageStats } from "../lib/evals/assertions.mjs"
import { makeScratch, stageFixture, stageSkill, denySkillTool, snapshotTree } from "../lib/evals/fixture.mjs"
import { agentArgs, runAgent, scrubEnv } from "../lib/evals/agent.mjs"
import { classify } from "../lib/evals/result.mjs"
import { judgePrompt, runJudge, judgeOutcome } from "../lib/evals/judge.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const CHILD_ENV = scrubEnv()

function findCase(skill, n) {
  const dir = join(REPO, "skills", skill)
  if (!existsSync(dir)) throw new Error(`no skill '${skill}' in ${join(REPO, "skills")}`)
  const { cases } = parseCases(readFileSync(join(dir, "references/evals.md"), "utf8"))
  const c = cases.find((x) => x.n === Number(n))
  if (!c) throw new Error(`skill '${skill}' has no case ${n}`)
  return { skill: { id: skill, dir }, c }
}

export default class SkillEvalProvider {
  constructor(options = {}) {
    this.providerId = options.id ?? "skill-eval"
    this.config = options.config ?? {}
  }

  id() {
    return this.providerId
  }

  async callApi(_prompt, context) {
    const vars = context?.vars ?? {}
    const arm = this.config.arm ?? vars.arm ?? "with-skill"
    const model = this.config.model ?? vars.model
    const timeoutMs = this.config.timeoutMs ?? 600000
    const { skill, c } = findCase(vars.skill, vars.case)

    const scratch = makeScratch(skill.id, c.n)
    let pinned = { hash: null }
    stageFixture(skill, c, scratch)
    if (arm === "without-skill") denySkillTool(scratch)
    else pinned = stageSkill(skill, scratch)
    const snapshot = snapshotTree(scratch)

    const started = Date.now()
    const args = agentArgs({ prompt: c.prompt, model })
    const { out, err, code } = await runAgent({ args, cwd: scratch, env: CHILD_ENV, timeoutMs })
    const durationMs = Date.now() - started

    const asserts = evaluateAssertions(c, scratch, out, replyText(out), snapshot)
    const gate =
      c.gate === "off"
        ? { ok: true, reason: "case does not gate on the skill" }
        : arm === "without-skill"
          ? {
              ok: skillLoads(out).length === 0,
              reason: skillLoads(out).length ? `loaded ${skillLoads(out).map((l) => l.id).join(", ")} in the control arm` : "no skill loaded (control arm)",
            }
          : skillGate(out, scratch, skill.id)
    const verdict = classify({ exit: code, asserts, skillGate: gate })
    const usage = usageStats(out)

    // Same rule as the runner: one judge per execution, and it can only fail a
    // case that already passed deterministically.
    let status = verdict.status
    let reason = verdict.reason
    let semantic = null
    if (this.config.judge && status === "passed") {
      const threshold = this.config.judge.threshold ?? 0.8
      const reply = replyText(out)
      const shell = toolCalls(out)
        .filter((t) => t.tool === "shell")
        .map((t) => `${String(t.input.command ?? "").split("\n")[0]}  [exit ${t.exit ?? "?"}]`)
      const judged = await runJudge({
        model: this.config.judge.model,
        prompt: judgePrompt(c, { reply, shell }),
        source: [reply, ...shell].join("\n"),
        env: CHILD_ENV,
      })
      const outcome = judgeOutcome(judged.parsed, threshold)
      semantic = { score: outcome.score, threshold, reason: outcome.reason, verdicts: judged.parsed?.verdicts ?? [] }
      if (!outcome.ok) {
        status = "failed"
        reason = outcome.reason
      }
    }

    return {
      output: replyText(out) || `(no reply; exit ${code}${err ? `; stderr: ${err.slice(0, 200)}` : ""})`,
      cost: usage.cost,
      tokenUsage: {
        total: usage.tokens.input + usage.tokens.output + usage.tokens.reasoning,
        prompt: usage.tokens.input,
        completion: usage.tokens.output + usage.tokens.reasoning,
      },
      metadata: {
        status,
        reason,
        semantic,
        skill: skill.id,
        case: c.n,
        arm,
        model: model ?? "default",
        skillHash: pinned.hash,
        skillGate: gate,
        assertions: asserts,
        exit: code,
        durationMs,
        toolCalls: toolCalls(out).length,
        tokens: usage.tokens,
        transcriptScratch: scratch,
      },
    }
  }
}
