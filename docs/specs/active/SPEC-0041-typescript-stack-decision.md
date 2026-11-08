---
id: SPEC-0041
title: Decide the default TypeScript/Node stack with reproducible numbers
status: ready
priority: P1
task: TASK-65
created_at: 2026-11-08
updated_at: 2026-11-08
source_docs:
  - https://github.com/ricardowendell/agent-skills/issues/12
  - backlog/tasks/task-65 - stack-matriz-de-decisão-ADR-e-referência-TS.md
  - skills/bootstrap-project-harness/references/typescript.md
  - docs/roadmap.md
related_decisions: []
depends_on: []
blocks:
  - SPEC-0042-preserve-existing-stack
  - SPEC-0043-typescript-templates
  - SPEC-0044-harness-state-capabilities
  - SPEC-0045-stack-review-evals
files:
  - skills/bootstrap-project-harness/references/typescript.md
  - docs/specs/active/SPEC-0041-typescript-stack-decision.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0041-typescript-stack-decision.md --base main
---

# SPEC-0041: Decide the default TypeScript/Node stack with reproducible numbers

## Purpose

`bootstrap-project-harness` ships an essentially fixed TypeScript/Node stack:
Bun, ESLint flat config, Prettier, Vitest/Jest, Lefthook, commitlint, lint-staged,
with a Node 22 `.nvmrc` alongside a Bun-first workflow. Issue #12 asks for a
technical review — feedback time, determinism, quality, security, maintenance
cost — without following fashion and without weakening the harness.

This is the **gate** for the rest of the split: the templates, the detector and
the skill text can only be made coherent after a decision exists. It is a
decision-and-evidence spec, not an implementation of the stack.

There is no `docs/decisions/` in this repo and no ADR convention in use; the
durable record is this spec plus `references/typescript.md`. Creating a new docs
tree for one decision would add structure the repo does not have.

## User Outcome

A maintainer can read one document and see the chosen default, the alternatives
that are supported, the numbers behind the choice, and the limits that were kept
or traded. A second person can reproduce the matrix from the recorded commands
and versions.

## Scope

