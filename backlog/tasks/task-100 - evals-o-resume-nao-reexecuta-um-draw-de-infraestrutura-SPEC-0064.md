---
id: TASK-100
title: 'evals: o --resume nao reexecuta um draw de infraestrutura (SPEC-0064)'
status: To Do
assignee: []
created_date: '2026-11-11T00:25:00Z'
labels: []
dependencies: []
references:
  - scripts/eval.mjs
  - docs/specs/SPEC-0034-iterative-corpus.md
priority: high
type: task
ordinal: 100000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: revisita 2026-11-10, ao planejar o resume da SPEC-0034. scripts/eval.mjs:842 devolve qualquer draw armazenado, inclusive um unscored/infrastructure; entao o --resume do controle #12 do corpus devolve o r3 stalled e a onda nunca chega a 5 draws limpos — exatamente o resume que a SPEC-0034 assumia. Um draw pago e descartado pelo harness nao e resultado: deve ser refeito no resume. Zero draws.
<!-- SECTION:DESCRIPTION:END -->
