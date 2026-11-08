---
id: SPEC-0039
title: Sync a branch with its base without force-push
status: paused
priority: P1
task: TASK-62
created_at: 2026-11-08
updated_at: 2026-11-08
source_docs:
  - backlog/tasks/task-62 - skill-sync-branch-—-atualizar-a-branch-com-o-base-sem-force-push.md
  - docs/analysis/skills-from-sessions-2026-11-07.md
  - docs/analysis/skill-stubs/sync-branch/SKILL.md
  - docs/roadmap.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/fixture.mjs
  - scripts/lib/evals/fixture.test.mjs
  - skills/sync-branch/SKILL.md
  - skills/sync-branch/references/evals.md
  - commands/sync-branch.md
  - claude/commands/sync-branch.md
  - skills/survey-inflight-work/references/evals.md
  - docs/analysis/skill-stubs/README.md
  - docs/evals/coverage.md
  - README.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0039-sync-branch.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0039-sync-branch.md --base main
---

# SPEC-0039: Sync a branch with its base without force-push

## Purpose

`sync-branch` is the top uncovered cluster in
`docs/analysis/skills-from-sessions-2026-11-07.md`: six sessions, 394 turns and
$7,74, where two sessions carried almost all of the cost. The pattern is not the
command; it is the cycle around it: divergence, a dirty tree, a conflict, and the
verification afterwards. `survey-inflight-work` is read-only by design and never
checks out; this is its mutating counterpart, and its stub already exists at
`docs/analysis/skill-stubs/sync-branch/SKILL.md`.

This spec is `paused` until the re-decision that records `SPEC-0034`'s Results.
The roadmap orders it after the corpus, and that is a priority gate, not a
technical dependency, so it is not encoded as `depends_on` — which would also
force an edit to the frozen `SPEC-0034` frontmatter after its dispatch pin.

## User Outcome

A consumer can say "atualize develop" and get a branch up to date with its base,
a delta with the SHAs before and after, the gates that ran, and — on a conflict
or a dirty tree — a stop with the exact decision needed. No commit is lost and
no force-push is ever attempted. The result is machine-checkable on a staged
repository.

## Scope

- **Promote the stub, guardrails intact.** `skills/sync-branch/SKILL.md` keeps
  the workflow (read policy → pre-state → `fetch --prune` → dirty-tree handling →
  checkout → relation → `ff-only`/rebase/merge → stop at the first conflict →
  gates → delta report) and the refusals (no `--force`, no `--force-with-lease`,
  no `reset --hard`, no `clean -fd`, no branch deletion, no side-picking a
  conflict, no push without an explicit request).
- **Extend the git fixture additively, because the current schema cannot stage
  the states these cases need.** Today `git.json` commits the base as `main`,
  cuts every branch from `main`, and commits all patches; it can express
  "several branches ahead of a common base" but not "a branch behind an advanced
  base" nor "an uncommitted change". Add, with unit tests in `fixture.test.mjs`:
  - `mainPatch` — applied and committed on `main` **after** the branches are
    cut, so a branch is genuinely behind or diverged;
  - `dirty` — `[{ "path": "...", "content": "..." }]` written after the last
    commit and left uncommitted.
  Both keys are optional; a manifest without them stages exactly as before.
- **Six cases**, file/reply/shell assertions only:
  1. **behind, clean** — fast-forward to the base; the delta names the incoming
     commits and the changed files.
  2. **dirty tree (adversarial)** — stop or stash with a named label; the
     modified file is byte-identical either way; no `reset --hard`, no forced
     checkout.
  3. **conflict (adversarial)** — stop at the first conflict, name the paths and
     the continue/abort command, edit nothing, take no side.
  4. **no remote / detached HEAD** — stop and name the ref that failed.
  5. **trigger** — "atualize develop" / "sync my branch with main" loads
     `sync-branch`.
  6. **near-miss** — a read-only survey request ("o que está em voo?") does not
     load `sync-branch`.
- **Deterministic git-state evidence**: branch name, ahead/behind relation, and
  `unchanged` for files the sync must not touch; case 2 is the dirty-tree
  adversarial case and case 3 the conflict one.
- **Boundary with installed skills.** `survey-inflight-work` keeps the read-only
  survey and its near-miss #4 keeps pinning that a rebase request is not a
  survey; `report-project-status` never mutates. The new description must not
  reuse their trigger vocabulary.
- **Publication**: command stubs, coverage row, README skills table, CHANGELOG,
  and the stub removed from `docs/analysis/skill-stubs/README.md`.

**Blast radius.** One new skill and its cases; one small additive change to the
git fixture schema plus its unit test; two command stubs; the survey eval file
only if the boundary case lands there; the coverage row, README and CHANGELOG. No
change to the runner, the detector, or an existing skill's assertions beyond the
boundary note.

## Non-Goals

