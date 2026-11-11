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
// the checker actually saw. `yes` requires a v2 detector, a manifest that
// records an isolated run — and, when the manifest carries SPEC-0046's
// `params.isolation` record, `enforced: true` — plus at least one draw that ran
// to a verdict.
// Everything else — a v1 run, a missing isolation
// record, unproven provenance — is `unknown`, which is neither an accusation nor
// a clean bill.
//
// There is no separator manifest. The stronger rule needs no list: in a
// `with-skill` run every repetition that did not load the skill is a finding,
// because that cell cannot be credited to the skill. In a control run every
// repetition that did load a skill is a finding, because the arm is supposed to
// prove the skill is absent.
//
// A timeout, a stall, or a provider abort is a third invariant: the draw never
// ran to a verdict, so it is an `infrastructure` finding (incomplete evidence).
// It is deliberately not
// a `gate-miss`: the skill was never given a chance to load, and the kill says
// nothing about its behaviour.
//
// Unknown provenance is a finding, not silence. A repetition without `leak`
// post-SPEC-0017 cannot be called clean; a repetition without `skillGate`
// cannot be called a load. Both fail the checker explicitly. The one exception
// is a run that started before the detector landed and has no `leak` anywhere:
// the CLI warns per draw and keeps the historical artefact citable. It never
// calls those draws clean.

import { hasCapability } from "./leak.mjs"
import { ASSERTED_LEGACY_REASON, RESUMED_LEGACY_REASON, drawIsolation, summarizeDrawIsolation } from "./isolation.mjs"

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value)

const isContaminated = (result) =>
  result.contaminated === true || (typeof result.contaminated === "number" && result.contaminated > 0)

const isControl = (arm) => arm === "without-skill" || arm === "control"

const INFRASTRUCTURE_EXITS = new Set(["timeout", "stalled"])

// A timeout, a stall, or a provider abort is a harness/provider event, not a
// draw of behaviour. It is never
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
// matched, so the finding can name what was read. A `denied` entry (SPEC-0048)
// is an attempt the boundary refused: it is counted, never a finding.
function leakEntries(result) {
  return (result.leak ?? [])
    .map((l) =>
      typeof l === "string"
        ? { path: l, kind: "leak" }
        : {
            path: l?.path,
            kind: l?.kind === "host" ? "host" : l?.kind === "denied" ? "denied" : "leak",
            root: l?.root,
          },
    )
    .filter((e) => e.path)
}

function leakPaths(result, kind) {
  return leakEntries(result)
    .filter((e) => e.kind === kind)
    .map((e) => e.path)
}

// The run's isolation evidence, per draw first (SPEC-0067). A draw carries its
// own record; the manifest summary is the fallback for runs whose draws predate
// per-draw recording, and a manifest without `params.isolation` predates the
// enforcement probe and keeps the old boolean rule. Do not derive enforcement
// from `params.isolate`: `true` there meant "throwaway home", never "the corpus
// was denied".
//
// A stored "earlier draws were not enforced" is restated as what it can support:
// no record. The count comes from the draws the caller read. A draw with no
// record is unrecorded, not "older than the probe": absence has two causes and
// this module cannot tell them apart (SPEC-0067).
const unprovenReason = (draws) => `${draws.length} of ${draws.length} draws carry no enforcement record`

function restateLegacy(record, draws = []) {
  if (!isRecord(record)) return record
  if (record.enforced === true) return record
  if (record.reason !== ASSERTED_LEGACY_REASON && record.reason !== RESUMED_LEGACY_REASON) return record
  return {
    enforced: false,
    mechanism: null,
    reason: draws.length ? unprovenReason(draws) : RESUMED_LEGACY_REASON,
  }
}

export function manifestIsolation(manifest, draws = []) {
  const derived = summarizeDrawIsolation(draws)
  if (derived) return derived
  const record = manifest?.params?.isolation
  if (isRecord(record)) return restateLegacy(record, draws)
  const legacy = manifest?.params?.isolate
  return typeof legacy === "boolean" ? legacy : null
}

