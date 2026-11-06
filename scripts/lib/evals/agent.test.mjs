import test from "node:test"
import assert from "node:assert/strict"
import { agentArgs, isStalled, runAgent, scrubEnv } from "./agent.mjs"

// Both functions shape what the child process sees. A regression here would not
// fail an assertion — it would quietly attach the run to the invoking session or
// drop the flag that makes the scratch dir the project.

test("scrubEnv removes the vars that attach the run to the invoking session", () => {
  const env = scrubEnv({ PATH: "/bin", HOME: "/home/x", OPENCODE_CONFIG: "a", OPENCODE_BIN: "b", AI_AGENT: "c", OPENCODE_SESSION: "d" })
  assert.deepEqual(env, { PATH: "/bin", HOME: "/home/x" })
})

test("scrubEnv does not mutate the caller's env", () => {
  const input = { OPENCODE_CONFIG: "a", PATH: "/bin" }
  scrubEnv(input)
  assert.deepEqual(input, { OPENCODE_CONFIG: "a", PATH: "/bin" })
})

test("agentArgs puts the prompt last and stands the run alone", () => {
  const args = agentArgs({ prompt: "Do the thing." })
  assert.deepEqual(args, ["run", "--format", "json", "--auto", "--agent", "build", "--standalone", "Do the thing."])
})

test("agentArgs adds the model before the prompt, not after it", () => {
  const args = agentArgs({ prompt: "p", model: "provider/model#variant" })
  assert.equal(args[args.length - 1], "p")
  assert.equal(args[args.indexOf("--model") + 1], "provider/model#variant")
})

test("agentArgs omits --standalone when the run is explicitly shared", () => {
  const args = agentArgs({ prompt: "p", standalone: false })
  assert.equal(args.includes("--standalone"), false)
})

test("agentArgs honours a different agent", () => {
  const args = agentArgs({ prompt: "p", agent: "plan" })
  assert.equal(args[args.indexOf("--agent") + 1], "plan")
})

// The watchdog is a decision: time since the last event vs the idle window. The
// hard timeout is the ceiling; a stall is the narrower "produced nothing new".
test("the stall decision compares the idle gap with the window", () => {
  assert.equal(isStalled(1000, 1099, 100), false, "a live stream under the window is not stalled")
  assert.equal(isStalled(1000, 1100, 100), true, "the window is inclusive")
  assert.equal(isStalled(1000, 999999, 0), false, "zero disables the watchdog")
})

test("a stream with no events is killed as stalled, distinct from timeout", async () => {
  const result = await runAgent({
    command: process.execPath,
    args: ["-e", "setTimeout(() => {}, 5000)"],
    cwd: process.cwd(),
    env: process.env,
    timeoutMs: 5000,
    stallMs: 80,
  })
  assert.equal(result.code, "stalled")
  assert.ok(result.durationMs < 2000, `stalled after ${result.durationMs}ms, not the full timeout`)
})

test("a slow but live stream resets the watchdog and survives", async () => {
  const result = await runAgent({
    command: process.execPath,
    args: [
      "-e",
      "process.stdout.write('e'); let i = 0; const t = setInterval(() => { process.stdout.write('e'); if (++i === 5) clearInterval(t) }, 30)",
    ],
    cwd: process.cwd(),
    env: process.env,
    timeoutMs: 5000,
    stallMs: 300,
  })
  assert.equal(result.code, 0, `expected a clean exit, got ${result.code}`)
  assert.notEqual(result.code, "stalled")
})
