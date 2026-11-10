---
spec: SPEC-0046
spec_sha: 7226cbab7c8342181a2771fe94a64eade62fb02b7eb8248c4cffb572ff10b608
---

# Implementation Prompt: SPEC-0046 Deny the control arm the installed corpus

## Source Spec

- `docs/specs/SPEC-0046-deny-control-arm-corpus.md` (pin `7226cbab…`)

Related: `docs/evals/coverage.md`, `docs/roadmap.md`,
`docs/specs/SPEC-0045-stack-review-evals.md` (the measurement that exposed
the block), TASK-43 (the detector half, `Done`).

## Requirements

**User outcome.** A maintainer can run a `--no-skill` cell on the measurement
host and know the child had no path to the installed corpus, because the boundary
is enforced below the tool layer and a canary proves it. Where that boundary
cannot be enforced, the run says `unknown` instead of claiming `yes`.

**Scope (from the spec).**

- An enforcement capability probed at run start and recorded in the manifest.
- Enforcement where it exists: on macOS, a seatbelt profile that denies reading
  the corpus (installed roots and `evals/<id>/cases.md`), with the mechanism
  named in the manifest.
- A deterministic canary: the same probe reads a known corpus path under the
  enforcement and must fail; without the enforcement it must succeed.
- Summary semantics: `isolated=yes` requires enforcement **and** zero
  `leak`/`host` findings; unenforced → `unknown`; findings → `no`.
- Publication: `docs/evals/coverage.md` stops attributing the block to TASK-43 and
  names SPEC-0046/TASK-71; `docs/roadmap.md` already carries the 0.7.0 placement
  — verify it and adjust only if it disagrees; `CHANGELOG.md` entry.

**Acceptance criteria** (copied from the spec):

- AC-1 — A run on a host without enforcement writes an explicit unenforced
  marker in its manifest; the summary never prints `isolated=yes` for it.
- AC-2 — On macOS the manifest names the mechanism and the run reports the
  boundary as enforced.
- AC-3 — The canary is not vacuous: the probe fails under the enforcement and
  succeeds without it; both asserted in the suite.
- AC-4 — A draw that reaches the corpus despite the enforcement still produces a
  named `leak` or `host` finding and is `isolated=no`, never `yes`.
- AC-5 — The evidence guard rejects `isolated=yes` when the manifest says the run
  was unenforced, and a test pins that rejection.
- AC-6 — `docs/evals/coverage.md` no longer calls this "the deny-layer half of
  TASK-43"; it names SPEC-0046/TASK-71 and states which skills stay `unresolved`
  until SPEC-0047 runs.
- AC-7 — The deny layer appears under 0.7.0 as a prerequisite of the corpus
  claim, with the cost of the wave named.
- AC-8 — Detector rules, skill text, templates, Python and the with-skill arm are
  unchanged, and every `tests:` command passes.

**Non-goals.** No re-measurement, no paid draws, no container, no Linux
enforcement claim, no detector-rule change, no five-draw change, no with-skill
change.

## Entities

| Term | Meaning |
| --- | --- |
| **corpus roots** | the host paths a control draw must not read: the installed skill roots (`~/.agents/skills`, `~/.claude/skills`, `~/.codex/skills`, `~/.config/opencode/skills`) and every host root the runner already records (`HOST_ROOTS` in `scripts/run-evals.mjs`) |
| **enforcement** | an OS-level denial of reads to those roots for the child process; today only macOS seatbelt |
| **mechanism** | the named implementation (`seatbelt`), `null` when unavailable |
| **probe** | the deterministic check that the boundary is real, no model call |
| **`isolation`** | the manifest record `{ enforced, mechanism, reason }` |
| **`isolated`** | the derived summary: `yes` only when `enforced === true` and zero findings; `no` when findings; `unknown` when unenforced or unrecorded |

## Approach

Two constraints shape the work.

