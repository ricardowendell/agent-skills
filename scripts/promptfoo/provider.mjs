// provider.mjs — Promptfoo adapter over the repo's own eval library.
//
// Promptfoo owns the matrix, the repetition and the report; this file owns
// nothing. It hands the case to `executeCase` — the same staging, the same
// pinned skill, the same assertions, the same classification the CLI uses — and
// maps the result to the metadata the single Promptfoo-side assertion reads.
// Keeping this thin is the point: a second copy of the rules is how two front
// ends start disagreeing about what passed.
//
// Config (from promptfoo.yaml): { model, arm, timeoutMs, judge }

import { existsSync, readFileSync } from "node:fs"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parseCases } from "../lib/evals/parse.mjs"
import { replyText } from "../lib/evals/events.mjs"
import { makeScratch } from "../lib/evals/fixture.mjs"
import { scrubEnv } from "../lib/evals/agent.mjs"
import { isolateHome } from "../lib/evals/isolation.mjs"
import { executeCase } from "../lib/evals/execute.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
// Same isolation as the CLI: the front ends must measure the same environment.
const ISOLATION = isolateHome(scrubEnv())
const CHILD_ENV = ISOLATION.env
process.once("exit", ISOLATION.cleanup)

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
    const { skill, c } = findCase(vars.skill, vars.case)

    const { result, out, err, code } = await executeCase({
      skill,
      c,
      scratch: makeScratch(skill.id, c.n),
      arm,
      model,
      timeoutMs: this.config.timeoutMs ?? 600000,
      env: CHILD_ENV,
      judge: this.config.judge
        ? { model: this.config.judge.model ?? "default", threshold: this.config.judge.threshold ?? 0.8 }
        : null,
    })

    const reply = replyText(out)
    return {
      output: reply || `(no reply; exit ${code}${err ? `; stderr: ${err.slice(0, 200)}` : ""})`,
      cost: result.execution.cost,
      tokenUsage: {
        total: result.execution.tokens.input + result.execution.tokens.output + result.execution.tokens.reasoning,
        prompt: result.execution.tokens.input,
        completion: result.execution.tokens.output + result.execution.tokens.reasoning,
      },
      metadata: {
        status: result.status,
        reason: result.reason,
        skill: skill.id,
        case: c.n,
        arm,
        model: model ?? "default",
        skillHash: result.skillHash,
        skillGate: result.skillGate,
        assertions: result.assertions,
        semantic: result.semantic ?? null,
        exit: code,
        durationMs: result.execution.durationMs,
        toolCalls: result.execution.toolCalls,
        tokens: result.execution.tokens,
      },
    }
  }
}
