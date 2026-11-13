---
name: sync-branch
description: "Bring a branch up to date with its base safely: fetch, check out, handle a dirty tree, fast-forward or rebase/merge per project policy, stop on the first conflict, run the documented gates, and report the delta. Use when the user asks to update develop, sync a branch, rebase, or pull in remote changes. Never force-pushes, never resets --hard, and never resolves a conflict by discarding one side."
stack-agnostic: true
---

# Sync A Branch

## Purpose

Move one branch to its base without losing work and without hiding a conflict.
The output is a delta with evidence: what came in, what broke, what needs a
human decision.

This is the mutating counterpart of `survey-inflight-work`, which is read-only
by design. Do not duplicate its survey: use it for the pre-state when the
project has several branches in flight.

## Inputs

- Target branch. Default: the branch the user named, else the base branch
  resolved from `AGENTS.md` or `refs/remotes/<remote>/HEAD`.
- Policy: `rebase` or `merge`. Read it from `AGENTS.md` or the pipeline doc.
  If the project states neither, stop and ask once.

## Workflow

1. Read `AGENTS.md`. Resolve the remote, the base branch, the sync policy, and
   the gate commands. Record the observation point: repo root, branch, short
   SHA, date.
2. Capture the pre-state: `git status --porcelain`, `git rev-parse --short
   HEAD`, `git stash list`. If worktrees exist and may matter, run
   `survey-inflight-work`.
3. `git fetch --all --prune`. This is the only network step. Report it.
4. Handle a dirty tree before checkout. Either stash with a named label
   (`git stash push -u -m "sync-branch <branch> <date>"`) or abort and hand
   back. Never carry uncommitted work across a checkout silently.
5. Check out the target branch. Record the SHA before the sync.
6. Compute the relation to the base: ahead, behind, diverged, or equal. If
   equal, report and stop.
7. Apply the policy:
   - behind and clean: `git merge --ff-only <base>`.
   - diverged with policy `rebase`: `git rebase <base>`.
   - diverged with policy `merge`: `git merge --no-ff <base>`.
8. On conflict, stop at the first one. List the conflicted paths, the commits
   on each side, and the command that would continue or abort. Do not choose a
   side, do not edit a file, do not `--continue`.
9. Run the documented gates on the result. Record each command and its exit
   status. A gate that cannot run is `not run`, never a pass.
10. Report the delta and restore the stash only if the sync succeeded and the
    restore is clean. If it is not, leave the stash and say its label.

## Output

```text
SYNC: <branch> - <remote>/<base> - <date>
POLICY: ff-only | rebase | merge

BEFORE: <branch>@<short sha> behind <n> ahead <n>
AFTER:  <branch>@<short sha> behind <n> ahead <n>

INCOMING
- <sha> <subject>

CHANGED
- <path> - <added|modified|deleted|renamed>

GATES
- <command> - pass | fail | not run - <reason>

STASH: none | restored <label> | left <label>

DECISION NEEDED
- <conflict or failing gate> - <continue|abort|resolve manually> - <why>
```

## Guardrails

- Never `push --force`, `push --force-with-lease`, `reset --hard`, `clean -fd`,
  or delete a branch.
- Never resolve a conflict by taking one side wholesale. If the intent is not
  obvious from the spec, stop.
- Never push without an explicit request. When asked, a normal push is allowed;
  a force push is not.
- Never hide a failing gate. The sync either passes the documented gates or
  reports exactly which one failed.
- Leave the repository in a resumable state. On abort, run the matching
  `--abort` and confirm `git status` is as clean as the pre-state.

## Degradation and refusal

- Detached HEAD, or target branch does not exist: stop and say which ref failed.
- No remote: stop. There is nothing to sync.
- Dirty tree that cannot be stashed safely: stop and list the paths.
- Diverged with no policy and no user answer: stop after the fetch, report the
  relation, and ask once.
