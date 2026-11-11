---
id: SPEC-0070
title: The body already matches what the skill does
status: ready
priority: P2
task: TASK-105
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-105 - skill-o-corpo-do-implement-from-prompt-assume-prompt-o-corpus-exercita-pedido-solto.md
  - docs/specs/SPEC-0068-the-skill-that-never-loaded.md
  - docs/evals/iterative-corpus.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/evals/iterative-corpus.md
  - docs/evals/coverage.md
  - skills/implement-from-prompt/SKILL.md
  - docs/specs/active/SPEC-0070-the-body-already-matches-what-the-skill-does.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0070-the-body-already-matches-what-the-skill-does.md --base main
---

## Purpose

`TASK-105` records a mismatch: the skill's body opens "This skill starts from
prompt artifacts, not from vague backlog ideas. If no prompt file exists yet, use
the `write-implementation-prompt` skill first", while the corpus exercises bare
requests — `#9` ("the save button should read …"), `#10` ("`slugify` returns
`hello----world`"), `#12` ("update the status badge").

The question is whether that line derails a loaded draw. If it does, the body
needs a fallback section. If it does not, the body is advisory and the honest
answer is a recorded decision, not an edit.

The first pass over the stored draws says it does not derail them, so this spec
is a check, a decision, and — if the check holds — **no code change**.

## User Outcome

- The mismatch is settled with evidence from the loaded draws, not by rewriting
  prose on a hunch.
- If no draw is derailed, the skill stays byte-identical and the corpus says why
  the question is closed, with the condition that reopens it.
- If a draw is derailed, the smallest body edit that fixes it is made and named.

## Scope

### F1 — read every loaded bare-request draw

The draws where the skill loaded and the request had no prompt file: `#9` r1–r4,
`#10` r1 and r4, `#12` r1–r5 (12 draws; `#9 r5`, `#10 r2/r3/r5` never loaded and
are not evidence here). For each, from the transcript's **assistant text parts
only** (not the `SKILL.md` content the read tool echoes):

- did the reply mention a prompt file, `write-implementation-prompt`, or the
  "prompt artifacts" rule?
- did it stop, ask for a prompt, or redirect before making the change?
- did it make the change the case measures?

A derailed draw is one that **stopped or redirected** because of the prompt
framing. A draw that mentions the rule and still implements is not derailed.

### F2 — decide by the rule

- **At least one derailed draw** → edit `SKILL.md` with the smallest fallback: a
  short section stating that a small, local change or bug fix may arrive as a
  bare request, that the request plays the prompt's role (its scope is the
  operations, the write-target vs read-dependency rule still decides what may be
  created, no spec or prompt status is claimed), and that new product decisions
  or a cross-module change still call for a prompt. Keep the existing steps
  untouched; add, do not rewrite. Name the case and the draw that justified it.
- **No derailed draw** → **change nothing.** Record the check, the count, and the
  decision. `SKILL.md` stays byte-identical in this spec.

Do not do both. The evidence chooses.

### F3 — publish the decision

- `docs/evals/iterative-corpus.md` — one paragraph in the iterative section: the
  12 loaded bare-request draws, how many mention the prompt framing, how many
  were derailed (expected zero), and the decision.
- `docs/evals/coverage.md` — one clause on the `implement-from-prompt` row
  pointing at that paragraph.

## Non-Goals

- **No paid draw.** The 12 draws are stored; the question is about them.
- **No description change.** `SPEC-0069` tested and reverted it; the description
  is the 0.7.0 wording and stays.
- **No case, prompt, fixture or assertion edit.**
- **No routing fix.** `#10`'s 2/5 and `#11`'s 1/5 are routing, not a body
  question, and this spec does not spend on them.
- **No second body edit.** One section, if the evidence asks for it; otherwise
  none.

## Flow

1. **F1** — extract the assistant text parts of the 12 draws; classify each as
   mentions / derailed / clean.
2. **F2** — apply the rule.
3. **F3** — publish the paragraph and the clause.

## Data

- `~/.local/share/opencode/evals/runs/2026-11-08T06-30-24--implement-from-prompt--agentworks-deepseek-v4-1-flash/cases/implement-from-prompt--09`
- `…/2026-11-08T06-35-22--…--agentworks-deepseek-v4-1-flash/cases/implement-from-prompt--10`
- `…/2026-11-08T06-39-39--…--agentworks-deepseek-v4-1-flash/cases/implement-from-prompt--12`
- `skills/implement-from-prompt/SKILL.md` — lines 13 (the rule) and 25 (step 2).
- `evals/implement-from-prompt/cases.md` — cases 2, 9, 10, 12 (case 2 is the one
  that *should* redirect; check it did).

## Acceptance Criteria

1. All 12 loaded bare-request draws are listed with the count of assistant-text
   mentions and a derailed/clean verdict.
2. The verdict is derived from the assistant's own text, not from `SKILL.md`
   content echoed by a read tool.
3. If no draw is derailed, `SKILL.md` is byte-identical (`git diff` empty) and the
   decision is published with its reopening condition.
4. If a draw is derailed, the body gains one fallback section naming that draw,
   and no existing step is rewritten.
5. Case 2 still redirects to `write-implementation-prompt` in its stored draws
   (the body's prompt rule must keep working where it should).
6. The corpus gains the paragraph and the row clause; no class or count changes.
7. Zero paid draws; every command in `tests:` exits 0.

## Decisions

- **Evidence before prose.** The body reads like a rule; the draws decide whether
  it acts like one. Rewriting it because it *sounds* inconsistent is the move
  `SPEC-0069` just paid to refute.
- **A mention is not a derailment.** The reply may quote the rule and still do
  the work. Only a stop or a redirect counts.
- **No change is a result.** If the body is advisory in practice, the corpus says
  so and the question is closed; a later draw that bails reopens it.

## Open Questions

None.

## Prompt Notes

- `result.json` has the draw's reply, but the transcripts carry the per-turn text
  parts; use `type: "text"` events. A `read` of `SKILL.md` puts the rule in the
  transcript as tool output — do not count that as the assistant acting on it.
- The cases' `why:` fields already say what each draw was expected to do; use
  them to judge "derailed", not your own reading of intent.
- If you change `SKILL.md`, run `validate-skills` and state the new tree hash;
  the corpus's hashes will go stale and that must be said, not hidden.

## Results

_Filled during implementation._
