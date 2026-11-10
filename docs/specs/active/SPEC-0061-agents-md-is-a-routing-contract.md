---
id: SPEC-0061
title: AGENTS.md is a routing contract
status: ready
priority: P2
task: TASK-95
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-95 - skill-AGENTS.md-como-contrato-de-roteamento-SPEC-0061.md
  - AGENTS.md
  - skills/bootstrap-project-harness/templates/AGENTS.md.template
  - skills/bootstrap-project-harness/templates/WORKFLOW.md
related_decisions: []
depends_on: []
blocks: []
files:
  - AGENTS.md
  - skills/bootstrap-project-harness/SKILL.md
  - skills/bootstrap-project-harness/templates/AGENTS.md.template
  - skills/bootstrap-project-harness/templates/WORKFLOW.md
  - skills/bootstrap-project-harness/references/typescript.md
  - skills/bootstrap-project-harness/references/python.md
  - skills/bootstrap-project-harness/scripts/template-parity.test.mjs
  - skills/bootstrap-project-harness/scripts/template-reference-parity.test.mjs
  - docs/specs/active/SPEC-0061-agents-md-is-a-routing-contract.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0061-agents-md-is-a-routing-contract.md --base main
---

## Purpose

`AGENTS.md` is the first thing an agent reads and the most expensive context in
the repository: it is loaded on every turn, whether or not the task needs it.
Today it carries implementation history that belongs in a spec, and the template
the bootstrap skill generates carries a workflow body, universal `just` commands
and stack placeholders that no project actually has.

The target is a **short operational contract**: what this repository is, the four
documents that are authoritative, how to work, what to check before reporting
done, and where to read the long version. Everything else moves to the reference
it belongs in, loaded on demand.

## User Outcome

- An agent reading `AGENTS.md` learns where the rules live instead of reading a
  second copy of them.
- A bootstrapped project gets an `AGENTS.md` describing *that* project, with no
  placeholder and no command the project does not have.

## Scope

### F1 — the root `AGENTS.md` is a routing contract

Sections, in order: purpose (two sentences), sources of truth (a list of paths),
working agreement (scope, deletion over addition, trust boundaries, invalid
measurement is never a pass, human gates), check before reporting completion (the
actual commands), and one pointer to `docs/README.md` and `CONTRIBUTING.md` for
detail.

Removed: the PDLC lifecycle graph (it lives in `docs/pipeline.md`), version
specific caveats (`dispatch.mjs:214`, `verify.mjs:323`, the `SPEC-NNNN` slug
notes), and links into historical eval records.

Kept: the operational PDLC section that tells an agent how work is queued,
dispatched, reviewed and merged, and the hard boundaries (no push, stay in the
worktree, human gates). Those are instructions, not history.

### F2 — the generated `AGENTS.md` describes the real project

`templates/AGENTS.md.template` becomes a small document assembled from the
project: purpose and actual stack; commands that exist in `package.json`,
`justfile` or CI; repository-specific constraints and where they live; what the
agent may change; secret and PII handling; approval points; and a pointer to the
`WORKFLOW.md` that was actually generated.

Removed: universal `just dev/check/ci`, `[tech stack]`-style placeholders, the
duplicated workflow body, and unconditional file-length or complexity limits
that the installed linter does not enforce.

### F3 — the reference keeps the decision, loses the history

`references/typescript.md` keeps the operational decision guide (defaults,
supported alternatives, when to choose what) and drops benchmark narrative that
no runtime decision needs. `references/python.md` is checked for the same
problem and trimmed only if it carries history rather than decisions.

### F4 — parity tests follow the template

`template-parity.test.mjs` and `template-reference-parity.test.mjs` still prove
that the template and the reference agree. Where the template changed, the tests
are updated to the new invariants; no test is deleted to make the change pass.

## Non-Goals

- No eval case edits. `skills/bootstrap-project-harness/references/evals.md` and
  its fixtures are moved by SPEC-0058 and are **not touched here**; case updates
  for the new template land after that move.
- No change to `README.md`, `CONTRIBUTING.md` or `docs/README.md`; SPEC-0058 owns
  them in this wave.
- No new documentation file. A reference is added only if it removes a decision
  from `SKILL.md`; this spec reduces, it does not add.
- **No `CHANGELOG.md` edit.** The entry for this spec is written by the wave's
  publication commit after both branches land, so this spec can run in parallel
  with SPEC-0058 without colliding on the hottest file in the repository.
- No paid draw.
- No `SKILL.md` behaviour change beyond replacing prose that pointed at removed
  content.

## Flow

1. **F0 — inventory.** Record the current `AGENTS.md` and template line counts
   and the sections each carries.
2. **F1 — root contract.** Rewrite `AGENTS.md` to the routing shape, keeping the
   operational PDLC instructions and the boundaries.
