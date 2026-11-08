---
id: TASK-66
title: '[stack] SKILL detecta e preserva a stack existente'
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
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fatia 2 da issue #12 (umbrella TASK-64): SKILL.md detecta runtime, package manager, lockfile, linter/formatter, test runner e scripts existentes; nao impoe substituicao; defaults so para repo vazio; colisao gera diagnostico.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Deteccao le runtime, package manager, lockfile, linter/formatter e test runner existentes, sem assumir Bun por tsconfig
- [ ] #2 Ferramentas existentes sao preservadas; conflito gera diagnostico e skip, nunca substituicao silenciosa
- [ ] #3 Defaults so se aplicam a repo sem stack TS/Node
<!-- AC:END -->
