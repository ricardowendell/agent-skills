---
id: TASK-133
title: 'bootstrap: the loaded docs carry only what was decided'
status: To Do
assignee: []
created_date: '2026-11-19T18:18:00Z'
labels:
  - skills
dependencies:
  - TASK-125
references:
  - skills/bootstrap-project-harness/templates/architecture.md.template
  - skills/bootstrap-project-harness/templates/.opencode/opencode.json
  - docs/inbox/2026-11-19-bootstrap-aprender-antes-de-decidir.md
priority: high
ordinal: 133000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Split from TASK-125 (2026-11-19): the task mixed two feature areas, so the loaded-instruction boundary gets its own slice. docs/architecture.md and docs/principles/design.md are loaded as instructions by the generated .opencode/opencode.json, yet the architecture template declares its rules normative for everything and repeats numeric thresholds that the tool configuration already owns. Restructure into accepted constraints versus recommendations, move thresholds to tool configuration, and state that a provisional statement does not enter a loaded document. Depends on TASK-125 for the certainty vocabulary.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 architecture.md separates accepted constraints (binding) from recommendations (not binding), with no numeric threshold in prose.
- [ ] #2 The generated opencode.json loads only documents whose every section is labelled confirmed or accepted.
- [ ] #3 AGENTS.md states the rule that a provisional statement stays out of a loaded document.
- [ ] #4 Screening on the cells that assert the threshold location is recorded as screening, not a separation claim.
- [ ] #5 No script, sensor, or parity fixture changes.
<!-- AC:END -->
