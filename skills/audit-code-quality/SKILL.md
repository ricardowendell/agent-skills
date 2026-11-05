---
name: audit-code-quality
description: "Audit a whole codebase or one module for coupling and cohesion, SOLID, duplication, unused code, test coverage and accumulated tech debt, with measured evidence and file:line. Use when the user asks how hard the code is to change, whether it is over-engineered or duplicated, where the debt is, or wants a quality read of a repo rather than one diff. Read-only: reports a ranked debt register and capture options, never refactors or writes."
stack-agnostic: true
---

# Audit Code Quality

## Purpose

Say where this body of code will hurt in six months, with evidence someone else
can reproduce. Not whether one change may merge — that is `review-code` — and not
whether a limit should tighten — that is `tighten-harness`.

There is no verdict and no score. A number like "quality 7/10" is unactionable
and invites arguing with the number instead of the code. The output is a ranked
register of costs, each with a path, a reason, and an effort estimate.

## Workflow

1. Read `AGENTS.md`, then the architecture document it names. Resolve: the test
   and coverage commands, the size and complexity limits, the dependency rules,
   and the product scope document.
2. Fix the scope and the baseline: repository root by default, or the path the
   user names. Record `git rev-parse --short HEAD`. Findings without a baseline
   cannot be re-checked later.
3. Measure before judging. Run the declared gates and keep the exact command and
   the number it printed. A command that does not exist is `unknown`, not an
   estimate, and it blocks any finding that would depend on it.
4. Map the structure: modules, the direction dependencies are allowed to flow,
   and any cycle. Use the project's dependency tool if it declares one. If it
   does not, a deterministic scan of imports is acceptable **only** when the
   result is reproducible; otherwise mark the dimension `unmeasured`.
5. Walk the dimensions below, in order, and keep only what has evidence.
6. Rank by cost of leaving it: how much it slows the next change, how likely it
   is to spread, and how reversible the fix is. Cap at ten findings; say how many
   were dropped.
7. Read the existing debt items (backlog, specs, TODOs) and mark what is already
   tracked instead of re-reporting it as new.
8. End with capture options and stop.

## Dimensions and what counts as evidence

**Coupling and cohesion.** A cycle between modules, a module that changes for
several unrelated reasons, or a dependency that points against the declared
direction. Evidence is the import edge or the file pair, plus the rule it
violates. Fan-in and fan-out counts support the finding; they are not the
finding.

**SOLID.** Each finding names the principle only after naming the concrete
dependency: which module knows about which, and what forces them to change
together. "Violates SRP" with no file pair is not a finding.

**DRY.** Point at the duplicate locations and at the thing that would diverge
first if one copy changed. Repeated *shape* without shared behavior is not
duplication worth fixing.

**YAGNI.** Unused exports, unused dependencies, dead code, and abstractions with
a single caller and no second use in sight. Judge scope against the product
scope document, not against your preference for smaller code.

**Clean code.** Only against limits the project already declares: file length,
function length, complexity, parameter count, naming. Without a declared limit,
this is `judgement` and must be labeled as such.

**Tests.** The measured coverage number, plus the high-risk modules with no
test. The gap matters more than the percentage: name the module and what could
break silently.

**Accumulated debt.** TODO and FIXME with age, suppressed lint rules, version
drift, and skipped or flaky tests. Count them; do not moralize.

## Authority

A finding is either `rule` or `judgement`.

- `rule` cites a written source: the architecture document, a harness limit, a
  lint rule, or an accepted ADR. The citation includes the file and the limit.
- `judgement` is a recommendation with no written rule behind it. It still names
  the cost and the change it would enable, and it says what would make it wrong.

Order of authority: architecture document, then stated constraints (product
scope, ADRs), then harness limits, then this checklist. A `judgement` finding
never overrides a documented decision; if the two disagree, that is an open
question for the user, not a finding.

## Output

```text
SCOPE: <path> @ <short sha> — <date>
MEASUREMENTS
- <command> → <result>
- not run: <command> — <reason>

FINDINGS
- [dimension] [rule|judgement] path:line — cost; evidence; effort S|M|L; risk

DEBT REGISTER
- <finding id> — <status: new|tracked> — <where it is tracked>

NOT ANALYZED
- <dimension or path> — <why>

CAPTURE OPTIONS
A. One backlog item per finding (preserves disposition)
B. A single debt note with the register (fast, loses per-item tracking)
C. Specs for the top three (costly, use when a fix is already planned)
```

Each finding carries one concrete action and one reason it matters. No finding
without an action; no action that requires rewriting the module — the fix is a
separate, scoped task.

## Refusal and degradation

- The path does not exist, is vendored, or is generated: stop and say which.
- No test or coverage command exists: report `coverage unknown` and do not infer
  it from test-file counts or a green gate.
- No dependency tool and no reproducible scan: mark coupling `unmeasured` rather
  than eyeballing it.
- The user asks for a score, grade, or pass/fail: refuse the score and offer the
  register. A verdict belongs to `review-code` and only for a diff.
- The scope is too large to inspect honestly: say so and ask for a path. Do not
  sample silently.

## Guardrails

- Read-only. Never edit, refactor, commit, or write to the backlog. Confirm
  `git status --porcelain` before and after; an identical result is the proof.
- Never invent a metric. "About 40%" is a fabrication; `unknown` is a fact.
- Never label taste as a rule. A finding that cannot name its source is
  `judgement`.
- Do not reopen product decisions. If YAGNI conflicts with the product scope,
  raise it as an open question and send it to grooming.
- Report what was not measured, even when the register looks complete.

## Pipeline

Runs outside the spec loop, like `tighten-harness`: at a milestone, before
planning a refactor, or after several `implement-from-prompt` cycles. Findings
feed `groom-backlog`; a measured limit that should become a gate feeds
`tighten-harness`; documentation drift is `audit-docs`, not this skill.
