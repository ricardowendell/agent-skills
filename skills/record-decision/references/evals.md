# Evals

A fixture in `references/evals/<n>/` is copied into the scratch repo before the
prompt runs. Each fixture is a small product-docs tree with an existing
`ADR-0002` and an index in `docs/decisions/README.md`.

Assertions: `- [assert] <kind> <arg>` is machine-checked after the case (`file`,
`nofile`, `dir`, `nodir`, `filematch` — glob-capable, `grep`/`nogrep`,
`unchanged`/`changed`). Prefer filesystem assertions over transcript greps.

1. **"Record the decision: we're moving the local store from Postgres to SQLite, because a single-user app should not need an ops dependency."**
   - Creates `ADR-0003`, status `accepted`, with context, decision, and consequences.
   - Adds the new row to the index without renumbering ADR-0001 or ADR-0002.
   - Does not restate `docs/architecture.md`.
   - Watch for: inventing alternatives the user never mentioned.
   - [assert] filematch docs/decisions/ADR-0003-*.md SQLite
   - [assert] filematch docs/decisions/ADR-0003-*.md [Ss]tatus
   - [assert] filematch docs/decisions/README.md ADR-0003
   - [assert] unchanged docs/architecture.md

2. **"Record that we decided to go with microservices."** (no context, no trade-off)
   - Treats this as not-yet-a-decision and asks for the context and what was traded away.
   - Writes nothing: no new ADR, no index change.
   - Watch for: inventing a rationale and filing a confident-looking ADR.
   - [assert] nofile docs/decisions/ADR-0003-*.md
   - [assert] unchanged docs/decisions/README.md
   - [assert] unchanged docs/architecture.md

3. **"We're reversing ADR-0002: the background queue moves from SQS to a Postgres-backed queue, because we already run Postgres."**
   - Writes `ADR-0003` for the reversal and marks `ADR-0002` as `superseded by ADR-0003`.
   - Keeps ADR-0002's original text intact.
   - Watch for: editing ADR-0002 into the new decision.
   - [assert] filematch docs/decisions/ADR-0003-*.md [Pp]ostgres
   - [assert] filematch docs/decisions/ADR-0002-*.md [Ss]uperseded by .*ADR-0003
   - [assert] filematch docs/decisions/README.md ADR-0003
