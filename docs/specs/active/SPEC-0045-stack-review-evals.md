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
  - skills/bootstrap-project-harness/scripts/template-reference-parity.test.mjs
  - skills/bootstrap-project-harness/references/evals/16/.gitkeep
  - skills/bootstrap-project-harness/references/evals/17/bun.lock
  - skills/bootstrap-project-harness/references/evals/17/bunfig.toml
  - skills/bootstrap-project-harness/references/evals/17/package.json
  - skills/bootstrap-project-harness/references/evals/17/README.md
  - skills/bootstrap-project-harness/references/evals/17/src/index.ts
  - skills/bootstrap-project-harness/references/evals/17/test/index.test.ts
  - skills/bootstrap-project-harness/references/evals/17/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/18/.nvmrc
  - skills/bootstrap-project-harness/references/evals/18/package.json
  - skills/bootstrap-project-harness/references/evals/18/pnpm-lock.yaml
  - skills/bootstrap-project-harness/references/evals/18/README.md
  - skills/bootstrap-project-harness/references/evals/18/src/index.ts
  - skills/bootstrap-project-harness/references/evals/18/test/index.test.ts
  - skills/bootstrap-project-harness/references/evals/18/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/19/package.json
  - skills/bootstrap-project-harness/references/evals/19/README.md
  - skills/bootstrap-project-harness/references/evals/19/src/index.ts
  - skills/bootstrap-project-harness/references/evals/19/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/20/biome.json
  - skills/bootstrap-project-harness/references/evals/20/package.json
  - skills/bootstrap-project-harness/references/evals/20/README.md
  - skills/bootstrap-project-harness/references/evals/20/src/index.ts
  - skills/bootstrap-project-harness/references/evals/20/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/21/package.json
  - skills/bootstrap-project-harness/references/evals/21/packages/a/package.json
  - skills/bootstrap-project-harness/references/evals/21/packages/a/src/index.ts
  - skills/bootstrap-project-harness/references/evals/21/packages/b/package.json
  - skills/bootstrap-project-harness/references/evals/21/packages/b/src/index.ts
  - skills/bootstrap-project-harness/references/evals/21/README.md
  - skills/bootstrap-project-harness/references/evals/21/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/22/.python-version
  - skills/bootstrap-project-harness/references/evals/22/package.json
  - skills/bootstrap-project-harness/references/evals/22/pyproject.toml
  - skills/bootstrap-project-harness/references/evals/22/README.md
  - skills/bootstrap-project-harness/references/evals/22/src/index.ts
  - skills/bootstrap-project-harness/references/evals/22/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/23/bun.lock
  - skills/bootstrap-project-harness/references/evals/23/bunfig.toml
  - skills/bootstrap-project-harness/references/evals/23/package.json
  - skills/bootstrap-project-harness/references/evals/23/README.md
  - skills/bootstrap-project-harness/references/evals/23/src/index.ts
  - skills/bootstrap-project-harness/references/evals/23/tsconfig.json
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

## Results

Measured on 2026-11-08 on `agentworks/deepseek-v4-1-flash` (the documented
measurement route in `docs/evals/coverage.md`), five draws per cell, detector
`71bfb85a91cd68ab`. Every command below ran from this worktree with `node`; no
skill text, template, detector or Python file was changed.

### Runs

- **Skill arm** — `2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`.
  8 cases, 40 draws. `check-eval-run`: `findings=3`, `skillLeaks=0`,
  `hostReads=1`, `isolated=no`. The findings are the two stalls below and one
  host read in the trigger case (`#23 r4`, `/Users/wendell/.agents`).
- **Control** — `2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill`.
  7 cases, 35 draws. `check-eval-run`: `findings=40`, `skillLeaks=33`,
  `hostReads=7`, `isolated=no`. Every behavioural cell read the real install
  under `/Users/wendell/.agents/skills` or the host checkout; `#19` managed two
  clean draws and both failed its assertions.
