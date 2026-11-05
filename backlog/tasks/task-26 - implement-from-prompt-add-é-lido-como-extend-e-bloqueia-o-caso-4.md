---
id: TASK-26
title: 'implement-from-prompt: ''add'' é lido como ''extend'' e bloqueia o caso #4'
status: To Do
assignee: []
created_date: '2026-11-05T16:51:00Z'
labels: []
dependencies: []
priority: high
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
No Gate A da SPEC-0015, o caso #4 deu 1/5 com skill e 1/5 sem. O transcript mostra a skill lendo 'In src/echo.js, add and export echo' como gap bloqueante porque o arquivo não existe, e parando. O caso espera que ela crie o arquivo e reporte o gate indisponível. A regra de blocking gap precisa distinguir criar de estender.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A skill distingue 'add/create' de 'extend/reuse' na regra de blocking gap.
- [ ] #2 O caso #4 passa 5/5 com skill e continua 0/5 no controle.
- [ ] #3 Nenhum outro caso do implement-from-prompt regride.
<!-- AC:END -->
