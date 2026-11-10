---
id: SPEC-0056
title: Review proportional to the risk of the diff
status: ready
priority: P1
task: TASK-80
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-80 - review-review-code-proporcional-ao-risco-do-diff-issue-15.md
  - https://github.com/ricardowendell/agent-skills/issues/15
  - skills/review-code/references/evals.md
  - docs/specs/SPEC-0055-audit-code-quality-architecture-and-deterministic-checks.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills/review-code/SKILL.md
  - skills/review-code/references/deterministic-checks.md
  - skills/review-code/references/evals.md
  - skills/review-code/references/evals/8/change.patch
  - skills/review-code/references/evals/8/git.json
  - skills/review-code/references/evals/9/change.patch
  - skills/review-code/references/evals/9/git.json
  - skills/review-code/references/evals/10/change.patch
  - skills/review-code/references/evals/10/git.json
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0056-review-proportional-to-diff-risk.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0056-review-proportional-to-diff-risk.md --base main
---

# SPEC-0056: Review proportional to the risk of the diff

## Purpose

`review-code` is contract-driven: it walks the spec's acceptance criteria, runs
the gates and checks the project's protections. That is the right first
dimension, but it can miss a change that satisfies the spec and keeps the tests
green while breaking a public interface, introducing a vulnerability, or masking
a regression.

At the same time, a heavy architecture/security review on every one-line diff is
overhead without evidence. This spec adds a **risk profile** and a **diff-scoped
deterministic layer**, not a second gate.

## User Outcome

A low-risk correct diff is approved without ceremony. A diff that breaks an
interface or introduces a vulnerability is rejected even when the suite is green.
A diff that looks risky but is correct is approved without a blocking finding.
Every blocking finding names `file:line`, the rule or AC, and one action.

## Scope

### F1 — risk profile

`skills/review-code/SKILL.md` keeps the current order — spec hash, AC walk,
gates, safeguards, documented norms — and adds:

- **Fast profile** for a small, low-risk diff: correctness, tests, secrets,
  scope.
- **Deep profile** when the diff touches a public interface, auth/security,
  persistence, schema/migration, concurrency or project policy.
- **Deepen only the dimensions the diff touches.** No dimension is mandatory.
- `blocking` (must change), `should-fix` (merge defensible, recorded), `nit`
  (documented rule only). Taste is not a finding.
- No spec declared → keep the existing withhold; do not invent a contract.

### F2 — diff-scoped deterministic slots

`skills/review-code/references/deterministic-checks.md` reuses the protocol from
SPEC-0055 and limits it to the diff:

| Slot | Tool | When |
| --- | --- | --- |
| security patterns | `semgrep --baseline-commit` | diff touches code/config |
| secrets | `gitleaks` | diff touches files or history |
| dependencies | `osv-scanner` | lockfile or manifest changes |
| workflows | `actionlint`, `zizmor` | `.github/**` changes |
| shell | `shellcheck` | `*.sh` changes |
| dead code / cycles | `knip`, `dependency-cruiser` | changed files only |
| type/test/lint | project commands | always if declared |

Rules: detect first, run locally with a timeout, record command and exit, and
report `unverified` when the tool is absent. Never install during a review and
never make a scanner mandatory. Prefer the project's CI tool over a duplicate.

### F3 — cases

- Case 8 — **interface break with green tests.** The patch changes a public
  function signature and updates the internal caller/tests; the suite stays
  green. The review must reject on the public-contract break.
- Case 9 — **introduced vulnerability.** The patch adds a shell/command path
  built from untrusted input; the suite stays green. The review must reject and
  name the flow.
- Case 10 — **false positive that must not block.** A correct retry with backoff
  looks risky but is scoped and tested. The review must approve without a
  blocking finding.
- Existing cases 1–7, including the red-gate case and the holdout #7, stay.

## Non-Goals

- No second reviewer, no second gate, no mandatory independent LLM review.
- No new review engine, scanner or dependency.
- No edit, merge, rebase or push; no issue write.
- No new PDLC phase.
- No change to `audit-code-quality` (a codebase, not a diff).

## Flow

1. **F0 — profile.** Add the fast/deep profile and the blocking/should-fix/nit
   distinction; keep the spec-first order.
2. **F1 — deterministic reference.** Write the diff-scoped registry and the
   detect/run/record/classify protocol; absent = `unverified`.
3. **F2 — cases.** Add patches 8, 9 and 10 on the existing `base/` fixture.
4. **F3 — measure.** Five draws per arm for cases 8–10; keep 1–7 as regression
   and the holdout; benchmark against the current skill.
5. **F4 — publish.** `docs/evals/coverage.md` and `CHANGELOG.md` with the
   measured result and the `keep/change/drop` decision.

## Data

- `skills/review-code/SKILL.md` and `references/evals.md`.
- Existing `references/evals/base/` and `base-red/` fixtures; patches 1–7.
- New patches 8–10 and their `git.json`.
- `docs/evals/coverage.md`, `CHANGELOG.md`.

## Acceptance Criteria

1. `SKILL.md` keeps spec hash and AC walk first; adds the fast/deep profile,
   blocking vs should-fix/nit, and the rule that only risk-relevant dimensions
   are deepened.
2. `deterministic-checks.md` lists the diff-scoped slots and the
   detect/run/record/classify protocol; absent or broken tools are `unverified`,
   never a pass; no install and no mandatory dependency.
3. Case 8 rejects the interface break with `file:line` despite green tests.
4. Case 9 rejects the introduced vulnerability and names the untrusted flow.
5. Case 10 approves the correct risky-looking diff without a blocking finding.
6. Existing cases 1–7 and the red-gate holdout remain green; routing still
   separates `audit-code-quality` (codebase) from `review-code` (diff).
7. Five draws per arm for the new cases; the measured result and the decision are
   published in `docs/evals/coverage.md` and `CHANGELOG.md`.
8. Read-only: no edit, merge, rebase, push or issue write; all eight `tests:`
   commands pass.

## Open Questions

- **Stubs or real scanners?** Stubs for the deterministic cases, so the eval is
  offline; the real tool is detected from the project at review time.
- **How to prove case 10 is a false positive?** The patch is correct and scoped;
  a human `expect:` records "no blocking finding", with machine assertions on
  `VERDICT: APPROVE`, the AC walk and `unchanged`.
- **Does this change the trigger?** No. The description and routing stay; only
  the body gains the profile and the reference.

## Prompt Notes

- **Requirements:** add the risk profile, the diff-scoped deterministic registry,
  the three cases and the measurement.
- **Entities:** fast/deep profile, public interface, auth/security, persistence,
  schema, concurrency, blocking/should-fix/nit, `unverified`.
- **Approach:** keep `review-code` as the only gate; make the deterministic layer
  proportional and diff-scoped; use stubs in fixtures.
- **Safeguards:** no second gate, no mandatory scanner, no install, no edit, no
  approval by inference, no spec → withhold.
- **Tests:** the eight gates; the paid eval is evidence, not CI.