- **Harness-state re-measure** — `2026-11-08T23-32-34--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`.
  2 cases, 10 draws. `check-eval-run`: `findings=0`, `skillLeaks=0`,
  `hostReads=0`, `isolated=yes`.

### Classification

| case | fixture | with skill (clean draws) | control (clean draws) | classification | failing assertion |
| --- | --- | --- | --- | --- | --- |
| #16 | empty repo | 4/4 passed, 1 stalled | 0/0 (5 contaminated) | unresolved | — |
| #17 | existing Bun | 4/4 passed, 1 stalled | 0/0 (5 contaminated) | unresolved | — |
| #18 | Node + pnpm | 5/5 | 0/0 (5 contaminated) | unresolved | — |
| #19 | declared ESLint, no config | 5/5 | 0/2 clean (2 failed, 3 contaminated) | unresolved | — |
| #20 | existing Biome | 0/5 | 0/0 (5 contaminated) | unresolved (red cell) | `unchanged biome.json` |
| #21 | npm workspace | 5/5 | 0/0 (5 contaminated) | unresolved | — |
| #22 | ambiguous stack | 5/5 | 0/0 (5 contaminated) | unresolved | — |
| #23 | Bun trigger | 4/4 clean, 1 contaminated | n/a | unresolved (routing) | — |
| #14 | complete harness | 5/5 | n/a | measured | — |
| #15 | nearly complete | 1/5 | n/a | red cell | `unchanged justfile` |

**No cell is a separator, and no cell is a non-discriminator.** A separator
needs five clean draws in both arms; the control has zero clean draws in every
behavioural cell, because it still reads the real install and the host corpus.
That is the deny-layer half of TASK-43, not a behavioural difference, and it is
published as `unresolved`, never as a separation.

`#20` is red on `unchanged biome.json`: the draws show the skill merging the
four Biome limits (`noExcessiveCognitiveComplexity`, `useMaxParams`,
`noExcessiveLinesPerFunction`, `noExcessiveLinesPerFile`) into the existing
config, which is step 11's instructed behavior ("translate the four limits into
its config"), not a rewritten config. The assertion is over-strict; it is
recorded here rather than edited after the draws. `#15` is red on `unchanged
justfile`: the draws add the missing `coverage`, `audit`, `build` and `install`
recipes, which is step 8's instructed behavior for an existing justfile. Both
cases need a corrected assertion in a follow-up; this spec does not change an
oracle after seeing draws.

### Stall protocol

Two paid draws stalled after the skill loaded, in the skill arm:

- `#16 r1`: `exit=stalled`, `stallMs=120000`, `durationMs=318637`,
  `attempts=2`, `retries=1`, `steps=30`, `toolCalls=30`, skill gate
  `loaded bootstrap-project-harness` (tool). The last event was a `step_start`;
  the watchdog killed 120 s of silence.
- `#17 r1`: `exit=stalled`, `stallMs=120000`, `durationMs=395435`,
  `attempts=2`, `retries=1`, `steps=22`, `toolCalls=38`, skill gate
  `loaded bootstrap-project-harness` (tool). Same gap and kill rule.

The stalled draws were not resumed and no `--resume` was used. The coordinator
reopens TASK-50 with these events; the affected cells are unresolved, not
passes, and the five-draw rule was not lowered.

### Template parity

`node --test skills/bootstrap-project-harness/scripts/template-reference-parity.test.mjs`
passes 2/2: the shipped `package.json`, `tsconfig.json`, `.oxlintrc.json`,
`.nvmrc`, package scripts and CI matrix agree with `references/typescript.md`,
and a deliberate `.nvmrc` divergence is reported.

### Left out

The control's clean five-draw matrix (the deny layer still reads the real
install, TASK-43); a corrected `#20` and `#15` assertion (not edited after the
draws); and any change to the skill text, templates, detector or Python. The
`check-evidence` warnings are pre-existing lines in other matrices; the new
coverage row adds none.

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
