---
id: SPEC-0040
title: A stakeholder recap mode for report-project-status
status: paused
priority: P2
task: TASK-63
created_at: 2026-11-08
updated_at: 2026-11-08
source_docs:
  - backlog/tasks/task-63 - report-project-status-modo-recap-para-stakeholder-nao-e-skill-nova.md
  - docs/analysis/skills-from-sessions-2026-11-07.md
  - skills/report-project-status/SKILL.md
  - docs/roadmap.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills/report-project-status/SKILL.md
  - skills/report-project-status/references/evals.md
  - commands/status.md
  - claude/commands/status.md
  - docs/evals/coverage.md
  - README.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0040-report-project-status-recap.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0040-report-project-status-recap.md --base main
---

# SPEC-0040: A stakeholder recap mode for report-project-status

## Purpose

`report-project-status` shipped on 2026-11-08 and already serves the measured
cluster (15 sessions, $20,26 in
`docs/analysis/skills-from-sessions-2026-11-07.md`). The incremental gap is the
**audience**, not the data: an operator wants current state and the next action,
while a stakeholder wants what changed, what was tested, what is still pending,
and what to expect next — in language that does not require the repo open.

A second skill in the same trigger space would recreate the collision that was
just removed between `survey-inflight-work` and `report-project-status`. So this
is an output **mode** of the existing skill, not a new skill.

**Why paused.** Two independent reasons, and both lift at the same point. The
roadmap re-decides every non-P0 priority in the commit that records `SPEC-0034`'s
Results, so no spec becomes `ready` before it. And this spec shares
`docs/evals/coverage.md` with `SPEC-0034`, which `pdlc groom` rejects without an
explicit dependency; the corpus must land first. The spec flips to `ready` at
that re-decision, not before.

## User Outcome

A consumer can ask for "um resumo para o stakeholder" and get a one-page recap
that answers four questions with cited evidence. Nothing is recomputed: a number
that was already published is quoted with its source, a 0/5 stays 0/5, and a
claim without evidence becomes an explicit limit instead of prose.

## Scope

- **Add a `recap` mode to `report-project-status`.** The default operator report
  is unchanged. The mode is selected by audience or wording ("recap",
  "stakeholder", "diretoria", "resumo executivo"), and the command stub documents
  it as `$ARGUMENTS`; it does not create a second trigger space.
- **A small fixed block**, so the output is checkable:
  - `WHAT CHANGED` — commits, merged specs, released versions, each with its
    source (commit, run dir, CHANGELOG entry).
  - `WHAT WAS TESTED` — measured results only, with n/N as published and a
    pointer to the run dir; a cell with no evidence is omitted, not softened.
  - `PENDING` — open blockers and the spec/task that owns each.
  - `NEXT STEP` — at most one, tied to evidence.
  - `NOT MEASURED` — what could not be supported, named explicitly.
- **Evidence rules.** Sources are `.pdlc/runs.json`, the run directories under
  `~/.local/share/opencode/evals/runs/`, `CHANGELOG.md`, and the specs. "Forge"
  is not a source: it appears only as a hypothesis in an inbox note and does not
  exist in this repo. The recap never recomputes a published number; if it
  summarizes, it points to the source. It never turns "0/5" into "had
  difficulty" or any other unmeasured claim.
- **Cases**:
  - trigger — stakeholder wording loads `report-project-status`, not a new skill;
  - near-miss — an operator status request, and a review verdict, still route
    where they route today (`report-project-status` and `review-code`);
  - behavioural — a recap that cites its sources and leaves an unsupported cell
    as `NOT MEASURED`.
- **README**: the skills table has been missing the `report-project-status` row
  since 2026-11-08; add it and name the recap mode.
- **Publication**: coverage row and CHANGELOG entry.

**Blast radius.** One skill's text and one new eval case set; both command stubs;
the coverage row, README and CHANGELOG. Still read-only. No change to
`survey-inflight-work`, the runner, the detector, or any existing assertion.

## Non-Goals

