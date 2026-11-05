---
id: TASK-34
title: 'evals: decidir audit-code-quality #4 e review-code #2'
status: To Do
assignee: []
created_date: '2026-11-05T20:54:00Z'
updated_date: '2026-11-05T20:55:00Z'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Os dois estão publicados como regression case sem decisão registrada. audit-code-quality #4 só separa quando o controle quebra o contrato, e review-code #2 mediu 5/5 nos dois braços e saiu da matriz. Falta a decisão explícita: fica como guarda de regressão ou sai do corpus.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Cada caso recebe decisao explicita: fica como regressao ou sai do corpus.
- [ ] #2 A decisao vai para coverage.md com o run dir que a sustenta.
- [ ] #3 Nenhum caso fica classificado como discriminador sem separacao medida.
<!-- AC:END -->
