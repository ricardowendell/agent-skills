---
id: SPEC-0068
title: The skill that never loaded
status: ready
priority: P1
task: TASK-101
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-101 - skill-implement-from-prompt-carrega-em-6-de-10-draws-de-comportamento.md
  - docs/evals/iterative-corpus.md
  - docs/specs/SPEC-0034-iterative-corpus.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills/implement-from-prompt/SKILL.md
  - docs/evals/iterative-corpus.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0034-iterative-corpus.md
  - docs/specs/active/SPEC-0068-the-skill-that-never-loaded.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0068-the-skill-that-never-loaded.md --base main
---

## Purpose

The corpus measured behaviour and found routing instead: in **8 of 15** skill-arm
draws the skill was not loaded at all.

| case | skill-arm draws | not loaded |
| --- | --- | --- |
| `#9` localized change | 5 | 1 (`r5`) |
| `#10` functional fix | 5 | 3 (`r2`, `r3`, `r5`) |
| `#11` unsafe request (holdout) | 5 | 4 (`r2`–`r5`) |

Every one of them was scored `failed` with the reason
`skill 'implement-from-prompt' was not loaded`. That is honest as a record of what
happened, and useless as a verdict on the procedure: when the skill did load, the
cases passed (`#9` 4/4, `#10` 2/2, `#11` 1/1, `#12` 4/5).

Nobody has ever looked at *why*. `TASK-101` says so: zero draws to diagnose.

This spec diagnoses the 15 draws from storage and applies the smallest fix the
diagnosis supports. It does **not** verify the fix — that costs draws and belongs
to the measurement budget.

## User Outcome

- The 8 misses are explained per draw, with the cause and the evidence that
  proves it, not as one label.
- The description of `implement-from-prompt` names the triggers the corpus
  actually exercises, if that is the cause.
- If the cause is not the description, the spec says which mechanism is at fault
  and stops instead of editing prose that would not help.
- The published corpus states the cause, not only the count.

## Scope

### F1 — diarise the 15 draws

For each skill-arm draw of `#9`, `#10`, `#11`, `#12` (run dirs in
`docs/evals/iterative-corpus.md`): the case, the rep, the prompt's first line, the
case's `gate:`, whether the `skill` tool was called, whether `SKILL.md` was read
directly, and what the draw did instead. Store the table in the spec's Results.

### F2 — classify each miss, with the proof each cause needs

- **(a) never offered** — the id is absent from whatever the child could see: it
  was not staged, or the menu/config did not list it. Proof: the transcript's
  first tool calls show no skill id at all, and the draw's staged set does not
  contain `implement-from-prompt`.
- **(b) offered, not chosen** — the id was on the menu and neither a `skill` call
  nor a direct read followed. Proof: the id appears in the draw's staged set or
  the child's skill listing, and the transcript has neither load.
- **(c) chosen, not proven** — a `skill` call or a read happened but the gate did
  not accept it. Proof: the transcript shows the event; the gate's `source` says
  why it was rejected.
- **(d) loaded, then lost** — the gate accepted the load and the draw still
  behaved as if it had not. Proof: `source` is set and the behaviour contradicts
  it.

A cause with no proof is not assigned. "Probably the description" is not a
finding.

### F3 — the smallest fix the dominant cause supports

- **(b) dominant, and the missing trigger is in the skill's remit** — edit the
  `description:` in `skills/implement-from-prompt/SKILL.md` to name the triggers
  the corpus exercises (a small change to an existing component; a bug fix with a
  regression test; an ambiguous request that needs one question). Keep it one
  sentence, route-not-summary, and do not exceed the current description's length
  by more than ~20%. Do **not** add the unsafe-request case: refusing an unsafe
  edit is not prompt-driven work, and naming it would be a false trigger.
- **(a) dominant** — staging or menu: out of this spec. Record the mechanism
  (file:line) and stop; a skill edit would not fix it.
- **(c) or (d) dominant** — detector or context: out of this spec. Record it.

The fix is one edit at most. If two causes tie, fix (b) and record the other.

### F4 — publish the cause

- `docs/evals/iterative-corpus.md` — the routing section gains the cause counts
  and the per-draw table reference; the `#10`/`#11` classes do not change.
- `docs/evals/coverage.md` — the `implement-from-prompt` row's routing sentence
  names the cause.
- `SPEC-0034` — its routing paragraph gains one sentence pointing at the cause.

