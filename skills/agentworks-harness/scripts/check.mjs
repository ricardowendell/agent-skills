#!/usr/bin/env node
// check.mjs — deterministic offline pre-flight for AgentWorks Agent Specs.
//
// S0 bundle freshness · S1 graph structure · S2 data edges · S3 hygiene.
// S4 (validate_agent) stays live; S5 (skill pack) lives in the CLI.
//
// The bundle manifest is resolved by walking up from the spec file, so a
// project-local .agentworks/ wins over the home-level fallback.
//
// Usage: node check.mjs --spec <agent-spec.json> [--bundle <manifest.json>]
//                      [--no-bundle] [--json]
// Exit:  0 clean · 1 findings · 2 usage.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join, parse } from "node:path";

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : def;
};
const specPath = flag("--spec");
const jsonOut = args.includes("--json");
const noBundle = args.includes("--no-bundle");

if (!specPath) {
  console.error("usage: check.mjs --spec <agent-spec.json> [--bundle <manifest.json>] [--no-bundle] [--json]");
  process.exit(2);
}

const errors = [];
const warnings = [];
const E = (m) => errors.push(m);
const W = (m) => warnings.push(m);

function findBundle(startDir) {
  let dir = resolve(startDir);
  for (;;) {
    const candidate = join(dir, ".agentworks", "bundle", "manifest.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// ---- S0: bundle freshness ---------------------------------------------------
if (!noBundle) {
  const bundlePath =
    flag("--bundle", null) ||
    findBundle(dirname(resolve(specPath))) ||
    resolve(process.env.HOME || ".", ".agentworks/bundle/manifest.json");

  if (!existsSync(bundlePath)) {
    W(`S0: no manifest found (${bundlePath}) — pass --no-bundle if you are not touching the cluster now`);
  } else {
    let bundle = null;
    try {
      bundle = JSON.parse(readFileSync(bundlePath, "utf8"));
    } catch (e) {
      E(`S0: unreadable manifest (${e.message})`);
    }
    if (bundle) {
      if (bundle.include !== "full-ops") {
        E(`S0: include=${JSON.stringify(bundle.include)} — authenticate and run 'agentworks builder init --out .' before any resource work`);
      }
      const exp = bundle.expires_at ? Date.parse(bundle.expires_at) : NaN;
      if (!Number.isNaN(exp) && exp < Date.now()) {
        E(`S0: bundle expired at ${bundle.expires_at} — refresh before any resource work`);
      }
    }
  }
}

// ---- load spec --------------------------------------------------------------
let text = "";
let spec = null;
try {
  text = readFileSync(specPath, "utf8");
} catch (e) {
  console.error(`cannot read ${specPath}: ${e.message}`);
  process.exit(2);
}
try {
  spec = JSON.parse(text);
} catch (e) {
  E(`spec is not valid JSON (${e.message}) — for YAML specs use 'agentworks agent validate -f'`);
}

// ---- S3: secret scan (runs even when JSON fails) ----------------------------
const secretRe = /\b(sk-[A-Za-z0-9_-]{8,}|sa-[A-Za-z0-9-]{8,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|xox[abp]-[A-Za-z0-9-]{8,}|Bearer\s+[A-Za-z0-9._-]{12,})/;
const hit = text.match(secretRe);
if (hit) E(`S3: possible secret in the spec ("${hit[0].slice(0, 12)}…") — credentials never belong in a spec`);
for (const key of ["api_key", "apiKey", "secret", "password", "bearer_token"]) {
  const re = new RegExp(`"${key}"\\s*:\\s*"[^"]{4,}"`, "i");
  if (re.test(text)) W(`S3: field '${key}' has a literal value — prefer external authority`);
}

function report() {
  const out = { spec: specPath, ok: errors.length === 0, errors, warnings };
  if (jsonOut) {
    console.log(JSON.stringify(out, null, 1));
  } else {
    console.log(`spec: ${specPath}`);
    console.log(`errors: ${errors.length} warnings: ${warnings.length}`);
    for (const e of errors) console.log("  ERROR " + e);
    for (const w of warnings) console.log("  WARN  " + w);
  }
  process.exit(errors.length ? 1 : 0);
}

if (!spec) report();

// ---- S1: structure ----------------------------------------------------------
// Accept either a full Agent Spec ({...spec, flow}) or a bare Flow document.
const flow = spec.flow || (spec.component_type === "Flow" ? spec : null);
if (!flow) {
  W("spec has no 'flow' — configured agents are covered by the live validator (S4)");
  report();
}

if (flow.component_type !== "Flow") W(`S1: flow.component_type=${JSON.stringify(flow.component_type)} (expected "Flow")`);
if (flow.execution_contract_version !== 2) {
  W(`S1: execution_contract_version=${JSON.stringify(flow.execution_contract_version)} — contract 2 enables durable gates`);
}

const nodes = Array.isArray(flow.nodes) ? flow.nodes : [];
const byId = new Map();
for (const n of nodes) {
  if (!n || typeof n.id !== "string" || !n.id) {
    E("S1: node without a string 'id'");
    continue;
  }
  if (byId.has(n.id)) E(`S1: duplicate id '${n.id}'`);
  byId.set(n.id, n);
  if (n.component_type === "ExternalTaskNode" && !n.task_type) E(`S1: ExternalTaskNode '${n.id}' has no task_type`);
}

const starts = nodes.filter((n) => n && n.component_type === "StartNode");
const ends = nodes.filter((n) => n && n.component_type === "EndNode");
if (starts.length !== 1) E(`S1: ${starts.length} StartNode(s) — exactly 1 required`);
if (ends.length < 1) E("S1: no EndNode");
const startId = flow.start_node?.id || starts[0]?.id;
if (flow.start_node?.id && !byId.has(flow.start_node.id)) E(`S1: start_node '${flow.start_node.id}' does not exist`);

const ctrl = Array.isArray(flow.control_flow_connections) ? flow.control_flow_connections : [];
const data = Array.isArray(flow.data_flow_connections) ? flow.data_flow_connections : [];
if (!ctrl.length) E("S1: control_flow_connections is empty");
if (!data.length) W("S2: data_flow_connections is empty — confirm this is intentional");

const outCount = new Map();
const inCount = new Map();
ctrl.forEach((e, i) => {
  const f = e?.from_node?.id;
  const t = e?.to_node?.id;
  if (!byId.has(f)) E(`S1: edge[${i}] from '${f}' does not exist`);
  if (!byId.has(t)) E(`S1: edge[${i}] to '${t}' does not exist`);
  outCount.set(f, (outCount.get(f) || 0) + 1);
  inCount.set(t, (inCount.get(t) || 0) + 1);
  if (e.from_branch) {
    const fn = byId.get(f);
    let allowed = null;
    if (fn?.component_type === "BranchingNode") allowed = fn.branches || [];
    else if (fn?.component_type === "HumanInputNode") allowed = Object.keys(fn.actions || {});
    if (allowed && !allowed.includes(e.from_branch)) {
      E(`S1: edge[${i}] from_branch '${e.from_branch}' is not declared on '${f}' (${allowed.join(", ") || "empty"})`);
    }
  }
});

for (const [id, node] of byId) {
  if (node.component_type !== "EndNode" && !outCount.get(id)) E(`S1: node '${id}' has no outgoing control edge`);
  if (id !== startId && !inCount.get(id)) E(`S1: node '${id}' has no incoming control edge`);
}

// branch/action/timeout coverage + mapping targets
for (const [id, node] of byId) {
  let labels = null;
  if (node.component_type === "BranchingNode") labels = node.branches || [];
  else if (node.component_type === "HumanInputNode") labels = Object.keys(node.actions || {});
  if (!labels) continue;
  const wired = ctrl.filter((e) => e.from_node?.id === id && e.from_branch).map((e) => e.from_branch);
  const missing = labels.filter((l) => !wired.includes(l));
  if (missing.length) E(`S1: '${id}' has branches/actions without an edge: ${missing.join(", ")}`);
  if (node.component_type === "BranchingNode") {
    for (const b of labels) if (!byId.has(b)) W(`S1: BranchingNode '${id}' branch '${b}' is not a node id`);
    for (const [k, v] of Object.entries(node.mapping || {})) {
      if (!byId.has(v)) E(`S1: BranchingNode '${id}' mapping '${k}' -> '${v}' does not exist`);
    }
  }
  if (node.component_type === "HumanInputNode") {
    for (const [a, schema] of Object.entries(node.actions || {})) {
      if (!schema || typeof schema !== "object") E(`S1: action '${a}' of '${id}' has no object schema`);
      else if (schema.additionalProperties !== false) W(`S1: action '${a}' of '${id}' lacks additionalProperties:false`);
    }
  }
}

// reachability from start (control edges only)
if (startId && byId.has(startId)) {
  const adj = new Map();
  for (const e of ctrl) {
    const f = e?.from_node?.id;
    const t = e?.to_node?.id;
    if (!f || !t) continue;
    if (!adj.has(f)) adj.set(f, []);
    adj.get(f).push(t);
  }
  const seen = new Set([startId]);
  const q = [startId];
  while (q.length) {
    const x = q.shift();
    for (const y of adj.get(x) || []) if (!seen.has(y)) { seen.add(y); q.push(y); }
  }
  const unreached = [...byId.keys()].filter((id) => !seen.has(id));
  if (unreached.length) E(`S1: unreachable from '${startId}': ${unreached.join(", ")}`);
}

// ---- S2: data edges ---------------------------------------------------------
const routeFed = new Set();
data.forEach((e, i) => {
  const s = e?.source_node?.id;
  const d = e?.destination_node?.id;
  if (!byId.has(s)) E(`S2: data[${i}] source '${s}' does not exist`);
  if (!byId.has(d)) E(`S2: data[${i}] destination '${d}' does not exist`);
  if (e.source_output === "route") {
    routeFed.add(d);
    const dn = byId.get(d);
    if (dn && dn.component_type !== "BranchingNode") W(`S2: data[${i}] route -> '${d}' (${dn.component_type}) — expected BranchingNode`);
    if (dn && dn.condition_input && dn.condition_input !== "route") {
      W(`S2: BranchingNode '${d}' condition_input='${dn.condition_input}' but the edge feeds 'route'`);
    }
  }
  if (!e.source_output && s) E(`S2: data[${i}] has no source_output`);
  if (!e.destination_input && d) E(`S2: data[${i}] has no destination_input`);
});
for (const [id, node] of byId) {
  if (node.component_type === "BranchingNode" && !routeFed.has(id)) {
    E(`S2: BranchingNode '${id}' has no 'route -> route' data edge`);
  }
}

// ---- S3: spec-level placeholders -------------------------------------------
if (/"workspace_id"\s*:\s*""/.test(text)) W("S3: empty workspace_id — use the active workspace from cluster_context");

report();
