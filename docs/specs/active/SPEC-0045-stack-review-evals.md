---
id: SPEC-0045
title: Measure and publish the stack review
status: ready
priority: P2
task: TASK-69
created_at: 2026-11-08
updated_at: 2026-11-08
source_docs:
  - https://github.com/ricardowendell/agent-skills/issues/12
  - backlog/tasks/task-69 - stack-evals-e-documentação-do-stack-review.md
  - skills/bootstrap-project-harness/references/evals.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0041-typescript-stack-decision.md
related_decisions: []
depends_on:
  - SPEC-0041-typescript-stack-decision
  - SPEC-0042-preserve-existing-stack
  - SPEC-0043-typescript-templates
  - SPEC-0044-harness-state-capabilities
blocks: []
files:
  - skills/bootstrap-project-harness/references/evals.md
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0045-stack-review-evals.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0045-stack-review-evals.md --base main
---

# SPEC-0045: Measure and publish the stack review

## Purpose

The stack decision and the templates are only a claim until they are measured.
Issue #12 requires behavioural evaluation with and without the skill, template
parity, fixtures for the supported stacks, and a published coverage row and
CHANGELOG entry. This spec closes the split; it owns the publication surfaces so
the intermediate specs do not collide on them.

## User Outcome

A reader can see that the bootstrap produces a runnable harness, preserves an
existing stack, and introduces no parallel toolchain, with the cases, fixtures
and run directories named. The coverage inventory and the CHANGELOG state the
claim and the alternatives.

## Scope

- **Behavioural cases with and without the skill**, proving:
  - a bootstrap on an empty repo produces a runnable configuration;
  - an existing project is preserved (no replacement, no second toolchain);
  - an ambiguous or conflicting stack is refused with a diagnostic.
- **Fixtures**: empty repo, existing Bun, Node + pnpm/npm, a declared dependency
  without its config, an existing linter/formatter, a monorepo, and a
  conflict/ambiguous stack.
- **Template parity**: a check that the templates and
  `references/typescript.md` agree; a deliberate divergence must fail.
- **The five-draw rule** for any behavioural cell; a dirty or infrastructure
  draw is not a pass; the stall protocol from `docs/evals/coverage.md` applies.
- **Publication**: the coverage row and the CHANGELOG entry. The CHANGELOG states
  the claim and the supported alternatives; it never recomputes a published
  number.
- **Untouched**: the Python bootstrap, the docs sensors and the routing cases.

**Blast radius.** The skill's eval file, the new fixtures, the coverage row and
the CHANGELOG, plus this spec.

## Non-Goals

- No change to the skill text, templates or detector (SPEC-0042–0044).
- No new assertion kind.
- No lowering of the five-draw rule to make a cell fit.
- No claim of separation from a manual or undrawn case.

## Flow

1. **F0 — cases.** Add the behavioural and trigger cases and their fixtures;
   `--list --check` clean.
2. **F1 — parity.** Add the template/reference parity check.
3. **F2 — measure.** Run both arms, five draws per cell, with the documented
   model; record every run directory.
4. **F3 — classify.** Separator, non-discriminator or unresolved; name the
   failing assertion for every red cell. A control without five clean draws is
   unresolved.
5. **F4 — publish.** The coverage row and the CHANGELOG entry; the spec's
   Results.

## Data

- `skills/bootstrap-project-harness/references/evals.md` and its fixture trees.
- `docs/evals/coverage.md` and `CHANGELOG.md`.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **Behavioural cases exist with and without the skill** and show that a
   bootstrap produces a runnable configuration, preserves an existing project and
   introduces no parallel toolchain.
2. **Fixtures cover** an empty repo, existing Bun, Node + pnpm/npm, a declared
   dependency without its config, an existing linter/formatter, a monorepo, and
   a conflict/ambiguous stack.
3. **Template parity is checked**: a deliberate divergence between the templates
   and `references/typescript.md` fails.
4. **Every behavioural cell follows the five-draw rule**; a dirty or
   infrastructure draw is not a pass, and a control without five clean draws is
   unresolved, never a separator.
5. **Coverage records the cases and their evidence**; an unmeasured or manual
   case is not counted as separation.
6. **The CHANGELOG states the claim and the alternatives** and does not
   recompute a published number.
7. **Python, the docs sensors and routing remain green.**
8. **`files:` follows the real diff**: every fixture file created is added to
   `files:` before `implemented`.
9. **No drift.** Every command in `tests:` passes.

## Open Questions

- **How many behavioural cells are worth the draws?** The stack change is mostly
  deterministic; measurement should focus on preservation and refusal, not on
  re-proving the whole bootstrap corpus.
- **Manual versus deterministic**: some bootstrap cases are `manual` today; a
  manual case is design intent, not evidence, and must not be counted.
- **Shared publication files**: `docs/evals/coverage.md` and `CHANGELOG.md` are
  also declared by other paused specs (SPEC-0034/0039/0040). Dispatch one at a
  time, or declare a dependency, so `pdlc groom` does not reject the pair.

## Prompt Notes

- **Requirements**: measure preservation and refusal; publish coverage and
  CHANGELOG; never claim separation from a manual cell.
- **Entities**: arm, draw, fixture, stack, parity check, coverage row, claim.
- **Approach**: reuse the existing bootstrap fixtures where they already model
  a stack; add only the missing ones.
- **Structure**: the existing eval file plus new fixture trees; no runner change.
- **Operations**: `node scripts/run-evals.mjs --root skills --list --check`
  first; then the five-draw matrix with the documented model.
- **Norms**: five clean draws for a rate; a dirty draw is not a pass; a stall
  stops the wave and reopens TASK-50.
- **Safeguards**: do not edit an oracle after seeing draws to force a
  separation; a limitation is published as `unresolved`.
- **Tests**: the `tests:` list is model-free; the draws are evidence.
