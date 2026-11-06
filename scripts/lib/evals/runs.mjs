// runs.mjs — one immutable directory per invocation.
//
// The old layout wrote into `<OUT_ROOT>/<skill>[--model][--arm]/<n>.json`, a path
// shared by every run of that cell. Two things went wrong with it: a staging
// failure wrote the transcript and left the previous JSON in place, so a stale
// green could be read as this run's result; and runs of different models could
// land in the same directory when a flag was not parsed. The fix is not to
// remember to delete the directory — it is to give every run its own.

import { mkdirSync, writeFileSync, renameSync, existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

const pad = (n) => String(n).padStart(2, "0")

export function slug(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// `2026-11-01T22-59-00--review-code--opencode-go-gpt-6-luna--without-skill`
export function runId({ label, arm, model, at = new Date() }) {
  const stamp =
    `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T` +
    `${pad(at.getHours())}-${pad(at.getMinutes())}-${pad(at.getSeconds())}`
  const parts = [slug(label) || "all"]
  if (model) parts.push(slug(model))
  if (arm === "without-skill") parts.push("without-skill")
  return `${stamp}--${parts.join("--")}`
}

// Writes through a temp file: a half-written manifest is worse than none.
function writeAtomic(file, text) {
  writeFileSync(`${file}.tmp`, text)
  renameSync(`${file}.tmp`, file)
}

export function createRun({ root, label, arm = "with-skill", model = null, agent, level, repoSha, params = null, at = new Date() }) {
  const id = runId({ label, arm, model, at })
  const runsRoot = join(root, "runs")
  mkdirSync(runsRoot, { recursive: true })

  // Two runs of the same configuration in the same second must not merge.
  let dir = join(runsRoot, id)
  for (let i = 2; existsSync(dir); i++) dir = join(runsRoot, `${id}-${i}`)
  mkdirSync(dir, { recursive: true })

  const manifest = {
    run: id,
    dir,
    label,
    arm,
    model: model ?? "default",
    agent,
    level,
    repoSha,
    // The runner's scheduling knobs, recorded so a later reader does not have to
    // infer them from the number of draws: concurrency, repeat, stop, stallMs.
    params: params ? { ...params } : null,
    startedAt: at.toISOString(),
    finishedAt: null,
    status: "running",
    counts: null,
    skillHashes: {},
  }
  writeAtomic(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2))

  const caseKey = (skill, n) => `${slug(skill)}--${pad(n)}`
  const caseDir = (skill, n) => join(dir, "cases", caseKey(skill, n))

  return {
    id,
    dir,
    manifest,
    caseDir,
    resultPath: (skill, n) => join(caseDir(skill, n), "result.json"),
    transcriptPath: (skill, n, rep) => join(caseDir(skill, n), rep ? `transcript.r${rep.index}.md` : "transcript.md"),
    writeResult(skill, n, result) {
      mkdirSync(caseDir(skill, n), { recursive: true })
      writeAtomic(join(caseDir(skill, n), "result.json"), JSON.stringify(result, null, 2))
      if (result?.skillHash) manifest.skillHashes[`${skill}#${n}`] = result.skillHash
    },
    finish({ status = "completed", counts = null } = {}) {
      manifest.finishedAt = new Date().toISOString()
      manifest.status = status
      manifest.counts = counts
      const text = JSON.stringify(manifest, null, 2)
      writeAtomic(join(dir, "manifest.json"), text)
      writeAtomic(join(dir, "summary.json"), text)
      return { ...manifest }
    },
  }
}

export function listRuns(root) {
  const runsRoot = join(root, "runs")
  if (!existsSync(runsRoot)) return []
  return readdirSync(runsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(runsRoot, e.name))
}