// `{ arm, cases }` → `{ findings, counts }`. `arm` comes from `manifest.json`
// when the caller has it; each repetition may still carry its own `arm` (older
// runs, or a case moved between runs), which is the fallback. Structural
// incompleteness (manifest status, a missing `result.json`) is a filesystem
// fact, so the CLI records it as an `incomplete` finding; this module assumes
// the cases it was given were actually read.
export function checkRun({ arm = null, cases = [], isolation = null, requested = null } = {}) {
  const findings = []
  const warnings = []
  let reps = 0
  let behavioural = 0
  let infrastructure = 0
  let skillLeaks = 0
  let hostReads = 0
  // SPEC-0048: a denied corpus attempt is evidence that the boundary held, not a
  // finding. It is counted per draw so the reader sees the probe without the
  // cell losing `isolated=yes`.
  let deniedDraws = 0
  // A cell is isolated only when the detector that judged it already looked for
  // host reads. This is a capability question, not digest equality (SPEC-0049):
  // a v2 or v3 run that looked for host reads and found none is `yes` under an
  // enforced manifest, and it is the same rule `evidence.mjs` uses, so the two
  // readers cannot disagree about one run. An unknown digest has no capability
  // and fails closed to `unknown`.
  const versions = []

  for (const c of cases) {
    const name = `${c.skill ?? "unknown"}#${c.case ?? "?"}`
    const list = repetitionsOf(c)

    // A stopped case is real evidence of the draws it ran, but it is not the
    // requested count. The canary rule asks for twelve precisely so one miss is
    // visible; an eight-draw stop must not be read as 12/12. The manifest's
    // requested repeat is the only thing that can say the denominator is short,
    // so the check fires only when the caller passed it.
    if (Number.isInteger(requested) && requested > 0) {
      const ran = Number.isInteger(c.reps) ? c.reps : list.length
      if (ran < requested) {
        const why = c.stoppedEarly === true ? "the stop rule fired" : "fewer draws than requested"
        warnings.push({
          case: name,
          rep: 0,
          kind: "stopped-early",
          detail: `reps=${ran} of requested ${requested} — ${why}; not a ${requested}/${requested} claim`,
        })
      }
    }

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
      behavioural++

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
        if (leakPaths(r, "denied").length) deniedDraws++
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

  const detectorCurrent = versions.length > 0 && versions.every((v) => hasCapability(v, "host-reads"))
  // A missing `leak` field, or contamination with no named path, leaves the
  // question open; an open question is not isolation.
  const unproven = findings.some((f) => f.kind === "leak-missing" || f.kind === "contaminated")
  // Three states, because two overclaim. `no` is reserved for a read the checker
  // actually saw. `yes` needs both a v2 detector and a recorded isolated mode.
  // Everything else — a v1 run, a run with no isolation record, a missing leak
  // field — is `unknown`, which is not the same accusation as `no`.
  const read = skillLeaks > 0 || hostReads > 0
  // `denied` is deliberately absent from `read`: a refused attempt is not a
  // read, and counting it would make an enforced control unable to be clean.
  // SPEC-0067: the draws decide first. `yes` requires every behavioural draw to
  // record enforcement; a draw with no record is unproven. The manifest record is
  // the fallback for a run whose draws predate per-draw recording, and a legacy
  // boolean still certifies a throwaway home, because rewriting history would
  // turn every earlier `isolated=yes` into an error.
  const behaviouralDraws = cases.flatMap(repetitionsOf).filter((r) => !infrastructureOf(r))
  const derived = summarizeDrawIsolation(behaviouralDraws)
  const record = derived ?? (isRecord(isolation) ? restateLegacy(isolation, behaviouralDraws) : null)
  const enforced = record ? record.enforced === true : isolation === true
  // The reason is the cell's, not a finding: a legacy draw already reported
  // `unknown`, and this change may not turn that verdict into a failure. It names
  // what the record cannot prove rather than asserting a mechanism. A smoke draw
  // is staged, not behaviour, so it never earns this line.
  const judged = behaviouralDraws.filter((r) => r.status !== "staged")
  const legacyResume =
    isRecord(isolation) && (isolation.reason === ASSERTED_LEGACY_REASON || isolation.reason === RESUMED_LEGACY_REASON)
  if (record && record.enforced !== true && judged.length && (derived || legacyResume)) {
    const unprovenLabels = behaviouralDraws
      .map((r, i) => ({ record: drawIsolation(r), label: `r${r.rep ?? r.index ?? i + 1}` }))
      .filter((e) => !e.record || e.record.enforced !== true || typeof e.record.mechanism !== "string" || !e.record.mechanism.trim())
      .map((e) => e.label)
    const cell = cases.length === 1 ? `${cases[0].skill ?? "unknown"}#${cases[0].case ?? "?"}` : "run"
    warnings.push({
      case: cell,
      rep: 0,
      kind: "isolation-unproven",
      detail: unprovenLabels.length ? `${record.reason} (unproven: ${unprovenLabels.join(", ")})` : record.reason,
    })
  }
  // `yes` also needs at least one draw that actually ran. A run where every rep
  // aborted (timeout, stall, provider limit) has no behaviour to certify, even
  // when nothing was read: that is `unknown`, not a clean bill.
  const isolated = read ? "no" : detectorCurrent && enforced && !unproven && behavioural > 0 ? "yes" : "unknown"
  return {
    findings,
    warnings,
    isolation: record ?? isolation,
    counts: { cases: cases.length, reps, findings: findings.length, infrastructure, skillLeaks, hostReads, deniedDraws, isolated },
  }
}
