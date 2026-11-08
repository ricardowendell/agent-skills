---
id: TASK-68
title: '[stack] harness-state por capacidades e slots'
status: To Do
assignee: []
created_date: '2026-11-08T10:00:00Z'
labels: []
dependencies:
  - TASK-65
  - TASK-67
references:
  - https://github.com/ricardowendell/agent-skills/issues/12
priority: medium
type: task
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fatia 4 da issue #12 (umbrella TASK-64): harness-state.mjs e testes avaliam capacidades/slots (formatter, linter, test runner, hooks, CI) em vez de nomes fixos; reconhecem Bun, Node+pnpm, ESLint/Prettier e Biome/Oxlint; complete antes de instalar dependencias.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 REQUIRED/OPTIONAL expressam capacidades/slots, nao nomes fixos de arquivo
- [ ] #2 complete e reportado para todas as stacks/perfis suportados, inclusive antes de node_modules/lockfile
- [ ] #3 Testes cobrem repo novo, Bun existente, Node+pnpm, lint existente, monorepo e stack ambigua
<!-- AC:END -->
