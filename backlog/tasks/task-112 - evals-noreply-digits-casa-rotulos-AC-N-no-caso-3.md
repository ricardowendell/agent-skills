---
id: TASK-112
title: 'evals: noreply #<digits> casa rotulos AC #N no caso 3'
status: To Do
assignee: []
created_date: '2026-11-13T13:22:00Z'
labels:
  - evals
dependencies: []
priority: medium
type: task
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0083 (F2). A assertion noreply #[0-9]+ do caso 3 tambem casa rotulos AC #1/AC #2 no reply; no controle, 3 dos 5 reds sao essa numeracao, nao issue inventada. Estreitar a assertion para observar issue de fato, sem editar o oraculo retroativamente, e registrar a nova medicao.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A assertion estreitada distingue issue inventada de rotulo AC.
- [ ] #2 O caso 3 re-medido mantem a classificacao, ou a mudanca e registrada.
- [ ] #3 A coverage/CHANGELOG citam o run dir e a correcao.
<!-- AC:END -->
