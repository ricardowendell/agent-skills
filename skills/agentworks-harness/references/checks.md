# Check protocol

Run S0–S3 offline before touching the cluster; S4 is the live gate; S5 covers
skill packages. Target: zero errors; every accepted warning needs one sentence
in the build report.

| Step | Command | Pass criterion |
| --- | --- | --- |
| S0 bundle | `check.mjs` (reads `manifest.json`) | `include == "full-ops"` and `expires_at > now`; otherwise refresh first |
| S1 structure | `check.mjs` | exactly 1 StartNode, ≥1 EndNode, unique IDs, every edge endpoint exists, branch/action routes wired, terminal path reachable |
| S2 data edges | `check.mjs` | every BranchingNode fed by a `route` edge; every declared input has a source; self-edges allowed |
| S3 hygiene | `check.mjs` | no secret-shaped strings; `workspace_id` filled; catalog references left to S4 |
| S4 live | `validate_agent` / `agentworks agent validate -f` | `valid: true` **and** `missing_permissions: []`; ≤3 remediation iterations |
| S5 skills | `agentworks skill pack` twice, then import | identical digest both runs; record `skill_version_id` + digest; `audit_skill` shows import → exposure → use correlating to that version |

## Notes

- `check.mjs` reads JSON only (flow graphs and JSON specs). For YAML specs the
  platform validator (S4) is the gate; keep the flow in JSON when you want the
  offline gate.
- `--json` prints machine-readable findings; exit codes: 0 clean, 1 findings,
  2 usage.
- `--no-bundle` skips S0 for pure structure work.
- Do not treat a warning you do not understand as a pass. Fix it or write down
  why it is accepted.
