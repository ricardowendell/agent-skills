import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { executeCase } from "./execute.mjs"
import { makeScratch, treeHash } from "./fixture.mjs"
import { corpusDir } from "./parse.mjs"
import { DETECTOR_VERSION } from "./leak.mjs"
import { rejudge } from "./rejudge.mjs"

// The run path is the contract every measurement goes through, and it used to
// call `runAgent` directly, which meant it could only be exercised by running a
// real agent — something a static CI never does. `judge.mjs` already takes an
// injected spawn; the same seam here makes the gate and the classification
// testable in milliseconds.

function skillDir(id = "demo") {
  const root = mkdtempSync(join(tmpdir(), `exec-skill-${id}-`))
  const dir = join(root, "skills", id)
  mkdirSync(dir, { recursive: true })
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
    assert.equal(gate.source, "tool")
    assert.deepEqual(result.skillGate.loaded, [skill.id])
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

test("a behavioural run that reads the staged SKILL.md passes with source read", async () => {
  const { skill, scratch, c, cleanup } = setup()
  try {
    const file = join(scratch, ".opencode/skills", skill.id, "SKILL.md")
    const out =
      JSON.stringify({
        type: "tool_use",
        part: { tool: "read", state: { status: "completed", input: { filePath: file }, metadata: { metadata: {} } } },
      }) +
      "\n" +
      JSON.stringify({ type: "text", part: { text: "done" } })
    const { spawn } = agent({ out })
    const { result, gate } = await executeCase({ skill, c, scratch, spawnAgent: spawn })

    assert.equal(gate.ok, true)
    assert.equal(gate.source, "read")
    assert.equal(result.status, "passed")
    assert.equal(result.skillGate.source, "read")
    assert.deepEqual(result.skillGate.loaded, [skill.id])
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

test("a declared sibling is staged, hashed and reported", async () => {
  const skill = skillDir("demo")
  const sibling = skillDir("sibling")
  const scratch = makeScratch("demo", 7)
  const c = { n: 3, title: "routing", prompt: "Process the inbox.", gate: "off", assert: [{ kind: "skill", arg: "sibling" }] }
  try {
    const siblingInside = join(scratch, ".opencode/skills/sibling")
    const { spawn } = agent({ out: stream({ reply: "done", loads: [{ id: "sibling", directory: siblingInside }] }) })
    const { result } = await executeCase({ skill, c, scratch, siblings: [sibling], spawnAgent: spawn })

    assert.equal(result.status, "passed")
    assert.deepEqual(result.stagedSkills, [{ id: "sibling", hash: treeHash(siblingInside) }])
    // The arm's hash is still the arm's skill; the gate still answers for it.
    assert.equal(result.skillHash, treeHash(join(scratch, ".opencode/skills/demo")))
    assert.equal(result.skillGate.ok, true)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
    rmSync(skill.dir, { recursive: true, force: true })
    rmSync(sibling.dir, { recursive: true, force: true })
  }
})

test("the control arm ignores a declared sibling and denies the skill tool", async () => {
  const skill = skillDir("demo")
  const sibling = skillDir("sibling")
  const scratch = makeScratch("demo", 8)
  const c = { n: 3, title: "routing", prompt: "Process the inbox.", gate: "off", assert: [{ kind: "reply", arg: "done" }] }
  try {
    const { spawn } = agent({ out: stream({ reply: "done" }) })
    const { result } = await executeCase({ skill, c, scratch, siblings: [sibling], arm: "without-skill", spawnAgent: spawn })

    assert.deepEqual(result.stagedSkills, [])
    assert.equal(result.skillHash, null)
    assert.equal(existsSync(join(scratch, ".opencode/skills/sibling")), false, "the declared sibling leaked into the control arm")
    assert.equal(existsSync(join(scratch, ".opencode/skills/demo")), false, "the arm's skill was staged under --no-skill")
    const config = JSON.parse(readFileSync(join(scratch, ".opencode/opencode.json"), "utf8"))
    assert.equal(config.tools.skill, false)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
    rmSync(skill.dir, { recursive: true, force: true })
    rmSync(sibling.dir, { recursive: true, force: true })
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
  const fixtureDir = join(corpusDir(skill.dir), "fixtures", "1")
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
  const fixtureDir = join(corpusDir(skill.dir), "fixtures", "1")
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

test("the judge prompt and the evidence check share the tool-call ledger", async () => {
  const { skill, scratch, c, inside, cleanup } = setup()
  const expected = { ...c, expect: ["Runs the test suite and reports the red gate."] }
  const agentOut = [
    JSON.stringify({ type: "tool_use", part: { tool: "skill", state: { status: "completed", input: { id: "demo" }, metadata: { metadata: { directory: inside } } } } }),
    JSON.stringify({ type: "tool_use", part: { tool: "read", state: { status: "completed", input: { path: "src/index.js" }, output: "SECRET READ BODY" } } }),
    JSON.stringify({
      type: "tool_use",
      part: { tool: "shell", state: { status: "completed", input: { command: "node --test" }, output: "# tests 1\n# fail 1\n", metadata: { metadata: { exit: 1 } } } },
    }),
    JSON.stringify({ type: "text", part: { text: "done" } }),
  ].join("\n")
  const judgeOut = JSON.stringify({
    type: "text",
    part: { text: JSON.stringify({ expectations: [{ i: 1, verdict: "met", evidence: "$ node --test  [exit 1]" }], score: 1 }) },
  })
  const prompts = []
  const spawn = async ({ args }) => {
    const prompt = args[args.length - 1]
    prompts.push(prompt)
    if (prompt.startsWith("You grade")) return { out: judgeOut, err: "", code: 0 }
    return { out: agentOut, err: "", code: 0 }
  }
  try {
    const { result } = await executeCase({ skill, c: expected, scratch, judge: { model: "stub", threshold: 0.8 }, spawnAgent: spawn })
    const judgePrompt = prompts.find((p) => p.startsWith("You grade"))
    assert.ok(judgePrompt, "the judge was never called")
    assert.match(judgePrompt, /## Tool calls/)
    assert.match(judgePrompt, /read: src\/index\.js/)
    assert.match(judgePrompt, /^\$ node --test {2}\[exit 1\]$/m)
    assert.ok(!judgePrompt.includes("SECRET READ BODY"), "a read body leaked into the judge prompt")
    // The shell line exists in the ledger, so the quote verifies and the case
    // stays passed. If the prompt and the corpus had drifted, this would be
    // `unverifiable` and the case would fail.
    assert.equal(result.status, "passed")
    assert.equal(result.semantic.score, 1)
    assert.equal(result.semantic.expectations[0].verdict, "met")
    assert.equal(result.semantic.reason, "")
  } finally {
    cleanup()
  }
})

// The two front ends must not drift again: a live run and a re-judge over the
// same stream have to produce the same prompt, byte for byte. If rejudge forgot
// a block the live path sends, the stored measurement would grade a different
// instrument than the runner.
test("execute and rejudge render the same judge prompt from the same stream", async () => {
  const { skill, scratch, c, inside, cleanup } = setup()
  const expected = { ...c, expect: ["Runs the test suite and reports the red gate."] }
  const streamText = [
    JSON.stringify({ type: "tool_use", part: { tool: "skill", state: { status: "completed", input: { id: "demo" }, metadata: { metadata: { directory: inside } } } } }),
    JSON.stringify({ type: "tool_use", part: { tool: "read", state: { status: "completed", input: { path: "src/index.js" }, output: "SECRET READ BODY" } } }),
    JSON.stringify({
      type: "tool_use",
      part: { tool: "shell", state: { status: "completed", input: { command: "node --test" }, output: "# tests 1\n# fail 1\n", metadata: { metadata: { exit: 1 } } } },
    }),
    JSON.stringify({ type: "text", part: { text: "done" } }),
  ].join("\n")
  const judgeOut = JSON.stringify({
    type: "text",
    part: { text: JSON.stringify({ expectations: [{ i: 1, verdict: "met", evidence: "$ node --test  [exit 1]" }], score: 1 }) },
  })
  const dir = mkdtempSync(join(tmpdir(), "rejudge-parity-"))
  try {
    let execPrompt = null
    const execSpawn = async ({ args }) => {
      const prompt = args[args.length - 1]
      if (prompt.startsWith("You grade")) {
        execPrompt = prompt
        return { out: judgeOut, err: "", code: 0 }
      }
      return { out: streamText, err: "", code: 0 }
    }
    const { result } = await executeCase({ skill, c: expected, scratch, judge: { model: "stub", threshold: 0.8 }, spawnAgent: execSpawn })
    assert.equal(result.status, "passed")

    writeFileSync(
      join(dir, "result.json"),
      JSON.stringify({
        skill: "demo",
        case: 1,
        status: "passed",
        repetitions: [
          {
            skill: "demo",
            case: 1,
            rep: 1,
            status: "passed",
            assertions: [{ kind: "reply", arg: "done", pass: true }],
            skillGate: { ok: true },
            execution: { exit: 0 },
          },
        ],
      }),
    )
    writeFileSync(
      join(dir, "transcript.r1.md"),
      `# Eval: demo case 1\n\n**Scratch:** /tmp/x\n**Exit:** 0\n**Status:** passed\n\n## Transcript\n\n\`\`\`\n${streamText}\n\`\`\`\n`,
    )

    let replayPrompt = null
    const replaySpawn = async ({ args }) => {
      replayPrompt = args[args.length - 1]
      return { out: judgeOut, err: "", code: 0 }
    }
    await rejudge({ dir, c: expected, model: "stub", spawnAgent: replaySpawn })
    assert.ok(execPrompt, "the live path never called the judge")
    assert.ok(replayPrompt, "the replay path never called the judge")
    assert.equal(replayPrompt, execPrompt, "the re-judge prompt differs from the live one")
  } finally {
    cleanup()
    rmSync(dir, { recursive: true, force: true })
  }
})

test("the fixture is staged before the agent runs and the skill is pinned", async () => {
  const skill = skillDir()
  const scratch = makeScratch(skill.id, 2)
  mkdirSync(join(corpusDir(skill.dir), "fixtures/2"), { recursive: true })
  writeFileSync(join(corpusDir(skill.dir), "fixtures/2/README.md"), "fixture\n")
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

// The provider error is on the stream, not in the exit code alone: a go-limit
// aborts after a few steps, so the exit is 1 but the assertions are trivially
// green. Recording the error is what lets the checker exclude the draw.
test("a provider abort is recorded and classified as infrastructure", async () => {
  const { skill, scratch, c, cleanup } = setup({ gate: "off" })
  try {
    const abort = JSON.stringify({
      type: "error",
      error: { type: "provider.go-limit", message: "Go usage limit exceeded", status: 429 },
    })
    const { spawn } = agent({ out: `${abort}\n`, code: 1 })
    const { result } = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(result.status, "unscored")
    assert.equal(result.infrastructure, true)
    assert.equal(result.infrastructureReason, "provider.go-limit")
    assert.deepEqual(result.execution.error, {
      type: "provider.go-limit",
      message: "Go usage limit exceeded",
      status: 429,
    })
  } finally {
    cleanup()
  }
})

// SPEC-0046: the corpus boundary must cover both attempts. A wrapper applied to
// the first launch and dropped on the retry would let the second draw read the
// installed skill while the manifest still said `enforced: true`.
test("the corpus wrapper reaches both the first launch and the retry", async () => {
  const { skill, scratch, c, cleanup } = setup()
  let retryScratch = null
  try {
    const calls = []
    let call = 0
    const spawn = async (launch) => {
      calls.push(launch)
      call++
      if (call === 1) {
        retryScratch = launch.cwd
        return { out: "", err: "", code: "timeout" }
      }
      retryScratch = launch.cwd
      return {
        out: stream({ reply: "done", loads: [{ id: "demo", directory: join(launch.cwd, ".opencode/skills/demo") }] }),
        err: "",
        code: 0,
      }
    }
    const wrapper = { command: "sandbox-exec", args: ["-p", "(version 1)\n(allow default)", "opencode"] }
    const { result } = await executeCase({ skill, c, scratch, wrapper, spawnAgent: spawn })

    assert.equal(result.status, "passed")
    assert.equal(calls.length, 2, "one draw and one retry")
    for (const launch of calls) {
      assert.equal(launch.command, "sandbox-exec", "the wrapper command survives the retry")
      assert.deepEqual(launch.args.slice(0, 3), ["-p", "(version 1)\n(allow default)", "opencode"])
      assert.equal(launch.args[3], "run", "the agent args are appended after the wrapped command")
      assert.equal(launch.args.at(-1), c.prompt)
    }
  } finally {
    cleanup()
    if (retryScratch && retryScratch !== scratch) rmSync(retryScratch, { recursive: true, force: true })
  }
})
