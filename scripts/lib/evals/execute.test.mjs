import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { executeCase } from "./execute.mjs"
import { makeScratch } from "./fixture.mjs"
import { DETECTOR_VERSION } from "./leak.mjs"

// The run path is the contract every measurement goes through, and it used to
// call `runAgent` directly, which meant it could only be exercised by running a
// real agent — something a static CI never does. `judge.mjs` already takes an
// injected spawn; the same seam here makes the gate and the classification
// testable in milliseconds.

function skillDir(id = "demo") {
  const dir = mkdtempSync(join(tmpdir(), `exec-skill-${id}-`))
  writeFileSync(join(dir, "SKILL.md"), `---\nname: ${id}\ndescription: fixture\n---\n\n# Demo\n`)
  return { id, dir }
}

// One tool call, shaped the way `opencode run --format json` emits it.
function stream({ reply = "", loads = [] } = {}) {
  const lines = []
  for (const load of loads) {
    lines.push(
      JSON.stringify({
        type: "tool_use",
        part: {
          tool: "skill",
          state: { status: load.status ?? "completed", input: { id: load.id }, metadata: { metadata: { directory: load.directory } } },
        },
      }),
    )
  }
  if (reply) lines.push(JSON.stringify({ type: "text", part: { text: reply } }))
  return `${lines.join("\n")}\n`
}

function setup({ gate, asserts = [{ kind: "reply", arg: "done" }] } = {}) {
  const skill = skillDir()
  const scratch = makeScratch(skill.id, 1)
  const c = { n: 1, title: "fixture", prompt: "Do the thing.", assert: asserts, ...(gate ? { gate } : {}) }
  const inside = join(scratch, ".opencode/skills", skill.id)
  const cleanup = () => {
    rmSync(scratch, { recursive: true, force: true })
    rmSync(skill.dir, { recursive: true, force: true })
  }
  return { skill, scratch, c, inside, cleanup }
}

function agent({ out = "", err = "", code = 0 } = {}) {
  const calls = []
  const spawn = async (args) => {
    calls.push(args)
    return { out, err, code }
  }
  return { spawn, calls }
}

test("a run that loaded the pinned copy passes", async () => {
  const { skill, scratch, c, inside, cleanup } = setup()
  try {
    const { spawn, calls } = agent({ out: stream({ reply: "done", loads: [{ id: "demo", directory: inside }] }) })
    const { result, gate } = await executeCase({ skill, c, scratch, spawnAgent: spawn })

    assert.equal(result.status, "passed")
    assert.equal(gate.ok, true)
    assert.ok(result.skillHash, "the staged copy is hashed")
    assert.equal(result.execution.exit, 0)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].cwd, scratch, "the agent runs in the scratch dir")
    assert.deepEqual(calls[0].args.slice(-1), [c.prompt], "the prompt is the last argument")
  } finally {
    cleanup()
  }
})

test("a run that never loaded the skill fails on the gate, not on an assertion", async () => {
  const { skill, scratch, c, cleanup } = setup()
  try {
    const { spawn } = agent({ out: stream({ reply: "done" }) })
    const { result } = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(result.status, "failed")
    assert.match(result.reason, /was not loaded/)
    assert.equal(result.assertions.every((a) => a.pass), true, "the assertions themselves passed")
  } finally {
    cleanup()
  }
})

test("a copy loaded from outside the scratch dir is not the artefact under review", async () => {
  const { skill, scratch, c, cleanup } = setup()
  try {
    const { spawn } = agent({ out: stream({ reply: "done", loads: [{ id: "demo", directory: join(tmpdir(), "somewhere-else", "demo") }] }) })
    const { result, gate } = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(gate.ok, false)
    assert.match(gate.reason, /outside the scratch dir/)
    assert.equal(result.status, "failed")
  } finally {
    cleanup()
  }
})

test("the control arm fails when the skill loaded anyway", async () => {
  const { skill, scratch, c, inside, cleanup } = setup()
  try {
    const { spawn } = agent({ out: stream({ reply: "done", loads: [{ id: "demo", directory: inside }] }) })
    const { result } = await executeCase({ skill, c, scratch, arm: "without-skill", spawnAgent: spawn })
    assert.equal(result.status, "failed")
    assert.match(result.reason, /although --no-skill/)
  } finally {
    cleanup()
  }
})

