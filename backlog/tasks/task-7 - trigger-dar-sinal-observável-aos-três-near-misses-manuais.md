---
id: TASK-7
title: 'trigger: dar sinal observável aos três near-misses manuais'
status: To Do
assignee: []
created_date: '2026-11-01T22:53:00Z'
labels: []
dependencies: []
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Três near-misses ficaram status: manual porque o agente às vezes carrega a skill só para conferir se é o caso, e responde certo em seguida: find-blind-spots #4 (2/3 e 1/3 carregamentos), tighten-harness #5 (1/3) e audit-docs #3 (1/3 depois de a descrição separar auditoria de revisão de diff). O assert notskill mede curiosidade, não roteamento. Fix: trocar roteamento por resultado observável (arquivo intocado, nenhum ADR, nenhum spec criado) ou manter manual com a taxa medida.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 cada um dos três tem asserção de resultado observável ou justificativa registrada no caso
- [ ] #2 nenhum caso fica vermelho por ruído de carregamento
<!-- AC:END -->
