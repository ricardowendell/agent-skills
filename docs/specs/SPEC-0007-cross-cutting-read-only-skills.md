---
id: SPEC-0007
title: Read-only answers that span several specs
status: implemented
priority: P1
created_at: 2026-11-04
updated_at: 2026-11-05
source_docs:
  - README.md
  - skills/survey-inflight-work/SKILL.md
  - skills/survey-inflight-work/references/evals.md
  - skills/audit-code-quality/SKILL.md
  - skills/audit-code-quality/references/evals.md
  - docs/evals/coverage.md
  - scripts/lib/evals/fixture.mjs
related_decisions: []
depends_on: []
blocks: []
tests:
  - skills/survey-inflight-work/references/evals.md
  - skills/audit-code-quality/references/evals.md
  - scripts/lib/evals/fixture.test.mjs
  - docs/evals/coverage.md
---

# SPEC-0007: Read-only answers that span several specs

## Purpose

Every stage of the loop answers a question about one artefact: one spec, one
prompt, one diff, one doc set. Two questions are not about one artefact, so the
loop gives them no owner:

- **What is in flight, and in what order can it land?** Asked before choosing
  what to work on and before a merge fan-in; a `git log` answer has no
  observation point and no proof it changed nothing.
- **Where will this code hurt in six months?** Asked at a milestone or before
  planning a refactor; a one-file read answers a different question.

Without a procedure, both are answered ad hoc, and neither can refuse. The two
skills here give each question a fixed shape, an observation point, and a
read-only proof.

## User Outcome

A reader can ask either question and get one answer they can check later: a
snapshot with a base, a sha and a path or PR for every claim, or a ranked
register with a `file:line` and a `rule`/`judgement` label for every finding —
and no file is written.

## Scope

- **`survey-inflight-work`**: fix and record the observation point; `fetch` as
  the only mutation; enumerate local branches, worktrees, open PRs (capped at
  30) and uncommitted work; intersect paths; the blocker enum; order only where
  a dependency is observable; degrade without a remote or `gh`; guardrails.
- **`audit-code-quality`**: fix scope and baseline; run the declared gates and
  keep the number; the seven dimensions with evidence; `rule`/`judgement`
  authority; a register capped at ten findings; capture options; refuse a
  score; guardrails.
- **Commands**: `/inflight` and `/quality-check` in `commands/` and
  `claude/commands/`; the README skill rows and the "outside the loop"
  paragraph.
- **Harness**: optional `remote` and `branches` keys in the `git.json` staging,
  one unit test, and the two rows plus totals in `docs/evals/coverage.md`.

**Blast radius.** Two new skills, four command stubs, README, the coverage
table, and `scripts/lib/evals/fixture.mjs` staging. No existing skill text,
description or case changes; no change to the runner's verdict logic, to CI, or
to any threshold. A manifest without `remote`/`branches` stages exactly as
before.

## Non-Goals

- **No new loop stage.** Both skills run outside capture → audit, as README says.
- **No action.** `survey-inflight-work` never rebases, merges, pushes, deletes a
  branch, pops a stash or checks out another branch. `audit-code-quality` never
  refactors and never writes to the backlog.
- **No score or grade.** `audit-code-quality` refuses one and offers the
  register instead; a verdict belongs to `review-code` and only for a diff.
- **No PR coverage beyond `gh pr list`.** A local bare `origin` deliberately
  yields `PR STATE: unknown`; the eval corpus does not pretend otherwise.
- **No vendor-skill guard.** `skills/skill-creator/` is a vendor skill
  (`anthropics/skills`). Its ignore line is correct, but extending the CI guard
  to it is a separate change (TASK-23), not part of this contract.
- **No change to existing skills, cases, or the published matrix.**

## Flow

1. The user calls `/inflight` or `/quality-check`, or asks the question in
   domain terms; the command stub names the skill.
2. The skill reads `AGENTS.md`, then resolves what it needs: base branch and
   remote, or scope and baseline.
3. It observes and records the observation point (`<base>@<short sha>` or
   `SCOPE: <path> @ <short sha>`), then measures.