- No new skill and no new trigger space.
- No dashboard, no score, no metric that is not already published.
- No edits, commits, merges, pushes, or issue actions: the skill stays read-only.
- No recomputation of a published number, even to "fix" it; name the correction
  and keep the old value as history.
- No `delivery-recap` skill (the same trigger-space collision).

## Flow

1. **F0 — mode.** Add the recap block and the evidence rules to
   `skills/report-project-status/SKILL.md`; keep the operator output first.
2. **F1 — command.** Document the mode in `commands/status.md` and
   `claude/commands/status.md` without adding a second command.
3. **F2 — cases.** Add the trigger, near-miss and behavioural cases;
   `--list --check` clean.
4. **F3 — run.** Exercise the deterministic cases; record the run dirs for any
   behavioural draw.
5. **F4 — publish.** Coverage row, README row (including the missing
   `report-project-status` entry), CHANGELOG.
6. **F5 — re-decision.** At the commit that records `SPEC-0034`'s Results, flip
   `status: paused` → `ready`; only then is the spec dispatchable.

## Data

- `skills/report-project-status/SKILL.md` and `references/evals.md`.
- `commands/status.md`, `claude/commands/status.md`.
- `docs/evals/coverage.md`, `README.md`, `CHANGELOG.md`.

## Acceptance Criteria

1. **The recap answers the four questions**: what changed, what was tested, what
   is pending, and the next useful step.
2. **Every claim cites evidence** — a run directory, a commit, or a CHANGELOG
   entry — and a summary points to its source; no published number is
   recomputed.
3. **Measured and unmeasured are distinguished**: a 0/5 is reported as 0/5, and
   an unsupported cell is `NOT MEASURED`, never narrative.
4. **No new skill or trigger space**: the recap is a mode of
   `report-project-status`, and the default operator report is unchanged.
5. **No evidence means a declared limit**, not a filled-in narrative.
6. **The route is pinned**: stakeholder wording loads `report-project-status`;
   an operator status request and a review verdict still route as they do today.
7. **Publication is complete**: coverage row, README row (including the
   `report-project-status` entry it has been missing), and CHANGELOG entry.
8. **No drift.** Every command in `tests:` passes.

## Open Questions

- **How is the mode selected?** By wording alone, by an explicit `recap`
  argument in the command stub, or both. Recommend both, with one trigger space
  and the operator output as the default.
- **Is the behavioural case deterministic or `manual`?** The existing status case
  #3 is `manual` because it needs a repo without `gh`. A small plain-tree
  fixture with a `CHANGELOG.md` and a fake coverage row could let `reply` /
  `filematch` assert the citations without a model; otherwise record it as
  `manual` and do not claim separation.
- **Is the fixed block necessary?** It makes the mode checkable, but it is also
  more structure than a stakeholder may want. Keep it minimal; if it grows, cut
  it back rather than adding fields.
- **README drift**: the `report-project-status` row is missing from the skills
  table. If adding it is considered a separate docs fix, split it out instead of
  folding it into this spec.

## Prompt Notes

- **Requirements**: one mode on one existing skill; four questions; cited
  evidence; measured vs unmeasured; no new trigger space.
- **Entities**: operator vs stakeholder, run dir, commit, CHANGELOG entry,
  published number, limit.
- **Approach**: add the mode to the existing workflow after the operator report;
  reuse the same observation point and the same delegated git/PR block.
- **Structure**: a short fixed block, documented in the skill and the command
  stub; no new command file.
- **Operations**: `node scripts/run-evals.mjs --skill report-project-status
  --list --check` first; trigger cases need no fixture; a behavioural case may
  need a plain tree with a CHANGELOG and a coverage row.
- **Norms**: never recompute a published number; cite or omit; 0/5 stays 0/5;
  the skill is read-only.
- **Safeguards**: do not invent a stakeholder's priorities; do not present an
  unmeasured claim as a measured one; do not create a second trigger space.
- **Tests**: the `tests:` list is model-free; a manual case is design intent, not
  evidence.
