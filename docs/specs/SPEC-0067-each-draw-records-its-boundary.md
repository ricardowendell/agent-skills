---
id: SPEC-0067
title: Each draw records the boundary it ran under
status: implemented
priority: P1
task: TASK-103
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-103 - evals-resume-rebaixa-o-isolamento-de-uma-celula-legada.md
  - docs/specs/SPEC-0034-iterative-corpus.md
  - docs/evals/iterative-corpus.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/isolation.mjs
  - scripts/lib/evals/isolation.test.mjs
  - scripts/lib/evals/runcheck.mjs
  - scripts/lib/evals/runcheck.test.mjs
  - scripts/eval.mjs
  - docs/evals/iterative-corpus.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0034-iterative-corpus.md
  - docs/specs/SPEC-0067-each-draw-records-its-boundary.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/SPEC-0067-each-draw-records-its-boundary.md --base main
---

## Purpose

A resume is supposed to finish a wave without weakening it. Today it weakens the
cell's boundary claim, and it does so by asserting something it cannot know.

`scripts/lib/evals/isolation.mjs:183-192`: when a manifest has no
`params.isolation`, `resumeIsolation` writes
`{ enforced: false, reason: RESUMED_LEGACY_REASON }` — *"resumed legacy run —
earlier draws were not enforced"*. The record is one object for the whole run, so
the draw that **did** run under seatbelt is flattened into the same claim as the
draws that predate the mechanism, and the absence of a field is turned into a
statement about what happened.

The consequence is already published: the corpus's only separator has its control
arm at `isolated=unknown` (`docs/evals/iterative-corpus.md`, `coverage.md:56`),
and the run directory
`2026-11-08T06-44-22--implement-from-prompt--…--without-skill` was rewritten in
place to say `enforced: false` for all five draws after `r3` was re-run under
seatbelt. A resume must not be able to do that.

## User Outcome

- A resumed cell says per draw what the harness can prove, and nothing more.
- A draw that ran under the mechanism is recorded as enforced even when its
  siblings predate it; a draw that predates the mechanism is recorded as
  **unproven**, not as "not enforced".
- `check-eval-run` still fails closed: a cell is `isolated=yes` only when every
  behavioural draw is proven. It just says *which* draws are the reason.
- The published corpus states the consequence honestly instead of implying that a
  resume broke a boundary that was there.

## Scope

### F1 — the record belongs to the draw

`isolationRecord` (already the one constructor) is written into each draw's
`result.json` as `isolation`, beside `status` and `detectorVersion`:

- `{ enforced: true, mechanism, reason }` — the draw ran wrapped by the mechanism;
- `{ enforced: false, mechanism: null, reason }` — this build asked and could not
  enforce (the existing `isolationRecord` contract, unchanged);
- `null` — the draw has no record: either the build predates the probe, or it
  had the probe but predates per-draw recording. The record cannot tell these
  apart, so it says "unrecorded" and neither rewrites absence into a claim nor
  invents a build order.

### F2 — the manifest stops lying and starts summarising

`resumeIsolation` no longer writes a verdict about the earlier draws. It writes a
manifest summary that is derived from the draws:

- `enforced: true` only when **every** behavioural draw records `enforced: true`;
- otherwise `enforced: false` with a reason that names the count, e.g.
  `"4 of 5 draws carry no enforcement record; r3 ran under seatbelt"`. A draw
  with no record is *unrecorded*: absence has two causes (a build before the
  probe, or a build with the probe but before per-draw recording) and the fold
  cannot tell them apart, so it never says "predates the probe";
- `RESUMED_LEGACY_REASON` becomes `"resumed legacy run — earlier draws carry no
  enforcement record"`, because that is the fact. A claim that they *were not*
  enforced requires evidence this harness does not have.

The existing guards that stop a resume from claiming a boundary the current
invocation did not have stay: a `--resume --no-isolate` still downgrades the new
draws, and the summary follows them down.

### F3 — the readers use the draw, not only the manifest

