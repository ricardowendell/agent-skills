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

// SPEC-0057 reverses SPEC-0053's "no clock seam" note: `runAgent` takes `now`,
// `setTimeout` and `clearTimeout`, so the watchdog can be driven in fake
// milliseconds. No CLI flag reaches the seam; a paid draw cannot set its clock.
function fakeClock() {
  let time = 0
  let seq = 0
  const timers = new Map()
  return {
    now: () => time,
    setTimeout: (fn, ms) => {
      const id = ++seq
      timers.set(id, { at: time + Number(ms), fn })
      return id
    },
    clearTimeout: (id) => timers.delete(id),
    // Advance fake time, running every timer that comes due in order.
    tick(ms) {
      const end = time + ms
      for (;;) {
        let due = null
        for (const [id, timer] of timers) {
          if (timer.at <= end && (!due || timer.at < due.timer.at)) due = { id, timer }
        }
        if (!due) break
        timers.delete(due.id)
        time = due.timer.at
        due.timer.fn()
      }
      time = end
    },
  }
}

test("a stream with no events is killed as stalled, distinct from timeout", async () => {
  const clock = fakeClock()
  const pending = runAgent({
    command: process.execPath,
    args: ["-e", "setTimeout(() => {}, 5000)"],
    cwd: process.cwd(),
    env: process.env,
    timeoutMs: 5000,
    stallMs: 1000,
    now: clock.now,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  })
  clock.tick(1000)
  const result = await pending
  assert.equal(result.code, "stalled")
  assert.equal(result.durationMs, 1000, "the fake clock, not the wall clock, measured the stall")
})

test("a stream that emits only at the start dies at the first idle window", async () => {
  const clock = fakeClock()
  const pending = runAgent({
    command: process.execPath,
    args: ["-e", "process.stdout.write('start'); setTimeout(() => {}, 5000)"],
    cwd: process.cwd(),
    env: process.env,
    timeoutMs: 5000,
    stallMs: 200,
    now: clock.now,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  })
  // Let the start chunk reach the parent, then fake the idle window. The
  // assertion is on the verdict: whether the chunk arrived before the tick or
  // not, there is no further activity, and only the watchdog can kill it (the
  // hard timeout is ten fake seconds away).
  await new Promise((r) => setTimeout(r, 40))
  clock.tick(200)
  const result = await pending
  assert.equal(result.code, "stalled")
  assert.ok(result.durationMs < 5000, "the watchdog fired, not the timeout")
})

test("a slow but live stream resets the watchdog and survives", async () => {
  // The child emits every 5 ms for ~100 ms; fake time advances faster than real
  // time, so the idle gap stays tiny. Activity advances the deadline, and the
  // watchdog also re-checks `isStalled` on every stall tick, so this proves the
  // stream survives — not that the reset is the only mechanism that can save it.
  // No real seconds are spent waiting.
  const clock = fakeClock()
  const stallMs = 2000
  const pending = runAgent({
    command: process.execPath,
    args: [
      "-e",
      "let i = 0; const t = setInterval(() => { process.stdout.write('e'); if (++i === 20) clearInterval(t) }, 5)",
    ],
    cwd: process.cwd(),
    env: process.env,
    timeoutMs: 10000,
    stallMs,
    now: clock.now,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  })
  const ticker = setInterval(() => clock.tick(10), 5)
  let result
  try {
    result = await pending
  } finally {
    clearInterval(ticker)
  }
  assert.equal(result.code, 0, `expected a clean exit, got ${result.code}`)
  assert.ok(result.out.length >= 20, `only ${result.out.length} events observed, not a live stream`)
})

// One integration test keeps the real clock: the fake tests prove the rule, but
// a regression that bypassed the injected timers entirely would only show on the
// real one. A short window keeps it cheap.
test("the real clock still kills a start-only stream as stalled", async () => {
  const result = await runAgent({
    command: process.execPath,
    args: ["-e", "process.stdout.write('start'); setTimeout(() => {}, 5000)"],
    cwd: process.cwd(),
    env: process.env,
    timeoutMs: 5000,
    stallMs: 60,
  })
  assert.equal(result.code, "stalled")
  assert.ok(result.durationMs < 2000, `stalled after ${result.durationMs}ms, not the full timeout`)
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
