---
id: SPEC-0043
title: Make the TypeScript templates implement the stack decision
status: implemented
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
  - skills/bootstrap-project-harness/SKILL.md
  - skills/bootstrap-project-harness/references/evals.md
  - skills/bootstrap-project-harness/references/evals/14/.nvmrc
  - skills/bootstrap-project-harness/references/evals/14/.oxlintrc.json
  - skills/bootstrap-project-harness/references/evals/14/eslint.config.js
  - skills/bootstrap-project-harness/references/evals/14/justfile
  - skills/bootstrap-project-harness/references/evals/14/lint-staged.config.mjs
  - skills/bootstrap-project-harness/references/evals/15/.nvmrc
  - skills/bootstrap-project-harness/references/evals/15/.oxlintrc.json
  - skills/bootstrap-project-harness/references/evals/15/eslint.config.js
  - skills/bootstrap-project-harness/references/evals/15/justfile
  - skills/bootstrap-project-harness/references/evals/15/lint-staged.config.mjs
  - skills/bootstrap-project-harness/references/typescript.md
  - skills/bootstrap-project-harness/templates/ts/.github/workflows/ci.yml.template
  - skills/bootstrap-project-harness/templates/ts/.nvmrc.template
  - skills/bootstrap-project-harness/templates/ts/.oxlintrc.json.template
  - skills/bootstrap-project-harness/templates/ts/.prettierignore.template
  - skills/bootstrap-project-harness/templates/ts/audit-gate.mjs
  - skills/bootstrap-project-harness/templates/ts/commitlint.config.cjs
  - skills/bootstrap-project-harness/templates/ts/eslint-ai-rules.md
  - skills/bootstrap-project-harness/templates/ts/eslint.config.js.template
  - skills/bootstrap-project-harness/templates/ts/justfile.template
  - skills/bootstrap-project-harness/templates/ts/lefthook.yml
  - skills/bootstrap-project-harness/templates/ts/lint-staged.config.mjs
  - skills/bootstrap-project-harness/templates/ts/oxlint-ai-rules.md
  - skills/bootstrap-project-harness/templates/ts/package.json.template
  - skills/bootstrap-project-harness/templates/ts/tsconfig.build.json.template
  - skills/bootstrap-project-harness/templates/ts/tsconfig.json.template
  - skills/bootstrap-project-harness/scripts/harness-state.mjs
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

**Blast radius.** `templates/ts/`, this spec, and — approved by the human gate on
2026-11-08 — the coupled surfaces the rename forces: the `SKILL.md` steps and
audit checklist that copy or grep the renamed files, the `harness-state.mjs`
`REQUIRED`/`OPTIONAL` lists (`template-parity.test.mjs` refuses a template it
cannot classify), eval fixtures 14/15 and the `references/evals.md` note (they
ship `eslint.config.js`, so the new required `.oxlintrc.json` changes their
verdict), and the one-line pointer in `references/typescript.md`. Not in scope:
the detector's capability rewrite (SPEC-0044), the runner, the docs sensor and
the Python templates.

## Non-Goals

- No **capability** rewrite of the detector (SPEC-0044). This spec only keeps the
  `REQUIRED`/`OPTIONAL` lists in step with the templates, which
  `template-parity.test.mjs` mechanically forces.
- No skill-text change beyond the alignment approved for this spec: the copy
  steps, the script-key list and the audit checklist that name files this spec
  renames. Detection and preservation stay with SPEC-0042.
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
5. **F4 — check.** The templates agree with the reference; the skill text, the
   detector lists and fixtures 14/15 agree with the templates; `--list --check`
   and the parity tests pass.

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
9. **The coupled surfaces name what ships**: no `SKILL.md` step or audit check
   points at a deleted template, `references/typescript.md` points at the lint
   config the templates install, and the eval fixtures agree with the detector —
   fixture 14 reads `complete` and fixture 15 names exactly `lefthook.yml`.

## Open Questions

- **Profiles versus defaults**: does the CLI/backend/library split become
  separate template sets, or one default plus documented optional additions?
  Prefer the smaller surface; add a profile only when the decision names one.
- **Package manifest template**: today the skill merges `package.json` inline.
  If the decision needs a template, add it as a new file and declare it.
- **Which lockfile**: the decision names it; the template must not assume two.

