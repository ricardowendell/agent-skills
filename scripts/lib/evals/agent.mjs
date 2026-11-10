// agent.mjs — one `opencode run`, isolated, with a hard timeout.
//
// Shared by the CLI runner and the Promptfoo provider so the execution path is
// identical in both: same args, same scrubbed env, same process-group kill.
// A divergence here would mean the two front ends measure different behaviour.

import { spawn, spawnSync } from "node:child_process"

// The vars that make `opencode run` attach to the invoking session's server or
// project instead of the scratch dir.
export function scrubEnv(env = process.env) {
  const out = { ...env }
  for (const k of Object.keys(out)) {
    if (/^OPENCODE/i.test(k) || k === "AI_AGENT") delete out[k]
  }
  return out
}

export function agentArgs({ prompt, model, agent = "build", standalone = true }) {
  const args = ["run", "--format", "json", "--auto", "--agent", agent]
  if (standalone) args.push("--standalone")
  if (model) args.push("--model", model)
  args.push(prompt)
  return args
}

// Pure decision, so the rule has a unit test without spawning a provider.
// `stallMs <= 0` disables the watchdog, matching `--stall-seconds 0`.
export function isStalled(lastActivityAt, now, stallMs) {
  return Number.isFinite(stallMs) && stallMs > 0 && now - lastActivityAt >= stallMs
}

// Before a batch, fail on a missing credential instead of paying for a draw that
// can only abort. This is an auth probe, not a quota probe: it reads the stored
// integrations and the model list, so it costs no model call. A quota or an
// upstream failure is classified later by the runner (TASK-52).
export function authProbe({ model, command = "opencode", spawnFn = spawnSync, env = process.env } = {}) {
  const ref = String(model ?? "").replace(/ \(config default\)$/, "")
  const provider = ref.includes("/") ? ref.split("/")[0] : null
  if (!provider) return { ok: true, provider: null, detail: "no provider prefix; probe skipped" }
  const call = (args) => {
    try {
      return spawnFn(command, args, { encoding: "utf8", env })
    } catch (e) {
      return { status: 1, stdout: "", stderr: e.message }
    }
  }
  const auth = call(["auth", "list"])
  if (auth.status !== 0) {
    return {
      ok: false,
      provider,
      detail: `${provider}: opencode auth list failed (${(auth.stderr ?? "").trim() || "no output"})`,
    }
  }
  if (!String(auth.stdout ?? "").trim()) {
    return { ok: false, provider, detail: `${provider}: no credentials stored` }
  }
  const models = call(["models"])
  if (models.status === 0 && !String(models.stdout ?? "").split("\n").map((s) => s.trim()).includes(ref)) {
    return { ok: false, provider, detail: `${provider}: ${ref} is not in opencode models` }
  }
  return { ok: true, provider, detail: `${provider}: credentials present` }
}

// SPEC-0057 reverses SPEC-0053's "no clock seam" note: the watchdog test used
// real seconds only because `runAgent` exposed no injectable time. The seam is
// testability, not measurement — no CLI flag reaches it, so a paid draw cannot
// set its own clock and a caller that passes nothing keeps the real one.
export function runAgent({
  args,
  cwd,
  env,
  timeoutMs = 600000,
  stallMs = 120000,
  command = "opencode",
  now = Date.now,
  setTimeout: scheduleTimeout = setTimeout,
  clearTimeout: cancelTimeout = clearTimeout,
}) {
  const started = now()
  return new Promise((resolve) => {
    // detached => the child leads its own process group, so the whole tree can
    // be killed. A lingering grandchild holding stdout can otherwise keep
    // 'close' from firing, so a hard timer guarantees resolution.
    const child = spawn(command, args, {
      cwd,
      // spawn's cwd does NOT update the inherited PWD, and opencode resolves its
      // project from PWD.
      env: { ...env, PWD: cwd, OLDPWD: cwd },
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let out = ""
    let err = ""
    let finished = false
    let lastActivity = started
    let stallTimer = null

    // The hard timeout is the ceiling; the watchdog is the "still working?" test.
    // Every chunk on either stream counts as activity: the JSON event stream
    // emits one line per step, so a live but slow draw keeps resetting it while
    // a stuck process does not. A watchdog kill is `stalled`, never `timeout`,
    // because the two lead to different retry and reporting decisions.
    const armStall = () => {
      if (!(stallMs > 0)) return
      cancelTimeout(stallTimer)
      stallTimer = scheduleTimeout(() => {
        if (finished) return
        if (isStalled(lastActivity, now(), stallMs)) finish("stalled")
        else armStall()
      }, stallMs)
    }

    const finish = (code) => {
      if (finished) return
      finished = true
      cancelTimeout(timer)
      cancelTimeout(stallTimer)
      try {
        process.kill(-child.pid, "SIGKILL")
      } catch {
        try {
          child.kill("SIGKILL")
        } catch {}
      }
      try {
        child.stdout?.removeAllListeners()
        child.stderr?.removeAllListeners()
        child.stdout?.destroy()
        child.stderr?.destroy()
        child.unref()
      } catch {}
      resolve({ out, err, code, durationMs: now() - started })
    }

    const timer = scheduleTimeout(() => finish("timeout"), timeoutMs)
    const activity = (chunk) => {
      lastActivity = now()
      armStall()
      return chunk
    }
    child.stdout.on("data", (d) => {
      out += activity(d)
    })
    child.stderr.on("data", (d) => {
      err += activity(d)
    })
    child.on("close", (code) => finish(code ?? "closed"))
    child.on("error", (e) => {
      err += `spawn error: ${e.message}\n`
      finish("error")
    })
    armStall()
  })
}
