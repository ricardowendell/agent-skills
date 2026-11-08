---
id: SPEC-0041
title: Decide the default TypeScript/Node stack with reproducible numbers
status: implemented
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
  - docs/specs/SPEC-0041-typescript-stack-decision.md
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

## Results

Implemented 2026-11-08. The operational record is
`skills/bootstrap-project-harness/references/typescript.md`; this section holds
the rationale, the numbers that decided it and the limits of the measurement.

### Decision

**Default for an empty repository:** Node.js 24 LTS (24.15.0) + npm 11.12.1 +
TypeScript 7.0.2 + Oxlint 1.92.0 + Prettier 3.9.10 + `node:test`; ESM/`NodeNext`
with native type stripping; `tsc` build for a library or CLI; npm workspaces
without Turbo/Nx.

**Supported alternatives.** Each one is named with the condition under which it
is chosen, not as a free-for-all:

| Alternative | Choose it when | Measured cost |
| --- | --- | --- |
| pnpm 11.1 + Node | install size or workspace strictness matters | clean install 422 vs 824 ms; +~120 ms per script |
| Bun 1.3 | the project wants Bun as runtime and/or package manager | test 25 ms vs 174 ms; warm install 43 ms; `tsc` still needed |
| Biome 2.6.6 | a single binary matters more than exact cyclomatic semantics | lint+format 276 vs 353 ms; complexity rule is cognitive |
| ESLint 10 + typescript-eslint 8.72 + Prettier | type-aware lint rules are required | lint 384 vs 145 ms; TypeScript capped at 6.0.3 |
| Vitest 5.1 | watch mode, browser runner or its reporting is required | test +53–58%; test imports and hooks must be rewritten |
| Oxfmt 0.77 | only JS/TS is formatted and a pre-1.0 formatter is acceptable | format 144 vs 208 ms |
| tsdown 0.23.7 | bundling or dual ESM/CJS output is required | build 231 vs 158 ms; 0.x; `.mjs` output |
| Turbo 2.11 | a workspace has cacheable outputs large enough to pay for a daemon | 2-package fixture: 178–208 vs 257–278 ms, +36 MB |

Runtime and package manager are independent. Both cross products passed:
Bun 1.3 running npm-installed dependencies (`bun test` 25 ms, `bun run lint`
54 ms) and Node 24 running Bun-installed dependencies (`npm test` 178 ms). The
package manager changes install time (npm 824 ms, pnpm 422 ms, Bun 43 ms warm);
the runtime changes execution time (Bun 25 ms vs Node 174 ms for the same test
sources).

Bun is therefore the faster runtime and still not the default. Node 24 is an
LTS line with a published support window; the project's CI images and native
dependencies are exercised against Node's ABI, while Bun is a different runtime
contract that would need its own CI coverage. Because no test runner here
typechecks, `tsc --noEmit` remains the type gate under Bun as well, so
typechecking does not distinguish the two runtimes; the LTS and CI-ABI contract
does.

### Numbers that decided it

Round-robin, one window per comparison, so machine load hits every lane in a
row equally. Medians in milliseconds; the full matrix and ranges are in the
reference.

| Comparison | A | B | Reading |
| --- | --- | --- | --- |
| Linter | Oxlint 145 | ESLint 384 | Oxlint is 2.6x faster; Biome 141 is equivalent in speed |
| Formatter | Prettier 208 | Biome 135 | Biome is 73 ms faster; Prettier is stable 3.x |
| Test runner (API) | `node:test` 239 | Vitest 365 | `node:test` is 1.5x faster and adds no dependency |
| Test runner (CLI) | `node:test` 191 | Vitest 301 | 1.6x |
| Compiler | TypeScript 7.0.2 171 | TypeScript 6.0.3 322 | TS 7 is 1.9x faster at typechecking |
| Build | `tsc` 158 | `tsdown` 231 | `tsc` is enough for a small library |
| Install (CLI, warm) | npm 824 | pnpm 422 | pnpm wins install; loses ~120 ms per script |
| Install (CLI, warm) | npm 824 | Bun 43 | Bun wins install |
| Runtime (same tests) | Node 174 | Bun 25 | Bun wins execution; Node is the LTS/CI ABI; `tsc` still required |
| Security audit | clean exit 0 | real high vuln exit 1 | all three managers fail on a real finding |

