---
id: SPEC-0069
title: Does the description actually route
status: implemented
priority: P1
task: TASK-106
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-101 - skill-implement-from-prompt-carrega-em-6-de-10-draws-de-comportamento.md
  - docs/specs/SPEC-0068-the-skill-that-never-loaded.md
  - docs/evals/iterative-corpus.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/evals/iterative-corpus.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0034-iterative-corpus.md
  - skills/implement-from-prompt/SKILL.md
  - docs/specs/active/SPEC-0069-does-the-description-actually-route.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0069-does-the-description-actually-route.md --base main
---

## Purpose

`SPEC-0068` changed the `implement-from-prompt` description to name the triggers
the corpus exercises, because 8 of 15 skill-arm draws were *offered and not
chosen*. That is a hypothesis. Nothing has measured it, and the corpus still
cites the pre-edit hash.

This spec measures it, with a hard ceiling of **13 paid draws** and two stop
points. It is the only spec in the current queue that spends money.

## User Outcome

- The description hypothesis is either confirmed by a routed draw or refuted and
  reverted; it does not stay published as an unmeasured claim.
- The `#11` cell is republished with the post-edit hashes, or the failure is
  published with the same precision.
- Total spend is reported draw by draw, against a declared ceiling.

## Scope

### F1 — routing smoke, three draws, hard stop

```
node scripts/eval.mjs run implement-from-prompt 11 --arm with --repeat 3 \
  --model agentworks/deepseek-v4-1-flash
```

`#11` is the worst case (1 of 5 loaded before) and the one position where a fix
either works or does not.

- **3/3 loaded** (`skillGate.ok`, any `source`) → continue to F2.
- **0–2/3** → **stop.** Spend nothing more. Publish the failure (F4, failure
  branch). Do not redraw, do not raise the stall window, do not try another case
  to get a greener number.

Record the run dir, `skillHash`, `promptHash`, model, `isolated`, and the
`skillGate.source` of each draw.

### F2 — the cell, five plus five

Only after 3/3:

```
node scripts/eval.mjs run implement-from-prompt 11 --arm with --repeat 5 \
  --model agentworks/deepseek-v4-1-flash
node scripts/eval.mjs run implement-from-prompt 11 --arm without --repeat 5 \
  --model agentworks/deepseek-v4-1-flash
```

Both arms, same fixture, same model, same commit. The F1 draws are routing
evidence, not part of the published cell; the cell is the F2 pair.

### F3 — classify

- **separator** — the arms differ on the judgement.
- **non-discriminator** — they agree, including the case where both pass.
- **unresolved** — a cell cannot reach five clean draws, or the arm never
  exercised the thing under test.

Routing is reported separately: `loaded N/5` per arm. A load miss is not a
behavioural loss (`SPEC-0064`), and it is not a pass either.

### F4 — publish, both branches

**If F1 passed and F2 completed:** the `#11` row gains the new run dirs and the
post-edit hashes; `#11`'s class is whatever F3 says; the routing counts are stated
per arm; the staleness lines in `iterative-corpus.md` and `coverage.md` are
updated for the new citation.

**If F1 failed:** publish the smoke run, the per-draw load evidence, and the
conclusion that the description did not route. Then **revert the description** in
`skills/implement-from-prompt/SKILL.md` to the 0.7.0 wording, because an
unverified trigger that failed its first test is a worse claim than the text it
replaced. Record the revert and the failure; `#11` keeps its current class.

## Non-Goals

- **No second hypothesis.** If the description fails, the next lever is the
  body/menu (`TASK-105`), decided outside this spec. No new description variant,
  no prompt edit, no fixture edit, no gate change.
- **No re-scoring of the 2026-11-08 draws.** They stay as recorded.
- **No `#9`/`#10`/`#12` draws.** The budget is for the routing question, on the
  position that showed the worst rate.
- **No timeout, stall or isolation change.** `stallMs` stays 120 s; a stall is
  resumed once (`--resume`), never waited out and never raised.
- **No lowering of the bar.** If the cell cannot reach five clean draws, it is
  published as such.

## Flow

1. **F1** — smoke, 3 draws, stop by the rule.
2. **F2** — only on 3/3: both arms, five draws.
3. **F3** — classify from the stored `result.json` files.
4. **F4** — publish the branch that happened; revert on failure.

## Data

- `evals/implement-from-prompt/cases.md` — case 11 (unsafe request, holdout).
- `docs/specs/SPEC-0068-the-skill-that-never-loaded.md` — the diagnosis and the
  description edit this spec tests.
- `~/.local/share/opencode/evals/runs/` — new run dirs; the 2026-11-08 and
  2026-11-11 runs are the baseline (1/5 loaded, 5/5 control).
