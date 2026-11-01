// agent.mjs — one `opencode run`, isolated, with a hard timeout.
//
// Shared by the CLI runner and the Promptfoo provider so the execution path is
// identical in both: same args, same scrubbed env, same process-group kill.
// A divergence here would mean the two front ends measure different behaviour.

import { spawn } from "node:child_process"

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

export function runAgent({ args, cwd, env, timeoutMs = 600000 }) {
  const started = Date.now()
  return new Promise((resolve) => {
    // detached => the child leads its own process group, so the whole tree can
    // be killed. A lingering grandchild holding stdout can otherwise keep
    // 'close' from firing, so a hard timer guarantees resolution.
    const child = spawn("opencode", args, {
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

    const finish = (code) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
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
      resolve({ out, err, code, durationMs: Date.now() - started })
    }

    const timer = setTimeout(() => finish("timeout"), timeoutMs)
    child.stdout.on("data", (d) => (out += d))
    child.stderr.on("data", (d) => (err += d))
    child.on("close", (code) => finish(code ?? "closed"))
    child.on("error", (e) => {
      err += `spawn error: ${e.message}\n`
      finish("error")
    })
  })
}
