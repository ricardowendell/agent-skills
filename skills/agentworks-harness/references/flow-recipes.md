# Flow recipes

Rules validated against the live API (`validate_agent`, `valid: true`,
`missing_permissions: []`) on 2026-11-16. Start from `templates/`; keep IDs
stable once deployed.

## Edge rules

- `control_flow_connections`: `{from_node:{id}, to_node:{id}}`. From a gate or
  branch node, add `from_branch`.
  - `HumanInputNode`: `from_branch` is the **action name** (`approve`, `revise`,
    `reject`, …), and the node's `branches` list uses the same names. A gate
    declaring actions `approve`/`reject` with edges labelled `on_approve` fails
    with *"Missing routes for <gate>: ['approve', 'reject']"* — the platform
    routes by action name, and any naming convention like `on_<action>` is
    rejected at create.
  - `BranchingNode`: `branches` lists **target node IDs**; `from_branch` equals
    the target ID; `mapping` maps the worker's `route` value to a target ID.
- `data_flow_connections`: `{source_node, source_output, destination_node,
  destination_input}`. Every `BranchingNode` needs an edge `route → route`.
  State edges carry `state → state`; a `state` output may also feed the node
  itself (retry loops), which validated.
- `ExternalTaskNode.task_type` follows `<flow_id>.<node_id>`; `result_schema`
  declares `{state (required), route (string)}`. Workers return the **complete
  merged state** plus the route they chose.
- Gates follow the triad: `HumanInputNode` → per-action edges → `gate_apply`
  (`ExternalTaskNode`) → `gate_route` (`BranchingNode`). The apply worker merges
  the frozen decision into state and returns `route = <action>`.
- Every `HumanInputNode` action, and every declared `timeout_branch`, needs an
  explicit edge. Omitting timeout fields means "wait indefinitely".
- Contract 2 (`execution_contract_version: 2`) is required for durable gates;
  every transitive subflow must also be contract 2.

## Create-time rules the validator does not enforce

`agent validate` is more permissive than `POST /v1/agents`. Four failures, in the
order they appear:

1. **`component_type: Flow` inside the `flow` block.** Validation infers the level
   and passes; create fails with *"Agent Spec payload must have component_type
   'Flow'"*. The graph also belongs under the `flow` key of `UnifiedAgentCreate`,
   not at the top level.
2. **`LlmConfig`, not `LLMConfig`.** Case-sensitive against `LlmConfig |
   VllmConfig | OllamaConfig | OpenAiConfig | OpenAiCompatibleConfig`.
3. **`start_node` is a reference.** `{id: "<start-id>"}`; the full node goes in
   `nodes`. A full object fails as *"Component entries must be objects"*.
4. **Every gate action needs a route with that exact name.**

Read-back: the flow materialises to a `graph_version_id`, and
`GET /v1/graph-versions/{id}` returns `.dsl` with `nodes` and
`control_flow_connections`. `GET /v1/agents/{id}` reports `current_version` as an
integer, so the graph is not on that response.

## Recipes

- **Gate triad**: `templates/flow-gate-triad.json`.
- **Direct-action gate**: `HumanInputNode` whose per-action edges go straight to
  the next node, no `gate_apply`/`gate_route` pair. Validated on two real
  pipelines (7 nodes, 2 and 1 gates): `actions` and `branches` use the same names
  and each has an edge with that `from_branch`. Use the triad only when a worker
  must merge the decision into state.
- **Retry loop**: `templates/flow-retry-loop.json` (self data edge + attempt
  counter in state; enforce the cap in the worker, e.g. ≤3).
- **PDLC delivery**: `templates/data-product-delivery.json` (capture → triage →
  groom → spec gate → prompt → implement → review → merge gate → deploy → docs).
- **Event wait**: `AwaitEventNode` with `event_name`, `correlation_input`,
  `payload_schema`; events arrive via `POST /v1/runs/{run_id}/signals`. Early
  events are buffered and wake one wait; retired correlations reject late
  deliveries; malformed buffered events are quarantined.
- **Long external work**: `ExternalTaskNode`; the worker claims, renews its
  lease, completes with the current `lease_generation`; the stable
  `operation_id` deduplicates external writes. A committed checkpoint prevents
  re-dispatch after a completed node.
- **Fan-out**: `MapNode` over a pinned subflow (`subflow.graph_version_id`,
  explicit `input_mapping`); results keep input order. Budgets: depth 10,
  1000 subflow invocations and 5000 node-steps per run; `max_depth` narrows
  only. Unknown subflow keys are validation errors.
- **Waiting for a human**: `HumanInputNode` with typed `actions`; respond with
  the exact `revision`, action, typed response and a stable idempotency key.
  Stale revisions and conflicting keys are 409; identical redelivery returns
  the original receipt. `participants.principal_refs` narrows assignment only.

## Validated on this cluster

A 17-node delivery flow with two gates, one retry self-edge, three branch nodes
and 22 data edges passed `validate_agent` with `valid: true`,
`missing_permissions: []`, `inferred_abstraction_level: "flow"` and **no model
declared** (`templates/data-product-delivery.json`).
