---
id: SPEC-0091
title: The generator's case proves a failing test step, not a character window
status: implemented
priority: P2
task: TASK-119
created_at: 2026-11-15
updated_at: 2026-11-15
source_docs:
  - backlog/tasks/task-119 - evals-ancorar-o-oraculo-do-caso-1-do-gerador-no-passo-de-teste.md
  - docs/specs/SPEC-0090-test-first-in-the-prompt.md
  - evals/write-implementation-prompt/cases.md
  - docs/evals/coverage.md
related_decisions: []
depends_on: []
blocks: []
files:
  - evals/write-implementation-prompt/cases.md
  - evals/corpus-baseline.json
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0091-case-1-oracle-step-anchored.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0091-case-1-oracle-step-anchored.md --base main
---

# SPEC-0091: The generator's case proves a failing test step, not a character window

## Purpose

`SPEC-0090` re-measured `write-implementation-prompt` case 1 at **3/5 vs 0/5**
and published the cell as **unresolved (oracle-limited)** because both red draws
were the oracle's fault, not the skill's. The assertion

    ## Operations[\s\S]{0,600}?(test|spec file)[\s\S]{0,300}?(implement|add and export)

is a character window: in r2 the first `test` token sits 569 characters into
`Operations` (inside 600) and the real implementation step, `**Implement the
toggle handler**`, sits 507 characters later (outside 300) and is capitalised,
so a case-sensitive `implement` never matches it; in r3 the same second hop
measures 999. The artifacts themselves are test-first — the test step precedes
the implementation step — and the oracle called them red anyway.

This spec replaces the window with an assertion that names the behaviour the
claim is about: a numbered Operations step that mentions the test **and** its
red state. It was validated before the draws: all five artifacts of
`2026-11-14T09-20-09--write-implementation-prompt` pass (r1–r5), and the
repository's implementation-first artifact
(`evals/write-implementation-prompt/fixtures/4/docs/prompts/SPEC-0007-import-csv.prompt.md`,
"1. add the function, 2. add a test") fails both assertions.

## User Outcome

A reader of `docs/evals/coverage.md` sees case 1 measured by an assertion that
fails on an implementation-first artifact and passes on a test-first one, with
the false-fail explained by the corrected oracle, the old 3/5 kept as history
and the class named from the new counts instead of left oracle-limited.

## Scope

- **F0 — the two assertions.** In `evals/write-implementation-prompt/cases.md`
  case 1, replace the window assertion with

      ## Operations(?:[^\n]|\n(?!## ))*?\n\s*(?:\d+\.|[-*])\s*[^\n]{0,160}?[Tt]est[^\n]*(red|fail|failing)

  which is bounded to the Operations section (a newline followed by `## ` ends
  it), accepts a numbered or bulleted step, and requires the step to name the
  test and its red state **on the same line**, with no character cap between the
  two; and broaden `[Ss]ee (it )?fail` to
  `([Ss]ee|[Ww]atch) (it )?[Ff]ail` (r1 says "watch it fail"). The `why:`
  records the correction and its limit: the assertion proves the artifact
  **names** a failing test step, not that the steps execute in order; the
  executor cell 13's red→green signature is the behavioural check. See
  `## Corrections during implementation` for the `{0,80}` cap this replaced and
  for the draws under each version.
- **F1 — the baseline moves once.** Case 1's `fieldsSha256` goes from
  `8564c2587b690b953c13453aa0f816239ff39a55443572c4f262ca62f5e6f652` to the new
  value; every other entry is untouched.
- **F2 — re-measure.** `node scripts/eval.mjs compare write-implementation-prompt
  1 --repeat 5 --root skills` — five draws per arm, model and detector recorded,
  both run dirs cited, raw counts and reds named, classified. The 3/5
  (`2026-11-14T09-20-09--write-implementation-prompt`) and the 5/5
  (`2026-11-09T13-07-02--write-implementation-prompt`) stay as history, not
  recomputed.
