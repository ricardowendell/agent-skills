---
id: TASK-131
title: 'index: group skills by the question they answer, not only by stage'
status: Done
assignee: []
created_date: '2026-11-19T14:01:00Z'
labels:
  - harness
dependencies:
  - TASK-123
references:
  - skills.index.json
  - docs/specs/SPEC-0086-companion-skills-and-scopes.md
priority: low
ordinal: 131000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origin: docs/inbox/2026-11-19-skills-componiveis-com-evidencia.md (10:48). Current scopes are pipeline, verify, observe, maintain, record and data. The proposal is six groups by question answered: establish the environment, understand and decide, prepare and implement, verify, observe, maintain. capture-idea and record-decision stay available throughout; python-luminary and agentworks-harness supply domain judgment wherever relevant. Grouping is catalog organization, not a selection registry: the boundary TASK-117 set stays (no registry, no taxonomy of selection, per issue #9). Grouping does not mean merging instructions into a larger skill.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Either the current scopes are kept with the reason recorded, or the new groups replace them; the decision names what was traded away.
- [ ] #2 Every first-party skill appears exactly once and the stated count matches the array length.
- [ ] #3 The file stays data: no SKILL.md frontmatter edited, no skillHash moves.
- [ ] #4 The selection-registry boundary is stated in the file's `about`.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-19T16:20:10.091Z

---

Decided 2026-11-19 and landed in SPEC-0101 (15421a2): keep the stage scopes, do not regroup.

The deciding fact is structural, not aesthetic. The proposed six groups are establish the environment, understand and decide, prepare and implement, verify, observe, maintain, and capture-idea plus record-decision appear in none of them; the note places them "available throughout", which a closed index with an exactly-once invariant cannot encode. Adopting the groups would either orphan two skills or reintroduce the catch-all bucket SPEC-0086 deliberately avoided.

What was traded: the index keeps answering "where in the lifecycle", not "what can I ask for". README.md carries the workflow, so nothing described the usage view twice. about now says both things, including that this is catalog organization and not a selection registry (#9).

No member moved and no SKILL.md was edited, so check-staleness is unchanged at 85 cited / 55 stale / 3 uncited.

---
<!-- COMMENTS:END -->
