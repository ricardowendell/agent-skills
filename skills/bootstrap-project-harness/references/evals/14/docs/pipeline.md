---
mode: direct            # direct | orchestrated
release_tier: B         # A | B
retry_budget: 1         # attempts before escalating to a human
---

# Pipeline

How this repo decides between direct and orchestrated work, and what each stage
must produce before the next one starts. This file is **policy**: it changes at a
human gate, never mid-task, and its git history is the changelog.

## Mode selection

- **direct** (default): one task, no real dependencies. Implement in place, in a
  single pass, with no ceremony.
- **orchestrated**: several tasks with real dependencies. Plan the order in
  waves, isolate each task in its own worktree, and merge only after that task
  passes its gate.

## Stages

| Stage       | Exit artifact                          | Gate                   | Evidence                     |
| ----------- | -------------------------------------- | ---------------------- | ---------------------------- |
| backlog     | item under `docs/backlog/`             | —                      | —                            |
| ready       | `docs/specs/SPEC-NNNN-*.md`, `status: ready` | human (groom)    | `spec_sha` recorded in the prompt |
| in_progress | implementation on a branch or worktree | —                      | —                            |
| verify      | diff reviewed against its spec         | reviewer (read-only)   | `APPROVE` verdict            |
| merged      | merge into the main branch             | human (merge sign-off) | merge commit                 |
| released    | tag                                    | release gate           | tag + changelog entry        |

## Evidence, not declarations

A stage advances when its exit artifact exists **and** the gate produced proof.
An agent reporting "done" is not proof, and neither is a checkbox. If a gate
cannot run, record it as a gap; a gap never counts as a pass.

## Retries

`retry_budget` is how many attempts a task gets before a human is involved.
When the budget is spent, stop and escalate with what was tried and what failed.
Repeating the same approach is not a second attempt.

## Release tiers

- **A** — distributed artifact: semver bump, CHANGELOG entry, and tag.
- **B** — internal: dry tag, no ceremony.

## Changing this file

Policy changes land as their own commit, after a human gate, with the reason in
the message. A retro that never touches this file is a retro that changed
nothing.
