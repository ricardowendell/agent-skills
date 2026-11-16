---
name: agentworks-harness
description: "Operate a deployed AgentWorks cluster: discover scope, author and validate agent flows against the live API, package and pin skills, run deterministic spec checks (bundle freshness, graph structure, secret scan), smoke deployments and leave a build report. Use whenever a task mentions AgentWorks or asks to create, validate, deploy, invoke or debug an agent, flow, skill, deployment, run or bundle — including stale or embedded-fallback bundles, and choosing MCP tools versus the CLI."
---

# AgentWorks Harness

Operate **one deployed AgentWorks cluster** through its public API — the MCP
server first, the `agentworks` CLI for everything the bridge does not expose.
Read the live contract before acting; never trust a cached copy.

## Read order (every task)

1. `.agentworks/bundle/manifest.json` — `include` and `expires_at`.
2. `.agentworks/context.md` — the builder contract (the only source of rules).
3. `.agentworks/bundle/cluster-context.json` — live scope, catalogs, affordances.
4. Task playbook: `docs/how-to/*` (durable workflows, skills, MCP servers,
   external authority, checkpoints) and `docs/reference/schemas/*.json`.

If `include` is `embedded-fallback` or `expires_at` has passed: authenticate and
run `agentworks builder init --out .` first. An empty fallback context means
"unknown", never "denied".

## Loop

```
discover → author → check (offline) → validate (live) → remediate →
create/import → deploy exact versions → smoke → inspect → report
```

1. **Discover.** `cluster_context` (MCP) or `agentworks context export`. Read
   `affordances`: `denied` is a hard boundary, `not_configured` means a
   prerequisite resource is missing. Tool discovery is live — `tools/list` is
   authoritative; `references/mcp-tool-map.md` is only the starting map.
2. **Author.** Start from `templates/` (configured agent, Claw agent, gate triad,
   retry loop, the validated delivery flow). Reference only catalog entries the
   token can see; never embed credentials.
3. **Check offline.** `node scripts/check.mjs --spec <agent-spec.json>` —
   bundle freshness (S0), graph structure (S1), data edges (S2), secret and
   catalog hygiene (S3).
4. **Validate live.** `validate_agent` (MCP) or `agentworks agent validate -f`.
   Require `valid: true` **and** `missing_permissions: []`. Iterate at most three
   times; report what still fails instead of shipping a warning you do not
   understand.
5. **Write.** MCP write tools exist only when the bridge runs with
   `--allow-write` or `AGENTWORKS_MCP_ALLOW_WRITE=1`; otherwise use the CLI
   (`agentworks agent create|deploy|run`, `agentworks skill pack|import`, …).
6. **Skills.** Pack deterministically, import with explicit scope, record the
   immutable `skill_version_id` and digest, pin exact IDs in `skill_version_ids`.
   A slug is not an execution pin.
7. **Inspect.** `inspect_run`, `list_observations`/`show_observation`, and the
   checkpoint tools (`get_resumable_run_checkpoint`, `run resume`).
8. **Report.** Fill `templates/build-report.json`; submit via
   `submit_build_report` when `audit.report` is allowed, otherwise keep it local
   and name the denial.

## Non-negotiables

- When a step must wait for explicit approval, silence is not consent — an
  unanswered gate is never a yes.
- Never put keys, tokens, `.env` contents or credential material in a spec,
  prompt, tool output, report or repository file. External systems use the
  secret-free external-authority chain.
- Fail closed: capability policies list only what the task needs; dry-run with
  `simulate_policy` before relying on them.
- Idempotency keys stay stable across retries; an event correlation identifies
  one unique occurrence per run (use the external operation identity).
- Memory is run-only by default. Shared memory requires `shared_across_users: true`
  and a deliberate decision to expose one user's saved content to everyone.
- Denied affordances are boundaries, not bugs: surface the operation and its
  remediation; never retry with a different identity to evade a gate.

## Files

- `references/practices.md` — curated rules with pointers to the live sources.
- `references/mcp-tool-map.md` — MCP tools by function, CLI equivalents, write gating.
- `references/flow-recipes.md` — validated graph patterns and edge rules.
- `references/checks.md` — the deterministic check protocol (S0–S5).
- `templates/` — copy-paste starting points, validated against the platform.
- `scripts/check.mjs` — the offline checker (Node, no dependencies).