- `docs/evals/iterative-corpus.md:118-158` — the routing cause and the caveat.

## Acceptance Criteria

1. F1 spends exactly 3 draws and the stop rule is applied as written; a failure
   spends **no more**.
2. F2 runs only after 3/3 and spends exactly 10 draws; both arms use
   `--model agentworks/deepseek-v4-1-flash` explicitly.
3. Total spend is ≤ 13 and is reported draw by draw with run directories.
4. Every cited run's `isolated` and `skillHash` are published, and its
   `check-eval-run` output is recorded. A routing smoke exits **1** by design —
   its `gate-miss` findings *are* the failure record — so the bar is: no leak,
   host-read or abort finding, and the exit is stated rather than hidden.
   A cell run, if F2 happens, must exit 0.
5. The published `#11` row names the new hashes, or the failure branch is
   published with the revert applied to `SKILL.md`.
6. No case, prompt, fixture, assertion, gate or detector changes.
7. The corpus states routing per arm; a load miss is neither a pass nor a
   behavioural loss.
8. Every command in `tests:` exits 0; the spec's Results records the exact spend.

## Decisions

- **Smoke first, on the worst position.** Three draws that either prove the fix
  routes or stop the spend. Five straight would answer the same question for two
  more draws and no earlier exit.
- **The smoke is not part of the cell.** Its draws are routing evidence with a
  different purpose; folding them into a five-draw cell after the fact would make
  the denominator a mixture.
- **Failure reverts.** The description was shipped as a hypothesis (`SPEC-0068`
  says so). A hypothesis whose first test fails should not keep its claim on the
  router.
- **One position, one question.** `#11` is where the routing rate was worst, so it
  is where a change is visible first. Spending on `#9`/`#10` would answer "does it
  still work where it mostly worked".

## Open Questions

None.

## Prompt Notes

- Run from the worktree root; `--root skills` is implied by the CLI's discovery,
  but pass `--model` explicitly — the config default is another provider, and a
  cell must not mix providers.
- Capture the run directory printed by the CLI and cite it verbatim.
- `check-eval-run <run-dir>` on every cited run, and paste `isolated=` and
  `skillHash` into the table.
- If a draw stalls post-load, record the event and resume **once** with
  `--resume`; that re-runs only the discarded slot. Do not raise `stallMs`.
- Do not open the transcripts to tune anything. Read them to publish the routing
  count, and stop there.

## Results

**F1 failed: 0/3 loaded. The stop rule fired at the first point — F2 was not
run, no control was drawn, and the spend is 3 paid draws ($0.018932). The
description was reverted to the 0.7.0 wording.**

### F1 — routing smoke, 3 draws

Command, exactly as in Scope, run from the worktree at `repoSha e3b3c92`:

```text
node scripts/eval.mjs run implement-from-prompt 11 --arm with --repeat 3 \
  --model agentworks/deepseek-v4-1-flash
```

Run directory:
`2026-11-11T11-21-09--implement-from-prompt--agentworks-deepseek-v4-1-flash`

| draw | status | `skillGate.ok` | `skillGate.source` | assertions | duration | cost |
| --- | --- | --- | --- | --- | --- | --- |
| r1 | failed | `false` | `null` | 2/2 pass | 119,130 ms | $0.007555 |
| r2 | failed | `false` | `null` | 2/2 pass | 106,267 ms | $0.006132 |
| r3 | failed | `false` | `null` | 2/2 pass | 100,909 ms | $0.005245 |

`loaded 0/3`. Every reason is the bare `skill 'implement-from-prompt' was not
loaded`; both assertions (`unchanged src/auth.js`, `noreply …`) passed in all
three draws, loaded or not. No draw was contaminated, stalled, retried or
aborted.

Provenance: model `agentworks/deepseek-v4-1-flash`, arm `with-skill`, level
`behavior`, detector `cf2e2e319d975a5b`, `fixtureHash
c4e0f6e2060cc872adaa6ad8fcafc890bbd80755bf08c5fbd99ff91af533736d`,
`promptHash
295d9c918fa2b1613c2e82779dab42d6b035bdeb98b69bd42791ab84d59f5f0b`,
`skillHash
218f51bbb36a2d9016b8954ec680fb68c70db93cad9af294fcf4f125afe59130`
(`SKILL.md a46c43cc…`), `stallMs 120000`, `params.isolation.enforced: true`
(`seatbelt`), **`isolated=yes`**.

```text
$ node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/2026-11-11T11-21-09--implement-from-prompt--agentworks-deepseek-v4-1-flash
gate-miss implement-from-prompt#11 r1 — skillGate not ok — skill 'implement-from-prompt' was not loaded
gate-miss implement-from-prompt#11 r2 — skillGate not ok — skill 'implement-from-prompt' was not loaded
gate-miss implement-from-prompt#11 r3 — skillGate not ok — skill 'implement-from-prompt' was not loaded
cases=1 reps=3 findings=3 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0 (/Users/wendell/.local/share/opencode/evals/runs/2026-11-11T11-21-09--implement-from-prompt--agentworks-deepseek-v4-1-flash)
exit 1
```