3. **F2 — generated contract.** Rewrite the template so every emitted command is
   conditional on the project.
4. **F3 — references.** Trim the TypeScript reference's history; check Python.
5. **F4 — parity.** Update the two parity tests to the new invariants.
6. **F5 — publish.** A Results section with before/after line counts. The
   `CHANGELOG.md` entry is written by the wave's publication commit, not here.

## Data

- `AGENTS.md` (39 lines today).
- `skills/bootstrap-project-harness/templates/AGENTS.md.template` (102 lines
  today) and `templates/WORKFLOW.md`.
- `skills/bootstrap-project-harness/references/{typescript,python}.md`.
- The two parity tests.

## Acceptance Criteria

1. `AGENTS.md` is at most 60 lines and contains: purpose, sources of truth,
   working agreement, check-before-reporting, and one pointer to
   `docs/README.md`/`CONTRIBUTING.md`.
2. `AGENTS.md` names `docs/pipeline.md` as the only home of the pipeline
   **policy** (mode, tier, gates, paths) and does not restate it; a one-line
   command index of the cycle is allowed.
3. `AGENTS.md` keeps the operational PDLC instructions and the hard boundaries
   (no push, stay in the worktree, human gates) — verified by reading the diff
   against the current file, not by a keyword.
4. The template emits no placeholder token: no `[tech stack]`, no bracketed
   field, no `TODO`. A test asserts the generated document contains none.
5. Every command in the generated document is one the project actually has; the
   template does not hard-code `just` when the project has none.
6. The generated document points at the `WORKFLOW.md` that was generated, and the
   workflow body is not duplicated in it.
7. No unconditional lint/complexity limit survives in the template unless it
   matches the installed linter configuration.
8. Both parity tests pass and still fail on a deliberate divergence between
   template and reference.
9. No file under `skills/bootstrap-project-harness/references/evals*` and no file
   under `docs/specs/**` or `backlog/**` is modified except this spec.
10. Zero paid draws; all gates in `tests:` pass.
11. `CHANGELOG.md` is not in this spec's diff; the wave's publication commit
    carries the entry.

## Decisions

- **The root `AGENTS.md` keeps the operational PDLC section.** It is an
  instruction every agent needs on the first turn; `docs/pipeline.md` is the
  policy, and the two must not become two policies. The split is "how to behave"
  here, "what the rules are" there.
- **No new document is created to shorten `AGENTS.md`.** A reference is justified
  only by a decision it removes from the always-loaded path. Deleting a paragraph
  that nothing needs is the preferred outcome.
- **Template changes are proven by parity tests, not by eval draws.** The
  behavioural cases for the bootstrap skill ship with SPEC-0058's corpus move;
  this spec must not spend a draw to prove a template edit.

## Open Questions

None.

## Prompt Notes

- Read the current `AGENTS.md` fully before rewriting. The pdlc caveats are
  history; the boundaries are instructions. Do not delete a boundary because it
  reads like a caveat.
- The template is rendered with substitutions; a "no placeholder" assertion must
  run on the **rendered** output, not the source, or it proves nothing.
- Do not touch `references/evals*`. SPEC-0058 is moving those paths in a parallel
  worktree; a conflict there means this spec is wrong, not 0058.

## Results

Line counts (`wc -l`), before → after:

| File | Before | After |
| --- | --- | --- |
| `AGENTS.md` | 39 | 44 |
| `templates/AGENTS.md.template` | 102 | 50 |
| `references/typescript.md` | 519 | 312 |
| `references/python.md` | 50 | 50 (unchanged, on purpose) |

`AGENTS.md` is under the 60-line cap and grew by five lines (39 → 44): the ~20
lines of version-specific history became a one-line command index of the cycle,
sources of truth and the working agreement. The generated template more than
halved.

### What was removed, and why

- **`AGENTS.md`** — the pdlc 1.4 caveats (`dispatch.mjs:214`, `verify.mjs:323`,
  the `SPEC-NNNN` slug note, the `TASK-36` reference); the `TASK-55` /
  `CONTRIBUTING.md#editing-the-backlog` history; the "no `In Review` status"
  enumeration. Why: those describe a version of the harness, not the rule an
  agent must follow today; the backlog CLI lives in `CONTRIBUTING.md`. Kept, as
  F1 requires: the operational cycle with its commands and order (`pdlc plan` →
  `pdlc prompt` → `pdlc dispatch` → worker → reviewer → `pdlc review` →
  `pdlc verify` → `pdlc merge` → `pdlc audit`, one line), the queue rule, the
  no-push / stay-in-the-worktree / human-gate boundaries, the backlog-comment
  recipe (tool usage, not history), and "behavioural evals are not a gate". The
  cycle stays because `docs/pipeline.md` names the stages and gates but no
  command: dropping it would leave `verify` and the order unrecoverable. That is
  the one deviation from F1's "remove the lifecycle graph", corrected in review.
