# Evals

A fixture in `references/evals/<n>/` is copied into the scratch repo before the
prompt runs. Each fixture is a small product-docs tree with an existing
`ADR-0002` and an index in `docs/decisions/README.md`.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

1. **Record the decision: we're moving the local store from Postgres to SQLite, because a single-user app should not need an ops dependency.**
   - prompt: Record the decision: we're moving the local store from Postgres to SQLite, because a single-user app should not need an ops dependency.
   - expect: Creates `ADR-0003`, status `accepted`, with context, decision, and consequences.
   - expect: Adds the new row to the index without renumbering ADR-0001 or ADR-0002.
   - expect: Does not restate `docs/architecture.md`.
   - expect: Watch for: inventing alternatives the user never mentioned.
   - assert: filematch docs/decisions/ADR-0003-*.md SQLite
   - assert: filematch docs/decisions/ADR-0003-*.md [Ss]tatus
   - assert: filematch docs/decisions/README.md ADR-0003
   - assert: unchanged docs/architecture.md

2. **Record that we decided to go with microservices.**
   - prompt: Record that we decided to go with microservices.
   - why: no context, no trade-off
   - expect: Treats this as not-yet-a-decision and asks for the context and what was traded away.
   - expect: Writes nothing: no new ADR, no index change.
   - expect: Watch for: inventing a rationale and filing a confident-looking ADR.
   - assert: nofile docs/decisions/ADR-0003-*.md
   - assert: unchanged docs/decisions/README.md
   - assert: unchanged docs/architecture.md

3. **We're reversing ADR-0002: the background queue moves from SQS to a Postgres-backed queue, because we already run Postgres.**
   - prompt: We're reversing ADR-0002: the background queue moves from SQS to a Postgres-backed queue, because we already run Postgres.
   - expect: Writes `ADR-0003` for the reversal and marks `ADR-0002` as `superseded by ADR-0003`.
   - expect: Keeps ADR-0002's original text intact.
   - expect: Watch for: editing ADR-0002 into the new decision.
   - assert: filematch docs/decisions/ADR-0003-*.md [Pp]ostgres
   - assert: filematch docs/decisions/ADR-0002-*.md [Ss]uperseded by .*ADR-0003
   - assert: filematch docs/decisions/README.md ADR-0003
