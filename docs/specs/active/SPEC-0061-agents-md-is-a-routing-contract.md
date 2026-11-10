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
2. `AGENTS.md` names `docs/pipeline.md` as the only home of the pipeline policy
   and does not restate the lifecycle as a second copy.
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

_Filled during implementation._
