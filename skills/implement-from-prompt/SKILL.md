---
name: implement-from-prompt
description: Implement code from a structured implementation prompt and verify it. Use when the user asks to implement a prompt, build from a SPEC prompt, or continue the prompt-driven workflow to verified code. Preserves the prompt's scope and safeguards.
---

# Implementation Prompt To Code

## Purpose

Implement code from a reviewed implementation prompt while preserving its scope, safeguards, and verification plan.

This skill starts from prompt artifacts, not from vague backlog ideas. If no prompt file exists yet, use the `write-implementation-prompt` skill first.

## Workflow

Concept names below are stable; resolve literal paths from `AGENTS.md`.

1. Read `AGENTS.md` (or the project's equivalent agent configuration file).
2. Read, resolving paths from `AGENTS.md`:
   - the prompt-driven-development system doc, if present
   - the requested implementation prompt
   - the source spec or design doc listed in the prompt
   - related docs and ADRs referenced by the spec or prompt
3. Confirm the prompt has enough detail to implement. If it has blocking gaps, stop and update the spec or prompt first.
4. Read the relevant codebase before editing: existing patterns, helpers, and tests in the affected area. Check for existing functions with similar logic and reuse or extend them (DRY) rather than duplicating. Follow the layering and dependency rules the project documents.
5. Confirm the Operations order mentally before touching code.
6. Read the Safeguards section. It defines forbidden scope, non-goals, and privacy boundaries. Treat any violation as a bug, not a tradeoff. Keep it visible throughout implementation.
7. Set the source spec `status: in_progress`, then implement only the Operations in the prompt. Apply the Norms section for product tone, copy, accessibility, and commit conventions.
8. Add or update tests required by the prompt.
9. Run the verification commands that are available locally.
10. Walk through each Acceptance Criterion in the source spec. Confirm each passes — including all UI states the spec defines (happy path, empty, loading, error). Call out any that are no-ops or deferred.
11. If code realities force a scope or design change, update the prompt/spec before treating the implementation as done. When every Acceptance Criterion passes, set the source spec `status: implemented` and populate its `tests:` list with the test files added or updated.

## Implementation Rules

- Do not implement behavior outside the prompt.
- Do not silently resolve product questions in code.
- Prefer existing project patterns and helpers. Before writing a new function, search for existing functions with similar logic — reuse or extend, never duplicate.
- Keep product and business rules in domain modules, not UI components.
- Follow the project's design system and established UI patterns for frontend work.
- Check any new user-visible copy against the project's voice guidelines before marking done.
- Check specs listed in `depends_on` and `blocks` in the source spec — these are the most likely regression surfaces.
- Avoid introducing security vulnerabilities (injection, XSS, SQL injection, and other OWASP top 10).
- Use small, incremental commits.
- Use Conventional Commits.

## Architecture Rules

Apply the architecture rules the project documents (for example in `docs/architecture.md`): separation of responsibilities, dependency direction, DRY, and any file or function size limits. If the project has no such document, follow the patterns already present in the code and ask when a rule is ambiguous. Violations of the project's stated rules are bugs, not tradeoffs.

## Verification

Follow the prompt's `Verification` section.

If unavailable, choose the narrowest useful checks:

- Typecheck.
- Unit tests for domain rules.
- Component tests for guided flows when present.
- Playwright for core user paths when a runnable app exists.

Always report what was and was not run.

## Prompt Sync

If implementation differs from the prompt:

1. Update the prompt or source spec.
2. Explain why.
3. Then update code.

Do not let the code become the only record of intent.

## Output

End with:

- Code files changed.
- Tests or checks run.
- Prompt/spec updates made, if any.
- Remaining open questions or risks (report even if none).

## Pipeline

Previous stage: `write-implementation-prompt`. After implementation, `audit-docs` can verify the docs still agree with the delivered behavior.
