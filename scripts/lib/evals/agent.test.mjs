import test from "node:test"
import assert from "node:assert/strict"
import { agentArgs, scrubEnv } from "./agent.mjs"

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