- **Decision dimensions**, each with a stated default and supported
  alternatives:
  1. Runtime and package manager (Node LTS with native TypeScript, Bun, pnpm);
     runtime and package manager are not assumed to be the same product.
  2. Compiler and modules (TypeScript 6/7 as actually supported, ESM, `NodeNext`,
     `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, type
     stripping).
  3. Lint and formatter (Biome; Oxlint + Oxfmt; ESLint + typescript-eslint +
     Prettier) — one tool per responsibility, no two competing.
  4. Tests and verification (`node:test`, Vitest, `bun test`) and the script
     surface (`test`, `test:watch`, `coverage`, `typecheck`, `lint`, `format`,
     `format:check`, `check`, `build` when applicable).
  5. Build/API (no bundler unless a library or CLI needs one; `tsdown` as a
     candidate) and monorepo (no Turbo/Nx by default).
  6. Supply chain and CI (reliable audit without `|| true`, offline versus
     unavailable, OSV/CodeQL/Gitleaks, lockfile policy, pins, least privilege).
  7. Gate performance (local-fast / pre-push / PR / nightly-release), with the
     checks each one runs.
  8. Compatibility (additive-only; detect and preserve an existing stack).
- **A reproducible matrix** across three fixture repos — small CLI, API/backend
  and TypeScript library — each with a clean install, cold and warm
  lint/typecheck/test, and a CI-equivalent run. Record the command, tool and
  runtime versions, wall time (median and spread), CPU or cache notes, and the
  failure mode. A matrix cell without a reproducible command is not evidence.
- **Quality limits**: keep complexity 10, max 4 parameters, 60 lines/function
  and 200 lines/file, or replace them with an explicit equivalence argument.
  A silent loss is a failure.
- **Update `references/typescript.md`** with the matrix, the decision, the
  supported alternatives, minimum versions and links to official documentation.
  Vendor benchmark claims are not a substitute for the recorded runs.
- **Publication**: the spec records the Results; `references/typescript.md` is
  the operational document.

**Blast radius.** One reference document plus this spec. No template, detector or
skill text changes here; those are the dependent specs.

## Non-Goals

- No forced migration of consuming projects to one stack.
- No adding every tool in the catalogue to every bootstrap.
- No rewriting the skills runtime or the pdlc.
- No removing a quality gate to make a benchmark look faster.
- No new `docs/decisions/` tree.

## Flow

1. **F0 — fixtures.** Build the three throwaway repos; pin runtime and tool
   versions.
2. **F1 — matrix.** Run clean install, cold/warm lint/typecheck/test and the
   CI-equivalent command; record numbers and failures.
3. **F2 — decide.** Choose the default for an empty repo, name supported
   alternatives, and justify each against the numbers.
4. **F3 — limits and supply chain.** Confirm the quality limits and the audit,
   pin and gate policies, including the fail-open/fail-closed choice per gate.
5. **F4 — publish.** Update `references/typescript.md` and record the Results
   here; the dependent specs unblock.

## Data

- `skills/bootstrap-project-harness/references/typescript.md` — the decision and
  the matrix.
- The three fixture repos are throwaway and are not committed; their commands,
  versions and outputs are recorded in the reference and in Results.

## Acceptance Criteria

1. **The matrix covers the three profiles** (CLI, API/backend, library) with a
   clean install, cold and warm lint/typecheck/test, and a CI-equivalent run;
   each cell names the command, the tool/runtime versions, the median and the
   spread.
2. **The matrix is reproducible**: a second person can rerun the recorded
   commands and get the same order of magnitude, and any deviation is explained.
3. **One explicit default for an empty repository**, with the supported
   alternatives named; runtime and package manager are treated as independent
   choices.
4. **Quality limits are preserved or replaced with an equivalence argument**;
   no limit disappears silently.
5. **Supply chain is explicit**: a real vulnerability fails the configured gate;
   network unavailability is reported as unavailable, not as green; no `|| true`
   hides an audit; the fail-open or fail-closed policy is named per gate.
6. **Pins are intentional**: tools, runtime and GitHub Actions are pinned; no
   unintended `latest`; the lockfile policy and frozen install are stated.
7. **Gates are split** into local-fast, pre-push, PR and nightly/release, each
   with the checks it runs and the condition under which it is skipped.
8. **`references/typescript.md` carries the decision**, the matrix, the
   alternatives, minimum versions and official links, without vendor claims.
9. **No drift.** Every command in `tests:` passes.

## Open Questions

- **How much benchmarking is enough?** Three fixtures and three runs each with a
  median is the floor; more runs only if the spread makes the choice ambiguous.
- **TypeScript 6/7**: confirm real ecosystem support before naming a version;
  do not choose a version that only exists in a release note.
- **Monorepo profile**: is it a default or an optional capability? The issue
  leaves it open; the matrix should say whether Turbo/Nx earns its cost.
- **Audit offline policy**: fail-closed in PR/nightly and fail-open in
  local-fast is the likely split, but the reference must state it explicitly.

## Prompt Notes

- **Requirements**: a decision with numbers, not a rewrite; three profiles; the
  current limits either kept or explicitly traded; one default plus supported
  alternatives.
- **Entities**: runtime, package manager, compiler, linter, formatter, test
  runner, hook manager, gate tier, lockfile, pin.
- **Approach**: measure first, decide second, write the reference last; a
  benchmark that cannot be rerun is an anecdote.
- **Structure**: one reference document; the spec holds the rationale and
  Results.
- **Operations**: keep the fixtures outside the repo; record every command and
  version; if a tool install needs the network, say so.
- **Norms**: no vendor benchmark claims; no silent gate removal; a choice is
  only made once its alternative is named.
- **Safeguards**: do not change templates or the detector here; a divergence
  found later is a REJECT in the dependent spec, not a quiet edit.
- **Tests**: the `tests:` list is model-free; the matrix is the evidence.
