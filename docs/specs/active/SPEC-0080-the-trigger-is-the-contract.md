---
id: SPEC-0080
title: The trigger is the contract, not the size of the edit
status: ready
priority: P0
task: TASK-110
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-110 - skills-implement-from-prompt-e-um-contrato-estruturado-nao-o-tamanho-do-edit.md
  - docs/evals/iterative-corpus.md
  - docs/specs/SPEC-0069-does-the-description-actually-route.md
  - docs/specs/SPEC-0034-iterative-corpus.md
related_decisions: []
depends_on: []
blocks:
  - SPEC-0081
files:
  - skills/implement-from-prompt/SKILL.md
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/iterative-corpus.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0080-the-trigger-is-the-contract.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0080-the-trigger-is-the-contract.md --base main
---

## Purpose

The corpus has measured `implement-from-prompt` in four iterative cases and the
result is not one number. `#12` separates (with skill 4/5, control 0/5); `#9`
does not (4/5 vs 5/5); `#10` is `unresolved` on routing gate-misses; `#11` is a
non-discriminator (1/5 loaded, 5/5 assertions in both arms). The eight stored
misses are all "offered, not chosen" (`SPEC-0068`), and the description hypothesis
was tested and reverted (`SPEC-0069`: 0/3 loaded on `#11`, $0.018932).

The data supports one position, not a bigger trigger: the skill's demonstrated
value is the contract — turning a structured implementation prompt into verified
code, and asking instead of editing when the contract is missing (`#12`). It has
no demonstrated value on a small, fully specified edit (`#9`), where forcing a
load adds tokens, latency and process for nothing.

This spec fixes that position in the artifact and in the published matrix.

## User Outcome

- A small, fully specified edit does not route to the skill by design, and the
  matrix says so next to the `#9` row.
- A structured contract — an implementation prompt or SPEC prompt — still
  routes, and an ambiguous request still gets one question before any edit.
- The routing consequence of the description edit is measured once, cheaply,
  with a stop rule, and published either way.

## Scope

### F1 — the description names the contract, not a task size

`skills/implement-from-prompt/SKILL.md`'s `description:` gains the boundary, in
trigger shape and under 500 characters:

- the structured contract (implementation prompt / SPEC prompt) is the trigger;
- an ambiguous request missing the contract → ask before editing, do not guess;
- a small, fully specified edit is explicitly out of target.

This is not a rewrite of the procedure. The body of the skill is unchanged, and
`stack-agnostic` stays.

### F2 — the matrix carries the position

`docs/evals/implement-from-prompt-matrix.md` gains a `Target` note per case and a
short positioning paragraph: `#12` in target (separator); `#9` out of target by
design (non-target evidence, not a defect); `#10` out of target until its routing
question is answered; `#11` out of target (the unsafe request is not
prompt-driven work). `docs/evals/iterative-corpus.md` gets the positioning
sentence that explains why `#9`'s 4/5 vs 5/5 is the expected result.

No cell count is rewritten. The stored draws keep their verdicts.

### F3 — one cheap routing check, with a stop rule

After the edit, one 3-draw routing smoke on the in-target anchor (`#12`), the
same shape as `SPEC-0069`:

```text
node scripts/eval.mjs run implement-from-prompt 12 --arm with --repeat 3 \
  --model agentworks/deepseek-v4-1-flash
```

Stop rule:

- **3/3 loaded** → the narrowed description kept the anchor. Publish the smoke as
  routing evidence, do not draw the control, do not re-judge the cell.
- **0–2/3 loaded** → stop at three paid draws, revert the description to the tree
  it had before this spec, publish the failure and the spend, and leave the
  positioning decision standing on the stored evidence (it does not depend on the
  smoke).

Either branch ends the spend at three draws.

### F4 — publish honestly

- Every `implement-from-prompt` cell that cites the old `skillHash` is marked
  stale in the matrix; the edit invalidates it and no count is rewritten.
- `docs/evals/coverage.md` gets the staleness reading update for the cells the
  edit unstaged. The reading is report-only and its number is expected to move.
- The smoke's run dir is cited with `check-eval-run`'s exit printed. A routing
  smoke exits non-zero with `gate-miss` findings; that is the measurement, not a
  failed gate.

## Non-Goals

- No new case, fixture or prompt.
- No attempt to route `#9`, `#10` or `#11`: they are out of target by design.
- No control draw on `#12` and no re-measure of the `#12` cell.
- No new assertion kind and no harness change.
- No description experiment on `#11` again; `SPEC-0069` already spent it.

## Flow

1. **F1** — the description edit.
2. **F3** — the routing smoke, read against the stop rule.
3. **F2 + F4** — publish the position, the smoke and the staleness reading.
4. If the smoke fails, the revert is the fourth step and F2/F4 publish the failure
   branch.

## Data

- `skills/implement-from-prompt/SKILL.md` — `description:` only.
- `docs/evals/implement-from-prompt-matrix.md` — the four case rows and the
  positioning paragraph.
- `docs/evals/iterative-corpus.md` — the case table and the routing note.
- The stored draws cited above; no new draw except the smoke.

## Acceptance Criteria

1. `skills/implement-from-prompt/SKILL.md`'s `description` is at most 500
   characters, names the structured contract as the trigger, keeps the
   ask-don't-guess clause, and states that a small fully specified edit is out of
   target.
2. `node scripts/validate-skills.mjs --root skills` passes with the new
   description.
3. The matrix states the target position for `#9`, `#10`, `#11` and `#12`, and no
   cell count changes from its published value.
4. The 3-draw smoke is published with its run dir, its per-draw `skillGate`
   reading, cost and `check-eval-run` exit; the stop rule's outcome is named.
5. If the smoke loads 3/3, the description is kept and the stale cells are marked
   stale; if not, the description is reverted and the spec publishes which tree
   it returned to.
6. No assertion semantics change; every command in `tests:` exits 0, except a
   routing `gate-miss` from `check-eval-run`, published with its exit.

## Decisions

- **The contract is the trigger.** `#12` is the only separating case and it is a
  contract question (ask, do not edit). `#9`'s 4/5 vs 5/5 is the control's win,
  which is the definition of out-of-target.
- **Measure the anchor, not the missed cells.** `SPEC-0069` already tested the
  worst position and failed; re-testing `#11` would spend twice on the same
  question. The anchor (`#12`) is where the position must hold.
- **A failed smoke does not undo the position.** The positioning rests on stored
  cells; the smoke only checks that the edit did not break the anchor.

## Open Questions

None.

## Prompt Notes

- `description` is the only line edited in the skill; keep the body and the
  `stack-agnostic` flag.
- The stop rule is a spend rule: 0–2/3 means stop at three paid draws.
- Do not re-score stored draws; the edit only marks cells stale.
- `check-staleness` is report-only; publish its new number, do not chase it to
  zero.
- Read `docs/specs/SPEC-0069-does-the-description-actually-route.md` before
  editing; do not repeat the description hypothesis it reverted.
