---
id: TASK-125
title: >-
  bootstrap: templates carry structured certainty, and the glossary stops
  demanding code entities
status: To Do
assignee: []
created_date: '2026-11-19T14:01:00Z'
labels:
  - skills
dependencies:
  - TASK-124
references:
  - skills/bootstrap-project-harness/templates/product-language.md
  - skills/bootstrap-project-harness/templates/architecture.md.template
  - skills/bootstrap-project-harness/templates/.opencode/opencode.json
priority: high
ordinal: 125000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origin: docs/inbox/2026-11-19-bootstrap-aprender-antes-de-decidir.md (10:40). Three tensions. The glossary requires product terms to map to code entities at inception, which pushes invented structure. The architecture template makes its rules normative and includes DRY and fixed size limits, so an unvalidated preference becomes a blocking rule. The generated opencode.json loads architecture.md and principles/design.md as instructions, so a provisional statement acquires normative authority by being loaded. Decision of 2026-11-19: certainty is structured (a frontmatter field or equivalent), not prose adjectives, so a machine — and the loading mechanism — can tell a confirmed constraint from a hypothesis. Numeric thresholds belong to tool configuration, not to prose.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every generated document that can carry a provisional statement declares its certainty in a structured field, not in prose adjectives.
- [ ] #2 The label set is exactly: confirmed constraint, accepted decision, hypothesis, open question.
- [ ] #3 product-language: the code-entity mapping is optional until the entity exists.
- [ ] #4 architecture: accepted constraints are separated from recommendations, and numeric thresholds point at tool configuration.
- [ ] #5 Documents loaded as instructions by opencode.json contain only confirmed or accepted statements, or each provisional statement is visibly marked when loaded.
- [ ] #6 Any check that validates the label set lives inside the skill, runs offline, and reuses existing assertion kinds.
<!-- AC:END -->
