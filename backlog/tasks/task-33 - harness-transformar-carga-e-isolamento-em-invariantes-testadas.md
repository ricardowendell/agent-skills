---
id: TASK-33
title: 'harness: transformar carga e isolamento em invariantes testadas'
status: To Do
assignee: []
created_date: '2026-11-05T20:54:00Z'
updated_date: '2026-11-05T21:37:00Z'
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
- [ ] #1 Um checker sem modelo falha um run dir com leak/contaminação ou com gate miss numa célula que o documento cita como separador, e passa num run limpo.
- [ ] #2 O canário de carga (--case 1 --repeat 12, 0 gate misses) fica documentado no CONTRIBUTING como passo manual pré-matriz; nenhuma run comportamental entra no CI nem no hook.
- [ ] #3 O checker é provado contra um run dir vermelho real e um verde real, além dos testes sintéticos.
<!-- AC:END -->