`manifestIsolation` / `checkRun` prefer a draw's own record; the manifest summary
is the fallback for a run whose draws predate per-draw recording (so every
existing run keeps the same answer it gets today). `eval.mjs`'s
`isolated=yes|unknown` line (`scripts/eval.mjs:1277`) keeps its rule — all
behavioural draws proven — and gains the reason it prints today only in
`check-eval-run`.

### F4 — republish the consequence

`docs/evals/iterative-corpus.md`, `coverage.md:56` and `SPEC-0034` state the cell
as: `#12` control `isolated=unknown` because **four of five draws predate the
enforcement probe**; `r3` was re-run under seatbelt and records it. The separator
survives for the reason already published — the control's red is an edit, and an
answer-key leak biases toward passing — and that argument is repeated where the
caveat lives.

## Non-Goals

- **No re-draw and no backfill.** The four legacy draws keep `isolation: null`. A
  number is not invented to make the cell `yes`; making it `yes` would require a
  new measurement, which is `TASK-92`/`TASK-101` territory.
- **No change to the deny layer, the detector or `params.isolate`.** The legacy
  boolean still means "throwaway home", never "the corpus was denied"
  (`runcheck.mjs:120`).
- **No new status value.** The status vocabulary stays
  `passed`/`failed`/`unscored`/`staged`.
- **No paid draw.** Every test seeds a manifest and a draw.
- **No rewrite of another run directory.** The store is read-only here; the
  reference run is inspected, never edited.

## Flow

1. **F1 — write per draw.** Thread `isolationRecordFor(level)` into `runDraw`'s
   record and persist it; a legacy draw parsed back without the field stays
   `null`.
2. **F2 — summarise.** Replace the `resumeIsolation` body; keep its signature so
   `eval.mjs:862` is a one-line change at most.
3. **F3 — read per draw.** `manifestIsolation(manifest, draws)` returns the
   per-draw union when the draws carry records, else the manifest record, else
   the legacy boolean. `checkRun` reports the reason per cell.
4. **F4 — republish.** Update the three documents and the caveat paragraph.

## Data

- `scripts/lib/evals/isolation.mjs:164-209` — `isolationRecord`,
  `RESUMED_LEGACY_REASON`, `resumeIsolation`.
- `scripts/eval.mjs:224-228` (`isolationRecordFor`), `:826`, `:862`, `:1277`.
- `scripts/lib/evals/runcheck.mjs:118-127` (`manifestIsolation`), `:241-256`
  (the `isolated` rule).
- Reference run (read-only):
  `~/.local/share/opencode/evals/runs/2026-11-08T06-44-22--implement-from-prompt--agentworks-deepseek-v4-1-flash--without-skill`.
- `docs/evals/iterative-corpus.md:119-123`, `docs/evals/coverage.md:56`,
  `docs/specs/SPEC-0034-iterative-corpus.md` (the caveat and the `#12` row).

## Acceptance Criteria

1. A fresh behavioural draw stores its own `isolation` record; a smoke draw says
   why nothing was applied.
2. `resumeIsolation` never writes "earlier draws were not enforced". The reason
   distinguishes *unproven* from *known-unenforced*.
3. A resumed cell with four unrecorded draws and one enforced draw summarises as
   `4 of 5 draws carry no enforcement record`, and the enforced draw's own
   record survives. Draws built after the deny layer (`repoSha 8aab5bd`) must not
   be described as "predating the probe".
4. `checkRun` returns `isolated=unknown` for that cell — failing closed — and the
   finding names the unproven draws.
5. A cell whose every behavioural draw records enforcement is still
   `isolated=yes`; a cell with one draw known-unenforced is not.
6. `--resume --no-isolate` still downgrades the new draws and the summary follows.
7. Re-reading the reference run co-located in a temp copy yields the same counts
   it yields today, with the corrected reason and per-draw provenance; the store
   itself is untouched.
8. The three documents state the `#12` control caveat as unproven legacy draws,
   and keep the reason the separator still stands.
9. Zero paid draws; every command in `tests:` exits 0.

## Decisions

- **Provenance is per draw.** A cell is a set of draws made at different times
  under different builds; one boolean for the set can only ever be the weakest
  one, which is why the honest answer is a list and the cell verdict is a fold.
