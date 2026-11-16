# Builder Contract (fixture stub)

Read the bundle manifest and cluster context before acting.

When `manifest.include` is `embedded-fallback`, no authenticated cluster snapshot
is available: the context is intentionally empty. Authenticate and re-run
`agentworks builder init --out .` before authoring, validating or mutating any
AgentWorks resource.
