# ADR-0001: Single container deployment

- **Status** — accepted
- **Context** — The product ships as one service. Splitting it into separately deployed pieces would add orchestration and network hops before there is a scale or team reason for them.
- **Decision** — Deploy a single container that serves the API and the background worker together, one container per service.
- **Consequences** — Easy: one artifact to build, deploy, and observe; no service mesh or cross-service auth. Hard: the worker and the API scale together, and any release touches both.
