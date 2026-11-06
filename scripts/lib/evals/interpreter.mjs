// interpreter.mjs — find a usable Python for the one sensor that needs one.
//
// `check-sensor-parity.mjs` is the only place in the harness that shells out to
// another language. When no interpreter is on `PATH`, a spawn failure and a real
// divergence between the JS and Python sensors both end as `exit 1`, so the
// check could not tell "the tool is missing" from "the sensors disagree" — it
// cost two commits during the 0.4.0 wave. The resolver reports *why* each
// candidate failed, and the CLI decides what to print. `probe` is injectable so
// the tests never depend on the host's interpreters.

import { spawnSync } from "node:child_process"

/** @typedef {{ ok: true, version: string } | { ok: false, reason: "missing" | "broken", detail?: string }} Probe */
/** @typedef {{ command: string, reason: string, detail?: string, version?: string }} Attempt */

export const MIN_PYTHON = [3, 8]
export const VERSION_PROBE = "import sys; print('%d.%d' % sys.version_info[:2])"
export const PROBE_TIMEOUT_MS = 5000

// Ordered, deduplicated. `PDLC_PYTHON` comes first so an explicit path always
// wins; the absolute fallbacks keep the hook working when `PATH` is stripped but
// the machine still ships a system interpreter.
/** @param {Record<string, string | undefined>} [env] @returns {string[]} */
export function defaultCandidates(env = {}) {
  const candidates = []
  const explicit = env && typeof env.PDLC_PYTHON === "string" ? env.PDLC_PYTHON.trim() : ""
  if (explicit !== "") candidates.push(explicit)
  candidates.push("python3", "python", "/opt/homebrew/bin/python3", "/usr/bin/python3")
  return [...new Set(candidates)]
}

/** @param {unknown} text @returns {string} */
function firstLine(text) {
  if (typeof text !== "string") return ""
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line !== "") ?? ""
}

// A missing binary is `missing`; anything that exists but cannot answer is
// `broken` with the first stderr line, so the CLI can name the cause without
// printing a whole traceback.
/**
 * @param {string} command
 * @param {{ spawn?: typeof spawnSync, timeout?: number }} [options]
 * @returns {Probe}
 */
export function probePython(command, { spawn = spawnSync, timeout = PROBE_TIMEOUT_MS } = {}) {
  const r = spawn(command, ["-c", VERSION_PROBE], { encoding: "utf8", timeout })
  if (!r || r.error) {
    if (r?.error?.code === "ENOENT") return { ok: false, reason: "missing" }
    const detail = firstLine(r?.error?.message) || String(r?.error?.code ?? "spawn failed")
    return { ok: false, reason: "broken", detail }
  }
  if (r.status !== 0) {
    const detail = firstLine(r.stderr) || (r.signal ? `killed by ${r.signal}` : `exit ${r.status}`)
    return { ok: false, reason: "broken", detail }
  }
  const version = typeof r.stdout === "string" ? r.stdout.trim() : ""
  if (!/^\d+\.\d+$/.test(version)) {
    return { ok: false, reason: "broken", detail: `unexpected version output: ${version || "(empty)"}` }
  }
  return { ok: true, version }
}

/** @param {string} version @param {number[]} [min] @returns {boolean} */
export function versionAtLeast(version, min = MIN_PYTHON) {
  const [major, minor] = String(version).split(".").map(Number)
  return major > min[0] || (major === min[0] && minor >= min[1])
}

// The first candidate that actually runs and is new enough. When none does, the
// attempts are returned instead of a generic failure: they are the diagnosis.
/**
 * @param {{ env?: Record<string, string | undefined>, candidates?: string[], probe?: (command: string) => Probe }} [options]
 * @returns {{ command: string, version: string } | { command: null, tried: Attempt[] }}
 */
export function findPython({ env = {}, candidates, probe = probePython } = {}) {
  const list = candidates ?? defaultCandidates(env)
  /** @type {Attempt[]} */
  const tried = []
  for (const command of list) {
    const result = probe(command)
    if (result?.ok) {
      if (versionAtLeast(result.version)) return { command, version: result.version }
      tried.push({ command, reason: "old", version: result.version })
      continue
    }
    /** @type {Attempt} */
    const attempt = { command, reason: result?.reason ?? "broken" }
    if (result?.detail) attempt.detail = result.detail
    tried.push(attempt)
  }
  return { command: null, tried }
}

// One line per missing dependency: binaries that do not exist are named without
// noise; ones that exist but cannot run carry their first stderr line.
/** @param {Attempt[]} tried @returns {string} */
export function formatTried(tried) {
  return tried
    .map((attempt) => {
      if (attempt.reason === "missing") return attempt.command
      if (attempt.reason === "old") return `${attempt.command} (${attempt.version} < ${MIN_PYTHON.join(".")})`
      return attempt.detail ? `${attempt.command} (broken: ${attempt.detail})` : `${attempt.command} (broken)`
    })
    .join(", ")
}
