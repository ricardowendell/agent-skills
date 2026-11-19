---
status: processed
processed_at: 2026-11-19 11:02
---

# Três experimentos: survey, bootstrap, review

## 10:54

My top three would be **`survey-inflight-work`, `bootstrap-project-harness`, and `review-code`**, in that experiment order. They combine repetitive mechanical work, clear correctness criteria, and meaningful consequences when the agent gets something wrong.

This ranks **expected opportunity**, not measured improvements. Bootstrap already has a state script, and review already documents deterministic checks—the experiments should measure the additional value of better integration.

| Priority | Skill | Main experiment | Expected benefit |
|---|---|---|---|
| 1 | `survey-inflight-work` | Deterministic repository snapshot and dependency calculation | Faster, more complete coordination |
| 2 | `bootstrap-project-harness` | Detect → plan changes → apply → verify | Safer setup and repeatable evolution |
| 3 | `review-code` | Assemble verified evidence before semantic review | Fewer missed defects and unsupported verdicts |

### 1. `survey-inflight-work`: replace mechanical investigation with a collector

Your current skill specifies a fairly precise algorithm in prose: enumerate branches, worktrees and PRs; resolve refs; calculate changed paths; find overlaps; respect declared dependencies. **That is an especially strong candidate for executable code.**

**Build a small collector that produces:**

- Observation time, base/head SHAs, remote and fetch status.
- Branches, PRs, dirty paths and worktrees, with their provenance.
- Ahead/behind counts only for resolvable refs.
- Overlap pairs, declared dependency edges and dependency cycles.
- Explicit unknowns, failures and truncated results.

Use the **Git CLI through subprocesses**, rather than introducing a Git abstraction library initially. Git's porcelain formats support machine parsing; GitHub CLI provides structured PR output. [git-status Documentation](https://git-scm.com/docs/git-status?utm_source=chatgpt.com)

The agent would interpret the snapshot and explain the next action. It would no longer reconstruct the inventory itself. `report-project-status` could consume the same snapshot.

**Experiment:** compare the current skill against the collector-assisted skill on eight controlled repository situations: clean branches, overlapping changes, stacked PRs, dirty worktrees, renames, missing authentication, unavailable PR refs and dependency cycles.

**Measure:**

- Missed work and incorrect blocker claims.
- Invented dependencies or unjustified merge ordering.
- Elapsed time, tokens and tool calls.
- Repository changes beyond the declared fetch.

**Promotion criterion:** correct inventory and ordering constraints across the cases, zero invented facts, and lower collection cost. A small model adds little here—the underlying problem is computation.

### 2. `bootstrap-project-harness`: make changes repeatable and inspectable

You already have `harness-state.mjs`. The valuable next experiment is **turning its observations into a bounded change plan**, rather than building another detector.

The proposed helper would describe each operation:

| Operation | Example |
|---|---|
| Preserve | Existing pnpm and ESLint configuration |
| Add | Missing documented test command |
| Merge | Add an absent script without replacing existing scripts |
| Defer | Two tools appear to own the same slot |
| Verify | Check resulting configuration and run the applicable smoke command |

Start with **one stack and a small set of configuration files**. Use native JSON parsing and a format-preserving editor where preserving comments or formatting matters. Keep product interpretation and interview answers with the agent.

For projects genuinely derived from Cookiecutter templates, evaluate **Cruft separately for template lineage and updates**. It already addresses that lifecycle; it should not become a generic merger for arbitrary repositories. [GitHub](https://github.com/cruft/cruft?utm_source=chatgpt.com)

**Experiment:** use an empty project, a partial harness, a complete harness and an existing project with competing tool choices. Run the operation twice on each.

**Measure:**

- Existing configuration preserved.
- Conflicts correctly deferred.
- Successful smoke checks.
- Second-run changes: ideally none.
- Time until the project can execute its first useful task.

That last metric matters: generating more documents is not itself a successful bootstrap.

**Optional small-model experiment:** extract candidate facts from existing product docs, with exact source passages. Compare against the main model on factual accuracy, unsupported assumptions and useful interview questions avoided. Extracted suggestions must remain distinguishable from confirmed decisions.

### 3. `review-code`: give the reviewer reliable evidence

Your review skill already names scanners and checks. The opportunity is to make their execution and interpretation consistent.

Build a thin helper that:

- Fixes the review range and records the spec hash.
- Discovers the project's existing checks.
- Runs applicable, installed tools with bounded execution.
- Captures command, version, exit status, findings and failures.
- Separates existing findings from newly introduced findings where supported.
- Produces a compact evidence packet for the reviewer.

Semgrep supports structured output and baseline-based scanning, which makes it a useful component for this experiment. Reuse the project's existing lint, type and test tools alongside it. [docs.semgrep.dev](https://docs.semgrep.dev/cli-reference?utm_source=chatgpt.com)

**Keep semantic judgment with the reviewer:** whether an acceptance criterion is actually satisfied, whether a test proves the intended behavior, and whether a public contract was broken.

**Experiment:** use eight small changes containing a mix of scanner-detectable defects, behavioral defects, misleading tests and clean changes. Compare independent review sessions with and without the evidence helper.

**Measure:**

- Real defects found, separated by defect type.
- False blocking findings.
- Unsupported "verified" claims.
- Review time and tokens.

A helper that finds more lint issues but distracts the reviewer from a broken business rule has failed.

A small model could later classify or deduplicate findings, but I would first test whether simple rules suffice. It should not silently discard findings or own approval.

**I would start with the survey collector.** It offers the clearest test of Maddalone's idea: move a known procedure into code, then spend the agent's reasoning on the decisions that remain uncertain. Test bootstrap next for repeatability, and review third for higher-stakes semantic benefit.
