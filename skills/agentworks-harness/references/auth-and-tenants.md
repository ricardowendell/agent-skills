# Auth and tenants

Read before a 401/403 diagnosis, a tenant or workspace change, or any read of a
model catalog. Three things decide a call: which tenant the credential was minted
for, which credential layer the endpoint reads, and which principal it presents.
Conflating them sends you debugging the wrong one.

## Three credentials, minted separately

`~/.config/agentworks/credentials.yaml` holds two per profile; the gateway key
lives in the same file under `service_accounts`:

| Key | Used by | Lifetime |
| --- | --- | --- |
| `tokens[profile]` | control-plane REST (`/v1/workspaces`, `/v1/skills`, `/v1/agents`) | hours |
| `mcp_tokens[profile]` | the MCP bridge, MCP-only endpoints | weeks |
| `service_accounts → … → accounts[id].api_key` | inference (`/v1/models`, `/v1/messages`, `/v1/chat/completions`) | set at mint; the server default is short |

The two JWTs embed `attr.active_tenant_id`, fixed at mint time. Sniff the middle
JWT segment (base64url) and compare that claim to the tenant you intend; do not
infer it from an error code. A gateway key is opaque (`sa-…`), carries no tenant
claim, cannot be loaded as a platform session, and is scoped to one workspace at
mint.

## Gateway keys authorize inference, and nothing else

A gateway key returns `401` on `/v1/me` and every control-plane route. A platform
token returns `401 invalid_api_key` on `/v1/models`. Neither is a fault: each
layer accepts only its own credential, so diagnose the layer the endpoint reads
before touching a token.

Read, list and mint:

- Key material: `credentials.yaml` → `service_accounts` → `profiles` →
  `clusters` → `tenants` → `workspaces` → `accounts[id]`. The same block holds
  `api_key_prefix`, `expires_at`, `scopes` and `current_id`.
- Candidates: `agentworks service-account list [--tenant …] [--workspace …]`.
- Lifecycle: `create --name <n> --validity 30d`, `rotate --id <id>`,
  `mint --id <id>`. Pass `--validity` explicitly; omission takes a short server
  default. `rotate` invalidates the previous key immediately.
- A human runs create, mint and rotate. A raw key that reaches agent output is
  already a leak; capture it file-to-file and report only the prefix.

Diagnose a gateway `401` in this order:

| Response | Meaning | Action |
| --- | --- | --- |
| `401 invalid_api_key` | key expired, revoked, or its account deleted | `rotate`, or `mint` if revoked |
| `403` on an inference call | the creator's membership or role changed | restore the membership |
| `Missing or invalid Authorization header` | no key presented | check the consumer's key path |
| `401` **and** `service-account list` empty | account deleted, or another principal owns it | `create` a new account |

- An expired key still lists. Absence is not expiry.
- `service-account list` is tenant- and workspace-scoped: `[]` means "not in this
  context", never "none exist". Switch tenant, then list again.
- Nothing rotates automatically, and expiry surfaces as a plain
  `invalid_api_key`. Record `expires_at` and rotate before it.
- A consumer that keeps its own copy of the key needs every copy updated on
  rotation. Find them before rotating, not after.

## `switch-tenant` moves the pointer, not the credential

`auth switch-tenant <id>` re-issues the **REST** token only and leaves the MCP PAT
stamped with the old tenant — the CLI says as much in its own warning.

`auth login` is worse: it mints against the account default — the first tenant in
the account's list, not the profile's last active tenant — so a login after a
switch **reverts** the switch, including `--reauthenticate`. Read `active_tenant_id`
back from `auth whoami` after every login.

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

`agentworks model list` and `agentworks model config opencode` send the platform
token to that gateway, so they answer `401 invalid_api_key` on every invocation.
Read that as the CLI talking to the wrong layer, not as a credential fault, and
do not retry it after a tenant switch.

Read the catalog from the platform instead:

- `agentworks context export --json` → `catalogs.models`. Authoritative, with
  `is_enabled` and `workspace_id` per entry.
- `cluster-context.json` in a live bundle, or `cluster_context` over MCP.
- `GET /v1/models` with a **gateway key** lists what that key may actually call.

Then take models from that catalog and let `agent validate` confirm registration
(`"Model … is registered and enabled"`); that check is the authority. Never read
the catalog from `~/.claude/cache/gateway-models*.json` or any other point-in-time
copy: it keeps serving retired models after the workspace catalog changed.

## A 200 does not mean applied

`PATCH /v1/agents/{id}` returns **200** and silently discards fields outside
`AgentPatch` (`name`, `slug`, `metadata`). Sending `{"is_enabled": false}`
"succeeded" and changed nothing.

Read back after every mutation and assert the field. With no field for the intent,
report the operation as unsupported: a request that is accepted and ignored is
indistinguishable from one that acted.
