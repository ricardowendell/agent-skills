import test from "node:test"
import assert from "node:assert/strict"
import { agentArgs, authProbe, isStalled, runAgent, scrubEnv } from "./agent.mjs"

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
  // The watchdog measures the time since the last output chunk. A producer paced
  // close to the window loses that race on a loaded host: when the parent event
  // loop is starved, Node drains expired timers before the pending stdout reads,
  // so the watchdog sees a gap for events the parent had not read yet (the 301ms
  // failure against a 300ms window). A handshake cannot fix that ordering, and
  // `runAgent` exposes no clock seam. Keep the pacing well below the window and
  // run for several windows instead, so the test still proves the reset: a
  // stream that emitted only at the start would die at the first idle window.
  const stallMs = 1500
  const gapMs = 100
  const ticks = Math.ceil((stallMs * 3) / gapMs)
  const result = await runAgent({
    command: process.execPath,
    args: [
      "-e",
      `process.stdout.write('e'); let i = 0; const t = setInterval(() => { process.stdout.write('e'); if (++i === ${ticks}) clearInterval(t) }, ${gapMs})`,
    ],
    cwd: process.cwd(),
    env: process.env,
    timeoutMs: 15000,
    stallMs,
  })
  assert.equal(result.code, 0, `expected a clean exit, got ${result.code}`)
  assert.ok(result.durationMs > stallMs * 2, `ran ${result.durationMs}ms, not across multiple idle windows`)
  assert.ok(result.out.length >= ticks / 2, `only ${result.out.length} events observed, not a live stream`)
})

// The probe is an auth check, not a model call: it reads the stored integrations
// and the model list, and names the provider when it fails. A quota abort is a
// different class and is recorded per draw by the runner.
test("authProbe passes when credentials and the model are present", () => {
  const calls = []
  const spawnFn = (command, args) => {
    calls.push(args)
    if (args[0] === "auth") return { status: 0, stdout: "OpenCode Go  stored\n", stderr: "" }
    return { status: 0, stdout: "opencode-go/deepseek-v4.1-flash\n", stderr: "" }
  }
  const r = authProbe({ model: "opencode-go/deepseek-v4.1-flash", spawnFn })
  assert.equal(r.ok, true)
  assert.equal(r.provider, "opencode-go")
  assert.deepEqual(calls, [["auth", "list"], ["models"]])
})

test("authProbe fails fast and names the provider when no credential is stored", () => {
  const spawnFn = () => ({ status: 0, stdout: "", stderr: "" })
  const r = authProbe({ model: "opencode-go/deepseek-v4.1-flash", spawnFn })
  assert.equal(r.ok, false)
  assert.equal(r.provider, "opencode-go")
  assert.match(r.detail, /opencode-go.*no credentials/)
})

test("authProbe fails when the model is not in opencode models", () => {
  const spawnFn = (command, args) =>
    args[0] === "auth"
      ? { status: 0, stdout: "OpenCode Go  stored\n", stderr: "" }
      : { status: 0, stdout: "other/model\n", stderr: "" }
  const r = authProbe({ model: "opencode-go/deepseek-v4.1-flash", spawnFn })
  assert.equal(r.ok, false)
  assert.match(r.detail, /not in opencode models/)
})

test("authProbe skips a model with no provider prefix", () => {
  const r = authProbe({
    model: "default",
    spawnFn: () => {
      throw new Error("must not spawn")
    },
  })
  assert.equal(r.ok, true)
  assert.equal(r.provider, null)
})
