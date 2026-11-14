---
id: SPEC-0088
title: The bootstrap cases prove the four recipes and the four limits
status: ready
priority: P1
task: TASK-114
created_at: 2026-11-13
updated_at: 2026-11-13
source_docs:
  - backlog/tasks/task-114 - skill-o-bootstrap-nao-adiciona-as-quatro-receitas-ausentes-no-caso-15.md
  - backlog/tasks/task-115 - evals-a-alternacao-prova-uma-receita-nao-as-quatro-e-um-maxLines-cobre-duas-regras.md
  - docs/specs/SPEC-0084-fix-the-two-over-strict-assertions.md
  - evals/bootstrap-project-harness/cases.md
  - skills/bootstrap-project-harness/SKILL.md
  - docs/evals/coverage.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills/bootstrap-project-harness/SKILL.md
  - evals/bootstrap-project-harness/cases.md
  - evals/corpus-baseline.json
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0088-bootstrap-cases-prove-the-four.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0088-bootstrap-cases-prove-the-four.md --base main
---

# SPEC-0088: The bootstrap cases prove the four recipes and the four limits

## Purpose

`SPEC-0084` corrected two over-strict assertions in
`bootstrap-project-harness` and re-measured both cells at `2026-11-13`. Both
came back `unresolved`, and both left a debt:

- **Case 15 measured 1/5 with the skill**, and the four red draws
  (`r1`, `r2`, `r3`, `r5` in `2026-11-13T10-59-24--bootstrap-project-harness`)
  each failed the **single** red assertion
  `filematch justfile (coverage|build|audit|install):` — they kept the justfile
  byte-for-byte instead of adding the four missing recipes. The oracle is not
  wrong: `SKILL.md:266` (step 8) says "keep the project's `justfile`, add only
  the missing recipes", and `SKILL.md:45` puts `justfile` inside the
  additive-only rule. The **skill's own end-of-run audit checklist**
  (`SKILL.md:432`) greps only `check: justfile`, so the contract asks for four
  recipes and verifies one — the instruction is right, the verification gate is
  the gap (`TASK-114`).
- **Both corrected cells prove less than they claim.** The case-15 alternation
  passes when *one* of the four recipes is added, while the published claim is
  "the four"; and `filematch biome.json maxLines` in case 20 passes on *one* of
  the two Biome line rules (60 lines/function, 200 lines/file), so a draw that
  merged one limit and dropped the other is green (`TASK-115`).

