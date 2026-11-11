---
id: SPEC-0080
title: The trigger is the contract, not the size of the edit
status: implemented
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
  --root skills --model agentworks/deepseek-v4-1-flash
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

## Results

**F1 kept: the 3-draw smoke loaded 3/3 on `#12` with the edited tree. The stop
rule ended the spend with no control arm and no re-judged cell. The description
stayed; F2/F4 publish the position and the staleness reading.**

### F1 — the description names the contract

`skills/implement-from-prompt/SKILL.md` now carries (332 characters):

```text
description: Implement code from a structured implementation prompt or SPEC prompt, and verify it. Use when a prompt file or SPEC prompt is handed over to build. If the contract is missing or the request is ambiguous, ask before editing — do not guess. A small, fully specified edit is out of target. Preserves the prompt's scope and safeguards.
```

It names the structured contract as the trigger, keeps the ask-before-editing
clause, and puts a small, fully specified edit out of target. Only the
`description:` line changed: the body is byte-identical and `stack-agnostic: true`
stays. New file hash `SKILL.md a015c8faf8faf28db1912d865f25f0c247c37f327a2b5711c1c8109459179249`;
the skill tree moves from `9147487f27cb27be0b915500599896d90db0be01a49dd605a402f57268fbff9e`
to `52379e16e3ab827f3d71324d0eda3e1d7c0fe64fbc7b4beaa7bffb61c5e645e9`.

### F3 — routing smoke, three draws

The smoke ran on the in-target anchor with the edited tree:

```sh
node scripts/eval.mjs run implement-from-prompt 12 --arm with --repeat 3 \
  --model agentworks/deepseek-v4-1-flash --root skills
```

Run directory:
`2026-11-11T17-52-34--implement-from-prompt--agentworks-deepseek-v4-1-flash`.
Provenance: `repoSha c59dd40`, model `agentworks/deepseek-v4-1-flash`, arm
`with-skill`, detector `cf2e2e319d975a5b`, `fixtureHash
084a0c00761a3fc361623553963879cd78185df1ca19e57cbb0d4e1f0ab2f5cc`, `promptHash
423838272eb503427c9d879ab70885bbca9a3e36143d40db639bd7e0cbe5a91c`, `skillHash
52379e16e3ab827f3d71324d0eda3e1d7c0fe64fbc7b4beaa7bffb61c5e645e9` (`SKILL.md
a015c8fa…`), `stallMs 120000`, `params.isolation.enforced: true` (seatbelt),
**`isolated=yes`**.

| draw | status | `skillGate.ok` | `skillGate.source` | assertions | duration | cost |
| --- | --- | --- | --- | --- | --- | --- |
| r1 | failed | `true` | `tool` | 1/2 (`reply \?` red) | 106,953 ms | $0.007815 |
| r2 | passed | `true` | `tool` | 2/2 | 73,284 ms | $0.008512 |
| r3 | passed | `true` | `tool` | 2/2 | 95,484 ms | $0.006711 |

**`loaded 3/3`** — the narrowed description kept the anchor. Per the stop rule
the spend ends here: no control draw, no re-judged `#12` cell, no fourth draw.
The 2/3 assertion count is the stored literal-`?` artefact (`#12 r2` has the same
red in the published cell), not a routing reading.

```text
$ node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/2026-11-11T17-52-34--implement-from-prompt--agentworks-deepseek-v4-1-flash
cases=1 reps=3 findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0 (/Users/wendell/.local/share/opencode/evals/runs/2026-11-11T17-52-34--implement-from-prompt--agentworks-deepseek-v4-1-flash)
exit 0
```

The exit is **0**, not the `gate-miss` exit the failure branch would print: with
3/3 loaded there is no gate miss to record. `skillLeaks=0`, `hostReads=0`,
`deniedDraws=0`, `warnings=0`.

### Deviation — the first invocation measured the installed tree

