# MCP tool map

The live `tools/list` is authoritative; this map reflects a `developer`-scope
tenant. Writes exist on the bridge only when it starts with `--allow-write` or
`AGENTWORKS_MCP_ALLOW_WRITE=1`; otherwise use the CLI.

| Function | MCP tools | CLI |
| --- | --- | --- |
| Scope & catalog | `cluster_context`, `list_models`, `list_tools`, `list_capability_policies`, `list_environments`, `list_mcp_servers`, `list_mcp_integrations`, `list_runtimes`, `list_error_definitions` | `agentworks context export`, `model list`, `environment list`, `policy list` |
| Agents | `validate_agent` | `agentworks agent validate|create|deploy|run|versions` |
| Skills | `list_skills`, `show_skill`, `list_skill_versions`, `list_skill_files`, `read_skill_file`, `export_skill_package`, `audit_skill` | `agentworks skill pack|import|version-import|list|show|versions|files|read|audit` |
| Runs & observability | `list_run_summaries`, `inspect_run`, `inspect_session`, `inspect_runtime`, `list_observations`, `show_observation`, `list_guardrail_violations` | `agentworks run list|inspect|observations`, `session inspect`, `runtime inspect` |
| Checkpoints | `list_run_checkpoints`, `get_run_checkpoint`, `get_latest_run_checkpoint`, `get_resumable_run_checkpoint` | `agentworks checkpoint list|latest|resumable|show|delete|cleanup`, `run resume` |
| Deployments | `list_deployment_summaries` | `agentworks deployment list` |
| Tuning | `get_tuning_schema`, `analyze_tuning`, `get_tuning_job` | `agentworks tuning schema|analyze|show|cancel` (create needs budget authority) |
| Authorization & approvals | `list_tool_permissions`, `get_tool_permission`, `check_tool_authorization`, `simulate_policy`, `list_principals`, `get_principal_authority`, `list_access_profiles`, `list_requestable_access_profiles`, `validate_access_profile_version`, `list_approval_requests`, `get_approval_request`, `list_approval_policies`, `get_platform_authority_cutover_readiness`, `list_tenant_policy_versions`, `get_tenant_authorization_state`, `list_tenant_authorization_generations`, `simulate_tenant_authorization_generation`, `get_observability_policy` | `agentworks principal|access-profile|approval|authorization|policy`, `mcp permission-*` |
| External authority (secret-free) | `list_external_targets`, `get_external_target`, `list_external_credential_sources`, `get_external_credential_source`, `list_external_authority_connections`, `get_external_authority_connection`, `list_external_authority_bindings`, `get_external_authority_binding` | `agentworks authority *` |
| MCP servers | `get_mcp_server`, `list_mcp_server_revisions`, `get_mcp_server_revision`, `get_mcp_oauth_grant` | `agentworks mcp *` |
| Durable workflows | `list_workflow_interactions`, `get_workflow_interaction`, `pending_workflow_interactions`, `list_workflow_tasks`, `get_workflow_task`, `pending_workflow_tasks`, `list_workflow_invocations`, `get_workflow_invocation`, `list_workflow_signals`, `get_workflow_signal` | `agentworks workflow *` |
| Cache readiness | `list_model_cache_readiness`, `get_model_cache_readiness`, `page_model_cache_readiness`, `preview_model_cache_request` | `agentworks model cache-readiness` |
| Applications & events | `list_application_integrations`, `get_application_integration`, `get_application_delegation`, `list_event_subscriptions`, `get_event_subscription`, `poll_resource_events` | `agentworks application *` |

## Observed in a developer-scope tenant

Verify against your own `cluster_context`; these read `denied` there:
`application.*`, `tenant_policy.*`, `access_profile.create|version|publish|archive`,
`approval.read|review`, `external_authority.*` (create/stage/bind),
`model.create`, `mcp_server.create`, `capability_policy.create`,
`environment.create`, `skill.*.tenant`, `tool_permission.create|bulk_create|delete`,
`audit.report`.

`skill.read`/`skill.use` and `deployment.invoke` read `not_configured` until the
resources exist. Reads always work; the write boundary is the bridge flag plus
your role, workspace membership and tags.

## Bridge facts worth remembering

- One active workspace per bridge process; restart after changing scope. The
  bridge sends `_meta.activeScope` on every call and the API re-checks
  membership and permissions each time.
- Empty `AGENTWORKS_BEARER_TOKEN` in the harness config means "unset" so the
  profile credential applies. Do not export a token into the server env.
- A human PAT with several workspaces and no explicit selection gets
  `404: active workspace could not be resolved` even though the tool list
  appears (it is advertised locally).
