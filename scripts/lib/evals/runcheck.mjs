// runcheck.mjs — a run directory is evidence only if every draw has provenance.
//
// The runner records two invariants per repetition: `leak` (SPEC-0017's external
// read detector) and `skillGate` (did the draw load the skill it claims to
// measure?). Both used to live only in prose, so a contaminated draw could be
// published as a clean pass. This module turns them into findings; it is pure
// (no filesystem, no model) so the rule has unit tests and the CLI can read a run
// that already happened.
//
// There is no separator manifest. The stronger rule needs no list: in a
// `with-skill` run every repetition that did not load the skill is a finding,
// because that cell cannot be credited to the skill. In a control run every
// repetition that did load a skill is a finding, because the arm is supposed to
// prove the skill is absent.
//
// Unknown provenance is a finding, not silence. A repetition without `leak`
// post-SPEC-0017 cannot be called clean; a repetition without `skillGate`
// cannot be called a load. Both fail the checker explicitly. The one exception
// is a run that started before the detector landed and has no `leak` anywhere:
// the CLI warns per draw and keeps the historical artefact citable. It never
// calls those draws clean.

const isContaminated = (result) =>
  result.contaminated === true || (typeof result.contaminated === "number" && result.contaminated > 0)

const isControl = (arm) => arm === "without-skill" || arm === "control"

// `repetitions[]` is the aggregate artifact; when `--repeat 1` (or a smoke run)
// the case root is the repetition itself, `skillGate` included.
export function repetitionsOf(result) {
  return Array.isArray(result.repetitions) && result.repetitions.length ? result.repetitions : [result]
}

// A run where no draw carries `leak` may have been written before SPEC-0017.
// The structural signal alone is not enough: a modern runner that forgot the
// field would look the same. Fail closed unless the manifest says the run
// started before the detector landed (commit 8777e0b). A run that carries the
// field anywhere must carry it everywhere; a partial run is a bug and is
// treated as missing provenance.
const LEAK_DETECTOR_LANDED_AT = Date.parse("2026-11-06T10:04:44.000Z")

export function isPreDetector(cases = [], startedAt = null) {
  const reps = cases.flatMap(repetitionsOf)
  if (!reps.length || !reps.every((r) => r.leak === undefined)) return false
  const started = Date.parse(startedAt)
  return Number.isFinite(started) && started < LEAK_DETECTOR_LANDED_AT
}

function leakPaths(result) {
  return (result.leak ?? []).map((l) => (typeof l === "string" ? l : l?.path)).filter(Boolean)
}

// `{ arm, cases }` → `{ findings, counts }`. `arm` comes from `manifest.json`
// when the caller has it; each repetition may still carry its own `arm` (older
// runs, or a case moved between runs), which is the fallback. Structural
// incompleteness (manifest status, a missing `result.json`) is a filesystem
// fact, so the CLI records it as an `incomplete` finding; this module assumes
// the cases it was given were actually read.
export function checkRun({ arm = null, cases = [] } = {}) {
  const findings = []
  let reps = 0

  for (const c of cases) {
    const name = `${c.skill ?? "unknown"}#${c.case ?? "?"}`
    const list = repetitionsOf(c)

    for (let i = 0; i < list.length; i++) {
      const r = list[i]
      reps++
      const rep = r.rep ?? r.index ?? i + 1
      const repArm = arm ?? r.arm ?? c.arm ?? null
      const add = (kind, detail) => findings.push({ case: name, rep, kind, detail })

      // SPEC-0017 made `leak` mandatory. A missing field is not an empty field:
      // it means this draw cannot be checked, so it fails loudly.
      const paths = leakPaths(r)
      if (r.leak === undefined) {
        add("leak-missing", "leak field missing — provenance unknown")
      } else if (paths.length) {
        add("leak", `read ${paths.join(", ")}`)
      }

      // Contamination is its own finding even when no path survived (an old
      // aggregate could mark the draw and drop the evidence). When a leak is
      // named, that finding already carries the failure.
      if (isContaminated(r) && !paths.length) {
        add("contaminated", "marked contaminated without a named leak path")
      }

      const gate = r.skillGate
      if (gate === undefined || gate === null) {
        add("provenance", `skillGate missing — cannot check the load invariant for ${repArm ?? "unknown arm"}`)
      } else if (repArm === "with-skill") {
        if (gate.ok !== true) add("gate-miss", `skillGate not ok — ${gate.reason || "no reason recorded"}`)
      } else if (isControl(repArm)) {
        const loaded = Array.isArray(gate.loaded) ? gate.loaded : []
        if (loaded.length) add("gate-miss", `control arm loaded ${loaded.join(", ")} — ${gate.reason || "no reason recorded"}`)
      } else if (!repArm) {
        add("provenance", "arm unknown — cannot check the load invariant")
      }
    }
  }

  return { findings, counts: { cases: cases.length, reps, findings: findings.length } }
}