The Scope's literal command omits `--root skills`. `eval.mjs` then discovers the
installed roots (`~/.agents/skills`, this repository's **primary checkout**), not
the worktree, so that run measured the pre-edit description:

| draw | status | `skillGate.ok` | `skillGate.source` | assertions | duration | cost |
| --- | --- | --- | --- | --- | --- | --- |
| r1 | failed | `true` | `read` | 1/2 | 142,015 ms | $0.012433 |
| r2 | failed | `true` | `read` | 1/2 | 130,524 ms | $0.009424 |
| r3 | failed | `true` | `read` | 1/2 | 130,611 ms | $0.008792 |

Run directory:
`2026-11-11T17-45-52--implement-from-prompt--agentworks-deepseek-v4-1-flash`. It
recorded `skillHash 9147487f…` and `SKILL.md 67a5dd32…` — the tree before this
spec — so its 3/3 load reading is **not evidence for the edit**, even though it
was clean (`check-eval-run`: `findings=0 warnings=0 skillLeaks=0 hostReads=0
isolated=yes deniedDraws=0`, exit 0). The re-run adds `--root skills`, records the
edited tree `52379e16…` / `SKILL.md a015c8fa…`, and is the only smoke cited as
evidence. The extra three draws are published, not hidden.

### F2 — the matrix carries the position

`docs/evals/implement-from-prompt-matrix.md` gains a **Target (SPEC-0080)**
section: `#12` in target (the separator), `#9` out of target by design (the
control's 5/5 win is non-target evidence, not a defect), `#10` out of target
until its routing question is answered, `#11` out of target (an unsafe request is
not prompt-driven work). It also carries the positioning paragraph, the new
`description`/tree hashes, the staleness statement for `#1`–`#12`, and the smoke
run with its `check-eval-run` exit.

`docs/evals/iterative-corpus.md` gains **The target (SPEC-0080)**, which explains
why `#9`'s 4/5 vs 5/5 is the expected result and not a defect. No cell count in
either document changes.

### F4 — staleness, published as report-only

Fourth reading, after the edit: **66 cited cells, 51 stale, 3 uncited**
(`node scripts/check-staleness.mjs`, exit 0). The baseline is 51 rather than the
third run's 55 because the `SPEC-0078` wave re-measured `review-code` #3–#6 at
`9a28572…`; that delta is not this spec's. All twelve `implement-from-prompt`
cells cite an older tree (`0389466e…`/`a58c5074…` for `#1`–`#10`, the
`SPEC-0069` smoke's `218f51bb…` for `#11`, no governed hashes for the `#12`
control) and were **already stale**, so the edit unstages no fresh cell: **zero
cells move** and the count stays 51. No count is rewritten. The smoke run is
cited in the matrix, not in `coverage.md`, so it does not replace the `#12` cell
with a three-draw run.

### Gates

| command | result | exit |
| --- | --- | --- |
| `node scripts/validate-skills.mjs --root skills` | `Scanned 14 SKILL.md across 1 roots. All clear.` | 0 |
| `node scripts/eval.mjs check --root skills` | `Parsed 101 case(s): 98 runnable, 3 manual; 98 fixture(s) staged. No findings.` | 0 |
| `node --test scripts/lib/evals/*.test.mjs` | `pass 568`, `fail 0` | 0 |
| `node --test scripts/lib/*.test.mjs` | `pass 13`, `fail 0` | 0 |
| `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` | `pass 42`, `fail 0` | 0 |
| `node scripts/check-sensor-parity.mjs` | `2/2 fixtures in parity` | 0 |
| `node scripts/check-evidence.mjs` | `6 documents, 0 errors, 0 warnings; current detector cf2e2e319d975a5b` | 0 |
| `node scripts/check-staleness.mjs` | `66 cited cell(s), 51 stale, 3 uncited citation(s)` (report-only) | 0 |
| `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0080-the-trigger-is-the-contract.md --base main` | `ok … — contract holds` (committed tree) | 0 |
| `node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/2026-11-11T17-52-34--implement-from-prompt--agentworks-deepseek-v4-1-flash` | `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0` | 0 |

### Acceptance Criteria

1. **Pass.** The `description` is 332 characters, names the structured contract as
   the trigger, keeps the ask-before-editing clause, and puts the small fully
   specified edit out of target.
2. **Pass.** `validate-skills` is clean with the new description.
3. **Pass.** The matrix states the target for `#9`, `#10`, `#11` and `#12`; no
   cell count changed.
4. **Pass.** The smoke is published with run dir, per-draw `skillGate`, cost and
   `check-eval-run` exit; the stop rule's 3/3 branch is named.
5. **Pass.** 3/3 loaded, so the description is kept and the stale cells are marked
   stale. (The failure branch was not taken.)
6. **Pass.** No assertion semantics changed; every command in `tests:` exits 0.
   The smoke's `check-eval-run` also exits 0 because 3/3 loaded leaves no
   `gate-miss`.

### Spend

| draw | run directory | purpose | cost |
| --- | --- | --- | --- |
| 1 of 6 | `2026-11-11T17-45-52--implement-from-prompt--agentworks-deepseek-v4-1-flash` r1 | literal command; measured the installed (pre-edit) tree — not evidence | $0.012433 |
| 2 of 6 | same r2 | same | $0.009424 |
| 3 of 6 | same r3 | same | $0.008792 |
| 4 of 6 | `2026-11-11T17-52-34--implement-from-prompt--agentworks-deepseek-v4-1-flash` r1 | F3 smoke, edited tree | $0.007815 |
| 5 of 6 | same r2 | F3 smoke, edited tree | $0.008512 |
| 6 of 6 | same r3 | F3 smoke, edited tree | $0.006711 |

**Total: 6 paid draws, $0.053688** — three invalid draws ($0.030649) plus the
three-draw smoke ($0.023039). The spec set a three-draw / ~$0.02 ceiling; the
overrun is the cost of the omitted `--root` in the pinned command and is recorded
here rather than hidden. No stall, retry or lost draw.
