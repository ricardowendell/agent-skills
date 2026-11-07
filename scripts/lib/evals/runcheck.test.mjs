import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { checkRun, isPreDetector } from "./runcheck.mjs"
import { DETECTOR_VERSION } from "./leak.mjs"

const gate = ({ ok = true, loaded = ["implement-from-prompt"], reason = "loaded implement-from-prompt" } = {}) => ({
  ok,
  loaded,
  reason,
})

const controlGate = () => ({ ok: true, loaded: [], reason: "no skill loaded (control arm)" })

const rep = (overrides = {}) => ({
  skill: "implement-from-prompt",
  case: 1,
  status: "passed",
  arm: "with-skill",
  leak: [],
  contaminated: false,
  detectorVersion: DETECTOR_VERSION,
  skillGate: gate(),
  ...overrides,
})

const aggregate = (reps, overrides = {}) => ({
  skill: "implement-from-prompt",
  case: 1,
  arm: "with-skill",
  status: "passed",
  contaminated: reps.filter((r) => r.contaminated).length,
  repetitions: reps,
  ...overrides,
})

const kinds = (findings) => findings.map((f) => f.kind)

test("a clean with-skill run at 5/5 has no findings", () => {
  const cases = [aggregate(Array.from({ length: 5 }, (_, i) => rep({ rep: i + 1 })))]
  const { findings, counts } = checkRun({ arm: "with-skill", cases, isolation: true })
  assert.deepEqual(findings, [])
  assert.deepEqual(counts, { cases: 1, reps: 5, findings: 0, infrastructure: 0, skillLeaks: 0, hostReads: 0, isolated: "yes" })
})

test("a clean control run at 0/5 is not dirty just because it failed", () => {
  const reps = Array.from({ length: 5 }, (_, i) =>
    rep({ rep: i + 1, status: "failed", arm: "without-skill", skillGate: controlGate() }),
  )
  const { findings, counts } = checkRun({ arm: "without-skill", cases: [aggregate(reps, { contaminated: 0 })], isolation: true })
  assert.deepEqual(findings, [])
  assert.deepEqual(counts, { cases: 1, reps: 5, findings: 0, infrastructure: 0, skillLeaks: 0, hostReads: 0, isolated: "yes" })
})

test("a control repetition that loaded a skill is a gate miss", () => {
  const cases = [
    aggregate([
      rep({ rep: 1, arm: "without-skill", skillGate: controlGate() }),
      rep({
        rep: 2,
        arm: "without-skill",
        skillGate: { ok: false, loaded: ["review-code"], reason: "LOADED — the control arm is broken" },
      }),
    ]),
  ]
  const { findings } = checkRun({ arm: "without-skill", cases })
  assert.deepEqual(kinds(findings), ["gate-miss"])
  assert.equal(findings[0].case, "implement-from-prompt#1")
  assert.equal(findings[0].rep, 2)
  assert.match(findings[0].detail, /control arm loaded review-code/)
})

test("a with-skill repetition that lost the gate is a gate miss", () => {
  const cases = [aggregate([rep({ rep: 1, skillGate: { ok: false, loaded: [], reason: "skill not loaded" } })])]
  const { findings } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["gate-miss"])
  assert.equal(findings[0].rep, 1)
  assert.match(findings[0].detail, /skill not loaded/)
})

test("a repetition with no skillGate is unknown provenance, not clean", () => {
  const r = rep({ rep: 3 })
  delete r.skillGate
  const { findings } = checkRun({ arm: "with-skill", cases: [aggregate([r])] })
  assert.deepEqual(kinds(findings), ["provenance"])
  assert.equal(findings[0].rep, 3)
  assert.match(findings[0].detail, /skillGate missing/)
})

test("a repetition with no leak field fails as missing provenance", () => {
  const r = rep({ rep: 2 })
  delete r.leak
  const { findings } = checkRun({ arm: "with-skill", cases: [aggregate([r])] })
  assert.deepEqual(kinds(findings), ["leak-missing"])
  assert.equal(findings[0].rep, 2)
  assert.match(findings[0].detail, /leak field missing/)
})