1. **Do not redefine `isolated=yes` retroactively.** Today `params.isolate: true`
   means "throwaway home + the detector found nothing". It is not proof of
   enforcement. If the new rule required `enforced === true` for every manifest,
   every historical row that cites `isolated=yes` would become a
   `check-evidence` error and the inventory would have to be rewritten. Do not do
   that. Add `params.isolation` as a **new** field; treat a manifest without it
   as legacy and keep today's rule; apply the stricter rule only when the field
   is present. The spec's AC-5 says "when the manifest says the run was
   unenforced" — a legacy manifest says nothing, so it is not unenforced.
2. **Enforce below the tool layer, and prove it.** `external_directory: deny` is
   a permission preference; a `bash` call bypasses it. The child must be spawned
   under the boundary. The canary must fail *under* the boundary and pass
   *without* it, or it proves nothing.

Sequence: probe → wrap the spawn → canary test pair → summary derivation →
manifest field → evidence guard → publication.

## Structure

- `scripts/lib/evals/isolation.mjs` — `isolateHome`, the deny preference, and the
  natural home for `probeIsolation()` and `wrapCommand()`.
- `scripts/lib/evals/agent.mjs` — `runAgent` spawns the child; the wrapper must
  reach the `spawn(command, args, …)` call without changing the env scrubbing,
  `detached`, or the process-group kill.
- `scripts/lib/evals/execute.mjs` — calls `spawnAgent({ args, cwd, env, … })`;
  it must pass the wrapped command through, including on the retry path.
- `scripts/lib/evals/runcheck.mjs` — `checkRun({ isolation })` at line ~224
  derives the verdict; extend it to consume the richer record while keeping the
  boolean legacy path.
- `scripts/lib/evals/evidence.mjs` — `checkCitation` reads the run record; the
  guard belongs there (or in the resolver that feeds it).
- `scripts/run-evals.mjs` — computes `ISOLATION`/`CHILD_ENV` at line ~368 and
  writes the manifest at line ~330.
- `scripts/check-eval-run.mjs` — line ~55 reads `params.isolate` into the record;
  it must read `params.isolation` too.
- `scripts/check-evidence.mjs` — line ~101 derives `isolation` from
  `params.isolate` and passes it to `checkRun`; the resolver that builds the run
  record must carry the richer field for the guard.
- `scripts/replay-evals.mjs` — reads the manifest; it must not upgrade a legacy
  run.
- `docs/evals/coverage.md`, `docs/roadmap.md`, `CHANGELOG.md`.

Reuse: `scrubEnv` and `agentArgs` in `agent.mjs`; `leakEntries`, `leakPaths` and
the `isolated` derivation in `runcheck.mjs`; the run resolver in
`check-evidence.mjs`; do not add a parallel summary path.

## Operations

1. **Probe.** Add `probeIsolation({ platform = process.platform, command = "sandbox-exec" } = {})`
   to `isolation.mjs`. It returns `{ enforced, mechanism, reason }`: on `darwin`
   with the binary present, `{ enforced: true, mechanism: "seatbelt", reason }`;
   elsewhere `{ enforced: false, mechanism: null, reason: "<why>" }`. It must not
   spawn anything and must be unit-testable by injection. Add its test.
2. **Profile and wrapper.** Add `wrapCommand({ command, args, roots, mechanism })`
   returning `{ command, args }`. For seatbelt, prepend
   `sandbox-exec -p <profile>`; the profile starts from `(version 1)`,
   `(allow default)`, then one `(deny file-read* (subpath "<root>"))` per corpus
   root. Reject an empty `roots` list loudly — a boundary over nothing is a lie.
   Unit-test the argument shape (no real spawn).
3. **Plumb the child.** `executeCase` accepts the wrapper result (or a `spawn`
   override) and passes it through `spawnAgent`; `runAgent` keeps `env`,
   `detached`, `PWD` and the watchdog unchanged. The retry path must use the same
   wrapper. In `run-evals.mjs`, compute the probe once, keep the parent unsandboxed,
   and pass the wrapper to the child.
