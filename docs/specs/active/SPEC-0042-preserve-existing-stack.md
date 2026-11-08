---
id: SPEC-0042
title: Detect and preserve an existing TypeScript stack
status: ready
priority: P2
task: TASK-66
created_at: 2026-11-08
updated_at: 2026-11-08
source_docs:
  - https://github.com/ricardowendell/agent-skills/issues/12
  - backlog/tasks/task-66 - stack-SKILL-detecta-e-preserva-a-stack-existente.md
  - skills/bootstrap-project-harness/SKILL.md
  - docs/specs/active/SPEC-0041-typescript-stack-decision.md
related_decisions: []
depends_on:
  - SPEC-0041-typescript-stack-decision
blocks:
  - SPEC-0045-stack-review-evals
files:
  - skills/bootstrap-project-harness/SKILL.md
  - docs/specs/active/SPEC-0042-preserve-existing-stack.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0042-preserve-existing-stack.md --base main
---

# SPEC-0042: Detect and preserve an existing TypeScript stack

## Purpose

The skill's scope line says "TypeScript/Node (bun)" and its steps assume the Bun
workflow. On an existing project that already chose Node + pnpm, Biome, or
`node:test`, the skill must not install a second toolchain or rewrite the
scripts. Issue #12's objective 8 makes additive-only explicit: detect, preserve,
and refuse a destructive change.

This spec changes the skill text (and only the skill text) to make detection the
first decision and the default apply only to an empty repository.

## User Outcome

A consumer running `bootstrap` on an existing TypeScript repo gets the harness it
already chose, completed rather than replaced. A consumer on an empty repo gets
the default decided in `SPEC-0041`. A genuine conflict is named, and the step is
skipped, not silently overwritten.

## Scope

- **Detection before defaults.** Read runtime, package manager, lockfile, linter,
  formatter, test runner, hook manager and existing scripts. `tsconfig.json`
  alone does not prove Bun; a `bun.lock` does.
- **Preserve the existing choice.** No second toolchain, no replacement of
  ESLint/Prettier for Biome or the reverse, no switching `node:test` to Vitest.
- **Defaults only for an empty repo.** Use `SPEC-0041`'s default when no
  TypeScript/Node stack is detectable; state that the default is a fallback.
- **Merge, never overwrite.** Existing `package.json` keys, scripts, hooks and
  config files are merged; a collision produces a diagnostic and skips.
- **A detection table** in the skill names the signal for each supported stack
  and profile (Bun, Node + pnpm/npm, existing linter/formatter, test runner,
  monorepo).
- **Python and the other surfaces are untouched.**

**Blast radius.** The skill's stack/detection section and the steps that name
Bun or a fixed linter. No template, detector or eval change.

## Non-Goals

- No implementation of the templates (SPEC-0043).
- No detector code (SPEC-0044).
- No forced migration or "upgrade" of an existing toolchain.
- No new stack beyond TypeScript/Node and Python.

## Flow

1. **F0 — read the decision.** Take the default and the supported alternatives
   from `SPEC-0041`.
2. **F1 — detection table.** Write the signals for each stack and profile.
3. **F2 — steps.** Rewrite the stack-specific steps to branch on detection and
   to merge instead of overwrite.
4. **F3 — refusal.** Name the conflict cases and the diagnostics; keep the
   additive-only guarantee.
5. **F4 — check.** `--list --check` and the skill's own examples still hold.

## Data

- `skills/bootstrap-project-harness/SKILL.md` — the detection table and steps.

## Acceptance Criteria

1. **Detection resolves** runtime, package manager, lockfile, linter, formatter,
   test runner, hook manager and scripts from the repository; `tsconfig.json`
   alone is not evidence of Bun.
2. **An existing choice is preserved**: no replacement and no second toolchain;
   the skill does not install a competing linter, formatter or test runner.
3. **Defaults apply only to an empty repo**, and the default is the one decided
   in `SPEC-0041`.
4. **Existing scripts and hooks are merged, never overwritten**; a collision
   produces a diagnostic and the step is skipped.
5. **The detection table names a signal** for every supported stack and profile,
   including Bun, Node + pnpm/npm, an existing linter/formatter and a monorepo.
6. **The additive-only boundary is explicit** and no step silently rewrites a
   config file.
7. **Python is unchanged** and the skill still routes it correctly.
8. **No drift.** Every command in `tests:` passes.

## Open Questions

