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
  - evals/python-luminary/fixtures/7/AGENTS.md
  - evals/python-luminary/fixtures/7/pricing.py
  - evals/python-luminary/fixtures/7/tests/test_pricing.py
  - evals/python-luminary/fixtures/8/AGENTS.md
  - evals/python-luminary/fixtures/8/catalogue.py
  - evals/python-luminary/fixtures/8/tests/test_catalogue.py
  - evals/python-luminary/fixtures/9/AGENTS.md
  - evals/python-luminary/fixtures/9/statements.py
  - evals/python-luminary/fixtures/9/tests/test_statements.py
  - evals/python-luminary/fixtures/10/AGENTS.md
  - evals/python-luminary/fixtures/10/ledger.py
  - skills/python-luminary/scripts/analyze.py
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

**Measured outcome, 2026-11-17.** Three iterations, each falsified or confirmed on
the default model (`opencode-go/deepseek-v4.1-flash`).

*Round 1 — micro-fix judgment (cases 3–7).* No separation. The skill did not load
on short fix prompts (1/3, 1/12 on `gpt-oss-120b`), and where it loaded the
control solved the fixture the same way. Cases 6 and 7 were retired with that
reason. This measured the router, not the judgment: a one-line "fix it" is the
case where the harness skips a skill.

*Round 2 — design judgment (cases 3, 5, 8, 9).* Still no separation. #8 (a green
suite over a latent equality defect) and #9 (share line math without a layer)
both read 1/1 vs 1/1: the control rejected the PR and kept the change flat
without help.

*Round 3 — codebase analysis (case 10).* **Separator at evidence level.** Case 10
stages a two-year-old ledger with five defects; the skill answers **5/5** and the
control **0/5** (`2026-11-17T10-23-12--python-luminary` /
`2026-11-17T10-18-13--python-luminary--without-skill`, both clean), reproducing
the 3/3 vs 0/3 screening. The discriminating assertion is process with
consequence: the skill runs `scripts/analyze.py` (which also drives ruff and ty),
the control reads the module and never runs a tool, so its findings carry no
`file:line` evidence. Canary #1 held at 10/12 clean with two infrastructure
stalls.

*Known weakness.* #9 regressed 1/3 vs 3/3: one draw piped `unittest` through
`tail` and read `$?`, which reports tail's status, and one never loaded the
skill. The core already says to keep the exit status visible; the draw is
evidence that a pipe still looks like the way to shorten output. Logged, not
patched here, because editing the tree would stale the #10 measurement.

The candidate is kept and scoped to codebase analysis. The micro-fix and design
claims are dropped with their measurements, in the description and in the body.

**Iteration 4, 2026-11-17 — the scan learns architecture.** A field trial against
a real 134-file kit (`ai4de-kit`) exposed two gaps the fixtures could not. First,
the scan answered line-level questions only: it named defects but said nothing
about where the weight was, so the Map phase ran on hand-written analysis while
the tool stayed silent. Second, both external tools ran from the skill's own
directory, which made `ty` resolve imports against the wrong environment — 458
diagnostics on a project whose own gate was green, 367 of them `import-not-found`
for its own first-party modules. The measurement under test did not cover either,
because case 10 has one module and no layering.

What changed, all in `scripts/`:

- `analyze.py` is now a 142-line CLI over a `scan/` package (model, classes,
  errors, effects, rules, shape, summary, tools). The entry point keeps its path
  and its asserted invocation; the rules moved, none changed.
- A `[shape]` block prints module count, largest modules with fan-in/fan-out,
  largest functions, effect sites, declared importlinter layers and import
  cycles. It also renders as `architecture` in `--json`.
- Every external tool runs with the target project's root as its working
  directory. On `ai4de-kit` this took `ty` from 458 diagnostics to 1.
- `vulture` gains the `uvx` fallback `ty` already had, so a project without the
  tool installed still gets dead-code coverage.
