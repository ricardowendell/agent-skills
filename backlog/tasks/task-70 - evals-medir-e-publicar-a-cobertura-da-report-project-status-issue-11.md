---
id: TASK-70
title: 'evals: medir e publicar a cobertura da report-project-status (issue #11)'
status: To Do
assignee: []
created_date: '2026-11-09T00:46:00Z'
labels: []
dependencies: []
references:
  - https://github.com/ricardowendell/agent-skills/issues/11
priority: medium
type: task
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: issue #11. A skill foi mergeada em 2026-11-08 (fca9c78): frontmatter, gh issues, delegacao ao survey, <=3 acoes e guardrails read-only estao cumpridos (5/8 ACs). Faltam: (1) o caso comportamental com fixture (hoje o #3 e manual); (2) a linha de coverage e um run medido com/sem skill; (3) o piloto de 1 semana medindo turnos ate a primeira acao (condicional). O recap (TASK-63) e outro incremento e nao cobre estes ACs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Caso comportamental com fixture roda e o #3 deixa de ser manual
- [ ] #2 Coverage row atualizada e um run medido com/sem skill, com a regra de cinco draws
- [ ] #3 Piloto de 1 semana medindo turnos ate a primeira acao, ou a razao registrada para nao faze-lo
<!-- AC:END -->
