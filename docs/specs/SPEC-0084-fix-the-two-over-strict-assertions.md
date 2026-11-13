---
id: SPEC-0084
title: Fix the two over-strict assertions and re-measure
status: implemented
priority: P1
task: TASK-87
created_at: 2026-11-13
updated_at: 2026-11-13
source_docs:
  - backlog/tasks/task-87 - evals-corrigir-as-assercoes-20-e-15-e-re-medir-issue-12.md
  - https://github.com/ricardowendell/agent-skills/issues/12
  - docs/specs/SPEC-0045-stack-review-evals.md
  - evals/bootstrap-project-harness/cases.md
  - docs/evals/coverage.md
  - skills/bootstrap-project-harness/references/typescript.md
related_decisions: []
depends_on: []
blocks: []
files:
  - evals/bootstrap-project-harness/cases.md
  - evals/corpus-baseline.json
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0084-fix-the-two-over-strict-assertions.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0084-fix-the-two-over-strict-assertions.md --base main
---

# SPEC-0084: Fix the two over-strict assertions and re-measure

## Purpose

Two cells in the `bootstrap-project-harness` corpus are red for the wrong
reason. Case 15 asserts `unchanged justfile`, but the skill is supposed to add
the missing `coverage`, `audit`, `build` and `install` recipes to the existing
justfile; the case 20 asserts `unchanged biome.json`, but the skill is supposed
to merge the four quality limits into the existing Biome config (`SKILL.md`
step 11, `references/typescript.md` Quality limits). In both, the skill did the
instructed thing and the oracle called it a defect.

The last published numbers are history: case 15 was **1/5** (the four red draws
failed `unchanged justfile`) and case 20 was **0/5** on `unchanged biome.json`
with a control that never reached five clean draws (5 contaminated), so it was
`unresolved`, not a separator. This spec corrects the two assertions, registers
the correction with the old values kept in the record, and re-measures both
cells from scratch.

## User Outcome

A reader of `docs/evals/coverage.md` sees cases 15 and 20 measured against the
behaviour the skill actually promises — the existing recipes/keys preserved, the
missing recipes and the four limits added — with the old 1/5 and 0/5 kept as
history and the new two-arm counts cited. No skill changes.

## Scope

- **F0 — correct the two assertions.**
  - Case 15: replace `unchanged justfile` with `filematch justfile dev:` (an
    existing recipe survives) and `filematch justfile (coverage|build|audit|install):`
    (the missing recipes were added); keep `file lefthook.yml`,
    `unchanged .oxlintrc.json`, `unchanged docs-check.mjs` and `reply lefthook`.
  - Case 20: replace `unchanged biome.json` with `filematch biome.json linter`,
    `filematch biome.json formatter` (the detected choice survives),
    `filematch biome.json (maxAllowedComplexity|noExcessiveCognitiveComplexity)`,
    `filematch biome.json useMaxParams` and
    `filematch biome.json maxLines` (the four limits are merged); keep the
    `package.json`/justfile/no-second-tool assertions.
  - Update each case's `why:` to name the correction and the re-measurement, and
    keep the old 1/5 and 0/5 sentences marked as history.
- **F1 — the baseline digest moves twice.** The two parsed cases change, and
  `evals/corpus-baseline.json` guards them (SPEC-0065). Update **only** case 15
  (`abc772a4a3f9957d58e84e32de3cd62bb6c2023c63041b55caca38842ab55729`) and case 20
  (`8f610106dca66959c4a94d8b8ead9434e9bc9689d499be72df4b13b12a8fc845`) in the
  `bootstrap-project-harness` entry; every other baseline case and fixture is
  untouched. This supersedes SPEC-0065's "the baseline is not edited" for these
  two entries, recorded rather than silent, and the old digests stay here as
  history.
- **F2 — re-measure both cells.** Both arms, five draws each, for case 15 and
  case 20 (`node scripts/eval.mjs compare bootstrap-project-harness 15 --repeat 5
  --root skills`, same for 20; the positional form is required). Record the
  model, the detector and both run dirs per cell. Classify each as `separator`,
  `non-discriminator` or `unresolved` with the raw counts; a control with fewer
  than five clean draws is `unresolved` with the exact reason, and no oracle edit
  happens after the first draw.
- **F3 — publish.** Update the `bootstrap-project-harness` row in
  `docs/evals/coverage.md` for cases 15 and 20 with the new run dirs and counts,
  keeping the old rates marked as history, and add the `CHANGELOG.md` entry under
  the next release.

