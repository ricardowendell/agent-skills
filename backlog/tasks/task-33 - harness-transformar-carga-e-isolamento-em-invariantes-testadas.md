---
id: TASK-33
title: 'harness: transformar carga e isolamento em invariantes testadas'
status: To Do
assignee: []
created_date: '2026-11-05T20:54:00Z'
updated_date: '2026-11-05T20:55:00Z'
labels: []
dependencies:
  - TASK-29
  - TASK-30
priority: high
type: task
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-10 (carga) e TASK-11 (isolamento) estão Done e as duas voltaram como TASK-30 e TASK-29. As ACs mediram o mecanismo (taxa agregada, scrubEnv), não a invariante. Sem um teste que falhe, a mesma regressão volta.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Um teste do harness falha quando um transcript de controle contem leitura de skills/<id>/SKILL.md ou de references/evals.md fora do scratch.
- [ ] #2 Um canario de carga (--case 1 --repeat 12, 0 gate misses) roda em PR que toca skills/*/references/evals*.
- [ ] #3 Os dois testes sao provados contra um caso vermelho de proposito, nao so verdes.
<!-- AC:END -->
