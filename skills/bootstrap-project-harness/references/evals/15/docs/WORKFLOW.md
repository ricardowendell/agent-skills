# Development Workflow

> The map, not the manual. Each step is a skill or command that carries its own
> detail; this file only says what runs when, and in what order.

## The loop

1. **Capture** — `/capture "idea"` — save a raw thought in `docs/inbox`, your wording preserved.
2. **Process** — `/process-inbox` — classify stable ideas into vision / principles / backlog.
3. **Groom** — `/groom <backlog item>` — turn a decided item into a small spec (stops at the readiness gate).
4. **Prompt** — `/prompt <SPEC>` — turn a `ready` spec into an implementation prompt.
5. **Implement** — `/implement <prompt>` — build it, add tests, flip the spec `in_progress` → `implemented`.
6. **Review** — `/review-code` — read the diff against the spec; APPROVE or REJECT with evidence.
7. **Check** — `/docs-check` — audit the docs for drift. (`just docs-check` also runs in the gates.)

Between **Prompt** and **Implement**, stress-test the prompt with `/blind-spots` —
the last cheap checkpoint before code exists.

## If it goes wrong

Revert what the response changed with `git restore` (or `git checkout`), adjust
the prompt, then re-run. Small commits keep rollback cheap.

## Which command when

| You want to…                           | Run              |
| -------------------------------------- | ---------------- |
| Save a half-formed idea                | `/capture`       |
| Organize raw notes into docs           | `/process-inbox` |
| Turn a backlog item into a spec        | `/groom`         |
| Turn a ready spec into a prompt        | `/prompt`        |
| Implement a prompt                     | `/implement`     |
| Review a diff against its spec         | `/review-code`   |
| Audit docs for contradictions or drift | `/docs-check`    |
| Set up a new repo's harness and docs   | `/bootstrap`     |
| Stress-test a plan before building     | `/blind-spots`   |

## Worked example

`/capture "users lose drafts when the tab closes"` → `/process-inbox` files it
under backlog → `/groom` writes `SPEC-0007-draft-autosave.md` (`status: ready`)
→ `/prompt SPEC-0007` writes the implementation prompt → `/implement` builds it,
adds `tests/draft-autosave.test.ts`, sets the spec `implemented` → `/review-code`
walks the acceptance criteria and returns APPROVE → `/docs-check` confirms
nothing drifted.

## Beyond the loop

`find-blind-spots` (pressure-test a design), `simplify` (reduce complexity after
tests pass), `audit-docs` (periodic doc drift), `record-decision` (record the
choice as an ADR), `tighten-harness` (raise the bar once the code earns it),
`graphify` (architecture questions), `agent-browser` / `webapp-testing` (verify
UI), `impeccable` (frontend design), `clonedeps` (read a dependency's source).

## Gates you will hit

Commits run lint + types + security; pushes run tests + docs-check. Never
commit `.env`, `.db`, or data files.
