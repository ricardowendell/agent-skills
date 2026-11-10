---
id: SPEC-0055
title: Audit architecture with deep modules and deterministic slots
status: ready
priority: P1
task: TASK-79
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-79 - arch-aprofundar-audit-code-quality-com-deep-modules-e-custo-de-mudanca-issue-14.md
  - https://github.com/ricardowendell/agent-skills/issues/14
  - docs/specs/SPEC-0054-architecture-corpus-slice.md
  - skills/audit-code-quality/references/evals.md
related_decisions: []
depends_on:
  - SPEC-0054-architecture-corpus-slice
blocks:
  - SPEC-0056-review-proportional-to-diff-risk
files:
  - skills/audit-code-quality/SKILL.md
  - skills/audit-code-quality/references/architecture.md
  - skills/audit-code-quality/references/deterministic-checks.md
  - skills/audit-code-quality/references/evals.md
  - skills/audit-code-quality/references/evals/8/AGENTS.md
  - skills/audit-code-quality/references/evals/8/git.json
  - skills/audit-code-quality/references/evals/8/package.json
  - skills/audit-code-quality/references/evals/8/bin/dependency-cruiser
  - skills/audit-code-quality/references/evals/8/bin/knip
  - skills/audit-code-quality/references/evals/8/src/app.js
  - skills/audit-code-quality/references/evals/8/src/legacy.js
  - skills/audit-code-quality/references/evals/8/src/unused.js
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0055-audit-code-quality-architecture-and-deterministic-checks.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0055-audit-code-quality-architecture-and-deterministic-checks.md --base main
---

# SPEC-0055: Audit architecture with deep modules and deterministic slots

## Purpose

`audit-code-quality` already reports cycles, duplication, dead code and scope
with `file:line`. It does not give the reader a way to judge a **shallow
interface** — a module that forwards calls while the caller still has to know the
invariants — and it leaves deterministic signals on the table: dependency
graphs, unused exports, duplication and coverage.

This spec adds one reference for architecture judgement and one for deterministic
checks. The skill stays read-only and stack-agnostic: it detects the tools the
project already declares, records what they printed, and says `unmeasured` when
they are absent. It never makes a scanner a new mandatory dependency.

## User Outcome

An audit of a shallow module names the interface and the caller-side
orchestration with `file:line`, instead of praising the file count. An audit of a
healthy deep module reports zero findings and does not call it overengineering.
When `dependency-cruiser`, `knip`, `jscpd` or a coverage command exist, the
register cites their command and output; when they do not, the dimension is
`unmeasured`, not "clean".

## Scope

### F1 — architecture reference (on demand)

`skills/audit-code-quality/references/architecture.md`:

- Deep module: the interface is everything the caller must know, including
  invariants, ordering, failure modes and configuration.
- Shallow forwarding layer, leaked invariants, distributed responsibility.
- Deletion test, seams, boundaries, direction of dependencies, change cost.
- `rule` vs `judgement`: a finding cites the architecture document, ADR, harness
  limit or lint rule; otherwise it is `judgement` with a stated cost.
- Zero findings is a valid result; a healthy decomposition is not a finding.

The reference is read only when the audit reaches architecture; the skill
description and trigger stay unchanged.

### F2 — deterministic slots

`skills/audit-code-quality/references/deterministic-checks.md`:

| Slot | Tool | Output |
| --- | --- | --- |
| cycles / boundaries | `dependency-cruiser`, `madge --circular` | JSON |
| unused files / exports / deps | `knip` | JSON |
| duplication | `jscpd` | JSON |
| coverage | `c8`, `nyc`, `coverage.py` | summary |
| complexity / size | declared lint limits, `lizard` | JSON/text |
| Python boundaries / dead code | `import-linter`, `vulture`, `radon` | text/JSON |

Protocol, in order:

1. **Detect** the tool or the project script; never install during an audit.
2. **Run** the local binary with a pinned version, JSON output and a timeout; no
   network and no `npx --yes`.