test("a run with no leak field at all is recognised as pre-detector", () => {
  const reps = Array.from({ length: 12 }, (_, i) => rep({ rep: i + 1 }))
  for (const r of reps) delete r.leak
  const cases = [aggregate(reps)]
  assert.equal(isPreDetector(cases, "2026-11-05T15:35:30.459Z"), true)
  assert.equal(isPreDetector(cases, "2026-11-06T10:05:00.000Z"), false)
  assert.equal(isPreDetector(cases), false, "fails closed without a start time")

  // The pure rule stays strict; the CLI downgrades these to warnings for the
  // historical artefact so the old run remains citable.
  const { findings, counts } = checkRun({ arm: "with-skill", cases, isolation: true })
  assert.deepEqual(kinds(findings), Array(12).fill("leak-missing"))
  assert.deepEqual(counts, { cases: 1, reps: 12, findings: 12, infrastructure: 0, skillLeaks: 0, hostReads: 0, isolated: "unknown" })
})

test("a run that carries leak somewhere must carry it everywhere", () => {
  const missing = rep({ rep: 2 })
  delete missing.leak
  const cases = [aggregate([rep({ rep: 1 }), missing])]
  assert.equal(isPreDetector(cases), false)

  const { findings } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["leak-missing"])
  assert.equal(findings[0].rep, 2)
})

test("a contaminated repetition is a finding even with an empty leak list", () => {
  const cases = [aggregate([rep({ rep: 4, contaminated: true, leak: [] })])]
  const { findings } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["contaminated"])
  assert.equal(findings[0].rep, 4)
})

test("an infrastructure draw is its own finding, not a gate miss", () => {
  const cases = [
    aggregate([
      rep({ rep: 1 }),
      rep({
        rep: 2,
        status: "unscored",
        reason: "infrastructure: timeout",
        infrastructure: true,
        infrastructureReason: "timeout",
        skillGate: { ok: false, loaded: [], reason: "killed before it could load" },
        execution: { retries: 1 },
      }),
    ]),
  ]
  const { findings, counts } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["infrastructure"])
  assert.equal(findings[0].case, "implement-from-prompt#1")
  assert.equal(findings[0].rep, 2)
  assert.match(findings[0].detail, /infrastructure: timeout \(retried 1x\)/)
  assert.equal(counts.infrastructure, 1)
  assert.equal(counts.findings, 1, "the run is not clean")
})

test("an unscored reason naming infrastructure is recognised without the flag", () => {
  const cases = [aggregate([rep({ rep: 1, status: "unscored", reason: "infrastructure: stalled" })])]
  const { findings, counts } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["infrastructure"])
  assert.match(findings[0].detail, /stalled/)
  assert.equal(counts.infrastructure, 1)
})

test("an old timeout is found through execution.exit, not only the new fields", () => {
  const cases = [
    aggregate([
      rep({ rep: 1 }),
      rep({ rep: 2, status: "failed", reason: "exit timeout", execution: { exit: "timeout" } }),
      rep({ rep: 3, status: "failed", reason: "exit stalled", execution: { exit: "stalled" } }),
    ]),
  ]
  const { findings, counts } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["infrastructure", "infrastructure"])
  assert.match(findings[0].detail, /infrastructure: timeout/)
  assert.match(findings[1].detail, /infrastructure: stalled/)
  assert.equal(counts.infrastructure, 2)
})

test("the execution.exit fallback does not turn an ordinary failure into infrastructure", () => {
  const cases = [aggregate([rep({ rep: 1, status: "failed", reason: "verdict REJECT", execution: { exit: 0 } })])]
  const { findings, counts } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(findings, [])
  assert.equal(counts.infrastructure, 0)
})

test("a run without manifest.json falls back to each repetition's arm", () => {
  const cases = [
    aggregate([
      rep({ rep: 1, arm: "with-skill" }),
      rep({ rep: 2, arm: "with-skill" }),
      rep({ rep: 3, arm: "without-skill", skillGate: controlGate() }),
    ]),
  ]
  const { findings, counts } = checkRun({ cases })
  assert.deepEqual(findings, [])
  assert.equal(counts.reps, 3)
})

test("the aggregated case reads repetitions[] and names the leaking draw", () => {
  const cases = [
    aggregate([
      rep({ rep: 1 }),
      rep({
        rep: 2,
        leak: [{ tool: "shell", path: "/Users/me/.agents/skills/implement-from-prompt/SKILL.md" }],
      }),
    ]),
  ]
  const { findings } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["leak"])
  assert.equal(findings[0].case, "implement-from-prompt#1")
  assert.equal(findings[0].rep, 2)
  assert.match(findings[0].detail, /SKILL\.md/)
})

