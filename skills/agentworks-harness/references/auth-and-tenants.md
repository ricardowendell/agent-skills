# Auth and tenants

Read when a call fails with 401/403 and the obvious cause is not the answer, or
before switching tenant or workspace. Three separate things decide whether a call
succeeds: which tenant the credential was minted for, which credential layer the
endpoint reads, and which principal the request presents. Conflating them sends
you debugging the wrong one.

## Two credentials, minted separately

The CLI stores a REST session token and an MCP PAT under different keys in
`~/.config/agentworks/credentials.yaml`:

| Key | Used by | Lifetime |
| --- | --- | --- |
| `tokens[profile]` | control-plane REST calls (`/v1/workspaces`, `/v1/skills`, `/v1/agents`) | short (hours) |
| `mcp_tokens[profile]` | the MCP bridge and MCP-only endpoints | long (weeks) |

Both embed an `attr.active_tenant_id` claim. That claim is fixed at mint time. A
token is not re-carved when you point the profile somewhere else, so a stale
claim and an invalid token produce the same 401 on some endpoints and succeed on
others.

Decode before debugging (base64url the middle segment of the JWT) and compare
`attr.active_tenant_id` against the tenant you intend. Do this instead of guessing
from the error code.

## `switch-tenant` moves the pointer, not the credential

`agentworks auth switch-tenant <id>` calls `POST /v1/auth/switch-tenant` and saves
the **REST** token it returns. It does not mint a new MCP PAT. The CLI says so in
its own warning: *"this profile's existing MCP PAT was preserved but was minted
for the previous tenant"*.

Worse, `agentworks auth login` mints the PAT against the tenant the **identity
provider** considers active, which is the account default — so a login issued
after a successful switch silently reverts the switch. Observed three times in one
session: login after switch, switch after login, and `login --reauthenticate` all
landed back on the previous tenant.

The sequence that works:

1. `agentworks auth switch-tenant <new-tenant-id>` (REST token is now correct;
   confirm with `auth whoami`).
2. Mint the PAT **while the REST token is still switched**:
   `POST {api}/v1/users/me/pats` with body `{"name": "<label>"}` and
   `Authorization: Bearer <rest-token>`. The mint does not take a tenant
   parameter: the server stamps whatever tenant the presented session is active
   in, which is exactly why step 1 must come first.
3. Write the returned `api_key` into `mcp_tokens[profile]`.
4. Confirm: decode the new PAT and check `attr.active_tenant_id` matches.

Re-running `login` later undoes this. Treat a login as "reset to the account
default" and redo steps 1–3 after one.

## The bridge reads environment, not the CLI profile

`agentworks mcp serve` takes its tenant and workspace from
`AGENTWORKS_TENANT_ID` / `AGENTWORKS_WORKSPACE_ID`. Changing the CLI profile does
not move a running bridge. Update the harness config (the MCP server's
`environment` block) and restart it; verify with `cluster_context` that `scope`
names the tenant you expect.

## Different endpoints read different credential layers

The same valid user token can be accepted by one endpoint and rejected by another.
Measured with one token, one instant, one tenant:

| Endpoint | Result |
| --- | --- |
| `GET /v1/workspaces` | 200 |
| `GET /v1/auth/config` | 200 |
| `GET /v1/models` | **401 invalid_api_key** |

`/v1/models` is served by the inference gateway, which wants a gateway key, not a
user token. A 401 there says nothing about the tenant.

Practical consequence: do not use `model list` to prove a tenant switch worked.
Use `auth whoami`, `workspace list` or `cluster_context`. For authoring, read the
model catalog from `cluster-context.json`, and confirm registration
server-side with `agent validate`, whose `model` check reports *"Model … is
registered and enabled"*. That check is the authority for "may I reference this
model", not the gateway listing.

## Verify after write: a 200 does not mean applied

`PATCH /v1/agents/{id}` returns **200 OK** and silently discards fields outside
its schema (`AgentPatch` accepts only `name`, `slug`, `metadata`). Sending
`{"is_enabled": false}` "succeeded" and changed nothing.

Read the resource back after every mutation and assert the field you changed. When
the schema has no field for the intent, say the operation is unsupported instead
of reporting success: an agent that accepts a request and ignores it reads exactly
like an agent that acted.

## Blast-radius notes for a developer role

Measured across two tenants on the same account, so these are role properties, not
one tenant's policy:

- `environment.create` and `capability_policy.create` are `denied`. A developer
  cannot create the prerequisite an agent needs to run; this is the hard limit on
  "deploy and invoke your own agent".
- `service_account.create` is `denied`, which blocks external-agent reporting
  (`external_agent:invoke`). Reading reported runs and graphs is `allowed`.
- `DELETE /v1/agents/{id}` is **403** even for an agent the same principal
  created. There is no way for a developer to remove an agent, and the PATCH
  workaround does not exist (see above). Name anything you create so a human can
  identify it later: `…-do-not-use` is cheaper than an apology.
- `approval.request` is `allowed` while `approval.review` is not. But a request
  needs a published access profile and policy, and those are admin-authored; an
  empty `approval profiles` list means the request path is not yet usable. Check
  it before promising a self-service escalation.
