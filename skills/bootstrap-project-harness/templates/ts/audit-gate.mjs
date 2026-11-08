#!/usr/bin/env node
// audit-gate.mjs — a dependency audit that tells a finding apart from a registry
// that could not be reached.
//
// `npm audit` exits 1 for both cases, so the exit code alone cannot be a gate:
// `|| true` would hide a real vulnerability and a bare `exit 1` would block
// every commit on a plane. The JSON report is what decides. A report that lists
// high or critical vulnerabilities is a finding and always fails. Anything that
// is not a report is "unavailable": a warning by default (pre-push stays usable
// offline) and a failure with --fail-on-unavailable (CI, where a silent skip is
// worse than a red build).
//
// Usage: node audit-gate.mjs [--fail-on-unavailable]

import { spawnSync } from "node:child_process";

const failOnUnavailable = process.argv.includes("--fail-on-unavailable");
const HIGH = new Set(["high", "critical"]);

function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isReport(report) {
  return Boolean(report) && typeof report.metadata?.vulnerabilities === "object";
}

// npm puts the reason in `error.detail`, `error.summary` or `message` and leaves
// the others as empty strings, so an empty one is not an answer.
function unavailableReason(report) {
  const candidates = [report?.error?.detail, report?.error?.summary, report?.message];
  const detail = candidates.find((text) => typeof text === "string" && text.trim());
  return `npm audit could not reach the registry: ${detail ?? "no reason given"}`;
}

function readReport() {
  const result = spawnSync("npm", ["audit", "--json", "--audit-level=high"], {
    encoding: "utf8",
  });
  if (result.error) return { unavailable: `npm audit could not run: ${result.error.code}` };
  const report = parseJson(result.stdout);
  if (report === null) {
    const detail = (result.stderr || result.stdout || "no output").trim().split("\n")[0];
    return { unavailable: `npm audit did not return JSON: ${detail}` };
  }
  return isReport(report) ? { report } : { unavailable: unavailableReason(report) };
}

function describe(name, entry) {
  const titles = (entry.via ?? [])
    .map((item) => (typeof item === "string" ? item : item?.title))
    .filter(Boolean);
  return `${name} (${entry.severity})${titles.length ? `: ${titles.join("; ")}` : ""}`;
}

function findingsOf(report) {
  const entries = Object.entries(report.vulnerabilities ?? {}).filter(([, entry]) =>
    HIGH.has(entry?.severity),
  );
  return entries.map(([name, entry]) => describe(name, entry)).toSorted();
}

const outcome = readReport();

if (outcome.report) {
  const findings = findingsOf(outcome.report);
  for (const finding of findings) console.error(`audit: ${finding}`);
  if (findings.length) {
    console.error(`audit: ${findings.length} high-severity finding(s) — fix or remove them.`);
    process.exit(1);
  }
  console.log("audit: no high-severity vulnerabilities");
} else if (failOnUnavailable) {
  console.error(`audit: ${outcome.unavailable}`);
  console.error("audit: failing because --fail-on-unavailable was passed");
  process.exit(1);
} else {
  console.warn(`audit: skipped — ${outcome.unavailable}`);
  console.warn("audit: not run is not a pass; CI runs this with --fail-on-unavailable");
}
