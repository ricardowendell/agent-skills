---
id: TASK-74
title: 'evals: sob enforcement, hit do corpus e tentativa negada'
status: To Do
assignee: []
created_date: '2026-11-09T14:18:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Terceiro halt da SPEC-0047 (2026-11-09). Dois defeitos independentes. (1) O controle novo rodou ls /Users/wendell/.agents/skills 2>/dev/null: o stderr foi descartado, nenhuma linha nomeia aquele caminho com Operation not permitted, e o detector registrou leak — apesar de o boundary negar o checkout inteiro e o canario provar que o perfil esta completo. (2) O check-eval-run usa igualdade de hash (runcheck.mjs:233) enquanto a evidence.mjs ja aceita por capacidade, entao a arm com skill v2 reusada aparece como isolated=unknown. Custo: zero draw pago; o replay re-julga os runs existentes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sob enforcement, um hit do corpus sem conteudo comprovado daquele caminho vira denied, inclusive com stderr suprimido
- [ ] #2 Sem enforcement a regra v2 continua: a tentativa e leak; e uma leitura com conteudo comprovado continua leak mesmo sob enforcement
- [ ] #3 runcheck usa capacidade (host-reads), nao hash: run v2 limpa reporta isolated=yes e v1 continua unknown
- [ ] #4 O replay do controle 10-59-41 da 5 draws limpos com deniedDraws>=1 e a arm 07-37-44 reporta isolated=yes
<!-- AC:END -->
