---
id: TASK-102
title: 'evals: ranpass pontua o comando literal, nao o efeito (corpus #10)'
status: To Do
assignee: []
created_date: '2026-11-11T09:57:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/assertions.mjs
  - evals/implement-from-prompt/cases.md
  - docs/evals/iterative-corpus.md
priority: high
type: task
ordinal: 102000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0034, caso #10 r1 (2026-11-11). A assertion ranpass compara a regex contra input.command; o modelo rodou 'npm test', que o package.json do fixture mapeia para 'node --test', e o teste passou (pass 3, exit 0). A assertion exigia o literal 'node --test' e marcou vermelho: o corpus publicou por um tempo que o incumbent 'nunca rodou a suite'. Mesma classe do vocabulario do verdict (SPEC-0062): o oraculo pontua o token, nao o comportamento. Decidir: aceitar a cadeia npm->script, ou exigir o comando literal e documentar; re-julgar #10 r1 por replay (zero draw).
<!-- SECTION:DESCRIPTION:END -->