This spec closes the skill gap, makes both oracles prove the claim, and
re-measures with an instrument that no longer manufactures a ceiling: the valid
draws in the last run took **505 s (#15)**, **543 s** and **578 s (#20)** against
the default **600 s** hard timeout, and of the twenty draws those two cells
spent, five ended in `timeout` and one in `stall` — six non-passing draws that
the ceiling removed from the evidence, not the skill.

## User Outcome

A reader of `docs/evals/coverage.md` sees cases 15 and 20 measured against
assertions that distinguish "one recipe" from "four" and "one line rule" from
"both", with the old 1/5 and 2/2-vs-1/3 kept as history. A bootstrap user gets
the four recipes because the skill checks for them at the end, and a re-measure
that is not cut off at 600 s.

## Scope

- **F0 — the #15 decision: the skill is wrong, not the oracle.** Fix the skill;
  do not weaken the assertion. The evidence is the four named draws, each red
  only on the recipes assertion, against `SKILL.md:266` and `SKILL.md:45`; the
  decision is written in the coverage note with the draws and the excerpt.
- **F1 — the skill.** Two edits, no new step and no new file:
  - step 8 names the four recipes the template adds beyond a typical project —
    `coverage`, `audit`, `build`, `install` — and says each must be present,
    with the existing body kept when the recipe already exists;
  - the end-of-run audit checklist replaces `grep -q "check:" justfile` with a
    per-recipe loop (`check`, `coverage`, `audit`, `build`, `install`), so the
    gate the agent runs sees the same four the instruction asks for.
  The skill's tree hash moves, so this spec owns the staleness it causes: `#1`
  was the one fresh bootstrap cell (`skillHash 913614a6…` via
  `2026-11-13T19-27-21`), and F6 restores it.
- **F2 — case 15 asserts the four recipes.** Replace the alternation with four
  assertions, one per recipe, each matching a definition at column 0:
  `filematch justfile (^|\n)coverage:`, `…(^|\n)audit:`, `…(^|\n)build:`,
  `…(^|\n)install:`. The `why:` records that one missing recipe now fails, and
  the limitation: a recipe added under a different name (`cover:`) fails, which
  is intended — the template's names are the claim.
- **F3 — case 20 asserts the four limits.** Replace `filematch biome.json
  maxLines` with the two line rules and their values:
  `filematch biome.json noExcessiveLinesPerFunction`,
  `filematch biome.json noExcessiveLinesPerFile`,
  `filematch biome.json maxLines":\s*60\b`,
  `filematch biome.json maxLines":\s*200\b`. Complexity and parameters keep
  their assertions. The `why:` records that one line rule is no longer enough.
  The exact JSON shape is taken from a green draw of
  `2026-11-13T11-56-32--bootstrap-project-harness` (`noExcessiveLinesPerFunction`
  → `"maxLines": 60`; `noExcessiveLinesPerFile` → `"maxLines": 200`).
- **F4 — the baseline moves twice.** Only case 15 (`4dec9dd5…b20856`) and case
  20 (`a49b61a3…ed360`) change in `evals/corpus-baseline.json`; the old digests
  stay quoted here, and every other entry is untouched.
- **F5 — re-measure with a timeout that fits the work.** Both cells, both arms,
  five draws each, with the **existing** `--timeout 1200` flag:
  `node scripts/eval.mjs compare bootstrap-project-harness 15 --repeat 5
  --timeout 1200 --root skills` and the same for `20`. Model and detector
  recorded, both run dirs cited, raw counts and reds named, classified. The
  previous 1/5 and 2/2-vs-1/3 stay as history, not recomputed. The timeout is an
  instrument parameter, not an oracle change, and it is recorded beside the
  counts.
- **F6 — restore the screening cell.** `#1` goes stale by F1. Re-screen it with
  one draw (`node scripts/eval.mjs run bootstrap-project-harness 1 --repeat 1
  --root skills`); if that draw is contaminated or stalled, do **not** buy a
  second one — declare `#1` stale with the reason and say so.
- **F7 — publish.** The coverage row/note for both cells (new counts, old counts
  marked history, the F0 decision, the timeout and the `#1` result) and one
  `CHANGELOG.md` entry under `[Unreleased]`; the release cut decides the
  roadmap slot.

**Blast radius.** One skill's prose and checklist, two corpus cases, two
baseline digests, the coverage inventory and the release entry. The runner,
detector, fixtures, templates and every other corpus are untouched.

## Non-Goals

- No change to the fixtures: case 15's justfile stays the one that lacks the
  four recipes, and case 20's `biome.json` stays the bare
  `linter`/`formatter` file.
- No new assertion kind, runner flag, detector version or pdlc stage. `--timeout`
  already exists; raising it is a parameter, and the 600 s runs keep their
  published counts as history.
- No edit to `docs/specs/SPEC-0084-…`: its 1/5 and 2/2-vs-1/3 are history.
- No `TASK-116` (the valid contract A/B) and no other corpus.
- No push and no issue action.

## Flow

1. **F0/F1 — the skill.** Naming the four recipes in step 8 and replacing the
   single grep in the audit checklist with the five-recipe loop; no new step.
2. **F2/F3 — the oracles.** Four recipe assertions and the split Biome limits;
   each `why:` names the correction and its limit.
3. **F4 — the baseline.** Recompute only the two `fieldsSha256` values with the
   parity algorithm; `node --test scripts/lib/evals/corpus.test.mjs` proves it.
4. **F5/F6 — the runs.** Both cells with `--timeout 1200`, then the `#1`
   screening draw; record model, detector, dirs, counts, reds.
5. **F7 — publish.** Coverage and CHANGELOG; no oracle edit after the first
   draw.

## Data

- `skills/bootstrap-project-harness/SKILL.md` — step 8 and the audit checklist.
- `evals/bootstrap-project-harness/cases.md` — cases 15 and 20.
- `evals/corpus-baseline.json` — the two case digests.
- `docs/evals/coverage.md` — the cells' new notes and the old counts.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **The skill asks for what it checks**: step 8 names the four recipes and the
   audit checklist greps all four plus `check`; the diff adds no step and no
   file to the skill.
2. **Case 15 proves four**: four independent assertions, each failing when its
   own recipe is absent; the `why:` records the renamed-recipe limitation.
3. **Case 20 proves four limits**: the two line rules and their two values are
   asserted separately, beside complexity and parameters; the `why:` records
   why one `maxLines` was not enough.
4. **The baseline moves exactly twice**: cases 15 and 20 change, the old digests
   are quoted here, every other entry matches, and parity is green.
5. **Both cells are re-measured**: five draws per arm with `--timeout 1200`,
   model, detector, both run dirs, raw counts, reds and the classification
   recorded; the old 1/5 and 2/2-vs-1/3 stay as history.
6. **The screening cell is restored or declared**: `#1` has a fresh cited draw
   with the new skill hash, or is declared stale with the reason and no second
   paid attempt.
7. **Publication is complete** and `files:` is honest (`spec-check` clean);
   every `tests:` command passes.

## Open Questions

- **Do the checklist greps close the gap?** The four red draws did the additive
  work correctly everywhere else (lefthook, config, docs) and stopped at the
  justfile, which the audit checklist barely looked at. A five-recipe loop is
  the smallest change that makes the end-of-run gate see the same four the
  instruction names. If the cell stays red, that is a finding about the skill's
  step 8 prominence, not a reason to soften the assertion — report it.
- **Will `--timeout 1200` be enough?** The valid draws sat at 505–578 s of a
  600 s ceiling, so 1200 s doubles the headroom. If draws still time out, the
  cell stays `unresolved`, the count is named and no class is claimed.

## Prompt Notes

- **Requirements**: one skill fix, two oracle corrections, two digests, two
  re-measures with a 1200 s timeout, one screening draw, one honest publication.
- **Entities**: four recipes, per-recipe assertion, two Biome line rules,
  timeout ceiling, old rate, baseline digest, clean draw, unresolved.
- **Approach**: edit step 8 and the audit checklist; rewrite the assertions in
  place; recompute the two digests; re-measure both arms.
- **Structure**: only the six `files:`; fixtures and templates are read-only
  inputs.
- **Operations**: `node scripts/eval.mjs check --root skills`; then
  `compare bootstrap-project-harness 15 --repeat 5 --timeout 1200 --root skills`
  and the same for `20`; then `run bootstrap-project-harness 1 --repeat 1
  --root skills`; record every dir.
- **Norms**: five draws per arm; never recompute a published number; a red is
  named, not softened; a timeout is an instrument fact, not a result.
- **Safeguards**: no fixture edit, no oracle edit after the first draw, no new
  assertion kind, no second paid screening attempt.
- **Tests**: the gates above; `corpus.test.mjs` proves the two-digest move;
  `check-staleness.mjs` is the staleness gate and its count is reported, not
  hidden.
