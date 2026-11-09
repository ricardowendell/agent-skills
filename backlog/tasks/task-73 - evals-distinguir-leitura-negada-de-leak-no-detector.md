---
id: TASK-73
title: 'evals: distinguir leitura negada de leak no detector'
status: To Do
assignee: []
created_date: '2026-11-09T12:26:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Descoberto no F0.1 da SPEC-0047 (2026-11-09): o boundary seatbelt da SPEC-0046 funciona (ls devolve Operation not permitted), mas o detector classifica o caminho presente no input da ferramenta como leak mesmo quando o SO negou a leitura. Resultado: um controle que sonda o corpus instalado nunca fica limpo, isolated=no e estrutural, e a onda da 0047 parou em 1 de 5 celulas com 40 draws nao gastos. O parser ja expoe output/exit/status por chamada (events.mjs:60), entao a classificacao por caminho e possivel sem tocar o boundary. Custo: zero draw pago; o replay re-julga os runs existentes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Uma leitura negada por permissao vira 'denied', nao leak/host, e um draw so com tentativas negadas e limpo
- [ ] #2 Uma leitura que teve sucesso continua leak/host; numa chamada mista, o caminho lido com sucesso continua leak
- [ ] #3 O resumo conta 'denied' e o check-eval-run imprime, sem virar finding nem forcar isolated=no
- [ ] #4 O replay dos runs do F0.1 da SPEC-0047 reclassifica r3-r5 como negados e mantem a arm com skill em isolated=yes
<!-- AC:END -->
