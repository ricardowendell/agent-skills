---
id: SPEC-0098
title: Draft a layered Python Luminary engineering skill
status: draft
priority: P1
task: TASK-122
created_at: 2026-11-16
updated_at: 2026-11-16
source_docs:
  - backlog/tasks/task-122 - python-luminary-layered-python-engineering-skill.md
  - CONTRIBUTING.md
  - docs/pipeline.md
related_decisions: []
depends_on: []
blocks: []
files:
  - CHANGELOG.md
  - README.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0098-python-luminary.md
  - evals/python-luminary/cases.md
  - evals/python-luminary/fixtures/3/AGENTS.md
  - evals/python-luminary/fixtures/3/money.py
  - evals/python-luminary/fixtures/3/tests/test_money.py
  - evals/python-luminary/fixtures/4/AGENTS.md
  - evals/python-luminary/fixtures/4/checkout.py
  - evals/python-luminary/fixtures/4/tests/test_checkout.py
  - evals/python-luminary/fixtures/5/AGENTS.md
  - evals/python-luminary/fixtures/5/rollup.py
  - evals/python-luminary/fixtures/5/tests/test_rollup.py
  - evals/python-luminary/fixtures/6/AGENTS.md
  - evals/python-luminary/fixtures/6/metrics.py
  - evals/python-luminary/fixtures/6/pyproject.toml
  - evals/python-luminary/fixtures/6/tests/test_metrics.py
  - skills.index.json
  - skills/python-luminary/SKILL.md
  - skills/python-luminary/agents/openai.yaml
  - skills/python-luminary/references/architecture-and-boundaries.md
  - skills/python-luminary/references/concurrency-and-performance.md
  - skills/python-luminary/references/errors-and-resources.md
  - skills/python-luminary/references/functions-and-iteration.md
  - skills/python-luminary/references/python-data-model.md
  - skills/python-luminary/references/review-examples.md
  - skills/python-luminary/references/sources.md
  - skills/python-luminary/references/tooling-and-verification.md
  - skills/python-luminary/references/types-and-domain-models.md
tests:
  - pdlc preflight
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0098-python-luminary.md --base main
---

# SPEC-0098: Draft a layered Python Luminary engineering skill

## Purpose

The user explicitly requested a draft pull request for a Python engineering skill
that combines idiomatic patterns, Fluent Python literacy, and architecture.
Existing skills cover project setup and whole-codebase architecture audits;
this candidate supplies language-specific implementation judgment.

This is an authorized draft experiment, not a measured capability claim. The
user's request authorizes publishing its branch and draft PR for review. It does
not authorize merge, release, policy changes, or a claim that local gates ran.

## User Outcome

An agent can use a short core to choose a proportionate Python change and load
only the deeper reference the decision needs. The user can review the actual
content and candidate evaluation cases before investing in measurements.

## Scope

- Author an original core, nine focused references, and host display metadata.
- Keep the core under 120 lines and its description below 500 characters.
- Cover data-model invariants, functions/iteration, domain types, architecture,
  exceptions/resources, concurrency/performance, tooling and practical review.
- Prefer functions, meaningful protocols and cohesive boundaries; avoid mandatory
  async, line-count limits, coverage floors, or automatic tool migrations.
- Add one pipeline scope entry, a README row, a draft coverage inventory, and
  an Unreleased entry. Preserve all existing skill bodies and workflow policy.
- Add two routing cases and four small behavior fixtures, outside the skill.
  Protect their tests/contracts; reuse existing assertion kinds only.
- Attribute influences and authoritative documentation without copying
  third-party skills or book text.

## Non-Goals

No new eval engine, flags, matcher kinds, workflow stages, CI workflow, Python
toolchain migration, bootstrap template change, personal-skill installation,
release bump, or automatic merge. Async/resource behavior is documented but
is not claimed as covered by this initial corpus.

## Flow

1. Inspect repository instructions, existing skills and contribution contracts.
2. Author the candidate and external corpus; review links, scope and metadata.
3. Publish the isolated branch and draft PR as explicitly requested.
4. Use existing PR CI for structural verification; record its actual result.
5. Before promotion, execute local preflight/gates, validate failing fixture
   baselines, and run the documented canary and candidate/control comparisons.
6. Keep, narrow or remove the candidate according to the measured decision.
   Keep TASK-122 open until that decision and required checks are recorded.

## Acceptance Criteria

1. The core routes directly to every reference and does not preload the corpus.
2. Instructions preserve target compatibility, existing tools, file scope, and
   the host implementation/review gates.
3. Hashing guidance permits identity-based mutable objects but rejects unstable
   value hashes; repr reconstruction and advanced mechanisms are contextual.
4. Architecture guidance names invariant ownership, dependency direction, effect
   boundaries, cohesive modules, and a practical reason for every abstraction.
5. Six numbered cases have neutral prompts and existing assertions; four fixtures
   exercise observable behavior with protected standard-library tests/contracts.
6. Catalog and coverage clearly mark the skill as draft/unmeasured, with no
   fabricated run directory, rate, benchmark, or gate result.
7. Required checks and the candidate/control decision are recorded before the PR
   is promoted for merge; no policy or harness feature changes are introduced.

## Results

Authored the core, nine references, display metadata, catalog integration, and
six candidate cases (two routing, four behavior). The four behavior fixtures
carry standard-library tests for immutable value keys, offline pricing reuse,
early streaming output, and a local fix preserving project configuration.

The authoring session has no executor. No pdlc command, local lint/selftest,
fixture baseline, Python example execution, or model-based comparison was run.
PR CI is the available structural verification surface; its result belongs in
the PR. This spec deliberately remains draft and TASK-122 remains To Do.

Structural CI passed for the initial draft commit `dedbd262` in
[Actions run 43989076852](https://github.com/ricardowendell/agent-skills/actions/runs/43989076852):
the validator reported `All clear`, corpus checking/staging and the spec contract
passed, harness/helper/bootstrap suites had 635 passes, five skips and zero
failures, and both sensor fixtures were in parity. These are repository checks,
not executions of the four new Python behavior fixtures.

A separate read-only usage exercise loaded the core and architecture reference
and proposed a two-function offline-pricing refactor. It preserved validation
before charging and added no layers. The proposed code was not executed; this
informal exercise is not a harness run, a pass rate, or candidate/control evidence.

## Evaluation Plan

Establish that each unfixed behavior fixture fails its documented command without
editing the protected tests. Follow CONTRIBUTING.md's load canary, then compare
candidate and without-skill arms on cases 3–6, starting with screening draws.
Retain a case only when its oracle measures meaningful behavior. Review
architecture quality and tool restraint beyond the machine assertions.
Publish raw counts and actual run directories only after the run checker passes.
No budget or superiority claim is inferred from this draft request.
