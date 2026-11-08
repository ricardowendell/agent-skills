---
name: survey-inflight-work
description: "Survey the work in flight across local branches, worktrees and open GitHub pull requests, then report what overlaps, what is blocked and the order it can land in. Use when the user asks which branch or PR conflicts with their current work, what is blocking a merge, or how to sequence several branches or pull requests. Read-only: never rebases, merges or pushes; order is indeterminate unless a dependency is declared."
stack-agnostic: true
---

# Survey Work In Flight

## Purpose

Answer one question before the next action: what is in flight, what collides
with what, what is blocked, and in what order can it land?

The output is a snapshot with evidence, not an action. This skill observes; the
user or a later stage decides. A recommendation is only as good as the state it
was read from, so the observation point is recorded and every claim points at a
path, a ref, or a PR number.

## Workflow

1. Read `AGENTS.md`. Resolve the base branch, the remote, and any dependency
   declared between branches or specs (`depends-on`, stacked PRs).
2. Fix the observation point and record it: repo root, `git rev-parse --short
   HEAD`, the current worktree, and the date. A snapshot without a point in
   time cannot be compared with the next one.
3. Refresh remote-tracking refs with `git fetch --all --prune`. This is the only
   mutation allowed, and the output says it happened.
4. Resolve the remote: the current branch's upstream remote, else `origin`, else
   `upstream`, else the single configured remote. Resolve the base branch from
   `refs/remotes/<remote>/HEAD`, else `main`, else `master`. Say which pair you
   resolved; a wrong base silently corrupts every ahead/behind number.
5. Enumerate candidates:
   - **Local branches** with commits not in the base (`git for-each-ref
     refs/heads` plus `git rev-list --count <base>..<branch>`).
   - **Worktrees** from `git worktree list --porcelain`, including the current
     one and the ones a dispatch tool created.
   - **Open PRs**, capped at 30 by most recently updated: `gh pr list --json
     number,title,headRefName,headRefOid,baseRefName,isDraft,reviewDecision,
     mergeable,files,url`.
   - **Uncommitted work** per worktree: `git status --porcelain` and `git stash
     list`. Paths only — never read or diff the content.
6. Compute each candidate's changed paths against the merge base. A PR whose
   head is neither a local branch nor a remote-tracking branch has no ahead or
   behind count; take its paths from the PR `files` and mark the counts
   `unknown`.
7. Intersect paths pairwise and drop the ignore set. Report only pairs with at
   least one shared path.
8. Detect blockers from the enum below.
9. Order only where a dependency is observable. Otherwise say indeterminate and
   give the serialization constraint.
10. Report and stop.

## Conflict rules

- Paths, not line ranges. A shared path is an **overlap**, not a proven conflict:
  label it `region unknown` unless a merge already reports a conflict.
- Ignore by default: dependency lockfiles, generated output (`dist/`, `build/`,
  `coverage/`), minified assets, snapshots, i18n catalogs, changelogs. Fold in
  any extra patterns the project declares.
- A path touched only by uncommitted work, and by no branch, is not a conflict.
  It is local work in progress and belongs in `SNAPSHOT`, not `CONFLICTS`.
- Renames count as both paths. A branch that deletes a file another branch edits
  is an overlap worth naming.

## Blockers

Use these exact names; do not invent new ones.

| Blocker | Fires when |
| --- | --- |
| `base-moved` | The base advanced since the candidate last synced and the candidate overlaps another in-flight change |
| `dirty-worktree` | Uncommitted paths in a worktree overlap another candidate |
| `ci-red` | A required check on the PR is failing |
| `review-rejected` | The PR's review decision is changes requested |
| `dep-unmerged` | The PR targets another open PR's head (stacked and unlanded) |
| `overlap` | Shared paths with another candidate that has not landed |
| `stale-branch` | Behind the base, no overlap, no other blocker — informational |
| `state-unknown` | `gh` is missing, unauthenticated, or the remote is not GitHub |

## Ordering

An edge exists only when one candidate's PR `baseRefName` names another
candidate's head, or `AGENTS.md` or the spec declares `depends-on`. Everything
else is not a dependency.

- With edges: emit waves; a candidate never appears before a candidate it
  depends on.
- Without edges: `ORDER: indeterminate`. Emit `SERIALIZE` instead — land what is
  reviewed and green first, and never put two overlapping candidates in the same
  wave. That is a constraint, not a ranking.
- Never infer priority from size, age, author, or how urgent the branch feels.

## Output

```text
SNAPSHOT: <base>@<short sha> via <remote> — <date>
FETCH: ran | skipped (reason)

ITEMS
- <kind: branch|pr|wip|worktree> <name> — <ahead/behind or unknown> — <PR #state>

CONFLICTS
- <a> × <b> — shared: <paths> — region unknown

ORDER
- wave 1: <items>
- wave 2: <items>
or
ORDER: indeterminate
SERIALIZE: <constraint>

BLOCKERS
- <item> — <enum> — <evidence: path, check name, PR field>

NEXT ACTION
- <item> — <rebase|wait|land|ask review|drop> — <why>

NOT SCANNED
- <PR or branch and why it was skipped>
```

## Degradation and refusal

- Not a git repository: stop and say so. There is nothing to survey.
- No remote: produce the git-only snapshot, set `PR STATE: unknown`, and give no
  merge advice. A local repo cannot tell you about someone else's PR.
- `gh` missing or unauthenticated: same, plus a `state-unknown` blocker naming
  the exact command that failed.
- More than 30 open PRs: scan the 30 most recently updated and list the rest
  under `NOT SCANNED`. Silent truncation reads as "nothing else exists".
- Never estimate ahead/behind for a PR whose head cannot be resolved.

## Guardrails

- Read-only apart from `fetch`. Never rebase, merge, push, delete a branch,
  pop or apply a stash, check out another branch, or mutate a worktree.
- Prove it: `git status --porcelain` per worktree before and after, identical.
  `fetch` moves remote-tracking refs and `FETCH_HEAD`; that is the one exception
  and it is stated in the output.
- Never call a branch mergeable from git alone. Mergeability needs the PR state.
- If the user asks you to act on the snapshot, stop and hand off. Producing the
  order is this skill's job; executing it is not.
- Report what was not scanned, and why.

## Pipeline

Stage 0, outside the spec loop: before choosing what to work on, before
dispatching a worker, and before a merge fan-in. It decides **which** diff
`review-code` will judge. It does not replace `review-code` (one diff, verdict)
or `find-blind-spots` (a design, before implementation).
