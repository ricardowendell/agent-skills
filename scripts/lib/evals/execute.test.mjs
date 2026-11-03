import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { executeCase } from "./execute.mjs"
import { makeScratch } from "./fixture.mjs"

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

test("a timeout is a failure, not an unscored case", async () => {
  const { skill, scratch, c, cleanup } = setup()
  try {
    const { spawn } = agent({ out: "", code: "timeout" })
    const { result } = await executeCase({ skill, c, scratch, spawnAgent: spawn })
    assert.equal(result.status, "failed")
    assert.equal(result.reason, "exit timeout")
  } finally {
    cleanup()
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
