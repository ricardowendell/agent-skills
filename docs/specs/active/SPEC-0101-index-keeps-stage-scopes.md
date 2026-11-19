---
id: SPEC-0101
title: The index keeps stage scopes and names what it is not
status: in_progress
priority: low
task: TASK-131
created_at: 2026-11-19
updated_at: 2026-11-19
source_docs:
  - backlog/tasks/task-131 - index-group-skills-by-the-question-they-answer-not-only-by-stage.md
  - docs/inbox/2026-11-19-skills-componiveis-com-evidencia.md
  - docs/specs/SPEC-0086-companion-skills-and-scopes.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills.index.json
  - docs/specs/active/SPEC-0101-index-keeps-stage-scopes.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0101-index-keeps-stage-scopes.md
  - node scripts/check-staleness.mjs
---

# SPEC-0101: The index keeps stage scopes and names what it is not

## Purpose

`TASK-131` records a proposal to regroup the index by the question a skill
answers — establish the environment, understand and decide, prepare and
implement, verify, observe, maintain — instead of by stage in the pipeline. The
proposal is reasonable as a description of how work flows, and it is wrong as a
taxonomy for this file.

The invariant `TASK-117` set and `SPEC-0086` implemented is that every
first-party id appears **exactly once**. The proposed six groups have no home for
`capture-idea` and `record-decision`: the note says they "remain lightweight entry
points available throughout", which is a statement about usage, not a scope. So
adopting the groups as written either orphans two skills or reintroduces the
"available throughout" bucket that a closed index cannot express.

This spec decides the question the task left open — keep or regroup — and records
the trade, so the next reader does not reopen it without new evidence.

## User Outcome

Someone reading `skills.index.json` learns two things it did not say: that the
scopes answer "where in the lifecycle" rather than "what can I ask for", and that
the file is catalog organization, not a selection registry. The workflow question
is answered by `README.md`, which is where a reader should look for it.

## Scope

- **F0 — the boundary sentence.** `about` gains the distinction: scopes are
  catalog organization, not a selection registry (`#9` excludes building a
  template/stack catalogue), and the question-shaped view of the workflow lives in
  `README.md`.
- **F1 — the decision record.** This spec records why the six question-groups are
  not adopted: the exactly-once invariant against two homeless skills, and the
  absence of a runtime consumer. It names the trade: the index keeps answering a
  lifecycle question, not a usage question.
- **F2 — the unchanged invariants.** Count still 17, each id once, `data` still
  reserved and empty, `platform` unchanged.

**Blast radius.** One `about` string in one data file, plus this spec. No
`SKILL.md`, no `skillHash`, no measured cell, no scope renamed, no member moved.

## Non-Goals

- **No regrouping.** The scopes keep their names and members; `pipeline`,
  `verify`, `observe`, `maintain`, `record`, `data` and `platform` stay as they
  are.
- **No parallel vocabulary.** `README.md` already describes the workflow in
  stages; this spec does not add a second description of it.
- **No consumer.** Nothing in `scripts/` starts reading the index; the invariant
  stays checked by the commands in `tests:`.
- **No `docs/integrations/agentworks.md`**, no new scope, no second `platform`
  member.

## Flow

1. Read `about` and the seven scopes; confirm the two homeless ids under the
   proposed grouping (`capture-idea`, `record-decision`).
2. Add the boundary and trade sentence to `about`.
3. Verify the invariants: 17 ids, each once, count matching, validator clear,
   staleness unchanged.
4. Record the observed outputs in `Results`.

## Data

One string changes. The file keeps its shape and its members:

```
pipeline:7 verify:3 observe:2 maintain:3 platform:1 record:1 data:0
```

## Acceptance Criteria

1. `about` states that the scopes are catalog organization and not a selection
   registry, and that the workflow view lives in `README.md`; both statements are
   findable in the string, not implied.
2. The file still holds 17 ids, each exactly once, and the count in `about`
   matches the array length.
3. The decision is recorded with its reason: the six question-groups are not
   adopted because `capture-idea` and `record-decision` have no group under an
   exactly-once invariant, and because no runtime consumer reads the file.
4. No `SKILL.md` is modified and `node scripts/check-staleness.mjs` reports the
   same 85 cited / 55 stale / 3 uncited as the baseline.
5. `node scripts/validate-skills.mjs --root skills` prints `All clear` and
   `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0101-index-keeps-stage-scopes.md`
   reports no errors.

## Results

Implemented 2026-11-19 in direct mode: one data string, no reviewer gate.

The two homeless ids are the deciding fact, and they are checkable rather than
argued: the proposal's six groups are establish the environment, understand and
decide, prepare and implement, verify, observe, maintain — `capture-idea` and
`record-decision` appear in none of them, and the note itself places them
"available throughout", which the closed index cannot encode.

Observed after the edit: `17` ids, `17` unique, count in `about` matching,
`hasCatalog true` and `hasWorkflow true` for the two new statements,
`node scripts/validate-skills.mjs --root skills` printing `All clear`, and
`node scripts/check-staleness.mjs` still reporting `85 cited, 55 stale, 3
uncited` — so no measured cell moved.

## Open Questions

- **Would a consumer change the answer?** If a host ever routes by this file
  rather than by `SKILL.md` descriptions, a usage-shaped grouping becomes worth
  its churn. Today nothing reads it, which is exactly why the trade is cheap to
  keep and cheap to revisit.

## Prompt Notes

- Requirements: one boundary sentence in `about`; no member changes.
- Entities: scope, member, catalog organization, selection registry, workflow.
- Approach: edit the string, then verify by query.
- Structure: one file.
- Safeguards: do not rename scopes, do not add a second description of the
  workflow, do not touch `SKILL.md`.
- Tests: parse the JSON and assert the invariants; grep `about` for both
  statements; compare the staleness report to the baseline.