## Results

Implemented in the worktree; `status:` is left to the merge.

- **Script surface** lives in `package.json.template` exactly as
  `references/typescript.md` §Tests and scripts states it, with the runtime,
  package manager and every tool pinned to the reference's exact version.
  `tsconfig.json.template` and `tsconfig.build.json.template` are new: without
  them `tsc --noEmit` typechecks nothing and `build` has no config, so the
  scripts could exist without running.
- **Lint and format**: `.oxlintrc.json.template` replaces
  `eslint.config.js.template` with the four limits, severities and options from
  the reference; `eslint-ai-rules.md` became `oxlint-ai-rules.md` for the same
  reason. `lint-staged.config.mjs` is gone: Lefthook's `{staged_files}` and
  `stage_fixed` already own the staged-file path, so keeping it was a second
  tool for the same job.
- **Hooks, CI and pins**: pre-commit is staged-only plus typecheck and test and
  needs no network; pre-push runs the full set, the optional build, the docs
  sensor and the audit; `audit-gate.mjs` tells a finding from an unreachable
  registry and is run closed (`--fail-on-unavailable`) in CI. Actions are pinned
  by commit SHA, the runtime by `.nvmrc`/`engines`, the tools by exact version,
  and CI installs with `npm ci` against a committed lockfile.
- **Deviation, declared (approved 2026-11-08)**: `scripts/harness-state.mjs`'s
  `REQUIRED`/`OPTIONAL` lists are edited. The parity test is the mechanism that
  keeps every shipped template classified, so a template rename cannot land
  without it, and the file says so itself ("drift is a failing test"). This is
  **not** a list-only change: it changes a verdict. Fixture 14 shipped
  `eslint.config.js`, which the old list required, and read `complete`; with
  `.oxlintrc.json` required it read `partial` until the fixture gained the file
  (and fixture 15 then named two gaps instead of one). The fixtures are updated
  here, which is why the `12/12` and `3/3` rows in `references/evals.md` are
  marked as pre-rename history instead of being rewritten. The capability
  rewrite remains SPEC-0044.
- **Coupled surfaces (approved)**: `SKILL.md` step 7 no longer copies the
  removed `lint-staged.config.mjs`, step 9 merges the keys the shipped
  `package.json.template` carries and no longer asks for a `dev` key, step 11
  installs `.oxlintrc.json` and `.prettierignore` instead of `eslint.config.js`,
  step 12 copies `audit-gate.mjs`, and the audit checklist greps the files that
  actually ship. `references/typescript.md:114` points at
  `.oxlintrc.json.template`. `package.json.template` drops the `audit` script:
  nothing called it (the justfile, the hook and CI call `node audit-gate.mjs`
  directly), and a script that exists to be bypassed is a surface, not a gate.
- **Fixtures 14/15**: both ship `package.json` and `tsconfig.json`, so those two
  stay `REQUIRED` in `harness-state.mjs`; `.oxlintrc.json` is added to both,
  `eslint.config.js` and `lint-staged.config.mjs` are removed, `.nvmrc` pins
  `24.15.0`, and the `format-check` recipe (a `true:check` typo) runs `true`.
  Verified: fixture 14 reads `complete` (exit 0) and fixture 15 reads `partial`
  naming exactly `lefthook.yml`, which is what the two eval cases assert.
- **Evidence**: the templates were installed into a scratch repository outside
  this one (Node 24.15.0, npm 11.12.1) and every script ran. `npm ci` refused a
  drifted lockfile (`EUSAGE`), oxlint flagged a 5-parameter function (error), a
  73-line function and a 205-line file (warnings) while leaving their sparse
  twins alone, and `audit-gate.mjs` exited 1 on `lodash@4.17.20`, exited 0 (with
  the skip named) on an unreachable registry, and exited 1 with
  `--fail-on-unavailable`. The git hooks were installed in that scratch repo:
  pre-commit blocked a staged `.env`, blocked a 5-parameter file after
  formatting and re-staging, and pre-push ran check, build, docs and audit;
  commitlint rejected a non-conventional message.
- Left out: the CI matrix cell for Node 22.18.0 was verified with a downloaded
  runtime, not a second installed Node; and the eval numbers for cases 14/15
  still need re-measuring after the fixture change, which is SPEC-0045's work.


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
