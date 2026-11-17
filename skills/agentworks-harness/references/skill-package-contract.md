# Skill package contract

Read when a package is rejected, when a skill needs typed arguments or a network
policy, or when you need the canonical bytes and their digest.

A skill is a sealed, versioned package: a deterministic zip with declared
contents, a digest per version, and explicit exposure. Nothing about a package
grants authority; `requires` and `allowed-tools` only make a run fail closed when
the agent, deployment, selectors, credentials or capability policy do not already
provide the resource.

## Shape

```text
skill/
├── SKILL.md            # required: YAML frontmatter + instructions
├── agents/agentworks.yaml  # optional: governance overlay, wins over SKILL.md
├── references/         # optional: supporting docs
├── assets/             # optional: templates and static artifacts
└── scripts/            # optional: utilities (see execution below)
```

`name`: 1–64 chars, lowercase ASCII kebab-case. `description`: 1–1024 chars.
`arguments_schema`: JSON Schema Draft 2020-12 describing a `type: object`.

## Limits, and what happens at each

| Boundary | Limit | On violation |
| --- | --- | --- |
| packed `.skill` / `.zip` | 10 MiB | rejected |
| unpacked total | 64 MiB | rejected |
| single file | 8 MiB | rejected |
| file count | 512 | rejected |
| directory depth | 16 | rejected |
| sandbox instruction body | 64 KiB | rejected |
| graph resource read | 256 KiB | truncated or rejected |
| argument schema | 256 KiB / 32 levels / 512 nodes | fail closed |
| invocation arguments | 64 KiB / 32 levels / 4096 nodes | fail closed |

Rejected outright: symlinks, special files (sockets, devices), encrypted members,
unsafe or case-colliding paths, YAML aliases, duplicate YAML keys, and **remote
references inside a JSON Schema**. Regex evaluation is a linear engine, so
lookarounds and backreferences are unavailable — the same failure mode as an
inline flag in a case matcher.

## Execution differs by runtime

| Runtime | Reads the sealed files | Runs scripts |
| --- | --- | --- |
| Graph agent | embedded `agentworks_skill` resource server | **no** — scripts are inert resources |
| Claw / OpenShell sandbox | materialized at `/sandbox/.agentworks/skills/<run-id>/<slug>/`, per-file size and SHA-256 verified, read-only modes | yes, when `capabilities.sandbox_scripts: true` and the compatibility report accepts it |

The platform installs no dependencies. A graph agent that needs to *do* something
uses a governed MCP tool, not a bundled script.

## Governance overlay

`agents/agentworks.yaml` (`schema_version: 1`) overrides the same field in
`SKILL.md` and is where package-level policy belongs:

```yaml
schema_version: 1
allowed-tools: [web-search/search]
requires:
  tools: [web-search/search]
policy:
  network:
    domains: [dados.empresa.com]
bindings:
  claw:
    command: /analisador-dados
```

`approval_requirements` and `compatibility` are preserved for portability but
fail closed on this host: express network restrictions as `policy.network.domains`.

## Digest and canonical bytes

A version records `package_format` (`agent-skill-zip-v1`), `package_digest`
(hex SHA-256) and `package_manifest`. The download endpoint returns the same value
three ways — `Digest` (RFC 3230, base64), `X-Skill-Package-Digest` (hex) and
`ETag` — with `Content-Type: application/vnd.agentworks.agent-skill+zip`.

Verify a round-trip with that digest rather than trusting file names or sizes:
a re-pack of identical bytes must reproduce it, and a differing digest is a
different version by definition.

## Exposure is a separate step

A catalog entry is not visible to a run until the deployment lists its exact
version: `PATCH /v1/deployments/{id}` with `{"skill_version_ids": [...]}`. The
control plane rejects duplicate, missing, inactive, cross-tenant or cross-workspace
versions, and any version the principal cannot use. An empty list exposes nothing.
Prefer the version UUID in automation: a slug resolves to the current version, but
exposure is checked against the exact ID.

Retire and reactivate per version (`skill retire|reactivate <skill> --version N`);
removing a version from every deployment comes first, or the API answers 409 with
the blocking deployment IDs.
