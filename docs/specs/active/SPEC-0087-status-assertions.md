---
id: SPEC-0087
title: The status case's assertions prove what they claim
status: implemented
priority: P1
task: TASK-112
created_at: 2026-11-13
updated_at: 2026-11-13
source_docs:
  - backlog/tasks/task-112 - evals-noreply-digits-casa-rotulos-AC-N-no-caso-3.md
  - backlog/tasks/task-113 - evals-o-token-de-degradacao-do-report-project-status-e-language-bound.md
  - docs/specs/SPEC-0083-report-project-status-evidence.md
  - evals/report-project-status/cases.md
  - docs/evals/coverage.md
related_decisions: []
depends_on: []
blocks: []
files:
  - evals/report-project-status/cases.md
  - evals/corpus-baseline.json
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0087-status-assertions.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0087-status-assertions.md --base main
---

# SPEC-0087: The status case's assertions prove what they claim

## Purpose

`report-project-status` case 3 measured **separator 4/5 vs 0/5** in 0.8.1
(`SPEC-0083`), but the review left two assertion defects and both were named as
follow-ups:

- the `ISSUES`/`CI` assertions require the literal `unknown`, while the skill is
  bilingual — one skill-arm draw answered "desconhecido" and went red on
  judgement it had made correctly (`TASK-113`);
- `noreply #[0-9]+` also matches the criterion labels "AC #1"/"AC #2" in the
  reply; three of the control's five reds are that numbering, not an invented
  issue (`TASK-112`).

Both make the assertions prove less than the claim. This spec corrects them,
registers the correction with the old assertions and the old 4/5 vs 0/5 kept as
history, and re-measures the cell.

## User Outcome

A reader of `docs/evals/coverage.md` sees the status cell measured with assertions
that accept the product's bilingual degradation and that distinguish an issue
reference from a criterion label; the old 4/5 vs 0/5 stays beside the new counts,
and the baseline's case-3 digest moves once with the old value kept in the spec.

## Scope

- **F0 — the bilingual degradation.** `reply ISSUES[\s\S]{0,120}?unknown` and the
  `CI` twin accept `(unknown|desconhecido)`; the product's own reply is bilingual,
  so the assertion must be. This is the registered correction of `TASK-113`'s
  option (a) — the skill text keeps `unknown` as its documented token, and the
  oracle accepts the Portuguese form.
- **F1 — the issue reference.** Replace `noreply #[0-9]+` with
  `noreply (#[0-9]{2,}|issue\s*#\s*[0-9]+|issues\s*#\s*[0-9]+)`: a two-digit number
  or an explicit "issue #N" is an invented issue reference, while "AC #1" is a
  criterion label and no longer a red. The limitation is recorded: a bare
  single-digit invented issue (`#7` without "issue") is not caught; the
  alternative (contextual matching) is brittle and would not change the class.
- **F2 — the baseline digest moves once.** The parsed case 3 changes, and
  `evals/corpus-baseline.json` guards it (SPEC-0065). Update **only** case 3's
  `fieldsSha256`; the old value `49ea7d9d2ced46bea430efbe7c861c29b4f8fe43dd92ea585a61d7f852384212`
  stays here as history, and every other baseline entry is untouched.
- **F3 — re-measure.** Both arms, five draws each
  (`node scripts/eval.mjs compare report-project-status 3 --repeat 5 --root
  skills`), model and detector recorded, both run dirs cited; classify. The
  previous `4/5 vs 0/5` in `2026-11-13T09-53-13--report-project-status` /
  `…09-49-36--…--without-skill` stays as history, not recomputed.
- **F4 — publish.** The coverage row/note for the cell (new counts, old counts
  marked history) and the `CHANGELOG.md` entry under `[Unreleased]`; the release
  cut decides the roadmap slot.

**Blast radius.** One corpus case (three assertions), one baseline digest, the
coverage inventory and the release entry. The skill, the runner, the detector and
every other corpus are untouched.

## Non-Goals

- No change to `skills/report-project-status/SKILL.md`: the skill's token stays
  `unknown`; the oracle learns the Portuguese form. If the re-measure shows the
  skill is wrong (not the oracle), that is a follow-up.
- No new assertion kind or runner flag (the freeze covers those).
- No edit to the bootstrap cells `#15`/`#20` — those are `SPEC-0088`.
- No `TASK-116` (the valid contract A/B) and no recomputation of a published
  number.
- No issue actions and no second skill.

## Flow

1. **F0/F1 — the assertions.** Rewrite the three assertions; `why:` gains one
   line naming the bilingual form and the label distinction.
2. **F2 — the baseline.** Update case 3's digest with the same `fieldsSha`
   digest the parity test uses; keep the old value in this spec.
3. **F3 — run.** `compare report-project-status 3 --repeat 5 --root skills`;
   record the model, the detector, both run dirs and the raw counts.
4. **F4 — publish.** Coverage and CHANGELOG; no oracle edit after the first draw.

## Data

- `evals/report-project-status/cases.md` — case 3.
- `evals/corpus-baseline.json` — case 3's digest.
- `docs/evals/coverage.md` — the cell's new note and the old counts as history.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **The bilingual form passes**: the `ISSUES`/`CI` assertions accept both
   `unknown` and `desconhecido`, and the correction is registered (old
   assertions quoted here).
2. **The label distinction holds**: `noreply` no longer matches "AC #1", and an
   explicit `issue #N` or a two-digit `#NN` still fails; the single-digit
   limitation is recorded.
3. **The baseline moves once**: case 3's digest changes, the old value is quoted,
   every other entry matches, and the parity test is green.
4. **The cell is re-measured**: five draws per arm, model and detector recorded,
   both run dirs cited, the cell classified with raw counts; the old 4/5 vs 0/5
   stays as history.
5. **The old assertions and rates are history, not deleted**: the spec and the
   coverage both keep them, marked superseded.
6. **No skill or other corpus change**: the diff touches the five declared files;
   every `tests:` command passes.
7. **Publication is complete** and `files:` is honest (`spec-check` clean).

## Open Questions

- **Does the class change?** The bilingual fix should not move the separator; the
  `noreply` tightening removes three control reds that were label noise — the
  control was already 0/5 on the ISSUES/CI assertions, so the class should stay,
  but the run decides.
- **Is the single-digit limitation acceptable?** Yes for this cell: the reply's
  own `why:` shows the honest form, and the alternative (contextual matching) is
  brittle. Recorded, not hidden.

## Prompt Notes

- **Requirements**: two assertion corrections, one baseline digest, one A/C
  re-measure, one honest publication; no skill change.
- **Entities**: bilingual token, criterion label, issue reference, old rate,
  baseline digest, clean draw, separator.
- **Approach**: rewrite the three assertions in place; update the digest with the
  parity algorithm; re-measure both arms.
- **Structure**: only the five `files:`; the skill is a read-only input.
- **Operations**: `node scripts/eval.mjs check --root skills`; then
  `compare report-project-status 3 --repeat 5 --root skills`; record the dirs.
- **Norms**: five draws, never three; the old rate stays visible; a red is named.
- **Safeguards**: no skill edit, no oracle edit after the first draw, no new
  assertion kind.
- **Tests**: the gates above; `corpus.test.mjs` proves the one-digest move.
