---
id: TASK-30
title: 'evals: re-diagnosticar a carga do implement-from-prompt por caso'
status: To Do
assignee: []
created_date: '2026-11-05T16:51:00Z'
labels: []
dependencies: []
priority: high
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Na SPEC-0015 o canário do #1 deu 12/12, mas o #2 perdeu o gate em 3/5 e o #8 em 1/5. A taxa agregada de ~23% da TASK-10 é caso-específica aqui. Medir a carga por caso com n>=12 e identificar o gatilho antes de rodar outra matriz.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Taxa de carga por caso com n>=12.
- [ ] #2 Causa identificada com transcript ou registrada como variância.
- [ ] #3 Nenhum caso passa a aceitar run sem skill.
<!-- AC:END -->
