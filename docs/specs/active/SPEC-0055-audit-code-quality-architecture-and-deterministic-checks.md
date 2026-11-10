---
id: SPEC-0055
title: Audit architecture with deep modules and deterministic slots
status: implemented
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
depends_on: []
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
  - skills/audit-code-quality/references/evals/9/git.json
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

## Results

Landed:

- `references/architecture.md` — deep module, interface, shallow forwarding,
  leaked invariants, distributed responsibility, deletion test, seams,
  boundaries, dependency direction, change cost, `rule` vs `judgement`, and zero
  findings as a valid result.
- `references/deterministic-checks.md` — cycles/boundaries, unused code,
  duplication, coverage, complexity/size and Python slots; detect → run → record
  → classify → scope; absent or broken tools are `unmeasured`.
- `SKILL.md` — a new step 4 probes the deterministic slots and records the
  command, exit and count; the architecture dimension reads its reference on
  demand; the refusal and guardrail sections say `unmeasured` and forbid an
  install. The description and trigger are byte-identical.
- Fixture 8 — `AGENTS.md`, `git.json`, `package.json`, executable
  `bin/dependency-cruiser` and `bin/knip` stubs that emit known JSON, and
  `src/{app,legacy,unused}.js`. Case 8 uses it; case 9 stages fixture 6 through
  `evals/9/git.json` (`base: "../6"`), so the tools are absent.
- Cases 5–9 in `references/evals.md`. Cases 5–7 are the SPEC-0054 fixtures;
  case 8 proves the tool-present finding; case 9 proves `unmeasured` with no
  invented metric.

Measured 2026-11-10 on `agentworks/deepseek-v4-1-flash`, concurrency 4, detector
v6 `9149d6ab1ca57343`, five draws per arm:

| case | arm | run directory | clean draws | passed | red assertion(s) | decision |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | with-skill | `2026-11-10T13-28-15--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | — | keep |
| 5 | control | `2026-11-10T13-31-04--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | keep |
| 6 | with-skill | `2026-11-10T13-33-15--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | `reply SCOPE:` (r2) | keep |
| 6 | control | `2026-11-10T13-36-02--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | keep |
| 7 | with-skill | `2026-11-10T13-40-49--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | `reply SCOPE:` (r5) | keep |
| 7 | control | `2026-11-10T13-43-14--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | keep |
| 8 | with-skill | `2026-11-10T13-45-48--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 3/5 | `reply SCOPE:` (r1, r3) | keep |
| 8 | control | `2026-11-10T13-49-08--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | keep |
| 9 | with-skill | `2026-11-10T13-59-02--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | `reply SCOPE:` (r4) | keep |
| 9 | control | `2026-11-10T14-02-40--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply (unmeasured\|not measured\|not configured\|not installed\|no dependency tool)`, `reply CAPTURE OPTIONS` | keep |

Every published cell passes `check-eval-run` with `findings=0 warnings=0
skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0`. Case 8's deterministic
assertions (`ran dependency-cruiser`, `ran knip`, cycle, unused) pass in both
arms; case 9 separates on classification — the skill says `unmeasured` 5/5, the
control 0/5.

The first case-9 with-skill attempt (`2026-11-10T13-51-55--audit-code-quality--agentworks-deepseek-v4-1-flash`) is **not evidence** (stall, `findings=1`): `evals/9` did not exist, so the staged tree held only the skill; r3 stalled for 171 s (the 120 s watchdog fired; 2 attempts, one runner retry) and the other draws failed `unchanged`. The fixture pointer was added and the cell re-run. The wave therefore spent 55 paid draws, not 50; the overrun is published, not hidden.

Decisions: `keep` for all five cases; no `change`, no `drop`. The only skill-arm
red is the strict `SCOPE:` line (a `## SCOPE` heading in five draws). It was not
relaxed after the draws.

Gates, all eight `tests:` commands from the worktree root:

- `node scripts/validate-skills.mjs --root skills` — exit 0, 14 skills, all clear.
- `node scripts/run-evals.mjs --root skills --list --check` — exit 0, 94 cases
  (91 runnable, 3 manual).
- `node --test scripts/lib/evals/*.test.mjs` — 441 pass, 0 fail.
- `node --test scripts/lib/*.test.mjs` — 13 pass, 0 fail.
- `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` — 34 pass,
  0 fail.
- `node scripts/check-sensor-parity.mjs` — 2/2 fixtures in parity, exit 0.
- `node scripts/check-evidence.mjs` — 0 errors; the 99 warnings are the existing
  dirty-run citations already in `docs/evals/`.
- `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0055-audit-code-quality-architecture-and-deterministic-checks.md --base main`
  — 0 errors on the committed diff.

Acceptance criteria: 1–5 and 7 are met. AC-6's read-only and no-install clauses
hold (every `unchanged` assertion passed; no dependency, lockfile or network
install); its "no paid draw beyond the authorised five" clause is **not met**:
the wave spent 55 draws because the missing case-9 fixture pointer forced one
invalid cell to be re-run.