4. It emits the fixed output block, lists what it did not scan or measure, and
   stops. Acting on the answer is a later stage's job.
5. Read-only proof: `git status --porcelain` identical before and after. In the
   survey, `fetch` is the one stated exception because it moves
   remote-tracking refs.

## Data

No persistence. Fixtures live under `skills/<id>/references/evals/<n>/`; a case
that needs history ships `git.json`, now with optional `remote` (a bare repo
beside the scratch dir, added as `origin` and pushed to) and `branches` (each
cut from `main`, the last left checked out). Run artefacts stay under
`~/.local/share/opencode/evals/runs/<timestamp>--<label>/`.

## UI Notes

No UI. The output block is the interface and is specified in each `SKILL.md`.
New user-visible copy is limited to the two command `description` lines and the
two README rows; this repo has no voice doc, so it is flagged
`(copy: pending voice review)`. Empty, loading and error states do not apply;
the degradation states that do (no remote, no `gh`, no coverage command) are
behaviour, covered by AC-5.

## Acceptance Criteria

- **AC-1** — Both skills exist with valid frontmatter and a `description` under
  the 500-character budget; `node scripts/validate-skills.mjs --root skills`
  exits 0. Verified by the command and by reading the two frontmatter blocks.
- **AC-2** — Each skill ships four cases in `references/evals.md`: two behaviour
  cases and two trigger cases (`skill`/`notskill`), and
  `node scripts/run-evals.mjs --root skills --list --check` exits 0 with 74
  parsed cases (69 runnable, 5 manual). Verified by the command and by counting
  the case blocks.
- **AC-3** — The survey fixtures stage the states its cases name: case 1 via
  `git.json` with `remote: true` and two named `branches`; case 2 via `git.json`
  with no remote. Verified by reading both manifests.
- **AC-4** — Staging supports `remote` and `branches` without dirtying the tree:
  `node --test scripts/lib/evals/*.test.mjs` passes, including the case that
  asserts the last branch is checked out, both `origin/*` refs exist, each
  branch carries its own file content, and `git status --porcelain` is empty. A
  manifest without the new keys stages as before, verified by reading
  `stageFixture` and by the unit suite staying green.
- **AC-5** — Degradation is asserted, not promised: survey case 2 asserts the
  reply names the absence of a remote and still reports the branch; audit case 1
  asserts coverage `unknown` when no coverage command exists.
- **AC-6** — Read-only is asserted: every behaviour case carries at least one
  `unchanged` assertion on a fixture file, and the audit cases add
  `nofile docs/backlog/*`; no behaviour case asserts a write.
- **AC-7** — Commands and README are registered, in the repo and on the machine:
  `commands/inflight.md`, `commands/quality-check.md`,
  `claude/commands/inflight.md` and `claude/commands/quality-check.md` exist
  with identical bodies (Claude omits `$ARGUMENTS` and the OpenCode-only
  frontmatter); the README table lists both skills and the "outside the loop"
  paragraph names both commands; and both stubs are present in
  `~/.config/opencode/commands/` and `~/.claude/commands/`. The repo copies and
  the README are CI-verifiable; the installed copies are environment state, so a
  review checks them on the machine it runs on instead of assuming them.
- **AC-8** — Every cell in `docs/evals/coverage.md` names a run directory for
  **each** case it counts, pass or fail: the with-skill runs and every control
  draw, including the one that passed. A control failure names the assertion that
  separated, and it is a wrong-outcome failure, not a harness error. Verified by
  opening each named run directory and its `result.json`.
- **AC-9** — The coverage totals match the inventory: `Cases` 74, `Trigger` 26,
  `Manual` 5, with 4/2/0 for each new skill. Verified by `--list` and the
  fixture directories.

## Open Questions

**Blocking — none.** The back-fill was accepted on 2026-11-05: the code
predates the spec, and the spec is the contract from here. A review of this
change judges a retro-contract and must label the verdict accordingly.

**Recorded, not blocking.**

