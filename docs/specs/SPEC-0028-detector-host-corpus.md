---
id: SPEC-0028
title: Make the leak detector see the host corpus
status: implemented
priority: P1
task: TASK-43
created_at: 2026-11-06
updated_at: 2026-11-08
source_docs:
  - docs/evals/coverage.md
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/evals/pipeline-bookends-matrix.md
related_decisions: []
depends_on: []
blocks:
  - SPEC-0029-measure-cross-skill-routing
  - SPEC-0030-fix-the-near-miss-trigger
  - SPEC-0031-remeasure-under-detector-v2
files:
  - scripts/lib/evals/leak.mjs
  - scripts/lib/evals/runcheck.mjs
  - scripts/lib/evals/runcheck.test.mjs
  - scripts/lib/evals/leak.test.mjs
  - scripts/replay-evals.mjs
  - scripts/run-evals.mjs
  - scripts/check-eval-run.mjs
  - docs/evals/coverage.md
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/specs/SPEC-0028-detector-host-corpus.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0028: Make the leak detector see the host corpus

## Purpose

`leak.mjs` decides what counts as a clean control draw. Its rules cover skill
roots (`~/.agents/skills`, `~/.claude/skills`, `~/.config/opencode/skills`,
`$TMPDIR/opencode/*/skills`) and the answer key (`references/evals.md`). They do
not cover the host checkout: `docs/`, `AGENTS.md`, `scripts/` and `.lane/trees`.

The 0.5.0 measurement found the hole by accident. A control draw read
`/Users/wendell/.agents/docs/specs/SPEC-0012-*.md` and the global `AGENTS.md`
with `read` and `sed`, and `check-eval-run` still printed `findings=0`. The
canary that read its own worktree under `.lane/trees` was the same. Three cells
were published as `unresolved` because their controls were contaminated; we
could not tell which of the other cells were contaminated in the same way.

"Clean" currently means "did not read an installed skill". It has to mean "did
not read anything outside the scratch".

## User Outcome

A draw that reads the host corpus is named as such, and the checker says plainly
whether a cell is isolated or merely free of skill reads. Replaying the 0.5.0
runs with the new detector produces a list of published cells that no longer
hold — before anyone spends another draw.

## Scope

- **Extend the detector to absolute host roots.** A read that resolves into the
  host checkout (`docs/`, `AGENTS.md`, `scripts/`, `skills/`, `runs/`) or into
  `.lane/trees/` is a finding, with the root named. A read inside the scratch
  stays invisible, and a read into the throwaway home
  (`opencode-eval-home-*`) stays invisible: it does not exist, and flagging it
  is the false positive the current rules already avoid.
  - The pure function takes the host roots from the caller (`leak({ calls,
    scratch, hostRoots })`) so a test can control them and the replay can derive
    them from the run. The runner records the roots it used in the manifest.
- **Separate the two verdicts in `checkRun`.** The summary distinguishes
  `skillLeaks` from `isolated`: `findings=0` no longer implies isolation. The
  existing `leak` finding keeps its meaning; a new `host` finding names the read.
- **Replay the published runs.** `scripts/replay-evals.mjs --leaks` recomputes
  the detector from the stored transcripts, with no model and no write to the
  run directory, and prints `cell → clean | dirty(rule)` for a run directory
  list. Run it over the 0.5.0 wave and publish the table in
  `docs/evals/coverage.md` under a "Detector v2" note.
- **The detector version moves.** `DETECTOR_VERSION` is a digest of the rules
  and a test pins it; changing the rules changes the version consciously. Runs
  written before the change keep v1 and stay citable as history, not as clean
  measurements.

**Blast radius.** One pure module and its rules, the checker summary, the replay
CLI, one documentation section. No skill, fixture, assertion or runner
scheduling change. **No model draw.**

## Non-Goals

- **No re-measurement here.** The cells the replay invalidates are SPEC-0031.
  This spec produces the list, not the new numbers.
- **No change to the deny rules.** Detecting a read is the guarantee the repo
  already chose (SPEC-0017, TASK-29). Denying the host checkout at the
  permission layer is a separate decision with its own risk of breaking
  fixtures; it is not smuggled in.
- **No rewriting of published run directories.** The numbers stay; the note
  says which detector produced them.
- No judge and no new case.

## Flow

1. **F0 — repro.** Replay a 0.5.0 control transcript that read the host
   `docs/`; today it reports no finding.
2. **F1 — rules.** Add the host roots and the `host` finding, with the pure
   signature change.
3. **F2 — checker.** Split the summary; keep the exit contract.
4. **F3 — replay.** `--leaks` over the 0.5.0 runs; the table lands in
   `coverage.md`.
5. **F4 — version.** Update the golden digest and say what changed.

## Data

- `~/.local/share/opencode/evals/runs/<run>/cases/<case>/transcript.r*.md` — the
  tool calls the replay re-reads.
- `<run>/manifest.json` — `repoSha`, `arm`, and the host roots recorded by the
  new runner.
- `docs/evals/coverage.md` — the "Detector v2" note and the invalidation table.

## Acceptance Criteria