- **F3 — publish.** The coverage cell (new counts, old history, the corrected
  oracle in the `why:`'s terms) and one `CHANGELOG.md` entry under
  `[Unreleased]`; the release cut decides the roadmap slot.

**Blast radius.** One corpus case's two assertions, one baseline digest, the
coverage inventory and the release entry. No skill, no fixture, no runner and no
other case.

## Non-Goals

- No change to `skills/write-implementation-prompt/SKILL.md`: `SPEC-0090` already
  made the guidance test-first, and this spec only corrects the oracle that
  judges it.
- No change to the fixture (`fixtures/1/`), to case 13, or to any other
  `write-implementation-prompt` case.
- No new assertion kind, runner flag, pdlc stage or detector change.
- No recomputation of a published number and no extra draws beyond the ten.
- No push and no issue action.

## Flow

1. **F0 — the oracle.** Replace the window, broaden the fail phrase, write the
   `why:` with the correction and the limit.
2. **F1 — the digest.** Recompute case 1's `fieldsSha256`; parity proves the one
   move.
3. **F2 — run.** `compare write-implementation-prompt 1 --repeat 5 --root
   skills`; record model, detector, both dirs, counts, reds.
4. **F3 — publish.** Coverage and CHANGELOG; no oracle edit after the first draw.

## Data

- `evals/write-implementation-prompt/cases.md` — case 1, two assertions.
- `evals/corpus-baseline.json` — case 1's digest.
- `docs/evals/coverage.md` — the cell's note and the old counts.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **The oracle is step-anchored**: the window is gone; the new assertion is
   section-bounded, accepts numbered or bulleted steps, and requires the test
   and its red state in the same step.
2. **It discriminates**: it passes all five artifacts of the `09-20-09` run and
   fails the implementation-first fixture prompt; the validation is recorded in
   the `why:` or the coverage note.
3. **The baseline moves once**: only case 1's digest changes, the old value is
   quoted here, and parity is green.
4. **The cell is re-measured**: five draws per arm, model, detector, both run
   dirs, raw counts and reds recorded; the 3/5 and the 5/5 stay as history.
5. **The class is named from the new counts**, not asserted in advance; if the
   skill arm is not 5/5 the cell stays unresolved and the remaining reds are
   named.
6. **Publication is complete** and `files:` is honest (`spec-check` clean);
   every `tests:` command passes.

## Open Questions

- **Does the step assertion still prove "test first"?** It proves the artifact
  names a failing-test step; the ordering is carried by the generator's
  guidance and by the executor's signature (case 13), not by the regex. The
  limit is published rather than hidden — the alternative (comparing step
  numbers) needs a new assertion kind, which the freeze forbids.
- **Will the control stay 0/5?** The control artifacts do not create
  `## Operations` at all, so both assertions fail by construction; the run
  decides, and the count is published as measured.

## Prompt Notes

- **Requirements**: two assertions replaced, one digest, one A/C re-measure, one
  honest publication; no skill and no fixture change.
- **Entities**: step anchor, red state, section bound, false-fail, old rate,
  digest.
- **Approach**: rewrite the assertions in place, recompute the one digest,
  re-measure both arms.
- **Structure**: only the five `files:`; the skill and the fixture are read-only.
- **Operations**: `node scripts/eval.mjs check --root skills`; then
  `compare write-implementation-prompt 1 --repeat 5 --root skills`.
- **Norms**: five draws per arm; a red is named; the old rate stays visible; the
  oracle is not edited after the first draw.
- **Safeguards**: no skill edit, no fixture edit, no new assertion kind, no
  extra draws.
- **Tests**: the gates above; `corpus.test.mjs` proves the one-digest move.

## Corrections during implementation

1. **The 80-character cap was the same defect, and it was removed before
   publication.** F0's first version kept
   `[^\n]{0,80}?(red|fail|failing)` between the test token and the red state.
   Under it, r4 of `2026-11-15T01-58-03--write-implementation-prompt` read red
   although the artifact is test-first: its step 3 is a single 507-character
   line, `test` at character 15 and "see it fail" **374** characters later. The
   cap was replaced by the same-line rule — `[^\n]*(red|fail|failing)` — before
   the result was published, so that 4/5 is history and was **never published**;
   the published counts come from the new draws below.
2. **The oracle changed after the first paid set, and a second set was
   measured.** The first set (10 draws, `2026-11-15T01-53-22--…--without-skill`
   / `2026-11-15T01-58-03--write-implementation-prompt`) ran under the
   `{0,80}` version; after the correction above a second set of 10 draws
   (`2026-11-15T02-08-11--…--without-skill` / `2026-11-15T02-11-01--…`) ran
   under the final oracle — **20 draws in total**. That exceeds both "no extra
   draws beyond the ten" (Non-Goals, F2) and "the oracle is not edited after the
   first draw" (Flow, Norms). The merge gate authorized it as the correction of a
   measurement that had classified a paid run wrongly; the published 5/5 comes
   from the new draws, not from re-scoring the first set.