**The 8 stored draws keep their recorded status.** A diagnosis is not a re-score:
`failed — skill not loaded` stays in `result.json`, and no document claims they
passed.

## Non-Goals

- **No paid draw.** The fix is not verified here. The routing smoke (3 draws on
  `#11`, then 5+5 if it loads) is the next spec, and it needs a declared budget.
- **No case, prompt, fixture or assertion edit.** The corpus is the measuring
  instrument; changing its prompts to make the skill load would measure the
  prompt.
- **No gate change.** `#11` is gated like every behavioural case, and the corpus
  already decided not to reclassify a load miss. Whether an unsafe-request case
  should gate on a load is a separate question; this spec records it as an open
  question and does not answer it.
- **No detector change.** `skillGate`'s acceptance rules are `SPEC-0062`/`0064`
  ground and stay.
- **No second skill edit** in the same spec; one description change is the whole
  budget.

## Flow

1. **F1 — read the store.** For each of the 15 draws, dump the tool calls, the
   staged set and the gate `source`. Zero cost.
2. **F2 — assign a cause per miss** with the proof. Count them.
3. **F3 — apply the one edit** if the dominant cause is (b); otherwise stop and
   report.
4. **F4 — republish** the three documents with the cause, and record the six
   remaining `#12` draws' state unchanged.

## Data

- Run dirs: `2026-11-08T06-35-22--implement-from-prompt--agentworks-deepseek-v4-1-flash`
  (`#10`, 5 draws), `…06-39-39…` (`#12`, 5), `2026-11-11T06-41-39…` (`#11`, 5),
  plus `#9`'s run dir named in `iterative-corpus.md`.
- `scripts/lib/evals/assertions.mjs` — `skillGate`, and what `source: read|tool`
  means.
- `scripts/lib/evals/execute.mjs:34-49` — the gate is decided per draw.
- `skills/implement-from-prompt/SKILL.md` — `name:` and `description:`.

## Acceptance Criteria

1. All 15 skill-arm draws are listed with case, rep, gate, tool-call evidence and
   cause; the 8 misses each carry one cause and the proof that supports it.
2. A cause with no supporting evidence is not used; if the evidence does not
   separate (a) from (b) for a draw, the spec says so instead of guessing.
3. If the dominant cause is (b), the `description:` names the three triggers the
   corpus exercises, stays one sentence, and does not exceed the ~20% length
   budget. If it is not (b), `SKILL.md` is unchanged and the spec says why.
4. `validate-skills` still passes with the edited description (the frontmatter
   contract is unchanged).
5. The published corpus states the cause counts; no stored draw is re-scored and
   no class changes.
6. `#10` stays `unresolved` (2/5, two loaded) and `#11` stays a non-discriminator.
7. Zero paid draws; every command in `tests:` exits 0.

## Decisions

- **Diagnose from storage, not from a new run.** The 8 misses are already
  recorded with full transcripts. A draw would buy a ninth example of the same
  thing.
- **The description is the only product surface in reach.** If the cause is the
  menu or the detector, the honest output is a named defect and no edit; a
  description that "sounds more like the prompt" would only move the number
  without explaining it.
- **The unsafe case is not a trigger.** `#11` asks for an edit that must not
  happen. Adding "unsafe request" to a skill about implementing prompts would
  teach it to load for work it should refuse — and would make its one loaded
  `#11` draw look like the goal.
- **The fix ships unverified, and says so.** Claiming the routing works without a
  draw is the error this corpus exists to prevent; the next spec measures it.

## Open Questions

- Should `#11` — a case whose correct behaviour is a refusal — gate on the skill
  loading at all? Recorded, not answered: changing the gate now would look like
  re-scoring the stored misses, and the corpus already refused that.

## Prompt Notes

- Read `docs/evals/iterative-corpus.md`'s routing section first; it already says
  the count and the sub-counts. Do not restate them differently.
- `skillGate` counts a direct `SKILL.md` read as a load (`execute.mjs:34`); a draw
  with a read and no `skill` call is **not** a miss. Check `source` before
  classifying.
- If the description changes, keep the existing opening verb and the
  "Preserves the prompt's scope and safeguards" clause; the description is read
  by a router, not by a human browsing a list.
- Do not "verify" the edit by running a case. If you are tempted to, that is the
  next spec.

## Results

_Filled during implementation._