- A tool that ran and was clean is now reported as `clean` instead of omitted;
  silence was indistinguishable from "not run".

Package `__init__` facades are contracted out of the graph before cycle detection.
Without that, a re-exporting package (`pkg/__init__.py -> pkg.cli` plus
`pkg.runner -> pkg.__init__`) reports as circular, and the trial's first run
claimed four cycles in a project whose own import-linter contract passes. A real
cycle still reports: a two-module fixture where `a` imports `b` and `b` imports
`a` gives `cycles: 1`.

**Iteration 4 measured, 2026-11-17 — the separator holds.** Re-measured on the
tree that carries the shape block and the tool-context fixes
(`6bb8632`), on the same default model. Case 10: **skill 5/5, control 0/5**
(`2026-11-17T13-43-48--python-luminary` /
`2026-11-17T10-18-13--python-luminary--without-skill`; both `findings=0`,
`isolated=yes`, `skillLeaks=0`, `hostReads=0`). Canary #1: **7/8** with one
infrastructure stall, retried once (`2026-11-17T13-51-04--python-luminary`). The
control arm was reused rather than re-run: the without-skill arm stages no skill,
so a change to the skill tree cannot reach it.

This is the third reproduction of the same separator — screening 3/3 vs 0/3, then
evidence 5/5 vs 0/5 on two different trees. The artifact grew from a single file
to a 142-line CLI over an eight-module package and the measurement did not move,
which is the property that matters: the claim is about running the scan and
citing `file:line`, not about the scan being small.

**Two defects the re-measurement cycle found in the scan itself**, both fixed in
`6bb8632` and both invisible to the fixture corpus:

1. `vulture` does not read ruff's `extend-exclude`, so passing it a directory
   swept an installed `.venv` and buried 19 real findings under 125 from
   `site-packages`. Targets are now expanded with the scan's own skip list.
2. Fan-in and fan-out counted test edges. A module with 20 test files is
   covered, not coupled: on the trial kit this read `workspace` as fan-in 6
   instead of its real 3, and made `cli` look like a hub. Test modules are now
   excluded from the production graph, and the block says so.

Neither defect had a fixture. They surfaced by running the scan against a real
project, which is the argument for keeping one external target in the loop
alongside the corpus.

**Review findings addressed, 2026-11-17.** Three findings from an independent
read-only review of draft PR #23, all non-blocking:

1. The coverage row now counts (`6` cases, `2` trigger) and the totals move to
   `120/37/2`; drafts belong to the table because they hold real authored cases,
   unlike the accepted-on-human-review skills in the note below it.
2. The core states that repository rules win when they disagree with this skill's
   preferences, so the core cannot be read as authority over a consuming repo.
3. Cases 4 and 5 gain the `nofile pyproject.toml` / `nofile requirements.txt`
   guards their expectations already implied, matching cases 3 and 6.

Verified while addressing them, on head `7d839cf` in a throwaway worktree:
`validate-skills --root skills` reported `All clear`; `eval.mjs check` parsed 120
cases with no findings; `spec-check --base main` held; `check-evidence` reported
six documents with zero errors; the harness, helper and bootstrap suites and
sensor parity passed. The four behavior fixtures fail their documented command
before any fix (`FAILED (failures=2)`, `(errors=6)`, `(failures=1)`, `(errors=1)`)
— the expected red baseline, recorded here as the measured state rather than a
claim about the skill.

Establish that each unfixed behavior fixture fails its documented command without
editing the protected tests, then measure candidate and control arms on the cells
that carry the candidate's claim: case 10 for analysis, cases 8 and 9 for review
judgment and layer restraint, case 3 for the data model. Retain a case only when
its oracle measures meaningful behavior. Review architecture quality and tool
restraint beyond the machine assertions.
Publish raw counts and actual run directories only after the run checker passes.
No budget or superiority claim is inferred from this draft request.
