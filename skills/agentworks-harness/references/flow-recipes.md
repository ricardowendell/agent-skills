# Flow recipes

Rules validated against the live API (`validate_agent`, `valid: true`,
`missing_permissions: []`) on 2026-11-16. Start from `templates/`; keep IDs
stable once deployed.

## Edge rules

- `control_flow_connections` — `{from_node:{id}, to_node:{id}}`; from a gate or
  branch node add `from_branch`.
  - `HumanInputNode`: `from_branch` is the **action name** (`approve`, `revise`,
    `reject`, …).
  - `BranchingNode`: `branches` lists **target node IDs**; `from_branch` equals
    the target ID; `mapping` maps the worker's `route` value to a target ID.
- `data_flow_connections` — `{source_node, source_output, destination_node,
  destination_input}`. Every `BranchingNode` needs an edge `route → route`.
  State edges carry `state → state`; a `state` output may also feed the node
  itself (retry loops) — validated.
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

## Recipes

- **Gate triad** — `templates/flow-gate-triad.json`.
- **Retry loop** — `templates/flow-retry-loop.json` (self data edge + attempt
  counter in state; enforce the cap in the worker, e.g. ≤3).
- **PDLC delivery** — `templates/data-product-delivery.json` (capture → triage →
  groom → spec gate → prompt → implement → review → merge gate → deploy → docs).
- **Event wait** — `AwaitEventNode` with `event_name`, `correlation_input`,
  `payload_schema`; events arrive via `POST /v1/runs/{run_id}/signals`. Early
  events are buffered and wake one wait; retired correlations reject late
  deliveries; malformed buffered events are quarantined.
- **Long external work** — `ExternalTaskNode`; the worker claims, renews its
  lease, completes with the current `lease_generation`; the stable
  `operation_id` deduplicates external writes. A committed checkpoint prevents
  re-dispatch after a completed node.
- **Fan-out** — `MapNode` over a pinned subflow (`subflow.graph_version_id`,
  explicit `input_mapping`); results keep input order. Budgets: depth 10,
  1000 subflow invocations and 5000 node-steps per run; `max_depth` narrows
  only. Unknown subflow keys are validation errors.
- **Waiting for a human** — `HumanInputNode` with typed `actions`; respond with
  the exact `revision`, action, typed response and a stable idempotency key.
  Stale revisions and conflicting keys are 409; identical redelivery returns
  the original receipt. `participants.principal_refs` narrows assignment only.

## Validated on this cluster

A 17-node delivery flow with two gates, one retry self-edge, three branch nodes
and 22 data edges passed `validate_agent` with `valid: true`,
`missing_permissions: []`, `inferred_abstraction_level: "flow"` and **no model
declared** (`templates/data-product-delivery.json`).
