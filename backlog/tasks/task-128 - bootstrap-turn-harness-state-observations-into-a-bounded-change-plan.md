---
id: TASK-128
title: 'bootstrap: turn harness-state observations into a bounded change plan'
status: To Do
assignee: []
created_date: '2026-11-19T14:01:00Z'
labels:
  - skills
dependencies:
  - TASK-124
  - TASK-125
references:
  - skills/bootstrap-project-harness/scripts/harness-state.mjs
  - docs/inbox/2026-11-19-experimentos-priorizados-survey-bootstrap-review.md
priority: medium
ordinal: 128000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origin: docs/inbox/2026-11-19-experimentos-priorizados-survey-bootstrap-review.md (10:54, experiment 2). harness-state already observes; the missing piece is turning observations into a plan whose operations are named before anything is written: preserve, add, merge, defer, verify. Start with one stack and a small configuration set; parse JSON natively and use a format-preserving edit where comments or ordering matter. Intervention and interview answers stay with the agent. Evaluate Cruft only for Cookiecutter lineage and updates, not as a generic merger for arbitrary repositories.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The plan names each operation as preserve, add, merge, defer or verify, per file.
- [ ] #2 Applying the plan twice produces no change on the second run.
- [ ] #3 Existing configuration is preserved; two tools claiming one slot are deferred, not resolved silently.
- [ ] #4 Fixtures cover an empty project, a partial harness, a complete harness and an existing project with competing tool choices.
- [ ] #5 Time until the project can run its first useful task is recorded, and document volume is not counted as success.
<!-- AC:END -->
