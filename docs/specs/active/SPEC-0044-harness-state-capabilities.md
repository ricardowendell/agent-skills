---
id: SPEC-0044
title: Check capabilities, not fixed file names, in harness-state
status: ready
priority: P2
task: TASK-68
created_at: 2026-11-08
updated_at: 2026-11-08
source_docs:
  - https://github.com/ricardowendell/agent-skills/issues/12
  - backlog/tasks/task-68 - stack-harness-state-por-capacidades-e-slots.md
  - skills/bootstrap-project-harness/scripts/harness-state.mjs
  - docs/specs/active/SPEC-0041-typescript-stack-decision.md
  - docs/specs/active/SPEC-0043-typescript-templates.md
related_decisions: []
depends_on:
  - SPEC-0041-typescript-stack-decision
  - SPEC-0043-typescript-templates
blocks:
  - SPEC-0045-stack-review-evals
files:
  - skills/bootstrap-project-harness/scripts/harness-state.mjs
  - skills/bootstrap-project-harness/scripts/harness-state.test.mjs
  - docs/specs/active/SPEC-0044-harness-state-capabilities.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0044-harness-state-capabilities.md --base main
---

# SPEC-0044: Check capabilities, not fixed file names, in harness-state

## Purpose

`harness-state.mjs` decides whether a repository's harness is complete. Today
`REQUIRED.ts` names `eslint.config.js` and `.prettierrc`, so a valid Biome
project reads as incomplete, and `detectStack` treats the presence of
`tsconfig.json` as the stack. Issue #12 makes the detector part of the system:
it must check the capability (a linter, a formatter, a test runner, hooks, CI),
not one vendor's file name, and it must be correct before dependencies are
installed.

## User Outcome

A consumer can run the state check on a Bun, Node+pnpm, ESLint/Prettier or
Biome/Oxlint repository and get `complete` for every supported configuration. An
ambiguous or conflicting stack is refused with a diagnostic instead of being
declared complete or overwritten.

## Scope

- **Capabilities and slots.** Replace the fixed file list with slots: linter,
  formatter, test runner, typecheck, hooks, CI, docs sensor. Each slot accepts
  the supported implementations and reports what it found.
- **Correct before install.** `complete` must not depend on `node_modules` or a
  lockfile existing; absence of either is not incompleteness.
- **Detection preserves the choice.** Recognize Bun, Node + pnpm/npm, and the
  supported linter/formatter/test-runner combinations; do not require ESLint and
  Prettier when an approved combination fills the same slot.
- **Competing toolchains** are a diagnostic, not a rewrite.
- **Tests** extend `harness-state.test.mjs` with the fixtures named below.
- **Python, the docs sensors and routing are untouched.**

**Blast radius.** `scripts/harness-state.mjs` and its test file, plus this spec.
No templates, skill text or eval files.

## Non-Goals

- No template change (SPEC-0043).
- No skill-text change (SPEC-0042).
- No new stack.
- No silent migration of a consumer's files.

## Flow

1. **F0 — read the decision and templates** from `SPEC-0041` and `SPEC-0043`.
2. **F1 — model slots.** Define the capability slots and the accepted
   implementations per stack.
3. **F2 — rewrite detection.** Detect the stack and the filled slots without
   assuming a vendor file.
4. **F3 — states.** `complete`, `partial`, `ambiguous` and `conflict` with
   diagnostics; verify before install.
5. **F4 — tests.** New repo, existing Bun, Node + pnpm, existing lint/format,
   monorepo, and a conflict fixture.

## Data

- `skills/bootstrap-project-harness/scripts/harness-state.mjs`.
- `skills/bootstrap-project-harness/scripts/harness-state.test.mjs`.

## Acceptance Criteria

1. **`REQUIRED`/`OPTIONAL` express capabilities/slots** (linter, formatter,
   test runner, typecheck, hooks, CI, docs sensor), not fixed file names.
2. **`complete` is reported for every supported stack/profile**, including
   before `node_modules` and a lockfile exist.
3. **Recognized choices are preserved**: Bun, Node + pnpm/npm, ESLint/Prettier
   and Biome/Oxlint; a competing toolchain produces a diagnostic, not a rewrite.
4. **Ambiguous or conflicting stacks are refused** with the reason, never
   reported as complete.
5. **Tests cover** a new repo, existing Bun, Node + pnpm, an existing
   linter/formatter, a monorepo, and a conflict fixture.
6. **Python, the docs sensors and routing are unaffected.**
7. **No drift.** Every command in `tests:` passes.

## Open Questions

- **Slot granularity**: is "lint" one slot or two (lint + type-aware lint)? Keep
  the smallest set that the supported stacks actually differ on.
- **Monorepo**: does the detector need a workspace slot, or is it a note on the
  root `package.json`? Decide from the `SPEC-0041` decision.
- **`smoke`**: the existing smoke path must keep working when a dependency is
  intentionally absent; confirm it does not become a false `partial`.
- **Fixture regression test**: add a `stateOf()` assertion against
  `references/evals/14` (complete) and `15` (partial, only `lefthook.yml`
  missing). The SPEC-0043 template rename broke both silently; a fixture
  assertion would have caught it.

## Prompt Notes

- **Requirements**: capability slots, correct state before install, preserve the
  detected choice, refuse ambiguity.
- **Entities**: stack, slot, capability, implementation, state (`complete`,
  `partial`, `ambiguous`, `conflict`), diagnostic.
- **Approach**: keep the current entry point and output shape; change the model,
  not the interface a consumer sees.
- **Structure**: one detector file plus its test; no new module unless the file
  becomes unreviewable.
- **Operations**: run the detector against the fixtures with and without
  dependencies installed.
- **Norms**: no second toolchain; no silent migration; a missing optional tool
  is `partial`, not `broken`.
- **Safeguards**: do not edit templates to fit the detector; they are
  SPEC-0043's and must agree with `SPEC-0041`.
- **Tests**: the `tests:` list is model-free; the behavioural cases are
  SPEC-0045.