test("a host-corpus read is its own finding, and skillLeaks stays zero", () => {
  const host = [
    {
      tool: "read",
      path: "/Users/me/host/docs/specs/SPEC-0012-demo.md",
      kind: "host",
      root: "/Users/me/host/docs",
    },
  ]
  const cases = [aggregate([rep({ rep: 1 }), rep({ rep: 2, leak: host, contaminated: true })])]
  const { findings, counts } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["host"])
  assert.equal(findings[0].rep, 2)
  assert.match(findings[0].detail, /read host corpus/)
  assert.match(findings[0].detail, /SPEC-0012-demo\.md/)
  assert.equal(counts.skillLeaks, 0)
  assert.equal(counts.hostReads, 1)
  assert.equal(counts.isolated, "no")
})

test("a skill leak and a host read in one draw are two findings", () => {
  const leak = [
    { tool: "read", path: "/Users/me/.agents/skills/review-code/SKILL.md" },
    { tool: "read", path: "/Users/me/host/AGENTS.md", kind: "host", root: "/Users/me/host/AGENTS.md" },
  ]
  const cases = [aggregate([rep({ rep: 1, leak, contaminated: true })])]
  const { findings, counts } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(kinds(findings), ["leak", "host"])
  assert.equal(counts.skillLeaks, 1)
  assert.equal(counts.hostReads, 1)
  assert.equal(counts.isolated, "no")
})

test("a run written by an older detector is unknown, not dirty and not isolated", () => {
  const cases = [aggregate([rep({ rep: 1, detectorVersion: "a31d58f79a6c7038" })])]
  const { findings, counts } = checkRun({ arm: "with-skill", cases, isolation: true })
  assert.deepEqual(findings, [])
  assert.equal(counts.skillLeaks, 0)
  assert.equal(counts.hostReads, 0)
  assert.equal(counts.isolated, "unknown", "the old detector did not look for host reads")
})

test("a v2 run with no isolation record is unknown, not yes", () => {
  const cases = [aggregate([rep({ rep: 1 })])]
  const { findings, counts } = checkRun({ arm: "with-skill", cases })
  assert.deepEqual(findings, [])
  assert.equal(counts.isolated, "unknown")
})

test("a v2 run that did not isolate (--no-isolate/--shared) is unknown", () => {
  const cases = [aggregate([rep({ rep: 1 })])]
  const { findings, counts } = checkRun({ arm: "with-skill", cases, isolation: false })
  assert.deepEqual(findings, [])
  assert.equal(counts.isolated, "unknown")
})

test("a single-draw result is the repetition at the root", () => {
  const root = rep({ rep: 1, skillGate: gate({ ok: false, loaded: [], reason: "MISSING" }) })
  const { findings, counts } = checkRun({ arm: "with-skill", cases: [root], isolation: true })
  assert.deepEqual(counts, { cases: 1, reps: 1, findings: 1, infrastructure: 0, skillLeaks: 0, hostReads: 0, isolated: "yes" })
  assert.deepEqual(kinds(findings), ["gate-miss"])
  assert.equal(findings[0].rep, 1)
})

// A stopped case is a real observation of the draws it ran, but the manifest's
// requested repeat is what says the denominator is short. The canary rule needs
// this: an eight-draw stop cannot be read as 12/12.
test("a case that stopped before the requested repeat is a warning, not a 12/12 claim", () => {
  const reps = Array.from({ length: 8 }, (_, i) => rep({ rep: i + 1 }))
  const { findings, warnings, counts } = checkRun({
    arm: "with-skill",
    cases: [aggregate(reps, { reps: 8, stoppedEarly: true })],
    isolation: true,
    requested: 12,
  })
  assert.deepEqual(findings, [])
  assert.equal(warnings.length, 1)
  assert.equal(warnings[0].kind, "stopped-early")
  assert.match(warnings[0].detail, /reps=8 of requested 12/)
  assert.match(warnings[0].detail, /not a 12\/12 claim/)
  assert.equal(counts.reps, 8)
})

test("a case that ran the requested repeat has no stopped-early warning", () => {
  const reps = Array.from({ length: 12 }, (_, i) => rep({ rep: i + 1 }))
  const { findings, warnings } = checkRun({
    arm: "with-skill",
    cases: [aggregate(reps, { reps: 12, stoppedEarly: false })],
    isolation: true,
    requested: 12,
  })
  assert.deepEqual(findings, [])
  assert.deepEqual(warnings, [])
})

