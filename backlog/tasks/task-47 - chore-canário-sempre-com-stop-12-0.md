---
id: TASK-47
title: 'chore: canário sempre com --stop 12/0'
status: To Do
assignee: []
created_date: '2026-11-06T21:23:00Z'
labels: []
dependencies: []
references:
  - CONTRIBUTING.md
priority: low
type: task
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O CONTRIBUTING manda rodar o canário como --case 1 --repeat 12 --run, mas o runner aplica o stop default 5/3 quando repeat > 5: o canário da SPEC-0025 parou em 8 draws e teve de ser refeito com --stop 12/0, gastando um run inteiro a mais. A regra escrita e o comportamento do runner divergem. Corrigir a linha do CONTRIBUTING para incluir --stop 12/0 (ou mudar o default quando o canário é o objetivo), e dizer por que o canário precisa dos 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 O comando do canário no CONTRIBUTING produz 12 draws de fato, e um teste ou nota justifica o 12.
- [ ] #2 Um canário que para antes de 12 é reconhecido como incompleto, não contado como 12/12.
<!-- AC:END -->