test("the control arm passes its gate when nothing loaded", async () => {
  const { skill, scratch, c, cleanup } = setup()
  try {
    const { spawn } = agent({ out: stream({ reply: "done" }) })
    const { result } = await executeCase({ skill, c, scratch, arm: "without-skill", spawnAgent: spawn })
    assert.equal(result.status, "passed")
    assert.match(result.skillGate.reason, /control arm/)
  } finally {
    cleanup()
  }
})

test("a trigger case opts out of the gate", async () => {
  const { skill, scratch, c, cleanup } = setup({ gate: "off" })
  try {
    const { spawn } = agent({ out: stream({ reply: "done" }) })
    const { result, gate } = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(gate.ok, true)
    assert.match(gate.reason, /does not gate/)
    assert.equal(result.status, "passed")
  } finally {
    cleanup()
  }
})

test("a timeout is infrastructure: unscored and retried once by default", async () => {
  const { skill, scratch, c, cleanup } = setup()
  try {
    const { spawn, calls } = agent({ out: "", code: "timeout" })
    const { result } = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(result.status, "unscored")
    assert.equal(result.reason, "infrastructure: timeout")
    assert.equal(result.infrastructure, true)
    assert.equal(calls.length, 2, "one automatic retry")
    assert.equal(result.execution.retries, 1)
  } finally {
    cleanup()
  }
})

test("a stall is infrastructure and is named as a stall, not a timeout", async () => {
  const { skill, scratch, c, cleanup } = setup()
  try {
    const { spawn } = agent({ out: "", code: "stalled" })
    const { result } = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(result.status, "unscored")
    assert.equal(result.reason, "infrastructure: stalled")
    assert.equal(result.infrastructureReason, "stalled")
  } finally {
    cleanup()
  }
})

test("the infrastructure retry is capped at one", async () => {
  const { skill, scratch, c, cleanup } = setup()
  try {
    const { spawn, calls } = agent({ out: "", code: "timeout" })
    const { result } = await executeCase({ skill, c, scratch, spawnAgent: spawn, maxInfraRetries: 0 })
    assert.equal(result.status, "unscored")
    assert.equal(calls.length, 1, "no retry when the cap is zero")
    assert.equal(result.execution.retries, 0)
  } finally {
    cleanup()
  }
})

test("a retry that succeeds keeps the behavioural verdict and records the retry", async () => {
  const { skill, scratch, c, cleanup } = setup()
  let retryScratch = null
  try {
    let call = 0
    const spawn = async ({ cwd }) => {
      call++
      if (call === 1) return { out: "", err: "", code: "stalled" }
      retryScratch = cwd
      return { out: stream({ reply: "done", loads: [{ id: "demo", directory: join(cwd, ".opencode/skills/demo") }] }), err: "", code: 0 }
    }
    const { result, scratch: finalScratch } = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(result.status, "passed")
    assert.equal(result.infrastructure, false)
    assert.equal(result.execution.retries, 1)
    assert.equal(result.execution.attempts, 2)
    assert.equal(finalScratch, retryScratch)
  } finally {
    cleanup()
    if (retryScratch) rmSync(retryScratch, { recursive: true, force: true })
  }
})

test("a case with no assertions is unscored, never passed", async () => {
  const { skill, scratch, c, cleanup } = setup({ asserts: [] })
  try {
    const { spawn } = agent({ out: stream({ reply: "done" }) })
    const { result } = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(result.status, "unscored")
    assert.match(result.reason, /no assertions/)
  } finally {
    cleanup()
  }
})

test("a failing assertion is named in the reason", async () => {
  const { skill, scratch, c, inside, cleanup } = setup({ asserts: [{ kind: "reply", arg: "done" }, { kind: "reply", arg: "nothing here" }] })
  try {
    const { spawn } = agent({ out: stream({ reply: "done", loads: [{ id: "demo", directory: inside }] }) })
    const { result } = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(result.status, "failed")
    assert.match(result.reason, /1\/2 assertion\(s\) failed/)
    assert.match(result.reason, /nothing here/)
  } finally {
    cleanup()
  }
})

