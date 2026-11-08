---
id: TASK-33
title: 'harness: transformar carga e isolamento em invariantes testadas'
status: Done
assignee: []
created_date: '2026-11-05T20:54:00Z'
updated_date: '2026-11-06T11:46:00Z'
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
- [x] #1 Um checker sem modelo falha um run dir com leak/contaminação ou com gate miss numa célula que o documento cita como separador, e passa num run limpo.
- [x] #2 O canário de carga (--case 1 --repeat 12, 0 gate misses) fica documentado no CONTRIBUTING como passo manual pré-matriz; nenhuma run comportamental entra no CI nem no hook.
- [x] #3 O checker é provado contra um run dir vermelho real e um verde real, além dos testes sintéticos.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T11:46:00Z

---

Fechada pela SPEC-0018 (merge em 1320c27). AC-1: check-eval-run falha 07-47-34 (2 leaks) e 07-31-00 (1 leak) e passa 12-35-30 (warnings=12, pre-detector) e 07-05-38 (limpo). AC-2: canario --case 1 --repeat 12 documentado no CONTRIBUTING como passo manual pre-matriz; git diff .github/.githooks vazio. AC-3: prova vermelha real (07-47-34) e verde real (07-05-38), alem de 20 testes da regra e 8 da CLI. O checker falha fechado em run incompleto (status != completed, case sem result.json).

---
<!-- COMMENTS:END -->