test("without a requested repeat the short case cannot be judged and stays silent", () => {
  const reps = Array.from({ length: 8 }, (_, i) => rep({ rep: i + 1 }))
  const { warnings } = checkRun({ arm: "with-skill", cases: [aggregate(reps, { reps: 8, stoppedEarly: true })] })
  assert.deepEqual(warnings, [])
})

// The CLI is the part that touches the filesystem; the tests above cover the
// pure rule. These run the real script against synthetic run directories in
// $TMPDIR so the exit codes and the summary cannot drift.
const CLI = fileURLToPath(new URL("../../check-eval-run.mjs", import.meta.url))
const REPLAY = fileURLToPath(new URL("../../replay-evals.mjs", import.meta.url))

function makeRun(t, { manifest, cases = [] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "pdlc-runcheck-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  if (manifest !== undefined) writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest))
  for (const c of cases) {
    const caseDir = join(dir, "cases", c.name)
    mkdirSync(caseDir, { recursive: true })
    if (c.result !== undefined) writeFileSync(join(caseDir, "result.json"), JSON.stringify(c.result))
  }
  return dir
}

const runCli = (dir) => spawnSync(process.execPath, [CLI, dir], { encoding: "utf8" })

function transcriptMd({ skill = "demo", n = 1, scratch, command }) {
  return [
    `# Eval: ${skill} case ${n}`,
    "",
    "**Prompt:** demo",
    "",
    `**Scratch:** ${scratch}`,
    "",
    "**Exit:** 0",
    "**Status:** passed",
    "",
    "## Transcript",
    "",
    "```",
    JSON.stringify({
      type: "tool_use",
      part: { id: `${n}`, tool: "shell", state: { status: "completed", input: { command }, metadata: { metadata: {} } } },
    }),
    "```",
    "",
  ].join("\n")
}

// The replay is read-only by contract; compare the tree before and after.
function snapshot(dir) {
  const out = []
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name)
      if (entry.isDirectory()) {
        out.push(`d ${p}`)
        walk(p)
      } else out.push(`f ${p}\n${readFileSync(p, "utf8")}`)
    }
  }
  walk(dir)
  return out
}

test("replay --leaks re-judges stored transcripts and writes nothing", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pdlc-replay-leaks-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const run = join(root, "run-demo")
  mkdirSync(run, { recursive: true })
  const scratch = "/var/folders/aa/T/eval-demo-1-abc"
  const host = "/Users/me/host/docs/specs/SPEC-0012-demo.md"
  writeFileSync(
    join(run, "manifest.json"),
    JSON.stringify({ arm: "without-skill", params: { hostRoots: ["/Users/me/host/docs"] } }),
  )
  const caseDir = join(run, "cases", "demo--01")
  mkdirSync(caseDir, { recursive: true })
  writeFileSync(join(caseDir, "transcript.r1.md"), transcriptMd({ n: 1, scratch, command: `sed -n '1,5p' ${host}` }))
  writeFileSync(join(caseDir, "transcript.r2.md"), transcriptMd({ n: 1, scratch, command: `cat ${scratch}/docs/SPEC-0012-demo.md` }))
  // A second cell reads only the scratch and must stay clean.
  const cleanDir = join(run, "cases", "demo--02")
  mkdirSync(cleanDir, { recursive: true })
  writeFileSync(join(cleanDir, "transcript.r1.md"), transcriptMd({ n: 2, scratch, command: `cat ${scratch}/AGENTS.md` }))

  const before = snapshot(run)
  const r = spawnSync(process.execPath, [REPLAY, "--leaks", run], { encoding: "utf8" })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /demo#1 → dirty\(host\)  \[2 draw\(s\)\]/)
  assert.match(r.stdout, /demo#2 → clean  \[1 draw\(s\)\]/)
  assert.deepEqual(snapshot(run), before, "the replay writes nothing into the run directory")
})

test("replay --leaks exits 2 for a path that is not a run dir", () => {
  const missing = join(tmpdir(), `pdlc-replay-missing-${process.pid}-${Date.now()}`)
  const r = spawnSync(process.execPath, [REPLAY, "--leaks", missing], { encoding: "utf8" })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /not a readable run dir/)
})

test("replay --leaks exits 2 for a directory without cases/", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "pdlc-replay-empty-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const r = spawnSync(process.execPath, [REPLAY, "--leaks", dir], { encoding: "utf8" })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /not a run dir \(no cases\/\)/)
})

