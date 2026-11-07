---
name: pdlc-orca
description: Run a pdlc cycle inside Orca — dispatch the worktree, prove Orca sees it, deliver the pinned prompt to an agent in an Orca terminal, then review, verify and merge from the main checkout. Use this whenever the user wants to run, supervise or review a pdlc task from Orca, open a pdlc worktree as an Orca workspace, wire PDLC and Orca together, or asks why an agent is working in `main` instead of the worktree.
stack-agnostic: false
compatibility: "pdlc >= 1.2 (bin `pdlc`; worktree under the repo's trees_dir, branch pdlc/<slug>); Orca CLI with `worktree current` and `worktree set --worktree path:`; OpenCode for the worker run."
---

# Run a pdlc cycle inside Orca

## Purpose

Orca is where agents work and are watched. pdlc decides what may run, be approved and land. This skill wires the two without moving authority: pdlc still creates the worktree, binds the review to `HEAD` + `spec_sha`, runs the gates and merges; Orca opens the workspace, hosts the terminal and the agent session.

Keep that boundary. Orca already ships orchestration tasks, dispatch and gates (`orca orchestration task-create|dispatch|gate-create|run`). Using them for the same work creates a second DAG and a second owner of state — the failure mode pdlc exists to prevent (`docs/product.md`, ADR-0021).

## Prerequisites, once per repo

```bash
orca repo add --path "$PWD" --json
orca repo set --repo "path:$PWD" --external-worktree-visibility show --json
pdlc doctor && pdlc preflight      # or: node src/harness.mjs doctor && node src/harness.mjs preflight
```

The `show` is not optional. With the default `hide`, `orca worktree current` does **not** fail — it resolves the enclosing main worktree. An agent launched on that answer works in `main`, commits to it, and the pdlc state still looks plausible until the diff is read. The pilot measured exactly this (see `references/pilot-2026-11-07.md`).

Orca only resolves worktrees **under the registered repo root**. pdlc's default `trees_dir` (`.lane/trees`) qualifies; if the repo configures a `trees_dir` outside the repo, Orca will not see it and the guard will fail there.

## Guard: never skip it

After `pdlc dispatch <slug>`, from inside the new worktree:

```bash
cd .lane/trees/<slug>
node "$HOME/.agents/skills/pdlc-orca/scripts/orca-guard.mjs" <slug>
```

The guard fails closed with the fix when Orca resolves another path or another branch. On success it prints JSON with the worktree id, the identity key (`wt2:local:…`), the branch and the path. Keep the identity key in your own run report — it is the workspace reference that ties this session to the run.

Why a script and not a command in this file: the check must be identical every time, and the error message must name the `show` setting. A silent mismatch is the whole risk.

## The cycle

1. `pdlc plan --compact` — pick a spec whose dependencies are satisfied (`waiting` empty, when the plan exposes it).
2. `pdlc dispatch <slug>` — pdlc creates `.lane/trees/<slug>`, branch `pdlc/<slug>`, opens the run.
3. `cd .lane/trees/<slug>` and run the guard.
4. Optional naming so the Orca UI reads like the work: `orca worktree set --worktree "path:$PWD" --display-name "<slug>"`.
5. Launch the agent with the pinned prompt. Either an Orca terminal for a human-supervised run:

   ```bash
   orca terminal create --worktree "path:$PWD" --title "<slug>" \
     --command 'opencode --agent worker' --json
   ```

   or a scripted run whose transcript you keep:

   ```bash
   opencode run --agent worker --auto --format json \
     "$(pdlc prompt <slug>)" > "/tmp/pdlc-worker-<slug>.json"
   ```

   Do **not** pass `--worktree` to `opencode run`: it creates a second worktree and collides with the one pdlc owns.
6. Read the worker report. Check that the changed files are inside `**Arquivos permitidos:**`; a worker that reports success with an out-of-scope file is a stop, not an approve.
7. Review with an **independent** agent — not the worker, not the same session — then record it from the **main checkout**:

   ```bash
   pdlc review <slug> < verdict.json
   ```

   Orca's visual diff is a convenience. It never replaces the verdict, and it never replaces `pdlc verify`.
8. `pdlc verify <slug>` — runs the repo gates in the worktree. Risk `high` needs a human `risk_ack` in the review payload.
9. Close the terminals you opened for this worktree before merging:

   ```bash
   orca terminal close --worktree "path:<worktree>" --all
   ```

   `pdlc merge` prunes the worktree and Orca drops the workspace on its own, but relying on that side effect is how a background agent loses its cwd mid-run.
10. `pdlc merge` from the main checkout, then `pdlc audit` if the run record is needed. The merge is the human gate; the record is the evidence.

## Keeping the run honest

- **pdlc owns identity.** Never create the worktree with `orca worktree create`, and never run `orca worktree rm` on a pdlc worktree — it removes from Orca *and* git.
- **One spec per worker.** Scope is the spec's allowlist. If the agent needs a file outside it, stop: the spec is wrong, and the correction goes through the main branch and a new review — not through a wider allowlist.
- **Workspace and session stay out of the record** until `pdlc-107` lands (`models` is the field the record gains). Keep the workspace identity, the terminal handle and the OpenCode session id in your own report.
- **A failed agent run is not a new run.** On `provider.go-limit` or a kill, `runs.json` keeps the same `run_id` and `attempts`; resume with `opencode run --session <id> --model <other> --agent worker`. Starting a new session would look like a second execution that never happened.

## Failure modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| Agent works in `main` / commits outside the worktree | `external-worktree-visibility` is `hide`; `current` returned the parent | `orca repo set --repo "path:<repo>" --external-worktree-visibility show`, then rerun the guard |
| `orca worktree current` returns a path that does not exist | the worktree was pruned by a merge | the run is over; `pdlc audit` if the record is missing |
| `opencode run` starts a new worktree | `--worktree` was passed to OpenCode | drop the flag; pdlc already created the workspace |
| Worker changed a file outside the allowlist | spec or worker scope drift | stop, fix the spec on `main`, re-dispatch; never widen the list to make it pass |
| `verify` refuses with "mudou fora do escopo" (after pdlc-106) | the diff contains a file the spec does not declare | same as above: the list is the authority |
| `provider.go-limit` mid-run | model quota | resume the same session with another `--model`; do not re-dispatch |

## Non-goals

- A second DAG: do not mirror specs into `orca orchestration` tasks, gates or dispatch.
- Replacing `pdlc verify`/`merge` with Orca actions, however green the UI looks.
- Recording `workspace`/`session` in the run record (deferred; see `pdlc-107`).
- Running several workers on one spec. Parallelism belongs to pdlc's DAG: one spec per worker, colliding files serialized.

## Reference

`references/pilot-2026-11-07.md` — the measured behaviour this skill is built on: the `hide` trap, the JSON fields Orca returns, what the merge does to the workspace, and the Forge import result.