### Dimension by dimension

1. **Runtime and package manager.** Node 24 LTS + npm is the default: one
   installation, one lockfile, `npm ci`, the lowest per-script overhead for a
   small repo, an LTS support window, and the ABI that CI images and native
   dependencies are exercised against. Bun is faster in every measured cell but
   is a different runtime contract requiring its own CI coverage, and it does
   not remove the `tsc` type gate. pnpm and Bun remain supported alternatives,
   independently of the runtime. Node 22.18 is the compatibility floor (type
   stripping); the pin is 24.15.0.
2. **Compiler and modules.** TypeScript 7.0.2 is the default and is 1.9x faster
   than 6.0.3. `NodeNext` + ESM + `.ts` specifiers +
   `rewriteRelativeImportExtensions`; `types: ["node"]` and `rootDir` are
   explicit because TS 6/7 stopped auto-including `@types` and require a common
   source directory. `erasableSyntaxOnly` enforces what Node can strip (an
   `enum` fails both `tsc` and Node). TS 6.0.3 is the supported compiler when
   ESLint is chosen, because `typescript-eslint@8.72.1` rejects 7.x with
   `ERESOLVE`.
3. **Lint and formatter.** Oxlint (linter) + Prettier (formatter): one tool per
   responsibility, exact preservation of the four limits, no TypeScript peer
   cap. Biome and the ESLint stack are supported alternatives; Oxfmt is the
   pre-1.0 fast formatter. Biome's combined 77 ms advantage was not enough to
   change the meaning of the complexity gate.
4. **Tests and scripts.** `node:test` is the default (built in, 1.5–1.6x faster
   than Vitest). The script surface is `test`, `test:watch`, `coverage`,
   `typecheck`, `lint`, `format`, `format:check`, `check`, and `build` when the
   project is a library or CLI. Vitest remains supported for watch/browser
   workflows; `bun test` only with the Bun runtime.
5. **Build and monorepo.** No bundler for an API/backend (Node runs the
   TypeScript; `tsc --noEmit` is the gate). `tsc` for a library or CLI;
   `tsdown` when bundling or dual output is needed (231 vs 158 ms, pre-1.0,
   `.mjs` output, TS 7 `tsgo` deprecation warning). npm workspaces, no Turbo/Nx
   by default: the two-package experiment did not produce a cache hit and cost
   36 MB.
6. **Supply chain and CI.** A real high-severity dependency makes all three
   managers exit 1; a clean one exits 0. An unreachable registry also exits 1,
   so the gate parses `--json` (or the error text) and reports the audit as
   **unavailable**, never as green. No `|| true`. Versions, runtime and Actions
   are pinned; the lockfile is committed and `npm ci` rejects drift (verified
   `EUSAGE`).
7. **Gate performance.** local-fast 763 ms (format, lint, typecheck, test);
   pre-push 920 ms (+ build); PR 1.5 s of local commands (+ clean install,
   audit, OSV/CodeQL/Gitleaks on Node 24 and the 22.18 floor); nightly/release
   2.1 s (+ coverage, full audit, semver/tag).
