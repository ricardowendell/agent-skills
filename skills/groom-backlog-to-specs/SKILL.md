---
name: groom-backlog-to-specs
description: Turn product backlog items into small implementation-ready Markdown specs. Use when the user asks to groom the backlog, build specs, create feature specs, convert backlog items into specs, prepare implementation work, define acceptance criteria, or update docs/specs in a structured product-thinking repository.
---

# Groom Backlog To Specs

## Purpose

Create or update implementation specs from existing product direction without expanding scope.

Use this skill to turn backlog items into specs that are small, testable, and aligned with the current product boundary.

Concept names below are stable; literal paths are illustrative. If the repo's layout differs, discover it from `AGENTS.md` (or the repo README) and map the same concepts — do not assume these exact paths exist.

## Workflow

1. Read `AGENTS.md` first.
2. Read, resolving paths from `AGENTS.md`:
   - the specs index
   - product vision and scope
   - the release plan and the now/next/later backlog
   - relevant `experience`, `system`, and `decisions` docs
   - the design, voice, and visual-design principles, plus `product-principles.md`
3. **Identify information gaps before writing.** For each backlog item, check:
   - Is the user intent clear enough to write a scope and flow?
   - Is there a matching experience doc that describes this flow? If not, flag it — the spec may be introducing new product ground.
   - Are all `depends_on` specs already in `implemented` status? If not, note the dependency risk.
   - Are there open specs with partially overlapping scope? If so, surface the conflict before writing.
   If any gap is critical, ask the user to resolve it before grooming. Do not guess product direction.
4. Check whether a matching spec already exists in the specs folder.
5. Update the existing spec when possible. Create a new spec only when needed.
6. **Assess size and blast radius before writing scope.** A spec is too broad if it:
   - Touches more than one feature area simultaneously (e.g., home + closing + data model + new flow).
   - Introduces more than one schema migration.
   - Changes behavior in core shared logic that other specs depend on.
   - Cannot be summarized in one sentence of user outcome.
   When too broad, split into smaller specs and present the split to the user before continuing.
   State the blast radius in terms of which feature areas are affected and which existing specs could regress — not file paths.
7. Keep each spec narrow enough for one coherent implementation task.
8. **Run the full design principles check.** For each principle in the design principles doc, briefly assess whether the spec's flow and scope respects it. Flag violations or tensions explicitly, quoting the principle from the repo's own doc rather than paraphrasing it here. For any spec that places content on a UI surface, also ask whether showing it there creates accumulated weight over time.
9. **Check UI state completeness.** For any spec with interactive UI, confirm the scope covers:
   - Happy path
   - Empty state (nothing to show yet)
   - Loading state (if async)
   - Error state (if data can fail)
   If a state is out of scope, call it out explicitly in Non-Goals.
10. **Check user-visible copy.** Any new copy introduced by the spec must be flagged for review against the voice principles doc. Mark it in the spec with a note like `(copy: pending voice review)` until reviewed. Do not invent copy that has not been validated.
11. **Run a lightweight security check.** For any spec that handles user data:
    - Is all data user-scoped? Nothing leaks across users.
    - Does any migration touch existing rows in a potentially destructive way?
    - Does any AI-generated content get displayed as trusted HTML or interpreted as code?
    Flag concerns in Prompt Notes > Safeguards. Do not prescribe implementation — just name the boundary.
12. Preserve uncertainty in `Open Questions`.
13. **Verify testability.** Every Acceptance Criterion must be independently verifiable — either by a user action and an observable result, or by a system state that can be queried. If a criterion cannot be verified without reading implementation internals, rewrite it or move it to Prompt Notes.
    Each spec should produce at least:
    - One behavior verifiable through a user interaction.
    - One system state verifiable through data (if the spec touches persistence).
    - One visual behavior verifiable by inspection (if the spec touches UI).
