---
id: TASK-67
title: '[stack] templates TS alinhados à decisão'
status: To Do
assignee: []
created_date: '2026-11-08T10:00:00Z'
labels: []
dependencies:
  - TASK-65
references:
  - https://github.com/ricardowendell/agent-skills/issues/12
priority: medium
type: task
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fatia 3 da issue #12 (umbrella TASK-64): package/scripts, lint/formatter, hooks, justfile, CI e pin seguem a decisao da matriz; limites de qualidade preservados ou substituidos com equivalencia justificada.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Templates implementam exatamente o default decidido; divergencia e REJECT
- [ ] #2 Scripts test, test:watch, coverage, typecheck, lint, format, format:check, check e build presentes e funcionais quando aplicavel
- [ ] #3 Pre-commit rapido e offline; audit sem || true; pins e lockfile congelado testados
<!-- AC:END -->