- **How far does "preserve" go** when the existing stack is incomplete — e.g.
  ESLint configured but no formatter? The default fill for a missing slot comes
  from `SPEC-0041`; the spec should say it is a fill, not a replacement.
- **Monorepo detection** may need a workspace signal (`pnpm-workspace.yaml`,
  `workspaces`); decide whether that is a profile or just a detection note.

## Prompt Notes

- **Requirements**: detection first, defaults only when nothing exists, merge
  never overwrite, conflicts named.
- **Entities**: runtime, package manager, lockfile, linter, formatter, test
  runner, hook manager, script, profile.
- **Approach**: a table of signals plus a branch per stack; the skill stays a
  procedure, not a detector implementation.
- **Structure**: the existing skill sections, with the stack line and steps
  rewritten.
- **Operations**: keep the examples runnable; the detection table must be
  readable without the templates.
- **Norms**: additive-only; no silent replacement; no invented stack.
- **Safeguards**: do not touch `templates/` or `scripts/harness-state.mjs`; a
  needed detector change is SPEC-0044.
- **Tests**: the `tests:` list is model-free; the behavioural cases are SPEC-0045.

## Results

### F0–F2 — the skill text

`skills/bootstrap-project-harness/SKILL.md` now detects before it defaults:

- **Scope and Principles** say detection is the first decision and split the rule
  per stack: TypeScript/Node preserves a detected linter, formatter, test runner,
  runtime or package manager; Python keeps its existing report-and-stop rule
  unchanged.
- **Detection → TypeScript/Node profile** is a signal table with one row per slot
  (runtime, package manager, linter, formatter, test runner, type checker, hook
  manager, commit messages, scripts, profile). Bun needs `bunfig.toml`, a
  `packageManager` naming Bun, or a `bun` script — `tsconfig.json` is named as
  TypeScript evidence only.
- **Preserve, fill, skip** states the four outcomes: preserve an existing choice,
  fill an empty slot from `references/typescript.md` and name it a fill, apply the
  default only to an empty repo, and on a collision emit a diagnostic and skip
  (two lockfiles, two owners of one slot, Yarn, a non-Lefthook hook manager, a
  limit the tool cannot express). No step rewrites an existing config file.
- **Steps 6–11, 15 and the audit** branch on detection: install with the detected
  manager, keep the project's `justfile` recipes and script commands, add
  Prettier/ESLint only when the slot is empty, and run the detected tool in the
  gate instead of the default's `bun` commands.
- The `AGENTS.md`-facing state table keeps the script's answer authoritative; a
  `competing:` TS tool is now preserved-and-skipped rather than a full stop, while
  Python still stops.

### F3 — gates

Run from the worktree, Node 24:

| Command | Result |
| --- | --- |
| `node scripts/validate-skills.mjs --root skills` | pass — 14 skills, all clear |
| `node scripts/run-evals.mjs --root skills --list --check` | pass |
| `node --test scripts/lib/evals/*.test.mjs` | pass — 366/366 |
| `node --test scripts/lib/*.test.mjs` | pass — 13/13 |
| `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` | pass — 17/17 |
| `node scripts/check-sensor-parity.mjs` | pass — 2/2 fixtures |
| `node scripts/check-evidence.mjs` | pass — 0 errors (97 pre-existing warnings) |
| `node scripts/spec-check.mjs --spec … --base main` | pass — 0 errors |

### Left out, by design

- `templates/ts/*` still ships the default's `bun` commands; replacing them is
  SPEC-0043. The skill says the template is a shape to substitute, not a command
  set.
- `scripts/harness-state.mjs` still reads `lefthook.yml` as required for TS; a
  Husky repo therefore keeps that line in `missing:` until SPEC-0044 teaches the
  detector profiles. The skill names the gap instead of installing a second hook
  manager.
- `references/evals.md` case 8 still reads "Uses lefthook + bun only"; revising
  the behavioural cases is SPEC-0045.
- **Known limitation, not fixed here:** the commit-message slot only detects
  `commitlint.config.*`/`.commitlintrc*`/a `commitlint` dependency. A repo using
  `commitizen` (the Python set's linter, and a legitimate TS choice) has no
  detection signal, so step 6 would install commitlint beside it. The slot list
  in `Prompt Notes` does not name a commit linter, so this is recorded for
  SPEC-0044 (detector profiles) and SPEC-0045 (the behavioural case), not
  expanded in this diff.