- **Absence is not evidence of absence.** "No record" and "recorded as not
  enforced" are different facts and must read differently. The old string
  collapsed them, and the corpus quoted it.
- **Unrecorded is not unenforced, and it is also not "older than the probe".**
  A draw without a record could have been built before the probe or after it but
  before per-draw recording; the harness cannot tell which from an absent field,
  so the reason says `carry no enforcement record` and adds no build-order claim
  unless the draw itself proves it.
- **Fail closed stays.** `unknown` is the correct cell verdict while four of five
  draws are unproven, even though this makes the separator's control arm look
  weaker. The alternative — inferring enforcement from a manifest written by a
  build that had no mechanism — is the failure this repository exists to prevent.
- **Do not re-draw to buy a `yes`.** Converting `unknown` into `yes` is a
  measurement decision with a price, not a documentation fix.

## Open Questions

None.

## Prompt Notes

- `isolationRecord` already refuses to claim enforcement without a mechanism;
  keep that rule and reuse it. Do not add a second constructor.
- `resumeIsolation`'s callers pass only the manifest today; the draws are in the
  same run directory. Read them, or accept them as an argument — either is fine,
  but the summary must be derived, not asserted.
- Keep `manifestIsolation`'s legacy boolean fallback for a manifest with no record
  and no per-draw records; that is what keeps every older run's verdict stable.
- Test with seeded directories only. Never write into `~/.local/share/opencode`.

## Results

**F1 — per draw.** `runCase` writes `isolation: ctx.isolation` beside
`detectorVersion` in the draw artifact (`draws/rN.json` and `repetitions[]`), in
the smoke draw as the `not applied: smoke stages only, no child draw` refusal, and
in both `fixture failed to stage` paths as provenance (the missing `leak` field
keeps those draws `unknown`). A draw without the field parses back as `null`
(`drawIsolation`); nothing is invented for it.

**F2 — derived summary.** `resumeIsolation(manifest, current, draws)` derives the
manifest record from the draws: `enforced: true` only when every behavioural draw
proves it; otherwise the counted reason (`4 of 5 draws carry no enforcement
record; r3 ran under seatbelt`). A draw with no field is *unrecorded* — the fold
does not infer that it predates the probe. `RESUMED_LEGACY_REASON` is now `resumed
legacy run — earlier draws carry no enforcement record`. A resume that cannot
enforce still lowers the summary and says so (`mixes enforced and unenforced
draws …`). `eval.mjs` calls it again after the draws so the persisted summary
covers the reused and the re-run draws.

**F3 — readers.** `manifestIsolation(manifest, draws)` and `checkRun` fold the
draws first, then the manifest record, then the legacy boolean. The stored
`earlier draws were not enforced` string is restated as "no record"; a cell that
is not proven gets an `isolation-unproven` warning naming the count. Every
existing run keeps its verdict: a scan of the whole store with the pre-change and
post-change checker differs only on the reference cell, and only in the reason.

**Reference run** (read through a temp copy; the store was not written):

```text
before  cases=1 reps=5 findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=unknown
        (no reason printed)
after   warn isolation-unproven implement-from-prompt#12 — 5 of 5 draws carry no enforcement record (unproven: r1, r2, r3, r4, r5)
        cases=1 reps=5 findings=0 warnings=1 skillLeaks=0 hostReads=0 isolated=unknown
```

The five stored draws carry no `isolation`; `r3` is distinguished only by its
provenance (`cf2e2e319d975a5b`, `8aab5bd`), so the reader counts five unrecorded
draws rather than asserting that four of them predate the probe or that any of
them was unenforced.

**F4 — republished.** `docs/evals/iterative-corpus.md`, `docs/evals/coverage.md`
and `SPEC-0034` now state the control is `isolated=unknown` because four of five
draws predate the enforcement probe and none of the five carries an enforcement
record; `r3` was re-run under seatbelt and the directory records that re-run. They
repeat why the separator still stands (the control's red is an edit; a leak biases
toward passing), and the corpus Gates row is quoted from the command's current
output (`warnings=1`, `isolated=unknown`).

**Gates.** Every `tests:` command exited 0; zero draws were spent.