test("an infrastructure retry re-stages a fresh scratch and does not inherit the dead draw", async () => {
  const { skill, scratch, c, cleanup } = setup()
  const fixtureDir = join(skill.dir, "references/evals/1")
  mkdirSync(fixtureDir, { recursive: true })
  writeFileSync(join(fixtureDir, "RULES.md"), "fresh\n")
  const scratches = []
  const spawn = async ({ cwd }) => {
    scratches.push(cwd)
    if (scratches.length === 1) {
      // The dead draw pollutes its fixture; the retry must not see this file.
      writeFileSync(join(cwd, "SIDE_EFFECT.md"), "from the stalled attempt\n")
      await new Promise((resolve) => setTimeout(resolve, 120))
      return { out: "", err: "", code: "stalled" }
    }
    assert.equal(existsSync(join(cwd, "SIDE_EFFECT.md")), false, "the retry got a clean fixture")
    assert.equal(existsSync(join(cwd, "RULES.md")), true, "the retry staged the fixture again")
    return { out: stream({ reply: "done", loads: [{ id: "demo", directory: join(cwd, ".opencode/skills/demo") }] }), err: "", code: 0 }
  }
  try {
    const exec = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(scratches.length, 2)
    assert.notEqual(scratches[0], scratches[1], "the retry did not reuse the dead scratch")
    assert.equal(exec.scratch, scratches[1])
    assert.equal(exec.result.status, "passed")
    assert.equal(exec.result.execution.attempts, 2)
    assert.equal(exec.result.execution.retries, 1)
    // The final attempt owns the duration; the 120ms dead draw is not added to it.
    assert.ok(exec.result.execution.durationMs < 100, `duration ${exec.result.execution.durationMs}ms summed the attempts`)
  } finally {
    cleanup()
    for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  }
})

test("a draw records the fixture, prompt and detector provenance", async () => {
  const skill = skillDir()
  const fixtureDir = join(skill.dir, "references/evals/1")
  mkdirSync(fixtureDir, { recursive: true })
  writeFileSync(join(fixtureDir, "RULES.md"), "one\n")
  const c = { n: 1, title: "fixture", prompt: "Do the thing.", assert: [{ kind: "file", arg: "RULES.md" }] }
  const runWith = async (prompt = c.prompt) => {
    const scratch = makeScratch(skill.id, 1)
    try {
      const inside = join(scratch, ".opencode/skills", skill.id)
      const { spawn } = agent({ out: stream({ reply: "done", loads: [{ id: "demo", directory: inside }] }) })
      const { result } = await executeCase({ skill, c: { ...c, prompt }, scratch, spawnAgent: spawn })
      return result
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }

  try {
    const first = await runWith()
    assert.match(first.fixtureHash, /^[0-9a-f]{64}$/)
    assert.match(first.promptHash, /^[0-9a-f]{64}$/)
    assert.equal(first.detectorVersion, DETECTOR_VERSION)

    const otherPrompt = await runWith("Do something else.")
    assert.equal(otherPrompt.fixtureHash, first.fixtureHash, "a prompt edit does not move the fixture hash")
    assert.notEqual(otherPrompt.promptHash, first.promptHash, "a prompt edit moves the prompt hash")

    writeFileSync(join(fixtureDir, "RULES.md"), "two\n")
    const otherFixture = await runWith()
    assert.notEqual(otherFixture.fixtureHash, first.fixtureHash, "a fixture byte moves the fixture hash")
    assert.equal(otherFixture.promptHash, first.promptHash, "a fixture edit does not move the prompt hash")
  } finally {
    rmSync(skill.dir, { recursive: true, force: true })
  }
})

test("the fixture is staged before the agent runs and the skill is pinned", async () => {
  const skill = skillDir()
  const scratch = makeScratch(skill.id, 2)
  mkdirSync(join(skill.dir, "references/evals/2"), { recursive: true })
  writeFileSync(join(skill.dir, "references/evals/2/README.md"), "fixture\n")
  const c = { n: 2, title: "fixture", prompt: "Do the thing.", assert: [{ kind: "file", arg: "README.md" }] }
  try {
    const seen = []
    const spawn = async ({ args, cwd }) => {
      seen.push({ cwd, hasFixture: true })
      return { out: stream({ reply: "done", loads: [{ id: "demo", directory: join(cwd, ".opencode/skills/demo") }] }), err: "", code: 0 }
    }
    const { result } = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(seen.length, 1)
    assert.equal(result.status, "passed", "the fixture file is in the scratch dir the agent saw")
  } finally {
    rmSync(scratch, { recursive: true, force: true })
    rmSync(skill.dir, { recursive: true, force: true })
  }
})
