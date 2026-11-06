// runcheck.mjs — a run directory is evidence only if every draw has provenance.
//
// The runner records two invariants per repetition: `leak` (SPEC-0017's external
// read detector) and `skillGate` (did the draw load the skill it claims to
// measure?). Both used to live only in prose, so a contaminated draw could be
// published as a clean pass. This module turns them into findings; it is pure
// (no filesystem, no model) so the rule has unit tests and the CLI can read a run
// that already happened.
//
// SPEC-0028 separates the two verdicts the old `findings=N` summary conflated.
// `skillLeaks` counts draws that read an installed skill or the answer key;
// `isolated` answers whether anything outside the scratch was read. A host-corpus
// read is its own `host` finding, so an empty skill-leak list is no longer
// evidence that the cell was isolated.
//
// The answer is three-state because two states overclaim. `no` requires a read
// the checker actually saw. `yes` requires a v2 detector and a manifest that
// records an isolated run. Everything else — a v1 run, a missing isolation
// record, unproven provenance — is `unknown`, which is neither an accusation nor
// a clean bill.
//
// There is no separator manifest. The stronger rule needs no list: in a
// `with-skill` run every repetition that did not load the skill is a finding,
// because that cell cannot be credited to the skill. In a control run every
// repetition that did load a skill is a finding, because the arm is supposed to
// prove the skill is absent.
//
// A timeout or a stall is a third invariant: the draw never ran to a verdict, so
// it is an `infrastructure` finding (incomplete evidence). It is deliberately not
// a `gate-miss`: the skill was never given a chance to load, and the kill says
// nothing about its behaviour.
//
// Unknown provenance is a finding, not silence. A repetition without `leak`
// post-SPEC-0017 cannot be called clean; a repetition without `skillGate`
// cannot be called a load. Both fail the checker explicitly. The one exception
// is a run that started before the detector landed and has no `leak` anywhere:
// the CLI warns per draw and keeps the historical artefact citable. It never
// calls those draws clean.

import { DETECTOR_VERSION } from "./leak.mjs"

const isContaminated = (result) =>
  result.contaminated === true || (typeof result.contaminated === "number" && result.contaminated > 0)

const isControl = (arm) => arm === "without-skill" || arm === "control"

const INFRASTRUCTURE_EXITS = new Set(["timeout", "stalled"])

// A timeout or a stall is a harness event, not a draw of behaviour. It is never
// clean evidence — the run is incomplete — but it is not a `gate-miss` either:
// the skill simply never got a chance to load. Infrastructure gets its own kind.
//
// The first two checks read the fields SPEC-0020 added. The `execution.exit`
// fallback is for artefacts written before them: a draw that was killed by the
// harness carries `execution.exit: "timeout"` even when it is marked `failed`
// and its reason was never rewritten. Without this a historical timeout reads as
// a clean run, which is exactly what the README says the checker prevents.
export function infrastructureOf(result) {
  if (result.infrastructure === true) return result.infrastructureReason ?? "timeout"
  if (typeof result.infrastructure === "number" && result.infrastructure > 0) return "unscored"
  const exit = result.execution?.exit
  if (INFRASTRUCTURE_EXITS.has(exit)) return exit
  const reason = result.reason ?? ""
  if (result.status === "unscored" && /^infrastructure:/.test(reason)) return reason.slice("infrastructure: ".length)
  return null
}

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

// Before the host rules every entry was `{ tool, path }`; an entry without a
// kind is therefore a skill/corpus leak. A `host` entry carries the root that
// matched, so the finding can name what was read.
function leakEntries(result) {
  return (result.leak ?? [])
    .map((l) =>
      typeof l === "string"
        ? { path: l, kind: "leak" }
        : { path: l?.path, kind: l?.kind === "host" ? "host" : "leak", root: l?.root },
    )
    .filter((e) => e.path)
}

function leakPaths(result, kind) {
  return leakEntries(result)
    .filter((e) => e.kind === kind)
    .map((e) => e.path)
}

// `{ arm, cases }` → `{ findings, counts }`. `arm` comes from `manifest.json`
// when the caller has it; each repetition may still carry its own `arm` (older
// runs, or a case moved between runs), which is the fallback. Structural
// incompleteness (manifest status, a missing `result.json`) is a filesystem
// fact, so the CLI records it as an `incomplete` finding; this module assumes
// the cases it was given were actually read.
export function checkRun({ arm = null, cases = [], isolation = null } = {}) {
  const findings = []
  let reps = 0
  let infrastructure = 0
  let skillLeaks = 0
  let hostReads = 0
  // A cell is isolated only when the detector that judged it already looked for
  // host reads. Pre-SPEC-0028 artefacts (a different or missing version) are
  // history: no host finding was possible, so silence cannot be a clean bill.
  const versions = []

  for (const c of cases) {
    const name = `${c.skill ?? "unknown"}#${c.case ?? "?"}`
    const list = repetitionsOf(c)

    for (let i = 0; i < list.length; i++) {
      const r = list[i]
      reps++
      const rep = r.rep ?? r.index ?? i + 1
      const repArm = arm ?? r.arm ?? c.arm ?? null
      const add = (kind, detail) => findings.push({ case: name, rep, kind, detail })
      versions.push(r.detectorVersion ?? c.detectorVersion ?? null)

      // An infrastructure draw is incomplete evidence, not behaviour: report it
      // and skip the load/leak checks, which a killed draw cannot satisfy.
      const infra = infrastructureOf(r)
      if (infra) {
        infrastructure++
        const retries = r.execution?.retries
        add("infrastructure", `infrastructure: ${infra}${retries ? ` (retried ${retries}x)` : ""}`)
        continue
      }

      // SPEC-0017 made `leak` mandatory. A missing field is not an empty field:
      // it means this draw cannot be checked, so it fails loudly.
      const skill = leakPaths(r, "leak")
      const host = leakEntries(r).filter((e) => e.kind === "host")
      if (r.leak === undefined) {
        add("leak-missing", "leak field missing — provenance unknown")
      } else {
        if (skill.length) {
          skillLeaks++
          add("leak", `read ${skill.join(", ")}`)
        }
        if (host.length) {
          hostReads++
          const named = host.map((e) => (e.root ? `${e.path} (${e.root})` : e.path))
          add("host", `read host corpus ${named.join(", ")}`)
        }
      }

      // Contamination is its own finding even when no path survived (an old
      // aggregate could mark the draw and drop the evidence). When a leak is
      // named, that finding already carries the failure.
      if (isContaminated(r) && !skill.length && !host.length) {
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

  const detectorCurrent = versions.length > 0 && versions.every((v) => v === DETECTOR_VERSION)
  // A missing `leak` field, or contamination with no named path, leaves the
  // question open; an open question is not isolation.
  const unproven = findings.some((f) => f.kind === "leak-missing" || f.kind === "contaminated")
  // Three states, because two overclaim. `no` is reserved for a read the checker
  // actually saw. `yes` needs both a v2 detector and a recorded isolated mode.
  // Everything else — a v1 run, a run with no isolation record, a missing leak
  // field — is `unknown`, which is not the same accusation as `no`.
  const read = skillLeaks > 0 || hostReads > 0
  const isolated = read
    ? "no"
    : detectorCurrent && isolation === true && !unproven
      ? "yes"
      : "unknown"
  return {
    findings,
    counts: { cases: cases.length, reps, findings: findings.length, infrastructure, skillLeaks, hostReads, isolated },
  }
}
