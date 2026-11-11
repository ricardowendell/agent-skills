---
id: SPEC-0069
title: Does the description actually route
status: ready
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
4. Every cited run passes `check-eval-run`; its `isolated` and `skillHash` are
   published.
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

_Filled during implementation._