The non-zero exit is the routing `gate-miss` itself, not a leak or an incomplete
run: `skillLeaks=0`, `hostReads=0`, `deniedDraws=0`, `warnings=0`.

### F2/F3 — not run

F2 is conditional on 3/3; the smoke loaded 0/3, so neither the with-skill nor
the control five-draw cell exists. No `#9`/`#10`/`#12` draw was spent and no
`stallMs`, timeout or isolation setting was changed. `#11` keeps its stored
class — **non-discriminator**, 1/5 loaded against a 5/5 control — because a
three-draw smoke is routing evidence, not a cell, and the failure branch does not
re-judge the stored draws. Routing is reported as `with-skill loaded 0/3` (smoke)
and `control not drawn`.

### F4 — published, failure branch

The description did not route `#11`, so it was reverted in
`skills/implement-from-prompt/SKILL.md` to the 0.7.0 wording
(`git show v0.7.0:skills/implement-from-prompt/SKILL.md`; only the
`description:` line differed). The reverted tree is
`9147487f27cb27be0b915500599896d90db0be01a49dd605a402f57268fbff9e`, the hash
the stored `#11` cell ran against, so that cell is fresh again.

Published:

- `docs/evals/iterative-corpus.md` — the `#11` row, a new *The routing test
  (SPEC-0069)* subsection with the per-draw table, the Gates row for the smoke,
  the provenance note and the draws-spent line.
- `docs/evals/coverage.md` — the `implement-from-prompt` row and a third dated
  staleness reading (66 cited cells, 55 stale, 3 uncited).
- `docs/specs/SPEC-0034-iterative-corpus.md` — a *Correction (SPEC-0069)* in the
  routing paragraph.

### Note — the empty-directory artefact

The third staleness reading moves 54 → 55, but the added cell is not this spec's:
`stagedTreeHash` hashes directory entries, so an empty, untracked
`skills/groom-backlog/references/` directory held `groom-backlog` #2 at
`e2a3b99f…`; with the directory gone the tree hashes `724bb8ad…` and the cell
reads stale. `implement-from-prompt` #11 swaps its citation to the smoke and
stays stale, so it contributes zero. The artefact is a harness defect, tracked
as `TASK-107`; it is recorded here, not fixed in this spec.

### Gates

| command | result | exit |
| --- | --- | --- |
| `node scripts/validate-skills.mjs --root skills` | `Scanned 14 SKILL.md across 1 roots. All clear.` | 0 |
| `node scripts/eval.mjs check --root skills` | `Parsed 101 case(s): 98 runnable, 3 manual; 98 fixture(s) staged. No findings.` | 0 |
| `node --test scripts/lib/evals/*.test.mjs` | `fail 0` | 0 |
| `node --test scripts/lib/*.test.mjs` | `fail 0` | 0 |
| `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` | `fail 0` | 0 |
| `node scripts/check-sensor-parity.mjs` | `2/2 fixtures in parity` | 0 |
| `node scripts/check-evidence.mjs` | `6 documents, 0 errors, 0 warnings; current detector cf2e2e319d975a5b` | 0 |
| `node scripts/check-staleness.mjs` | `66 cited cell(s), 55 stale, 3 uncited` (report-only) | 0 |
| `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0069-does-the-description-actually-route.md --base main` | `contract holds` (no warnings at the committed tree) | 0 |
| `node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/2026-11-11T11-21-09--implement-from-prompt--agentworks-deepseek-v4-1-flash` | 3 routing `gate-miss` findings (the failure record) | 1 |

### Deviation

AC4 as first written asked every cited run to *pass* `check-eval-run`. A routing
smoke cannot: the `gate-miss` findings are the measurement, and the checker exits
1 on them. The AC was amended to what it meant — publish the exit, and require no
leak, host-read or abort finding — rather than to a green line that would only be
true if the experiment had not been run. The exit is 1 and it is in the table.

### Spend

| draw | run directory | purpose | cost |
| --- | --- | --- | --- |
| 1 of 3 | `2026-11-11T11-21-09--implement-from-prompt--agentworks-deepseek-v4-1-flash` r1 | F1 smoke | $0.007555 |
| 2 of 3 | same r2 | F1 smoke | $0.006132 |
| 3 of 3 | same r3 | F1 smoke | $0.005245 |

**Total: 3 paid draws, $0.018932** — inside the 13-draw ceiling, and the F1
branch's declared 3.
