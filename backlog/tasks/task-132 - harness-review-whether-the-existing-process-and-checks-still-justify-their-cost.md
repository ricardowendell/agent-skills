---
id: TASK-132
title: >-
  harness: review whether the existing process and checks still justify their
  cost
status: To Do
assignee: []
created_date: '2026-11-19T14:01:00Z'
labels:
  - harness
dependencies:
  - TASK-127
  - TASK-128
  - TASK-130
references:
  - skills/tighten-harness/SKILL.md
  - docs/pipeline.md
priority: low
ordinal: 132000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origin: docs/inbox/2026-11-19-experimentos-para-resolver-incerteza.md (09:50). tighten-harness deliberately makes existing checks stricter; nothing owns the opposite question. This is a read-only spike, not a new mechanism: inventory the gates and required steps, and for each report what it costs (operator time, paid draws, maintenance), what it caught in the recent cycles, and a recommendation to keep, narrow or retire. Runs after the three experiments. Policy files are not edited by the spike; any change goes through human gate.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every gate and required step is listed with its cost and with evidence of what it caught.
- [ ] #2 Each item carries a keep, narrow or retire recommendation with the evidence behind it.
- [ ] #3 No policy file is edited by the spike; proposed changes are named as human gates.
- [ ] #4 The output is a results artefact, not a new always-loaded document.
<!-- AC:END -->
