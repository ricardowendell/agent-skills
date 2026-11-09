---
id: TASK-72
title: 'evals: re-medir sob o deny layer e reclassificar as skills bloqueadas'
status: To Do
assignee: []
created_date: '2026-11-09T09:05:00Z'
labels: []
dependencies:
  - TASK-71
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Segunda metade da TASK-71, partida em duas para nao juntar mudanca de harness com onda paga. Bloqueada pela SPEC-0046 (deny layer). Alvo: uma celula comportamental de cada skill com bloqueio publicado em docs/evals/coverage.md -- capture-idea #1 (2026-11-07T08-27-30), groom-backlog #2 (2026-11-06T07-47-34), write-implementation-prompt #1 (2026-11-07T08-17-29) e bootstrap-project-harness (2026-11-08T22-51-39) -- atinge cinco draws limpos no controle e e reclassificada como separator, non-discriminator ou unresolved. Nenhuma celula e promovida sem cinco draws limpos; a regra de cinco draws nao baixa. Custo estimado: 4 skills x 1 caso x 5 draws x 2 arms = 40 draws, mais canarios.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 As quatro skills bloqueadas rodam com o deny layer efetivo e o resumo nao diz isolated=no em nenhuma celula
- [ ] #2 Cada celula atinge cinco draws limpos no controle ou permanece unresolved com o motivo nomeado
- [ ] #3 Cada reclassificacao (separator, non-discriminator, unresolved) e publicada no coverage.md com o run dir
- [ ] #4 Nenhum oraculo e editado depois dos draws; vermelhos viram follow-up
<!-- AC:END -->
