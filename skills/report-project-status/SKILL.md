---
name: report-project-status
description: "Report a one-page project status: open GitHub issues, backlog and spec readiness, CI health, and at most three next steps with evidence. Branch, worktree and pull-request detail is delegated to survey-inflight-work. Use when the user asks how the project is doing, where it stands, what the next steps are, or to resume after a break. Read-only: composes survey-inflight-work, never edits, merges, pushes, or touches issues."
stack-agnostic: true
---

# Report Project Status

## Purpose

Answer one question: where does this project stand, and what is the next
action? The output is a snapshot with evidence, not a plan and not a fix.

## Workflow

1. Read `AGENTS.md`. Resolve the base branch, the backlog index, the specs
   directory, the pipeline or workflow doc, and the gate commands.
2. Fix the observation point and record it: repo root, `git rev-parse --short
   HEAD`, current branch, date.
3. Delegate the git, worktree and PR block to `survey-inflight-work`. Do not
   re-enumerate branches or PRs here; consume its snapshot verbatim and cite it.
4. List open GitHub issues when `gh` is available:
   `gh issue list --state open --limit 50 --json number,title,labels,updatedAt,assignees,url`.
   Count them by label and name only the issues that change the next action.
   Do not reconcile issues against the backlog; report both as they are.
5. Read the backlog index and the specs index. Count items by state: ready to
   implement, in progress, blocked, unclassified. Name only the items that
   change the next action. When `pdlc plan` is available it is the authoritative
   order; cite its output instead of re-deriving one, and if the two disagree
   report the disagreement rather than choosing a side.
6. Read CI state with `gh run list --limit 5`. Record the workflow, conclusion
   and commit it belongs to. If it is unavailable, report `CI: unknown` and why.
7. Check documentation readiness: does `AGENTS.md` exist, does the architecture
   doc exist, is the pipeline doc current enough to name its gates. Report
   presence, not quality.
8. Compose the report. Choose at most three next steps, each tied to evidence
   from steps 3 to 7.
9. Stop. Do not open a plan, do not edit, do not suggest a branch operation
   that needs a separate decision.

## Output

```text
STATUS: <repo>@<short sha> on <branch> - <date>
GIT/PR: <survey-inflight-work summary, or verbatim pointer>

ISSUES
- open: <n> - by label: <label n, ...>
- relevant: #<n> <title> - <why it changes the next action>

BACKLOG
- ready: <n> - <ids worth naming>
- in progress: <n> - <ids>
- blocked: <n> - <id> - <blocker>

CI
- <workflow> - <conclusion> - <short sha>

DOCS
- AGENTS.md: present|missing
- architecture: present|missing
- pipeline gates: named|not named

NEXT STEPS
1. <action> - because <evidence>
2. <action> - because <evidence>
3. <action> - because <evidence>

NOT CHECKED
- <item and why>
```

Fewer than three next steps is a valid answer. A step without evidence is not.
A next step is project-level (pick up a spec, fix a red check, resolve a
blocker); the per-branch order belongs to `survey-inflight-work` and is not
restated here.

## Guardrails

- Read-only. Never edit, commit, merge, rebase, push, or delete. Never create,
  close, comment on, label or assign an issue.
- Never reimplement the git/PR enumeration. If `survey-inflight-work` degrades,
  the git/PR block degrades with it and the report says so.
- Never invent priority from size, age, or tone. A next step cites a spec, a
  failing check, an open issue, a blocker, or a documented goal.
- Cap the report at one page. If the backlog or the issue list is large, name
  the items that change the next action and report the rest as counts.

## Degradation and refusal

- Not a git repository: report docs only, and say git, PR, issues and CI state
  are unavailable.
- No backlog index: say `BACKLOG: unavailable` and name the path you looked for.
- `gh` missing or unauthenticated: `ISSUES: unknown` and `CI: unknown`, plus the
  exact command that failed. Do not infer either from local state.
- More than 50 open issues: report the cap and say newer issues were not read.
- No `AGENTS.md`: resolve what you can from the repository layout and state the
  assumption in the report.