- **`templates/AGENTS.md.template`** — the `just dev` / `just check` / `just ci`
  block; the `[tech stack]` / `[db info]` / `[language/locale]` fields; the
  `## Behavioral Guidelines` body; the duplicated `## Workflow` paragraph; the
  `## Docs Layout` tree; the `## Linter Limits` table. Why: nothing there is
  derived from the project — the commands may not exist, and the limits are
  whatever the installed linter config enforces. The loop and the layout stay in
  `docs/WORKFLOW.md` and SKILL.md step 1. The template now renders eight
  `{{field}}`s and points at the generated `docs/WORKFLOW.md`. SKILL.md step 2
  names the source of each field — detection for `constraints` and
  `secret_policy`, one question for `change_scope` and `approval_points` with a
  stated default — and forbids leaving a marker in the file.
- **`templates/WORKFLOW.md`** — `` `just docs-check` ``; the generated workflow
  cannot assume a recipe the project may not have.
- **`references/typescript.md`** — the `## Matrix` section (method, the three
  fixtures, the per-fixture timing tables, the interleaved head-to-head), the
  per-section timing narrative (171/322 ms, 145/208/353 ms, 239/365 ms, install,
  build and monorepo numbers), the measured audit/registry tables, and the
  "Proposed tightening for SPEC-0043" paragraph. Every decision is kept:
  defaults, alternatives and their conditions, the tsconfig / oxlint / scripts
  blocks, the quality-limits table, gate tiers (without costs), pins, and the
  minimum-versions table the parity test reads.
- **`references/python.md`** — checked for the same problem; it carries
  decisions (toolchain, limits, security, commands), no measurement history.
  Left unchanged; it stays in `files:` as a declared non-change.

### Parity tests

- `template-parity.test.mjs` gained five invariants. The "no placeholder"
  assertion runs on the **rendered** document (`renderAgents()` +
  `AGENTS_FIXTURE`), not the template source. It proves: every declared field
  has a fixture value (a new field fails until it is rendered); no `{{…}}`,
  bracketed field, angle-bracket field, TODO/TBD/FIXME or "tech stack" survives
  rendering; no `just dev/check/ci` and no fenced command block, and every
  command in the commands section is one the fixture project ships; the document
  points at the `WORKFLOW.md` install path and contains none of the loop skills;
  it states no lint limit and points at the config that owns it. The rules are
  functions, and two mutation tests keep them honest: a bracketed field and a
  hard-coded `just check` each make the rendered assertion report.
- `template-reference-parity.test.mjs` now also compares the reference's
  `## Quality limits` table with `.oxlintrc.json.template` rule for rule (max,
  severity, `skipBlankLines`, `skipComments`), so the reference cannot claim a
  limit the scaffold does not install. Its mutation test changes only the
  reference row (`Max parameters 4` → `5`) and requires exactly one finding, the
  rule-level message; a template mutation would not prove that, because the
  whole-block comparison also quotes `max-params`. The original `.nvmrc`
  mutation still fails the comparison.

### Review round 1

- **Cycle restored.** `AGENTS.md` names `pdlc plan` → `prompt` → `dispatch` →
  worker → reviewer → `pdlc review` → `verify` → `merge` → `audit`, in order,
  because `docs/pipeline.md` has the stages but no commands.
- **Field sources.** SKILL.md step 2 no longer says to drop a required section:
  it names detection or one question for all eight fields and a default for the
  two that the project may not answer.
- **Template wording.** "Do not invent a command"; the closing check is named by
  role ("the gate in the list above that runs the others") because
  `{{commands}}` may list several.
- **Mutation isolation.** The quality-limit mutation now changes the reference
  row and requires the rule-level finding, so deleting the rule-by-rule check
  makes the test fail.

### Gates

All exit 0, run in this worktree:

| Command | Exit |
| --- | --- |
| `node scripts/validate-skills.mjs --root skills` | 0 |
| `node scripts/run-evals.mjs --root skills --list --check` | 0 (dry run; zero paid draws) |
| `node --test scripts/lib/evals/*.test.mjs` | 0 (463 pass) |
| `node --test scripts/lib/*.test.mjs` | 0 (13 pass) |
| `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` | 0 (42 pass) |
| `node scripts/check-sensor-parity.mjs` | 0 |
| `node scripts/check-evidence.mjs` | 0 (100 pre-existing warnings, no errors) |
| `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0061-agents-md-is-a-routing-contract.md --base main` | 0 (one warning: `references/python.md` declared and deliberately untouched) |

No file under `skills/bootstrap-project-harness/references/evals*`, `docs/specs/**`,
`backlog/**`, `CHANGELOG.md`, `README.md`, `CONTRIBUTING.md` or `docs/README.md`
was modified.

