// runs.mjs — one immutable directory per invocation.
//
// The old layout wrote into `<OUT_ROOT>/<skill>[--model][--arm]/<n>.json`, a path
// shared by every run of that cell. Two things went wrong with it: a staging
// failure wrote the transcript and left the previous JSON in place, so a stale
// green could be read as this run's result; and runs of different models could
// land in the same directory when a flag was not parsed. The fix is not to
// remember to delete the directory — it is to give every run its own.

import { mkdirSync, writeFileSync, readFileSync, renameSync, existsSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"

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
    // SPEC-0057: the per-file governed hashes and the resolved `governs:` list,
    // keyed like `skillHashes`. Additive — the tree hash above stays the identity
    // every stored manifest and citation already uses.
    skillFileHashes: {},
    governs: {},
    // Declared siblings staged for a case (`stage:`), keyed like skillHashes.
    // Empty for a run whose cases declare none.
    stagedSkills: {},
  }
  writeAtomic(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2))
  return handle(dir, manifest)
}

// Reopen a run that died before its final write. The manifest goes back to
// `running`; the per-draw files are the resume map. The caller supplies the same
// selection and `--repeat` as the original invocation.
export function openRun(dir) {
  const manifestPath = join(dir, "manifest.json")
  if (!existsSync(manifestPath)) throw new Error(`not a run directory (no manifest.json): ${dir}`)
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
  } catch (e) {
    throw new Error(`manifest.json is not valid JSON: ${e.message}`)
  }
  manifest.status = "running"
  manifest.finishedAt = null
  writeAtomic(manifestPath, JSON.stringify(manifest, null, 2))
  return handle(dir, manifest)
}

function handle(dir, manifest) {
  const caseKey = (skill, n) => `${slug(skill)}--${pad(n)}`
  const caseDir = (skill, n) => join(dir, "cases", caseKey(skill, n))
  const drawPath = (skill, n, index) => join(caseDir(skill, n), "draws", `r${index}.json`)

  return {
    id: manifest.run,
    dir,
    manifest,
    caseDir,
    resultPath: (skill, n) => join(caseDir(skill, n), "result.json"),
    transcriptPath: (skill, n, rep) => join(caseDir(skill, n), rep ? `transcript.r${rep.index}.md` : "transcript.md"),
    drawPath,
    // One file per completed draw, written before the next draw starts. A run
    // that dies leaves these behind; `--resume` reads them and skips the work.
    readDraw(skill, n, index) {
      const file = drawPath(skill, n, index)
      if (!existsSync(file)) return null
      try {
        return JSON.parse(readFileSync(file, "utf8"))
      } catch {
        return null
      }
    },
    writeDraw(skill, n, index, result) {
      const file = drawPath(skill, n, index)
      mkdirSync(dirname(file), { recursive: true })
      writeAtomic(file, JSON.stringify(result, null, 2))
    },
    writeResult(skill, n, result) {
      mkdirSync(caseDir(skill, n), { recursive: true })
      writeAtomic(join(caseDir(skill, n), "result.json"), JSON.stringify(result, null, 2))
      const key = `${skill}#${n}`
      if (result?.skillHash) manifest.skillHashes[key] = result.skillHash
      if (result?.skillHashes) manifest.skillFileHashes[key] = result.skillHashes
      if (result?.governs) manifest.governs[key] = result.governs
      if (result?.stagedSkills?.length) manifest.stagedSkills[key] = result.stagedSkills
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