1. **A host read is a finding.** A draw that reads the host `docs/`, `AGENTS.md`,
   `scripts/` or `.lane/trees` produces a named finding; a draw that reads only
   inside the scratch, or into the throwaway home, does not.
2. **The two verdicts are separate.** `check-eval-run` prints whether a cell has
   no skill reads *and* whether it is isolated; `findings=0` alone no longer
   reads as isolated.
3. **The replay is real.** `node scripts/replay-evals.mjs --leaks <run-dir…>`
   recomputes from transcripts, names each cell `clean` or `dirty(rule)`, writes
   nothing into the run directory, and spends no model.
4. **The invalidation list is published.** The 0.5.0 runs are replayed and every
   cell whose clean claim does not survive is named in `docs/evals/coverage.md`,
   with its run directory.
5. **Tests cover the rules.** One fixture per new root, one negative inside the
   scratch, one negative in the throwaway home, and the golden digest updated
   with the rule change.
6. **No drift.** The five policy gates pass, `git diff main...HEAD -- skills/` is
   empty, and the spec spends no draw.

## Results

- **Detector v2.** `leak.mjs` takes `hostRoots` from the caller and returns a
  `host` hit (with the **most specific** matching root) for an absolute read into
  the recorded host corpus, separate from the `leak` hit for skill
  roots/`references/evals.md`.
  `DETECTOR_VERSION` moved from `a31d58f79a6c7038` to `71bfb85a91cd68ab`; the
  test golden is updated to the new digest. The roots include the checkout root
  itself, so `git -C <checkout> log`, `.git/`, `CONTRIBUTING.md`, `package.json`
  and `.pdlc/` are covered. `run-evals.mjs` records the roots it used in
  `manifest.params.hostRoots` and the isolation mode in `manifest.params.isolate`
  (`--no-isolate`/`--shared` write `false`), and keeps the hit kind in each
  repetition's artifact.
- **Three-state verdict.** `checkRun` reports `skillLeaks`, `hostReads` and
  `isolated=yes|no|unknown`: `no` only when a skill or host read was detected,
  `yes` only for a v2 run with `params.isolate: true` and no read, and `unknown`
  for v1, a missing isolation record, or unproven provenance. `check-eval-run`
  prints the fields and keeps the 0/1/2 exit contract.
- **Replay.** `replay-evals.mjs --leaks <run-dir…>` re-reads the stored
  transcripts, derives host roots from the manifest (or the main checkout for
  pre-v2 runs), prints `cell → clean | dirty(rule)` per run and writes nothing.
  A missing path, a directory without `cases/`, or a run with no transcripts is
  a named error and exit 2; `--leaks` without run directories requires `--all`
  instead of silently scanning the store. `--all` skips runs whose manifest is
  not `completed` and reports `skipped=N`; exit 2 is reserved for explicitly
  named dirs.
- **0.5.0 replay.** 49 run directories / 57 cells: 26 dirty, 6 of them clean
  under v1 (1 already discarded, 5 newly invalidated). Among the new ones are
  the controls for `write-implementation-prompt` #2 (`2026-11-06T15-30-39`) and
  #4 (`2026-11-06T14-37-23`), each with one denied read of the checkout root:
  the published `0/5` and `5/5` are now **0/4 replay-clean** and **4/5 draws
  clean (4/4 passed)**. SPEC-0031 re-measured both at v2: #2 is **0/4 clean**
  (unresolved) and #4 is **2/2 clean passed** (non-discriminator). The
  corrections are beside the
  published numbers in `docs/evals/coverage.md` and
  `docs/evals/write-implementation-prompt-matrix.md`. The record-decision
  controls and the agentworks controls replay clean, so the host was read by
  many controls, not all. The 0.5.0 rows are replay-verified v1 history, not v2
  measurements.
- **No draw.** No model was called; all five gates pass (289 harness tests, 17
  bootstrap tests, sensor parity 2/2).

## Open Questions

- **Do the host roots belong in the manifest?** They are machine-specific. The
  alternative is for the replay to derive them from the transcript's absolute
  paths, which is guesswork. Recording them is the smaller lie.
- **Does the deny layer come later?** Probably, but only after the replay shows
  how often a control reaches the host. If it is rare, detection is enough; if
  it is every control, denying is the only honest fix.

## Prompt Notes

- **Requirements**: host-corpus reads are findings; isolation is reported
  separately; the 0.5.0 runs are re-judged without new draws.
- **Entities**: rule, host root, finding kind (`leak` vs `host`), detector
  version, cell.
- **Approach**: extend the pure rule set first, then the checker summary, then
  the replay CLI. The replay must not write into a run directory.
- **Structure**: `leak.mjs` owns the rules and the digest; `runcheck.mjs` owns
  the verdict; `replay-evals.mjs` reads transcripts and prints.
- **Operations**: keep the existing exit codes; a dirty cell is printed, not
  thrown.
- **Norms**: the detector is pure and the digest is derived; never hand-edit
  `DETECTOR_VERSION`.
- **Safeguards**: do not flag the throwaway home; do not rewrite published
  numbers; do not change the deny rules in this spec.
- **Tests**: rules by fixture, the two negatives, the golden digest, and one
  replay over a synthetic transcript set.