**Blast radius.** Two corpus cases, two baseline digests, the coverage inventory
and the release entry. The skill, the fixtures, the runner and the detector are
untouched.

## Non-Goals

- No edit to `skills/bootstrap-project-harness/SKILL.md`, its references or its
  templates: the skill's behaviour is the contract, and the oracle was wrong.
- No fixture edit: fixtures 15 and 20 stage the same trees; only the assertions
  change.
- No other case edit, no new assertion kind, no runner change (the freeze covers
  those).
- No recomputation of the old 1/5 and 0/5; they stay as history with the new
  value beside them.
- No claim of a separator from fewer than five clean draws per arm.

## Flow

1. **F0 — assertions.** Rewrite the two `assert:` blocks; the `why:` names the
   correction. `node scripts/eval.mjs check --root skills` stays clean.
2. **F1 — baseline.** Update the two digests with the same `fieldsSha` digest the
   parity test uses; run `node --test scripts/lib/evals/corpus.test.mjs`.
3. **F2 — run.** Four runs (2 cells × 2 arms), five draws each, model recorded;
   read the counts, classify, name every red assertion.
4. **F3 — publish.** The coverage row for #15/#20 and the CHANGELOG entry.

## Data

- `evals/bootstrap-project-harness/cases.md` — cases 15 and 20.
- `evals/corpus-baseline.json` — the two `fieldsSha256` values.
- `docs/evals/coverage.md` — the bootstrap row and its #15/#20 notes.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **The oracle matches the promised behaviour**: case 15 asserts an existing
   recipe survives and the four missing recipes are added; case 20 asserts the
   linter/formatter choice survives and the four limits are merged.
2. **The correction is registered**: the old assertions and the old rates (1/5
   for #15, 0/5 for #20) are quoted in this spec and marked as history in the
   coverage row; nothing is silently rewritten.
3. **The baseline moves exactly twice**: case 15's and case 20's digests change,
   the old values are kept in this spec, every other entry matches, and the
   parity test is green.
4. **Both cells are re-measured**: five draws per arm, model and detector
   recorded, both run dirs cited, and each cell classified with raw counts.
5. **No oracle edit after the first draw**: the correction lands before any draw;
   a red cell is named and becomes a follow-up, not an edit.
6. **No skill, fixture, runner or detector change**: `git diff` touches only the
   five declared files; every `tests:` command passes.
7. **Publication is complete**: the coverage row carries the new evidence with
   the old rates marked, and the CHANGELOG entry states what changed and what
   did not.

## Open Questions

- **Are the new assertions tight enough without being brittle?** The Biome
  keys are matched by value rather than by exact rule name (`maxAllowedComplexity`,
  `useMaxParams`, `maxLines`), so a valid merge cannot be called a miss; the run
  decides whether the shape is right, and a red cell is a follow-up.
- **Can the controls reach five clean draws now?** Case 20's old control was 5
  contaminated under the pre-deny detector; the current detector separates a
  denied read from a leak, so a clean pair is reachable. If it is not, the cell
  is `unresolved` with the reason.
- **Does the skill keep `dev:` in the fixture justfile?** The fixture has a
  `dev` recipe the template does not; the `filematch justfile dev:` is the proof
  that the merge did not rewrite the file.

## Prompt Notes

- **Requirements**: two corrected assertions, two baseline digests, two
  re-measured cells at five draws per arm, one honest publication; no skill
  change.
- **Entities**: existing recipe, missing recipe, detected linter/formatter, four
  limits, old rate as history, clean draw, separator, baseline digest.
- **Approach**: replace the two `unchanged <file>` assertions with
  preserve-and-merge checks drawn from `SKILL.md` step 11 and
  `references/typescript.md`; update the baseline with the same `fieldsSha`
  digest the parity test uses.
- **Structure**: only the five `files:`; the fixtures and the skill are read-only
  inputs.
- **Operations**: `node scripts/eval.mjs check --root skills`; then
  `compare bootstrap-project-harness 15 --repeat 5 --root skills` and the same
  for 20; record the four run dirs and the model.
- **Norms**: five draws, never three; a contaminated control is `unresolved`;
  the old rate stays visible; a red assertion is named, not softened.
- **Safeguards**: no skill or fixture edit; no oracle edit after the first draw;
  no new assertion kind.
- **Tests**: the gates above; `corpus.test.mjs` proves the two-digest move, and
  `check-evidence` validates the run-dir citations.
