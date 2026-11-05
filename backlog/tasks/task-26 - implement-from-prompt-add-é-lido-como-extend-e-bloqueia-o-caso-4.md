---
id: TASK-26
title: 'implement-from-prompt: ''add'' é lido como ''extend'' e bloqueia o caso #4'
status: To Do
assignee: []
created_date: '2026-11-05T16:51:00Z'
updated_date: '2026-11-05T17:55:00Z'
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
- [ ] #1 A skill distingue alvo de escrita (criar) de dependência de leitura (estender/reusar) na regra de blocking gap.
- [ ] #2 #4 passa 5/5 com skill; o controle remedido fica ≤2/5 (baseline pré-fix 1/5) e a taxa é reportada; acima disso o caso é publicado como não-discriminador, sem ajustar a asserção.
- [ ] #3 #1, #7 e #8 mantêm os baselines com skill (12/12, 5/5, 12/12) medidos a n=5.
- [ ] #4 Nenhuma asserção existente é editada e nenhuma outra skill muda.
<!-- AC:END -->