14. Add acceptance criteria only for behavior supported by existing product docs.
15. Add lightweight prompt notes when they help future implementation.
16. Do not add new product modules, architecture, integrations, or data models unless the user explicitly asks.
17. **Apply the readiness gate before marking status `ready`.** All must be true:
    - [ ] Scope fits one coherent task (size check passed).
    - [ ] Blast radius is stated and bounded.
    - [ ] All design principles respected or tensions explicitly noted.
    - [ ] UI states complete or out-of-scope ones named in Non-Goals.
    - [ ] User-visible copy reviewed against voice.md or flagged pending.
    - [ ] Security boundaries noted in Safeguards (if data is involved).
    - [ ] All AC are independently verifiable.
    - [ ] All `depends_on` specs are `implemented`, or the dependency risk is documented.
    - [ ] No unresolved cross-spec scope conflicts.
    If any item fails, keep status `draft` and list what is blocking.

## Spec Rules

- Store specs in the specs folder (per `AGENTS.md`).
- Use filenames like `SPEC-0001-morning-check-in.md`.
- Keep status in YAML frontmatter.
- Use these statuses:
  - `draft`
  - `ready`
  - `in_progress`
  - `implemented`
  - `paused`
  - `rejected`
- Start new specs as `draft` unless the user asks to mark them ready.
- Link source docs and related ADRs in frontmatter.
- Use the project's interface language for product-facing copy. Internal spec prose may stay in English unless the user requests otherwise.

## Spec Template

```markdown
---
id: SPEC-0001
title: Morning check-in
status: draft
priority: P0
release: "0.1"
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
source_docs:
  - docs/product/vision.md
related_decisions:
  - docs/decisions/ADR-0001-example.md
depends_on: []
blocks: []
---

# SPEC-0001: Morning Check-In

## Purpose

## User Outcome

## Scope

## Non-Goals

## Flow

## Data

## UI Notes

## Acceptance Criteria

## Open Questions

## Prompt Notes

- Requirements:
- Entities:
- Approach:
- Structure:
- Operations:
- Norms:
- Safeguards:
- Tests: (behaviors to verify — interaction, data state, visual)
```

## Grooming Guidance

When a backlog item is too broad, split it into smaller specs.

Good spec size:

- One ritual step.
- One user-facing flow.
- One data object plus its basic CRUD behavior.
- One bounded implementation slice.
- Describable in one sentence of user outcome.

Too broad:

- "Build the whole MVP."
- "Implement all daily flow."
- "Add AI."
- "Create complete mobile capture."
- Touches multiple feature areas simultaneously.
- Requires more than one schema migration.

## Product Guardrails

Derive scope boundaries from the product scope doc and the release plan. Before adding anything to a spec, verify that it falls within the current product boundary. Prefer removing or narrowing scope over adding details. A spec should reduce ambiguity, not create a feature factory.

## Design Principles Compliance

Before finalizing any spec, run a brief check against all principles in the design principles doc. This is not a deep audit — one sentence per principle is enough. The goal is to catch violations early, not to write design commentary.

For UI specs, also check the visual-design principles doc for tap targets, motion, spacing, and token usage — at the behavior level, not the implementation level.

## Prompt Readiness

When preparing a spec for implementation, include a `Prompt Notes` section inspired by the REASONS shape:

- Requirements: what must be true.
- Entities: domain objects, tables, and important terms.
- Approach: implementation strategy.
- Structure: likely modules, components, and dependencies.
- Operations: concrete implementation steps.
- Norms: repo conventions, tests, naming, and product tone.
- Safeguards: non-goals, boundaries, privacy, simplicity constraints, and security boundaries.
- Tests: behaviors to verify — one interaction-level, one data-state-level (if persistent), one visual-level (if UI).

Do not write a full implementation prompt unless the user asks. The spec should contain enough notes to generate one later.

## Output

End with:

- Specs created or updated, with their status.
- Items blocked from `ready` and what is missing.
- Open questions.
- Any backlog items intentionally left ungroomed and why.

## Pipeline

Previous stage: `process-inbox-notes`. Next stage: `spec-to-implementation-prompt` — turn a `ready` spec into an implementation prompt. Call this out when a spec becomes `ready`.
