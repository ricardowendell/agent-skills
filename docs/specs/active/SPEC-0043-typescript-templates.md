---
id: SPEC-0043
title: Make the TypeScript templates implement the stack decision
status: ready
priority: P2
task: TASK-67
created_at: 2026-11-08
updated_at: 2026-11-08
source_docs:
  - https://github.com/ricardowendell/agent-skills/issues/12
  - backlog/tasks/task-67 - stack-templates-TS-alinhados-à-decisão.md
  - skills/bootstrap-project-harness/templates/ts
  - docs/specs/active/SPEC-0041-typescript-stack-decision.md
related_decisions: []
depends_on:
  - SPEC-0041-typescript-stack-decision
blocks:
  - SPEC-0044-harness-state-capabilities
  - SPEC-0045-stack-review-evals
files:
  - skills/bootstrap-project-harness/templates/ts/.github/workflows/ci.yml.template
  - skills/bootstrap-project-harness/templates/ts/.nvmrc.template
  - skills/bootstrap-project-harness/templates/ts/.prettierrc.template
  - skills/bootstrap-project-harness/templates/ts/commitlint.config.cjs
  - skills/bootstrap-project-harness/templates/ts/dependency-cruiser-rules.md
  - skills/bootstrap-project-harness/templates/ts/eslint-ai-rules.md
  - skills/bootstrap-project-harness/templates/ts/eslint.config.js.template
  - skills/bootstrap-project-harness/templates/ts/justfile.template
  - skills/bootstrap-project-harness/templates/ts/lefthook.yml
  - skills/bootstrap-project-harness/templates/ts/lint-staged.config.mjs
  - docs/specs/active/SPEC-0043-typescript-templates.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0043-typescript-templates.md --base main
---

# SPEC-0043: Make the TypeScript templates implement the stack decision

## Purpose

The templates under `templates/ts/` are the executable form of the stack: the
justfile, the hooks, the CI workflow, the runtime pin, the formatter, the lint
config and the commit/lint-staged configuration. Issue #12 requires them to
follow the decision in `SPEC-0041` as one coherent system, with no surface left
behind and no quality limit lost.

This spec changes the templates only. The detector that reads them is
`SPEC-0044`; the skill text that selects them is `SPEC-0042`.

## User Outcome

A bootstrap that uses these templates produces a repository whose scripts run,
whose hooks are fast and offline, whose CI pins what it runs, and whose lint
limits match the decision. A maintainer comparing the templates to
`SPEC-0041` finds no divergence.

## Scope

- **Implement exactly the `SPEC-0041` default**: runtime and package manager,
  lint and formatter, test runner, build profile, hook manager and CI.
- **Script surface**: `test`, `test:watch`, `coverage`, `typecheck`, `lint`,
  `format`, `format:check`, `check`, and `build` when the profile needs it.
- **Hooks**: a fast offline pre-commit for changed/staged files, pre-push and PR
  checks for the full set, and an audit that reports a real vulnerability
  without `|| true` hiding it.
- **Pins and install**: runtime pin, GitHub Actions pinned, no unintended
  `latest`, and a lockfile with a frozen install in CI.
- **Quality limits** live in the lint configuration: complexity 10, max 4
  parameters, 60 lines/function, 200 lines/file, or the equivalence decided in
  `SPEC-0041`.
- **Templates and the reference agree**: any divergence from
  `references/typescript.md` is a REJECT, not a doc edit in this spec.
- **Untouched surfaces**: the docs sensor (`docs-check.mjs`), the spec-hash
  script (`spec-sha.mjs`) and the Python templates. If a stack change genuinely
  needs one of them, stop and split it out.

**Blast radius.** `templates/ts/` only, plus this spec. No skill text, detector,
runner or Python template.

## Non-Goals

- No detector change (SPEC-0044).
- No skill-text change (SPEC-0042).
- No new stack, no framework, no bundler without a profile that needs it.
- No `latest` as a convenience.
- No removal of a quality gate to make the pipeline faster.

## Flow

1. **F0 — read the decision.** Freeze the `SPEC-0041` default.
2. **F1 — scripts and profile.** Update package/scripts, justfile and CI to the
   default; keep the build optional by profile.
3. **F2 — lint and format.** One tool per responsibility; move the limits.
4. **F3 — hooks and pins.** Pre-commit/pre-push/PR split; audit policy; pins and
   frozen lockfile.
5. **F4 — check.** The templates agree with the reference; `--list --check` and
   the parity tests pass.

## Data

- `skills/bootstrap-project-harness/templates/ts/*` — the templates.
- `skills/bootstrap-project-harness/references/typescript.md` — the reference
  the templates must match (owned by `SPEC-0041`).

## Acceptance Criteria

1. **The templates implement the `SPEC-0041` default exactly**; a divergence is
   a REJECT, not a silent doc edit.
2. **Every script in the surface exists and runs**: `test`, `test:watch`,
   `coverage`, `typecheck`, `lint`, `format`, `format:check`, `check`, and
   `build` when the profile requires it.
3. **Pre-commit is fast and offline**; pre-push and PR run the full set; the
   audit reports a real vulnerability and never hides one with `|| true`.
4. **Pins are intentional**: runtime, Actions and tools are pinned; no
   unintended `latest`; the lockfile is installed frozen in CI.
5. **The quality limits** from `SPEC-0041` live in the lint configuration, with
   a test or a documented check that a violation fails.
6. **The docs sensor, spec-hash script and Python templates are untouched** and
   still pass their tests.
7. **`files:` follows the real diff**: any new template or profile file is added
   to `files:` before `implemented`, so `spec-check` reports no
   `files-touched-undeclared`.
8. **No drift.** Every command in `tests:` passes.

## Open Questions

- **Profiles versus defaults**: does the CLI/backend/library split become
  separate template sets, or one default plus documented optional additions?
  Prefer the smaller surface; add a profile only when the decision names one.
- **Package manifest template**: today the skill merges `package.json` inline.
  If the decision needs a template, add it as a new file and declare it.
- **Which lockfile**: the decision names it; the template must not assume two.

## Prompt Notes

- **Requirements**: the templates are the decision made executable; every
  surface is in scope; no gate is lost.
- **Entities**: script, hook stage, CI job, pin, lockfile, lint limit, formatter,
  test runner.
- **Approach**: edit the existing templates in place; keep the file names the
  skill already copies unless the decision requires a rename.
- **Structure**: one template tree; no per-profile tree unless the decision
  says so.
- **Operations**: run the templates in a scratch project before finishing; a
  template that was not executed is unverified.
- **Norms**: no `|| true`; no `latest`; no second tool for the same job.
- **Safeguards**: do not touch the detector or the docs sensor; a needed change
  to either is a separate spec.
- **Tests**: the `tests:` list is model-free; the behavioural cases are
  SPEC-0045.
