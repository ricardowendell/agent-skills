---
id: SPEC-0103
title: The loaded documents carry only what was decided
status: draft
priority: high
task: TASK-133
created_at: 2026-11-19
updated_at: 2026-11-19
source_docs:
  - backlog/tasks/task-133 - bootstrap-the-loaded-docs-carry-only-what-was-decided.md
  - docs/inbox/2026-11-19-bootstrap-aprender-antes-de-decidir.md
  - docs/specs/active/SPEC-0102-documents-carry-their-certainty.md
related_decisions: []
depends_on:
  - SPEC-0102
blocks: []
files:
  - skills/bootstrap-project-harness/templates/architecture.md.template
  - skills/bootstrap-project-harness/templates/AGENTS.md.template
  - skills/bootstrap-project-harness/SKILL.md
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0103-loaded-documents-carry-decisions.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0103-loaded-documents-carry-decisions.md
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
---

# SPEC-0103: The loaded documents carry only what was decided

## Purpose

The generated `.opencode/opencode.json` loads two documents as instructions:
`docs/architecture.md` and `docs/principles/design.md`. Being loaded is not a
neutral act — every later agent reads those two as binding on every task. Yet
`architecture.md.template` declares its whole content normative ("a violation is a
bug, not a tradeoff"), including DRY and a Size Limits table whose numbers
(`warn 60`, `warn 200`, `error 4`, `error 10`) duplicate what the lint
configuration already owns and can silently disagree with it.

So a preference the operator mentioned once becomes a blocking rule because a
template wrote it down and a loader picked it up. This spec separates what was
decided from what was merely suggested, and stops the loaded surface from
carrying the second kind.

## User Outcome

An agent working in a bootstrapped repo is bound only by constraints the operator
accepted, and can tell them apart from recommendations. Thresholds are read from
the tool configuration that enforces them, not from prose that paraphrases them.
A recommendation that turns out wrong costs a discussion, not a "bug".

## Scope

- **F0 — two sections, not one voice.** `architecture.md.template` splits into
  **Accepted constraints (binding)** and **Recommendations (not binding)**. Each
  entry says why it holds; a recommendation names the condition under which it
  would become a constraint.
- **F1 — thresholds leave the prose.** The Size Limits table goes. The template
  points at the configuration that owns each number (`oxlint`, `eslint`, the
  formatter) and states that this file does not restate them, so the two cannot
  drift.
- **F2 — the loading rule, written where the loader is.** `AGENTS.md.template`
  states that `opencode.json` loads `docs/architecture.md` and
  `docs/principles/design.md`, and that only sections labelled `confirmed` or
  `accepted` may appear in them — anything provisional lives in a document that
  is not loaded (`docs/product/`, `docs/system/`).
- **F3 — the bootstrap enforces it at write time.** `SKILL.md` says which
  documents are loaded and forbids writing a hypothesis into either, extending the
  rule `SPEC-0100` added for step 18 to the file-creation step.
- **F4 — screening.** The edits move the bootstrap's `skillHash`. Screen case 16
  (empty repo, the cell that asserts `max-lines` lives in `.oxlintrc.json`) and
  case 1 (the full tree) at 1–2 draws each; record the skillHash, the staleness
  delta and the reason in `docs/evals/coverage.md` with the words "screening, not
  a separation claim".
- **F5 — publish.** One `CHANGELOG.md` `[Unreleased]` line naming what changed and
  that the loader's file list is unchanged.

**Blast radius.** Two templates and one step of `SKILL.md`, plus the evidence note
and the release entry. No script, no sensor, no parity fixture, no change to
`opencode.json` itself. The vocabulary this relies on is `SPEC-0102`.

## Non-Goals

- **No loader change.** `opencode.json` keeps loading exactly those two paths. The
  fix is what may be written into them, not which files are loaded — moving the
  list would change where every consumer's agents look for constraints, and it
  would not stop a hypothesis from being authoritative.
- **No new check.** Nothing validates the labels at run time; the generated
  `docs-check` sensor would need the vocabulary and its parity fixtures, which is
  a separate, evidence-backed change.
- **No rewrite of `docs/system/`.** Descriptions of the system still live there and
  still link to the rules; this spec does not create a second architecture doc.
- **No retro-fixing generated projects.** Existing bootstrapped repos keep what
  they have; the rule applies to documents written from now on.
- **No measured claim.** Screening is a direction.

## Flow

1. Read `architecture.md.template`, list which entries are real constraints and
   which are preferences, and check each numeric limit against the lint
   configuration the template ships beside (`ts/`, `python/`).
2. Restructure the template into the two sections; put recommendations after the
   constraints, each with the condition that would promote it.
3. Delete the Size Limits table, replacing it with the pointer to tool
   configuration.
4. Add the loading rule to `AGENTS.md.template` and the write-time prohibition to
   `SKILL.md`.
5. Run the validator and the bootstrap's own tests, including template parity.
6. Screen cases 16 and 1; record the hash move and the delta.
7. Add the changelog line.

## Data

No new data. `architecture.md` keeps its path and its role; what changes is that
every entry in it belongs to one of two sections, and that a threshold is never
restated in it:

```
## Accepted constraints (binding)
## Recommendations (not binding)
```

The loaded set is unchanged: `docs/architecture.md`, `docs/principles/design.md`.

## Acceptance Criteria

1. `architecture.md.template` has exactly the two rule sections — accepted
   constraints and recommendations — and no entry sits outside one of them.
2. No numeric threshold appears in the template's prose: `grep` for the former
   limits (`warn 60`, `warn 200`, `error 4`, `error 10`) returns nothing, and the
   template names the configuration that owns each number.
3. Each recommendation carries the condition under which it would become a
   constraint.
4. `AGENTS.md.template` states which two documents the loader loads and that only
   `confirmed` or `accepted` sections belong in them.
5. `SKILL.md` forbids writing a hypothesis into a loaded document, and names both
   paths.
6. `.opencode/opencode.json` is unchanged, and no script, sensor, fixture or
   other template changes.
7. `node scripts/validate-skills.mjs --root skills` prints `All clear`,
   `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` passes, and
   `spec-check` reports no errors.
8. Screening on cases 16 and 1 is recorded with the skillHash move, the staleness
   delta and "screening, not a separation claim"; no rate is written.

## Open Questions

- **What happens to a constraint that is later rejected?** The template says an
  accepted constraint holds until deliberately revised; where the revision is
  recorded is `docs/decisions/`, not this file. Whether a superseded constraint
  stays visible in `architecture.md` is left to the consumer.
- **Does removing the table make case 16 weaker?** Case 16 asserts `max-lines`
  appears in `.oxlintrc.json`, which the change reinforces rather than weakens.
  The screening is what confirms it; if the cell stops discriminating, that is a
  corpus finding, not a reason to keep numbers in prose.

## Prompt Notes

- Requirements: two sections, no numbers in prose, loading rule stated, loader
  file list untouched.
- Entities: accepted constraint, recommendation, promotion condition, loaded
  document, threshold owner.
- Approach: restructure one template, then state the rule where the loader and the
  bootstrap read it.
- Structure: `architecture.md.template`, `AGENTS.md.template`, one `SKILL.md` step.
- Operations: classify entries before rewriting; check every removed number against
  the stack configs so the pointer is true.
- Norms: the template is stack-agnostic — name `oxlint`/`eslint` as examples, do
  not assume one.
- Safeguards: do not change `opencode.json`, do not add a check, do not create a
  second architecture document, do not claim measurement.
- Tests: (1) two sections, every entry inside one; (2) no threshold in prose;
  (3) promotion condition present per recommendation; (4) parity suite green.
