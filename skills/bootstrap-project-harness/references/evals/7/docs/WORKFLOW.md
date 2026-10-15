# Development Workflow

> The map, not the manual.

## The loop

1. `/capture "idea"` — save a raw thought in `docs/inbox`.
2. `/process-inbox` — classify stable ideas into the product docs.
3. `/groom <item>` — turn a backlog item into a spec.
4. `/prompt <SPEC>` — turn a `ready` spec into an implementation prompt.
5. `/implement <prompt>` — build it and update the spec.
6. `/docs-check` — audit the docs for drift.

Gates: commits run typecheck + lint + security; pushes run build + docs:check.
