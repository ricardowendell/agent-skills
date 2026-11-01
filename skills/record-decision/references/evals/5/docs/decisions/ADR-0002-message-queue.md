# ADR-0002: Message queue choice

- **Status** — accepted
- **Context** — Background jobs need retries and at-least-once delivery.
- **Decision** — Use SQS with a single worker process.
- **Consequences** — Easy: managed retries and visibility. Hard: vendor coupling and local emulation.
