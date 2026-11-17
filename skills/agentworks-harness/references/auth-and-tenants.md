# Auth and tenants

Read before a 401/403 diagnosis, a tenant or workspace change, or any read of a
model catalog. Three things decide a call: which tenant the credential was minted
for, which credential layer the endpoint reads, and which principal it presents.
Conflating them sends you debugging the wrong one.

## Two credentials, minted separately

`~/.config/agentworks/credentials.yaml` holds two per profile:

| Key | Used by | Lifetime |
| --- | --- | --- |
| `tokens[profile]` | control-plane REST (`/v1/workspaces`, `/v1/skills`, `/v1/agents`) | hours |
| `mcp_tokens[profile]` | the MCP bridge, MCP-only endpoints | weeks |

Both embed `attr.active_tenant_id`, fixed at mint time. Sniff the middle JWT
segment (base64url) and compare that claim to the tenant you intend; do not infer
it from an error code.

## `switch-tenant` moves the pointer, not the credential

`auth switch-tenant <id>` re-issues the **REST** token only and leaves the MCP PAT
stamped with the old tenant — the CLI says as much in its own warning.

`auth login` is worse: it mints against the account default, so a login after a
switch **reverts** the switch, including `--reauthenticate`.

Working sequence:

1. `auth switch-tenant <id>`; confirm with `auth whoami`.
2. Mint the PAT while the REST token is still switched: `POST {api}/v1/users/me/pats`
   with `{"name": "<label>"}`, `Authorization: Bearer <rest-token>`. The mint takes
   no tenant parameter; the server stamps the session's active tenant, which is why
   step 1 comes first.
3. Store the returned `api_key` under `mcp_tokens[profile]`.
4. Decode the new PAT and assert `attr.active_tenant_id`.

Any later `login` resets this: redo 1–3 after one.

The bridge does not read the CLI profile at all. `agentworks mcp serve` takes
`AGENTWORKS_TENANT_ID` / `AGENTWORKS_WORKSPACE_ID` from its environment: update the
harness MCP config and restart, then confirm `cluster_context.scope`.

## Endpoints read different layers

One valid token, one instant: `GET /v1/workspaces` → 200, `GET /v1/auth/config` →
200, `GET /v1/models` → **401 invalid_api_key**. The last is the inference gateway
wanting a gateway key; it says nothing about the tenant.

So `model list` never proves a tenant switch. Use `auth whoami`, `workspace list`
or `cluster_context`. For authoring, take models from `cluster-context.json` and
let `agent validate` confirm registration (`"Model … is registered and enabled"`);
that check is the authority, not the gateway listing.

## A 200 does not mean applied

`PATCH /v1/agents/{id}` returns **200** and silently discards fields outside
`AgentPatch` (`name`, `slug`, `metadata`). Sending `{"is_enabled": false}`
"succeeded" and changed nothing.

Read back after every mutation and assert the field. With no field for the intent,
report the operation as unsupported: a request that is accepted and ignored is
indistinguishable from one that acted.