- **One spec for two skills.** Kept together because the user outcome is one
  ("read-only answers that span several specs") and the harness change serves
  both; the precedent is SPEC-0004, which covered three skills' cases in one
  spec.
- **Discrimination is narrow.** In the control arm the only failing assertions
  are the degradation ones: survey case 1 passes 5/6, survey case 2 passes 2/3,
  audit case 1 passes 6/7. Audit case 4 is weaker still: its control passed one
  draw and failed the other. The cases prove the `unknown` honesty, not that
  branch enumeration or the register require the skill. That belongs in `why:`
  and in the coverage cell, so the counts are not read as broad separation.
- **Vendor guard is separate.** `skills/skill-creator/` is a vendor skill, so
  the ignore line is correct; the CI guard that should also name it is TASK-23.
  This spec does not touch `.github/workflows/skills.yml`.

## Prompt Notes

- **Requirements**: two skills with fixed output blocks; four command stubs;
  two README rows; `remote`/`branches` staging; one unit test; coverage rows
  and totals.
- **Entities**: skill, case, fixture tree, `git.json` manifest, run directory,
  observation point, blocker enum, finding, capture option.
- **Approach**: a procedure that ends in a fixed block, plus the minimum
  staging needed for two branches and a remote.
- **Structure**: `skills/<id>/SKILL.md`, `skills/<id>/references/evals.md`,
  `skills/<id>/references/evals/<n>/`; `commands/` and `claude/commands/`;
  `scripts/lib/evals/fixture.mjs`; `docs/evals/coverage.md`.
- **Operations**: stage fixtures, write cases, run the four documented gates,
  record run directories, copy the stubs.
- **Norms**: descriptions under 500 characters and trigger-shaped; cases small
  and self-contained; `why:` is never sent; evidence cites a run directory; no
  assertion without a possible failure.
- **Safeguards**: read-only; no secrets; no network writes beyond `fetch`; no
  invented metric; no score; never weaken a case to make it pass; a control
  failure must be an outcome failure.
- **Tests**: `validate-skills`, `run-evals --list --check`,
  `node --test scripts/lib/evals/*.test.mjs`, `check-sensor-parity`, plus the
  with-skill and control runs that back the coverage cells.

## Notes

This repo has no `docs/product`, `docs/principles`, `docs/experience` or ADR
tree, so the design-principles, UI-state, voice and security-boundary checks had
nothing to read. The gap is recorded rather than filled, as SPEC-0004 did. The
change arrived as untracked work with no backlog item; this spec back-fills the
contract so `review-code` has something to judge.

AC-7 and AC-8 were resolved during grooming from evidence already on disk, not
from new runs. The coverage cells now name every case: survey with-skill
`2026-11-04T21-49-16`, control case 1 `…21-45-26`, case 2 `…21-57-53`; audit
with-skill `2026-11-04T21-55-53`, control case 1 `…21-47-51`, case 4
`…21-57-53` (pass) and `…21-59-17` (fail). The audit `0/2` claim was wrong and
was replaced by the two draws it actually had; the stubs were installed in both
command directories on 2026-11-04.

Context for the measurement debt these two skills inherit: an external
direction proposal (2026-11-04, examined at `3784ae7`) argues that evidence
validity, not case count, is the library's main debt. It is not normative and is
not copied into this repo.

Review on 2026-11-05: APPROVE, retro-contract. One blocking finding was fixed
before approval: `stageFixture` had stopped applying a `patch` on `main` when no
`branch` was named; `scripts/lib/evals/fixture.mjs:164-169` restores the old
path and `scripts/lib/evals/fixture.test.mjs:109` pins it. The out-of-scope
`docs/README.md` direction note and the first-baseline bullet left this change.
Gates: `validate-skills`; `run-evals --list --check` (74 parsed, 69 runnable, 5
manual); `node --test scripts/lib/evals/*.test.mjs` (125/125); the bootstrap
suite (17/17); `check-sensor-parity` (2/2). Commits: `c6ca22b` (SPEC-0007) and
`f90f374` (TASK-23).