test("replay --leaks exits 2 for a run dir with no transcripts", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "pdlc-replay-notrans-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  mkdirSync(join(dir, "cases", "x--01"), { recursive: true })
  const r = spawnSync(process.execPath, [REPLAY, "--leaks", dir], { encoding: "utf8" })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /no transcripts in run dir/)
})

test("replay --leaks with no run dir exits 2 instead of scanning the store", () => {
  const r = spawnSync(process.execPath, [REPLAY, "--leaks"], { encoding: "utf8" })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /needs one or more run directories/)
  assert.match(r.stderr, /--all/)
})

test("replay --leaks --all with an empty store exits 2", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "pdlc-replay-all-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const r = spawnSync(process.execPath, [REPLAY, "--leaks", "--all", "--dir", dir], { encoding: "utf8" })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /no run directories found/)
})

test("replay --leaks --all skips an unfinished manifest-only run", (t) => {
  const store = mkdtempSync(join(tmpdir(), "pdlc-replay-store-"))
  t.after(() => rmSync(store, { recursive: true, force: true }))
  const scratch = "/var/folders/aa/T/eval-demo-1-abc"
  const good = join(store, "runs", "good-run")
  mkdirSync(join(good, "cases", "demo--01"), { recursive: true })
  writeFileSync(
    join(good, "manifest.json"),
    JSON.stringify({ status: "completed", params: { hostRoots: ["/Users/me/host/docs"] } }),
  )
  writeFileSync(
    join(good, "cases", "demo--01", "transcript.r1.md"),
    transcriptMd({ n: 1, scratch, command: "cat /Users/me/host/docs/specs/SPEC-0012-demo.md" }),
  )
  const broken = join(store, "runs", "running-run")
  mkdirSync(join(broken, "cases"), { recursive: true })
  writeFileSync(join(broken, "manifest.json"), JSON.stringify({ status: "running" }))

  const r = spawnSync(process.execPath, [REPLAY, "--leaks", "--all", "--dir", store], { encoding: "utf8" })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /good-run  demo#1 → dirty\(host\)  \[1 draw\(s\)\]/)
  assert.match(r.stdout, /skipped=1/)
  assert.match(r.stderr, /skipped .*running-run/)
})

const modern = (overrides = {}) => ({
  arm: "with-skill",
  status: "completed",
  startedAt: "2026-11-06T12:00:00.000Z",
  params: { isolate: true },
  ...overrides,
})

test("CLI exits 0 for a clean completed run", (t) => {
  const dir = makeRun(t, { manifest: modern(), cases: [{ name: "x--01", result: aggregate([rep({ rep: 1 })]) }] })
  const r = runCli(dir)
  assert.equal(r.status, 0)
  assert.match(r.stdout, /findings=0 warnings=0/)
  assert.match(r.stdout, /skillLeaks=0 hostReads=0 isolated=yes/)
})

