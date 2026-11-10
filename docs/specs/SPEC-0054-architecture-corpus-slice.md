---
id: SPEC-0054
title: An architecture corpus that can see a shallow module
status: implemented
priority: P1
task: TASK-89
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-89 - evals-fatia-de-arquitetura-do-corpus-issue-13.md
  - https://github.com/ricardowendell/agent-skills/issues/13
  - https://github.com/ricardowendell/agent-skills/issues/14
  - skills/audit-code-quality/references/evals.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills/audit-code-quality/references/evals.md
  - skills/audit-code-quality/references/evals/5/AGENTS.md
  - skills/audit-code-quality/references/evals/5/git.json
  - skills/audit-code-quality/references/evals/5/docs/architecture.md
  - skills/audit-code-quality/references/evals/5/src/orders/service.js
  - skills/audit-code-quality/references/evals/5/src/orders/repository.js
  - skills/audit-code-quality/references/evals/5/src/orders/validation.js
  - skills/audit-code-quality/references/evals/5/src/api/orders.js
  - skills/audit-code-quality/references/evals/6/AGENTS.md
  - skills/audit-code-quality/references/evals/6/git.json
  - skills/audit-code-quality/references/evals/6/docs/architecture.md
  - skills/audit-code-quality/references/evals/6/src/pricing/index.js
  - skills/audit-code-quality/references/evals/6/src/pricing/rules.js
  - skills/audit-code-quality/references/evals/6/src/pricing/money.js
  - skills/audit-code-quality/references/evals/6/src/api/quote.js
  - skills/audit-code-quality/references/evals/7/AGENTS.md
  - skills/audit-code-quality/references/evals/7/git.json
  - skills/audit-code-quality/references/evals/7/docs/architecture.md
  - skills/audit-code-quality/references/evals/7/src/format/date.js
  - skills/audit-code-quality/references/evals/7/src/format/currency.js
  - skills/audit-code-quality/references/evals/7/src/format/percent.js
  - skills/audit-code-quality/references/evals/7/src/report.js
  - skills/audit-code-quality/references/evals/7/src/export.js
  - docs/specs/SPEC-0054-architecture-corpus-slice.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/SPEC-0054-architecture-corpus-slice.md --base main
---

# SPEC-0054: An architecture corpus that can see a shallow module

## Purpose

Issue #13 is the gate for the data-product program, but `audit-code-quality`
needs only one slice of it: architecture cases that distinguish a shallow
forwarding layer from a deep module. The current four cases exercise cycles,
duplication, dead code and scope; none of them can tell a healthy decomposition
from a module that leaks its invariants.

This spec adds that slice. It does not change the skill and does not publish a
measurement; it makes the fixtures the next spec can measure.

## User Outcome

Three small fixtures exist, each with a committed baseline and a stated
architecture rule. A later spec can ask whether `audit-code-quality` names the
shallow interface, stays silent on a healthy deep module, and refuses the
"too many modules" false positive.

## Scope

- `skills/audit-code-quality/references/evals.md`: cases 5, 6 and 7, tagged
  `architecture`.
- Fixture **5 — shallow module with leaked invariants.** `OrderService.create`
  forwards to a repository but the caller must validate first, open the
  transaction and retry on conflict. `docs/architecture.md` says the service owns
  those invariants. The expected finding is the shallow interface and the
  caller-side orchestration, with `file:line`.
- Fixture **6 — deep module.** `pricing/index.js` exposes one `quote(order,
  catalog, now)` and hides tax, discount, rounding and validation behind it.
  `docs/architecture.md` says callers never see those details. The expected
  result is zero findings; the helpers are not "overengineering".
- Fixture **7 — many modules but cohesive.** `format/{date,currency,percent}.js`
  are small and each is used by `report.js` and `export.js`. The expected result
  is no "too many modules" or "abstraction without two consumers" finding.
- Each fixture has `AGENTS.md` (rules and commands), `git.json` (`base: "."`) and
  a committed tree. No test command is configured, so coverage stays `unknown`.

## Non-Goals

- No change to `skills/audit-code-quality/SKILL.md` or its description.
- No new skill, runner, dependency or paid draw.
- No coverage or `CHANGELOG` claim; the measurement belongs to SPEC-0055.
- No data fixtures (join, migration, schema); those stay in `TASK-78`.

## Flow

1. **F0 — write case 5.** Shallow service plus the caller that orchestrates the
   invariants; state the rule in `docs/architecture.md`.
2. **F1 — write case 6.** Deep pricing interface with internal helpers; state the
   public interface in `docs/architecture.md`.
3. **F2 — write case 7.** Small format helpers with two consumers; state the
   shared purpose in `docs/architecture.md`.
4. **F3 — validate.** `run-evals --list --check` parses the three cases; each
   fixture stages from its `git.json`.

## Data

- Existing fixtures `1/` and `4/` are the layout precedent: `AGENTS.md`,
  `git.json`, `docs/architecture.md`, `src/**`.
- `skills/audit-code-quality/references/evals.md` is the case registry.
- `scripts/run-evals.mjs --list --check` validates the case format.

## Acceptance Criteria

1. Cases 5, 6 and 7 are in `evals.md` with a prompt, a `why:`, human `expect:`
   lines and `tags: architecture`; `run-evals --list --check` passes.
2. Each fixture stages through its `git.json` with a committed baseline, and its
   `AGENTS.md` states the architecture rule and the commands (none configured).
3. Case 5's expectations name the shallow interface and the caller-side
   orchestration; cases 6 and 7 expect zero findings and no overengineering
   accusation.
4. No skill text, detector, coverage row or `CHANGELOG` entry changes.
5. All eight `tests:` commands pass; no paid draw.

## Open Questions

- **How explicit should the "zero findings" expectation be?** The eval assertion
  kinds are positive; use a human `expect:` for the absence and machine
  assertions for the contract (`SCOPE:`, `CAPTURE OPTIONS`, `unchanged`).
- **Does case 7 need two consumers per helper?** Yes: it exists to test the
  "abstraction without a second consumer" false positive.

## Prompt Notes

- **Requirements:** add three architecture fixtures and their cases; no skill
  change.
- **Entities:** shallow module, deep module, deletion test, interface, consumer,
  false positive.
- **Approach:** copy the fixture layout from `1/` and `4/`; keep each tree small
  enough to read in one pass.
- **Safeguards:** no writes, no test command invented, no paid draw, no
  coverage claim.
- **Tests:** the eight gates plus the case parser.
