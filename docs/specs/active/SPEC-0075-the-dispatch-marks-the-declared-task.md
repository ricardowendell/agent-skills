---
id: SPEC-0075
title: The dispatch says it cannot mark a task that it never looked for
status: ready
priority: P2
task: TASK-36
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-36 - harness-pdlc-não-marca-a-task-vinculada-no-dispatch-verify.md
  - docs/pipeline.md
related_decisions: []
depends_on: []
blocks: []
files:
  - CONTRIBUTING.md
  - docs/specs/active/SPEC-0075-the-dispatch-marks-the-declared-task.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0075-the-dispatch-marks-the-declared-task.md --base main
---

## Purpose

Every `pdlc dispatch`, `verify` and `merge` this session printed
`backlog: não foi possível marcar SPEC-00NN como "In Progress" — seguindo.`, and
the task was marked by hand each time.

The cause is not the Backlog CLI and not the PATH. It is the id:

`src/backlog.mjs`'s `taskIdFromSlug(slug)` derives an id from the spec's **slug**,
so `SPEC-0068-the-skill-that-never-loaded` yields `SPEC-0068`. `dispatch.mjs:239`
passes that id to `backlog task edit`, and no task `SPEC-0068` exists — the spec
declares `task: TASK-101`. The declared link is never read.

Verified from this repo: `backlog task edit TASK-108 --status "In Progress"` exits
0 and writes the file, and calling `setTaskStatus("TASK-108", …)` through the pdlc
module directly returns `true`. Only the slug-derived id fails.

## User Outcome

- The failure is documented where a contributor meets it, with the exact cause and
  the one-command workaround, so nobody re-diagnoses the CLI or the PATH.
- The upstream fix is named precisely enough to be made without rediscovery.

## Scope

### F1 — one paragraph in `CONTRIBUTING.md`

Where the pipeline's task marking is described, state:

- `pdlc` marks the task from the **slug** (`taskIdFromSlug`), not from the spec's
  `task:` frontmatter, so a spec whose task does not match its slug prints
  `não foi possível marcar SPEC-00NN … — seguindo.`;
- the run is not blocked, but the task stays where it was;
- the workaround is one command per stage:
  `backlog task edit <TASK-ID> --status "In Progress"` (then `In Review`, `Done`);
- the upstream fix is to prefer the spec's `task:` field over the slug id in
  `dispatch.mjs:239`, `verify.mjs:839` and `merge.mjs:689` before falling back to
  `taskIdFromSlug`.

### F2 — prove the diagnosis in the spec's Results

Record the three observations (CLI by hand: exit 0; `setTaskStatus` called
directly: `true`; the printed message names the slug id) so the upstream fix does
not start from the message alone.

## Non-Goals

- **No change to the pdlc project.** It is a separate repository, currently under
  active work; this spec records the cause and the workaround, and the upstream
  patch is its own change with its own review.
- **No change to this repo's pipeline.** `docs/pipeline.md` is policy and stays.
- **No new script.** The workaround is one CLI call, not a wrapper.
- **No paid draw.**

## Flow

1. **F1** — write the paragraph where a contributor edits the backlog during the
   pipeline.
2. **F2** — record the three observations.

## Data

- `CONTRIBUTING.md` — the pipeline/backlog section.
- pdlc: `src/backlog.mjs` (`taskIdFromSlug`, `setTaskStatus`),
  `src/commands/dispatch.mjs:239-241`, `verify.mjs:839`, `merge.mjs:689`.

## Acceptance Criteria

1. The paragraph names the slug-derived id as the cause, with `file:line` for the
   three call sites.
2. It gives the exact workaround command and says the run continues.
3. It states the upstream fix in one sentence without prescribing its design.
4. The spec's Results carries the three observations that separate "CLI missing"
   from "wrong id".
5. No pdlc file is edited; zero paid draws; every command in `tests:` exits 0.

## Decisions

