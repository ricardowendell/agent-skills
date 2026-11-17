# Catalog practices

How skills live in the catalog once they exist: scope, tags, naming, versions
and workspaces. The build loop (author → pack → import → pin) lives in
`SKILL.md`; this file is what keeps the catalog healthy as it grows. Every rule
below earned its place by removing a real mistake.

## Scope: workspace first, tenant rarely

Import with `--scope workspace` (the default). A workspace-scoped skill is
visible only to that workspace's members, which matches how teams actually
consume methodology: one service line, one engagement, one team at a time.

Promote to `--scope tenant` only when the skill is transversal methodology and
a second workspace asks for it. Tenant scope needs tenant-admin and a reason;
a skill nobody outside your workspace requested is not that reason.

The import target and the consumers are different decisions: the first picks
where the skill lives, the deployment's `skill_version_ids` picks who uses it.
Two agents in the same workspace can pin different versions of the same skill.

## Tags: plain tags are self-service, grants are not

`PATCH /v1/skills/{skill_id}` accepts `tags` (array of strings) plus `name`,
`description`, `visibility`, `owner_principal`, `metadata` and `status`. A
developer can set plain tags in their own workspace; measured across ten skills in
one pass, every one applied.

Admin territory is a tag **with a grant**: TBAC tags are visibility fences, and a
skill tagged for an audience your token has no grant for is invisible even inside
your workspace. So:

- Plain organizational tags (`pipeline:pdlc`, `quality:python`): assign them
  yourself. They are catalog metadata, not a permission.
- Access-gating tags: request from a tenant admin, naming audience and reason.

An empty `tags` list is not an error: an untagged skill is visible to the
workspace, the default posture.

## Tags exist on skills, not on agents

The two resources are asymmetric, and assuming otherwise wastes a write attempt:

| Resource | Tag mechanism | Indexed |
| --- | --- | --- |
| Skill | `tags` in `SkillPatch` (`PATCH /v1/skills/{id}`) | yes, first-class |
| Agent | **no `tags` field**; `metadata.tags` accepts an array | no, stored verbatim |

`AgentPatch` accepts only `name`, `slug` and `metadata`; `AgentCreate` and the GET
response have no `tags`. `model_tags` and `tool_tags` exist but select models and
tools, which is a different meaning entirely.

So an agent tag lives in `metadata.tags`. It survives a read-back and a human
reader can filter on it, but the platform does not index it: do not promise a
server-side tag filter for agents. Label transient agents in a field a human reads
(`metadata.tags: [do-not-use]`) rather than relying on deletion, which a developer
cannot perform.

## Organizing a pipeline: tags for membership, a flow for order

A tag says which pipeline a skill belongs to; it cannot say what comes first.
The pairing that works:

1. Import the stage skills with a shared prefix tag (`pipeline:product`,
   `pipeline:pdlc`, `quality:python`).
2. Create one flow agent per pipeline whose `AgentNode`s are the stages in order,
   with `HumanInputNode`s where a human decides. Each node's `description` names
   the catalog skill it serves, so the graph is the readable sequence.
3. Pin the version at deploy (`--skill-version-id`), never in the tag: a tag
   answers "which pipeline", a version id answers "which bytes".
4. Tag the flow agent too, in `metadata.tags`, with the same prefix plus its kind
   (`pipeline:pdlc`, `kind:flow`) so the two artifacts are discoverable together.

Neither artifact alone is the workflow.

## Naming

Kebab-case, `<domain>-<function>`: `agentworks-harness`,
`create-data-contract`, `breaking-change-check`. The slug is the catalog handle
and the version pin is by UUID, but humans navigate by slug: a name that needs
a sentence to explain will be mispronounced in every conversation about it.
One skill, one job; a skill that both builds and audits is two skills.

## Versions: immutable, pinned, re-deployed

Never edit a live version. New bytes mean a new version: `skill pack` →
`skill version-import` → record the new `skill_version_id` → update the
deployment's `skill_version_ids` → re-deploy. Importing the same digest as the
current version is idempotent and reuses it, which is the safe way to
"republish".

A deployment keeps working on a pinned version forever; that is the point.
When a version must stop being used, retire the deployment, not the version:
the audit trail (`audit_skill`) reads versions by UUID and the history is part
of the evidence.

## Workspaces: one per isolation boundary

A workspace is a team context (membership, resources, authorization), not a
folder. When the isolation need is real (a client engagement, a regulated
audience, a separate service line), request a new workspace from an admin
(creation is not developer-self-service) and keep one catalog per boundary.

Do not split a team's skills across workspaces to simulate categories: that
splits membership and authorization too. Categories inside a workspace are
slugs, descriptions and tags, not more workspaces.

## Checklist before promoting anything

1. Workspace import succeeded and `list_skills` shows `visibility: workspace`
   with the expected `workspace_id`.
2. The version UUID and package digest are recorded where the deployment will
   reference them.
3. Promotion to tenant scope has a named second consumer and an admin's
   approval.
4. Tag requests name the audience and the reason; a plain organizational tag does
   not need approval and should be applied by whoever imports the skill.