3. **Record** the exact command and exit/count in `MEASUREMENTS`.
4. **Classify** a violation of a written rule as `rule`; a heuristic as
   `judgement`; absent, broken or unconfigured as `unmeasured`.
5. **Scope** to the declared path; do not infer a metric from a test-file count.

### F3 — cases

- Cases 5–7 use the SPEC-0054 fixtures (shallow, deep, cohesive).
- Case 8 uses a new fixture `8/` with local stub binaries
  `bin/dependency-cruiser` and `bin/knip` that emit known JSON. The audit must
  cite the tools, record their commands, and name the cycle and the unused file.
- Case 9 reuses fixture 6 without the stubs: the tools are absent, so the audit
  must report `unmeasured` and must not invent a cycle or an unused export.

## Non-Goals

- No new skill, no second audit engine, no mandatory dependency for this repo or
  for a consumer.
- No refactor, no code write, no backlog write.
- No duplication of `review-code` (a diff) or `tighten-harness` (a gate).
- No score or maturity grade.
- No network install during an audit.

## Flow

1. **F0 — reference.** Write `architecture.md` and `deterministic-checks.md`.
2. **F1 — wire the skill.** Add the probe/record step and the `unmeasured` rule to
   `SKILL.md`; keep the description.
3. **F2 — fixtures and cases.** Add fixture 8 and cases 5–9.
4. **F3 — measure.** Five draws per arm for cases 5–9; classify
   `keep/change/drop` per case; publish `coverage.md` and `CHANGELOG.md`.
5. **F4 — gates.** Run the eight `tests:` commands.

## Data

- `skills/audit-code-quality/SKILL.md` and `references/evals.md`.
- SPEC-0054 fixtures 5, 6 and 7.
- Fixture 8: `AGENTS.md`, `git.json`, `package.json`, two stub binaries and a
  small source tree.
- `docs/evals/coverage.md`, `CHANGELOG.md`.

## Acceptance Criteria

1. `architecture.md` covers deep modules, interface, deletion test, boundaries,
   change cost and `rule` vs `judgement`; zero findings is explicitly valid.
2. `deterministic-checks.md` lists the slots and the detect/run/record/classify
   protocol; absent or broken tools are `unmeasured`, never clean.
3. `SKILL.md` keeps its description and trigger; it adds the probe and the
   `unmeasured` rule without making a tool mandatory.
4. Cases 5–7 read the SPEC-0054 fixtures; case 8 proves a tool-present finding;
   case 9 proves tool-absent `unmeasured` with no invented metric.
5. Five draws per arm for the new cases; the measured result is published in
   `docs/evals/coverage.md` and `CHANGELOG.md`, with `keep/change/drop` per case.
6. Read-only: `git status --porcelain` is identical before and after; no new
   dependency, no network install, no paid draw beyond the authorised five.
7. All eight `tests:` commands pass.

## Open Questions

- **Stubs or real tools in fixture 8?** Stubs, so the case is offline and
  deterministic. The real detection is documented and exercised by the user's
  project, not by the eval.
- **How to assert zero findings?** The runner's assertion kinds are positive; use
  a human `expect:` for "no overengineering finding" and machine assertions for
  `SCOPE:`, `CAPTURE OPTIONS` and `unchanged`.
- **How many draws?** Five per arm, the repo norm. If a case cannot reach five
  clean draws, publish `unresolved`; do not lower the bar.

## Prompt Notes

- **Requirements:** add the two references, wire the deterministic probe, add
  cases 5–9, measure and publish.
- **Entities:** deep module, shallow interface, invariant, deletion test,
  boundary, deterministic slot, detect/run/record/classify, `unmeasured`.
- **Approach:** keep the skill read-only; put tool knowledge in a reference; make
  the fixture stubs emit known JSON; filter findings to the declared scope.
- **Safeguards:** no install, no network, no `npx --yes`, no mandatory dependency,
  no invented metric, no code write.
- **Tests:** the eight gates; paid evals are evidence, not a CI gate.