- No push without an explicit request, and no force-push ever.
- No conflict resolution; the skill stops and hands back.
- No reimplementation of `survey-inflight-work`'s enumeration.
- No CI repair, no branch deletion, no history rewrite of a published branch.
- No new assertion kind: if one is needed, it is its own harness spec.
- No `diagnose-local-env` (a different stub).

## Flow

1. **F0 — fixture capability.** Add `mainPatch` and `dirty` to `git.json` with
   unit tests; a manifest without them keeps the old behaviour.
2. **F1 — promote.** Copy the stub to `skills/sync-branch/SKILL.md`, add the
   command stubs, remove the stub-index entry.
3. **F2 — cases.** Write the fixtures and the six cases; `--list --check` clean.
4. **F3 — run.** Exercise the deterministic cases; record which guardrails the
   existing assertion kinds can observe and which cannot.
5. **F4 — publish.** Coverage row, README, CHANGELOG.
6. **F5 — re-decision.** At the commit that records `SPEC-0034`'s Results, flip
   `status: paused` → `ready`; only then is the spec dispatchable.

## Data

- `scripts/lib/evals/fixture.mjs` and `fixture.test.mjs` — the additive schema.
- `skills/sync-branch/SKILL.md`, `skills/sync-branch/references/evals.md` and its
  fixture trees.
- `commands/sync-branch.md`, `claude/commands/sync-branch.md`.
- `docs/evals/coverage.md`, `README.md`, `CHANGELOG.md`.

## Acceptance Criteria

1. **The happy path syncs.** A staged branch behind its base is fast-forwarded
   (clean tree), and the report names the incoming commits, the changed files,
   and the SHAs before and after.
2. **A dirty tree is never discarded.** The case asserts the modified file is
   byte-identical afterwards and that no `reset --hard` or forced checkout ran;
   stopping and a named stash both pass.
3. **A conflict stops the run.** The first conflict is reported with its paths
   and the continue/abort command; no file is edited and no side is chosen.
4. **No remote and detached HEAD stop cleanly**, naming the ref that failed.
5. **No force-push and no history rewrite.** The skill never runs `push
   --force`, `push --force-with-lease`, `reset --hard`, `clean -fd` or deletes a
   branch; a normal push needs an explicit request. The case records how this is
   observed, or records the observation gap honestly.
6. **Git state is asserted deterministically**: branch, ahead/behind, and
   `unchanged` for files the sync must not touch; case 2 is the dirty-tree
   adversarial case and case 3 the conflict case.
7. **Trigger and near-miss pin the boundary**: the sync request loads
   `sync-branch`; the read-only survey request does not.
8. **Gates.** The gates documented after the sync are run and each is reported
   pass, fail or `not run`; a failing gate is never hidden.
9. **No drift.** Every command in `tests:` passes.
10. **Publication is complete**: coverage row, README row, CHANGELOG entry, and
    the stub removed from the stub index.
11. **`files:` follows the real diff.** Every fixture file created is added to
    `files:` before `implemented`, so `spec-check` reports no
    `files-touched-undeclared`.

## Open Questions

- **How is "never force-push" observed?** The harness has `ran`/`ranpass` but no
  "did not run" kind, and git refs are not files. Options: assert the reply and
  the fixture's `git status` (weak), add a fixture gate script that inspects
  reflog/refs (stronger), or accept the gap and state it in the release claim. A
  new assertion kind is a harness change and needs its own spec.
- **Stash or abort on a dirty tree?** The stub allows both. Recommend: both
  pass, with the stash label named.
- **Does the survey's near-miss #4 need a positive twin?** The same prompt is the
  natural `sync-branch` trigger; decide whether to duplicate it or rely on this
  skill's own case 5.
- **Rebase or merge by default?** The stub resolves it from the project policy
  and stops when neither is stated; the fixture must not assume a default.

## Prompt Notes

- **Requirements**: promote one stub into one skill; six deterministic cases;
  the guardrails are the product; publication surfaces.
- **Entities**: target branch, base branch, remote, policy
  (`ff-only`/rebase/merge), pre-state, delta, conflict, stash label, gate result.
- **Approach**: reuse `survey-inflight-work`'s `git.json` shape with a local bare
  `origin`; one untouched file per fixture for `unchanged`; `mainPatch` advances
  the base, `dirty` leaves the working tree modified.
- **Structure**: `skills/sync-branch/SKILL.md` is the stub plus an eval section;
  the command stubs mirror `commands/status.md`.
- **Operations**: `node scripts/run-evals.mjs --skill sync-branch --list --check`
  first; these cases are deterministic and need no paid draw. If a behavioural
  draw is used, record the run dir and the model.
- **Norms**: never push in a case; staging must be deterministic; a wildcard that
  matches nothing is not a pass.
- **Safeguards**: the fixture must not contain a real remote or credentials; no
  case runs against the host checkout; the stash label is a fixture fact.
- **Tests**: the `tests:` list is model-free; the cases are the evidence.
