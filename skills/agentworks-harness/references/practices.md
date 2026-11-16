# Practices

Curated from `.agentworks/context.md` (the live contract wins over this file)
and `docs/how-to/*`. Keep this file short; add a rule only if it removed a real
mistake.

## Freshness

- The bundle is a 24h snapshot. Refresh (`agentworks builder init --out .`) after
  `manifest.expires_at` or after any auth/catalog/model/MCP/policy change.
- `include: "embedded-fallback"` ships no authenticated scope; it says nothing
  about access.
- Prefer live reads (`cluster_context`, `tools/list`, `validate_agent`) over any
  prose or cached catalog.

## Scope and authority

- One active tenant and workspace per MCP bridge. Selecting a workspace does not
  grant access to it.
- Affordances: `allowed` is advisory until the API accepts the mutation;
  `denied` is a hard boundary; `not_configured` means a prerequisite resource is
  missing. Create or request it; do not work around it.
- Roles: `developer` authors agents/skills/deployments only in named workspaces.
  Models, environments, capability policies, tool permissions, tenant policy,
  external authority and service accounts are tenant-admin/operator territory.
  Tag denies override role.

## Authoring

- Validate before creating; create before deploying; deploy exact versions;
  smoke before reporting.
- Reference models by catalog slug, MCP servers by slug, tools by exact name.
  Never invent catalog entries.
- Never embed credentials, tokens or `.env` contents anywhere the model can see
  or that gets persisted.
- A flow needs exactly one `StartNode`, at least one `EndNode`, unique node IDs
  and reachable terminal paths. Every branch, action and timeout route needs an
  explicit edge.
- Orchestration-only flows (control, review, event, timer, external-task nodes)
  can run without a registered model; declaring one is a deliberate choice.

## Skills

- Immutable packages: pack deterministically, import with explicit scope, record
  `skill_version_id` + digest, pin exact IDs at deploy. A slug is not a pin;
  updates are new versions, never silent replacements.
- Package metadata never grants capability. `requires`/`allowed-tools` fail
  closed unless the agent, deployment and policy already provide the resource.
- Workspace scope by default; tenant scope needs tenant-admin and a reason.
- Third-party packages: review content (it becomes model-visible) and license
  before importing into a corporate tenant; the digest is the provenance.

## Execution

- Stable idempotency keys across retries; unique correlation per event occurrence.
- `resume` recovers the failed cursor with original inputs and authority; a
  historical replay needs a new run. Cancel invalidates descendant leases.
- Memory is run-only by default; shared memory exposes one user's saved content
  to every user of the agent.
- Capability policies fail closed: narrow models, domains, filesystem and
  applications.
- Pending approvals, events and external tasks live in the durable workflow
  queue without holding a worker open.

## Reporting

- Every build leaves a report (schema:
  `agentworks-build-report.schema.json`): IDs, versions, digests, validation
  result, runs, tests, changes, residual risk.
- `audit.report` denied → keep the local artifact and name the denial.