4. **Manifest.** Write `params.isolation = { enforced, mechanism, reason }` next
   to the existing `isolate` field. Never write `enforced: true` when the wrapper
   was not applied.
5. **Canary.** Add a test pair to `isolation.test.mjs` (or a sibling):
   a probe that `read`s a known corpus path **must fail** under the wrapper and
   **must succeed** without it. Skip with an explicit reason when enforcement is
   unavailable — never pass vacuously. The test must name the path it tried.
6. **Summary.** Extend the `isolated` derivation: `yes` iff the record is present,
   `enforced === true`, the detector is current, no leak/host finding and at
   least one behavioural draw; `no` when findings exist; `unknown` when the
   record is absent (legacy) or `enforced === false`. Keep the legacy boolean
   path for manifests without the field. Add tests for the three new shapes.
7. **Evidence guard.** When a citation claims `isolated=yes` for a run whose
   manifest carries `isolation.enforced === false`, emit an `error` (a new rule
   name, e.g. `unenforced-isolation`). Do not fire on legacy manifests. Add the
   test.
8. **Replay.** `replay-evals.mjs` must read `params.isolation` when present and
   must not infer enforcement from `isolate: true`. Add or extend its test.
9. **Publication.** In `docs/evals/coverage.md`, replace every "the deny-layer
   half of TASK-43" construction with the SPEC-0046/TASK-71 reference and state
   that the four blocked cells stay `unresolved` until SPEC-0047. Confirm the
   0.7.0 row and the "0.7.0 — the order" step 0 in `docs/roadmap.md` match the
   decision; edit only on disagreement. Add the `CHANGELOG` entry.
10. **Spec `files:`.** If any file outside the declared list had to change, stop
    and report it; the amendment path is the coordinator's, not the worker's.
11. **Gates.** Run the eight `tests:` commands from the worktree with `node`.

## Norms

- `node`, not bun. Tests live next to the module (`*.test.mjs`).
- Comments explain *why*, and cite the measurement that forced the change
  (SPEC-0045: 33 of 35 control draws read the install).
- No new dependency: `sandbox-exec` is a platform binary; prefer it to a package.
- Commit: `feat(SPEC-0046-deny-control-arm-corpus): <summary>`.
- Prose in docs stays in English.

## Safeguards

- Do not report `isolated=yes` from the absence of findings alone.
- Do not silently fall back to unenforced and keep the old claim: fall back to
  `unknown`.
- Do not widen the deny to `~/.local` or `~/.config/opencode`: that is provider
  auth and state, and a run without auth aborts and costs a paid draw for
  nothing.
- Do not sandbox the parent. The runner reads the corpus to stage and verify.
- Do not touch `leak.mjs` detector rules, the five-draw rule, the with-skill arm,
  the skill text, the templates, Python or any fixture.
- Do not run a paid eval. No model call is needed for any AC.
- Do not edit an acceptance criterion, the spec's scope, or the fixtures to make
  a gate pass.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | Unit: an unenforced probe yields `enforced: false`; the derived summary is `unknown`; the manifest writer emits the record |
| AC-2 | Unit on the probe + one real run manifest on macOS naming `seatbelt`; the wrapper test asserts the args |
| AC-3 | The canary pair: `read` of a corpus path fails under the wrapper, succeeds without it; the skip path names why |
| AC-4 | `checkRun` with a leak/host finding plus `enforced: true` yields `isolated=no` |
| AC-5 | `checkCitation` emits `unenforced-isolation` for `isolated=yes` on an `enforced: false` manifest, and does not fire on a legacy one |
| AC-6 | `grep -rn "TASK-43" docs/evals/coverage.md` returns no deny-layer attribution; the four skills are named with SPEC-0047 |
| AC-7 | `docs/roadmap.md` 0.7.0 row names SPEC-0046 and the wave cost |
| AC-8 | The eight `tests:` commands exit 0; `git diff --name-only` stays inside `files:` |

Done when every AC passes, the eight gates are green, and the branch is committed.