8. **Compatibility.** Additive only: detect and preserve an existing stack; new
   repositories get the default; a detected stack that cannot express a limit
   gets the replacement recorded (for example Biome's cognitive complexity),
   never a silent removal.

### Quality limits

The default reproduces the four limits exactly as the template ships them,
including severity and options: cyclomatic complexity 10 (`error`), maximum 4
parameters (`error`), 60 lines per function (`warn`, `skipBlankLines: true`,
`skipComments: true`) and 200 lines per file (`warn`, `skipBlankLines: true`,
`skipComments: true`).
Coverage stays optional. Nothing here raises a warning to an error or stops
skipping blank/comment lines.

Oxlint and ESLint implement the same rule semantics. On the violation fixture
both produced the same four findings. On a sparse fixture — a 209-line file with
30 comment lines and 29 blank lines, and a 67-line function with 8 comments and
blank lines — both pass with the shipped skip flags and both emit the same two
warnings without them. Biome produced five findings on the violation fixture
because `noExcessiveCognitiveComplexity` also flags a five-times-nested function
that cyclomatic complexity 6 does not, and it would miss a wide `switch` that
adds many cyclomatic paths but one cognitive point. Biome's line rules agree
with the shipped skip semantics on the sparse fixture (they pass it and flag the
dense controls), so the replacement is the complexity rule, not the line
options. The default therefore preserves the shipped limits, and the Biome
alternative replaces one of them — with evidence and a stated gap, not
silently.

Any tightening (for example `warn` to `error`, or counting blank and comment
lines) is not part of this spec. It would change what the harness installs and
belongs to `SPEC-0043`, which owns the templates; this spec's table mirrors the
template so it cannot claim a limit the scaffold does not ship.

### Supply chain evidence

| Case | Command | Result |
| --- | --- | --- |
| Real high vulnerability (`lodash@4.17.20`) | `npm audit --audit-level=high` | exit 1, 1 high |
| Same | `pnpm audit --audit-level high` | exit 1, 2 high + 2 moderate |
| Same | `bun audit` | exit 1, 2 high + 2 moderate |
| Clean (`nanoid@5.1.16`) | `npm audit --audit-level=high` | exit 0, `found 0 vulnerabilities` |
| Registry unreachable | npm/pnpm/Bun with `--registry http://127.0.0.1:1` | exit 1 with `ECONNREFUSED` / `fetch failed` / `ConnectionRefused` |
| Frozen install drift | `npm ci` after editing `package.json` | exit 1, `EUSAGE`, “package.json and package-lock.json … not in sync” |

Policy: audit absent in local-fast (stated, not green); fail-open on
network-unavailable only at pre-push; fail-closed at PR and nightly/release.
The audit is parsed as JSON where available because exit 1 is ambiguous between
a finding and an outage.

### Measurement limitations

- One host: macOS 27.2, Apple M4 Max, 14 cores, 36 GB, Node 24.15.0 arm64. Load
  average was 8–15 during the sweep, so absolute medians are only comparable
  within one sweep; every choice above is backed by a round-robin run in a
  single window.
- Three warm runs per command; one cold-cache install per cell. The cold-cache
  install is network-bound (3.2–22.7 s) and is reported as a single sample.
- “Cold” means the first execution after a fresh `node_modules`, not a cold OS
  page cache; tool binaries were already in the OS cache from other cells.
- The Vitest API cell was fixed after the sweep (Vitest has no `before`/`after`,
  only `beforeAll`/`afterAll`) and re-measured in a separate window; its install
  column is not comparable to the other API rows.
- Turbo reported `Cached: 0` on consecutive runs in the two-package fixture, so
  its “warm” number is not cache evidence. Only two packages were measured.
- Oxlint's rule catalogue is not 1:1 with typescript-eslint. The four limits
  and the correctness category were verified; type-aware rules are only
  guaranteed by the ESLint alternative.
- The advisory database changes over time: `lodash@4.17.21` was already reported
  high on the measurement day. Audit results are a snapshot, which is why the
  scheduled run exists.
- Nx 24 was not installed or timed. The monorepo recommendation rests on the
  Turbo run and on npm workspaces; Nx would need its own two-package run before
  it is costed.

### Not measured

Lefthook and commitlint timing (unchanged, outside the decision); Linux, Windows
and GitHub-hosted runners; Node 22.18 (the floor is from the official
type-stripping release, not a local run); OSV-Scanner, CodeQL and Gitleaks
execution (not installed); network-blocked dependency installation (only the
audit was tested offline); monorepos larger than two packages.

### Gates

- `node scripts/validate-skills.mjs --root skills` — pass (14 SKILL.md, all clear)
- `node scripts/run-evals.mjs --root skills --list --check` — pass (dry run)
- `node --test scripts/lib/evals/*.test.mjs` — pass (366 tests)
- `node --test scripts/lib/*.test.mjs` — pass (13 tests)
- `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` — pass (17 tests)
- `node scripts/check-sensor-parity.mjs` — pass (2/2 fixtures in parity)
- `node scripts/check-evidence.mjs` — pass, exit 0 (8 documents, 0 errors, 97 pre-existing warnings in `docs/evals/write-implementation-prompt-matrix.md`)
- `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0041-typescript-stack-decision.md --base main` — pass (contract holds)