- **Document, do not patch here.** The defect is in another repository that is
  being changed in parallel; a cross-repo edit from this pipeline would be an
  unreviewed side effect, and the workaround is one command.
- **Name the call sites.** "The harness is broken" is not actionable; three
  `file:line`s and one predicate are.

## Open Questions

None.

## Prompt Notes

- Do not re-diagnose from scratch: the three probes are in the Purpose. Re-run
  them only to confirm, and cite the output.
- Keep the paragraph short — this is a footnote to the pipeline, not a new
  section.

## Results

**F1.** One paragraph added to `CONTRIBUTING.md` under `## Editing the backlog`,
after the `--comment`/TASK-55 note, since that is where the pipeline's task
marking (`--status`) is described. It names the slug-derived id as the cause,
gives `dispatch.mjs:238-240`, `verify.mjs:837-839` and `merge.mjs:681` (the last
already preferring the declared task), states that the run continues, gives the
per-stage command, and states the upstream fix.

**F2.** Probes re-run on 2026-11-11 from this worktree; each write reverted with
`git checkout -- backlog/tasks/task-108…`, so `git status --short` is empty for
`backlog/` after the sequence.

1. The id is the slug. `taskIdFromSlug` imported from the installed pdlc module:

   ```text
   taskIdFromSlug(SPEC-0075-the-dispatch-marks-the-declared-task) = SPEC-0075
   taskIdFromSlug(SPEC-0068-the-skill-that-never-loaded) = SPEC-0068
   ```

   This spec declares `task: TASK-36`, so the message names `SPEC-0075`, not
   `TASK-36`. The three message sites in the installed pdlc are
   `dispatch.mjs:240`, `verify.mjs:839` and `merge.mjs:689` (the spec's
   `239/839/689` point at the same blocks; `dispatch`'s id line is 238).

2. The CLI is not missing — a declared id with a valid status succeeds:

   ```text
   $ backlog task edit TASK-108 --status "In Progress"
   Updated task TASK-108
   exit=0
   # status: To Do -> In Progress
   ```

3. `setTaskStatus` is not broken — called directly, it returns true:

   ```text
   $ node -e '…setTaskStatus("TASK-108", "In Progress")'
   setTaskStatus(TASK-108, In Progress) = true
   exit=0
   # status: To Do -> In Progress
   ```

4. The slug id is the one that fails — no task `SPEC-0075` exists:

   ```text
   $ backlog task edit SPEC-0075 --status "In Progress"
   Task SPEC-0075 not found. Task lookups read only the local working copy; use
   'backlog browser' to see tasks from other branches.
   No changes were applied.
   exit=1
   ```

5. Second cause found while probing, recorded in the paragraph: `verify` marks
   `In Review`, which this repo does not declare (`backlog/config.yml` has only
   `To Do`, `In Progress`, `Done`), so it fails even with the right id:

   ```text
   $ backlog task edit TASK-108 --status "In Review"
   Invalid status: In Review. Valid statuses are: To Do, In Progress, Done
   No changes were applied.
   exit=1
   ```

   F1 therefore gives `In Progress` at dispatch and `Done` at merge, and says
   why `In Review` is rejected instead of prescribing a command that exits 1.

**Scope.** No pdlc file edited (its source was read from the installed module),
no `docs/pipeline.md` or task edit committed, no wrapper script. Zero paid
draws.

**Gates.** All nine commands in `tests:` exited 0: `validate-skills` ("All
clear", 14 SKILL.md), `eval check` (101 cases: 98 runnable, 3 manual; "No
findings"), `evals/*.test.mjs` (565/565), `scripts/lib/*.test.mjs` (13/13),
`bootstrap-project-harness` (42/42), `check-sensor-parity` (2/2 fixtures),
`check-evidence` (6 documents, 0 errors, 0 warnings), `check-staleness` (exit 0;
its 55 stale cells and 3 uncited citations are pre-existing records, unchanged
here), and `spec-check --base main` (exit 0).

