---
name: write-implementation-prompt
description: Generate or update a scoped implementation prompt from a ready feature spec. Use when the user asks to create an implementation prompt, convert a spec into a prompt, or prepare a coding agent to implement a SPEC file. Stops if the spec is not `ready`.
---

# Spec To Implementation Prompt

## Purpose

Turn one implementation-ready spec into a scoped prompt that a coding agent can execute later.

This skill creates prompt artifacts. It does not implement code.

## Workflow

Concept names below are stable; resolve literal paths from `AGENTS.md`.

1. Read `AGENTS.md`.
2. Read, resolving paths from `AGENTS.md`:
   - the prompt-driven-development system doc, if present
   - the architecture doc (module structure, SRP, DIP, naming conventions)
   - existing prompts (`docs/prompts/implementation/*.prompt.md`)
   - the requested spec
3. Read source docs and related decisions listed in the spec frontmatter.
4. Check the spec status. If status is not `ready`, stop — list what is blocking readiness instead of generating a prompt from an incomplete spec.
5. Check open questions. If any block implementation, stop and list them instead of inventing answers.
6. Read any existing prompts for specs with overlapping domain or shared patterns. Mirror their structure where applicable.
7. Search the affected domain modules for existing functions that overlap with the spec's requirements. Note reusable functions in the Operations section to prevent duplication.
8. Run `node spec-sha.mjs <spec path>` and create or update the implementation prompt for the spec, recording the output as `spec_sha` in the prompt frontmatter.

## Prompt Structure

Use this shape:

```markdown
---
spec: SPEC-000N
spec_sha: <output of `node spec-sha.mjs docs/specs/SPEC-000N-name.md`>
---

# Implementation Prompt: SPEC-000N Name

## Source Spec

- docs/specs/SPEC-000N-name.md

## Requirements

## Entities

## Approach

## Structure

## Operations

## Norms

## Safeguards

## Verification
```

## Section Guidance

- **Requirements**: restate the user outcome, scope, acceptance criteria, and non-goals directly from the spec. Do not reinterpret — copy with precision.
- **Entities**: tables, domain terms, relationships, and important fields. Include any migration number if the spec defines one.
- **Approach**: implementation strategy and sequencing. Note key dependencies and the order they must be resolved.
- **Structure**: likely files, modules, components, server actions, queries, schemas, and tests. Treat as a guide, not a contract.
- **Operations**: concrete numbered steps the coder will follow in order. Derive from the spec's Flow, Data, and UI Notes sections. Follow this default order unless the spec requires otherwise: migration → domain types → repository → server helpers → UI → tests → spec status update. Each step should be independently committable. Be specific enough that the coder does not need to re-read the spec. For each step that creates a new function, note any existing function with similar logic that should be reused or extended instead.
- **Norms**: repo conventions, product tone, copy guidelines, accessibility, testing expectations, and commit format. Include any copy the spec has already validated. Restate the relevant architecture rules from the project's architecture doc (e.g. `docs/architecture.md`) — separation of responsibilities, dependency direction, DRY, and any file or function size limits — rather than assuming a specific stack.
- **Safeguards**: translate the spec's Non-Goals and Prompt Notes > Safeguards into explicit prohibitions. Phrase as "Do not..." statements. Include scope boundaries, privacy constraints, and forbidden patterns, and restate the project's own architecture anti-patterns from its architecture doc (for example: do not violate layering or dependency direction, do not duplicate business logic across files, do not create god functions or god files). Do not invent stack-specific rules the project does not state.
- **Verification**: map each Acceptance Criterion to at least one check — automated command, data query, or manual step. End with a statement that the work is done when every AC passes and the spec status is updated.

## Guardrails

- Stay within the scope boundary defined in the project's scope doc unless the user says otherwise.
- Use the project's accepted stack — derive it from the ADRs listed in the spec frontmatter.
- Keep prompts small enough to review before code generation.

## Output

End with:

- Prompt file created or updated.
- Source spec used.
- Blocking open questions, or `None`.

## Pipeline

Previous stage: `groom-backlog`. Next stage: `implement-from-prompt` — implement the generated prompt. Report the prompt path so it can be run next.