test("CLI reports a stopped canary as warnings, not as 12/12", (t) => {
  const reps = Array.from({ length: 8 }, (_, i) => rep({ rep: i + 1 }))
  const dir = makeRun(t, {
    manifest: modern({ params: { isolate: true, repeat: 12 } }),
    cases: [{ name: "x--01", result: aggregate(reps, { reps: 8, stoppedEarly: true }) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 0)
  assert.match(r.stdout, /warn stopped-early implement-from-prompt#1 — reps=8 of requested 12/)
  assert.match(r.stdout, /findings=0 warnings=1/)
  assert.match(r.stdout, /reps=8/)
})

test("CLI exits 1 and names a leaking draw", (t) => {
  const leak = [{ tool: "shell", path: "/Users/me/.agents/skills/x/SKILL.md" }]
  const dir = makeRun(t, {
    manifest: modern(),
    cases: [{ name: "x--01", result: aggregate([rep({ rep: 2, leak })]) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /leak implement-from-prompt#1 r2/)
  assert.match(r.stdout, /SKILL\.md/)
})

test("CLI names a host-corpus read and denies isolation", (t) => {
  const leak = [
    {
      tool: "read",
      path: "/Users/me/host/docs/specs/SPEC-0012-demo.md",
      kind: "host",
      root: "/Users/me/host/docs",
    },
  ]
  const dir = makeRun(t, {
    manifest: modern(),
    cases: [{ name: "x--01", result: aggregate([rep({ rep: 2, leak })]) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /host implement-from-prompt#1 r2/)
  assert.match(r.stdout, /read host corpus/)
  assert.match(r.stdout, /skillLeaks=0 hostReads=1 isolated=no/)
})

test("CLI does not credit an old-detector run as isolated", (t) => {
  const dir = makeRun(t, {
    manifest: modern(),
    cases: [{ name: "x--01", result: aggregate([rep({ rep: 1, detectorVersion: "a31d58f79a6c7038" })]) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 0)
  assert.match(r.stdout, /findings=0 warnings=0/)
  assert.match(r.stdout, /isolated=unknown/)
})

test("CLI reports unknown when the manifest did not record isolation", (t) => {
  const dir = makeRun(t, {
    manifest: modern({ params: {} }),
    cases: [{ name: "x--01", result: aggregate([rep({ rep: 1 })]) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 0)
  assert.match(r.stdout, /skillLeaks=0 hostReads=0 isolated=unknown/)
})

test("CLI reports unknown for a v2 run that ran --no-isolate/--shared", (t) => {
  const dir = makeRun(t, {
    manifest: modern({ params: { isolate: false } }),
    cases: [{ name: "x--01", result: aggregate([rep({ rep: 1 })]) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 0)
  assert.match(r.stdout, /skillLeaks=0 hostReads=0 isolated=unknown/)
})

test("CLI treats an infrastructure draw as incomplete evidence, not clean", (t) => {
  const dir = makeRun(t, {
    manifest: modern(),
    cases: [
      {
        name: "x--01",
        result: aggregate([
          rep({ rep: 1 }),
          rep({
            rep: 2,
            status: "unscored",
            reason: "infrastructure: timeout",
            infrastructure: true,
            infrastructureReason: "timeout",
          }),
        ]),
      },
    ],
  })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /infrastructure implement-from-prompt#1 r2/)
  assert.doesNotMatch(r.stdout, /gate-miss/)
})

test("CLI fails an old timeout draw that predates the leak and infrastructure fields", (t) => {
  const old = rep({ rep: 1, status: "failed", reason: "exit timeout", execution: { exit: "timeout" } })
  delete old.leak
  delete old.contaminated
  delete old.infrastructure
  const dir = makeRun(t, {
    manifest: modern({ startedAt: "2026-11-05T11:35:22.934Z" }),
    cases: [{ name: "x--07", result: aggregate([old], { contaminated: 0 }) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /infrastructure implement-from-prompt#1 r1/)
  assert.match(r.stdout, /infrastructure: timeout/)
  assert.doesNotMatch(r.stdout, /gate-miss/)
})

test("CLI exits 2 for a path that is not a run dir", () => {
  const dir = mkdtempSync(join(tmpdir(), "pdlc-runcheck-missing-"))
  rmSync(dir, { recursive: true, force: true })
  const r = runCli(dir)
  assert.equal(r.status, 2)
  assert.match(r.stderr, /not a readable run dir/)
})

test("CLI downgrades a pre-detector run to warnings and reports them", (t) => {
  const old = rep({ rep: 1 })
  delete old.leak
  const dir = makeRun(t, {
    manifest: modern({ startedAt: "2026-11-05T15:35:30.459Z" }),
    cases: [{ name: "x--01", result: aggregate([old]) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 0)
  assert.match(r.stdout, /warn leak-missing implement-from-prompt#1 r1/)
  assert.match(r.stdout, /pre-SPEC-0017 artefact/)
  assert.match(r.stdout, /findings=0 warnings=1/)
})

test("CLI falls back to the repetition's arm without manifest.json", (t) => {
  const control = rep({
    rep: 1,
    arm: "without-skill",
    status: "failed",
    skillGate: { ok: true, loaded: [], reason: "no skill loaded (control arm)" },
  })
  const dir = makeRun(t, { cases: [{ name: "x--01", result: control }] })
  const r = runCli(dir)
  assert.equal(r.status, 0)
  assert.match(r.stdout, /findings=0 warnings=0/)
})

test("CLI fails a manifest-only run as incomplete", (t) => {
  const dir = makeRun(t, { manifest: modern() })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /incomplete cases r0 — run contains no case results/)
})

test("CLI fails a run whose manifest never completed", (t) => {
  const dir = makeRun(t, {
    manifest: modern({ status: "running" }),
    cases: [{ name: "x--01", result: aggregate([rep({ rep: 1 })]) }],
  })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /incomplete manifest r0 — status running; run did not complete/)
})

test("CLI fails a case directory without result.json", (t) => {
  const dir = makeRun(t, { manifest: modern(), cases: [{ name: "x--01" }] })
  const r = runCli(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /incomplete x--01 r0 — case directory has no result\.json/)
})
