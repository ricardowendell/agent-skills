---
id: TASK-91
title: 'evals: o vocabulario de veredito nao reconhece formas validas'
status: Done
assignee: []
created_date: '2026-11-10T19:07:00Z'
updated_date: '2026-11-10T22:50:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/assertions.mjs
  - docs/evals/coverage.md
  - docs/specs/SPEC-0056-review-proportional-to-diff-risk.md
priority: high
type: task
ordinal: 91000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: review da SPEC-0056 (2026-11-10). O assertion verdict usa vocabulario fechado e nao reconhece formas que o controle emitiu: 'changes requested', 'needs changes', 'one blocking defect', 'compliant'. Resultado: os casos 8 e 9 marcaram 0/5 e 3/5 no controle embora o controle rejeitasse em prosa 5/5; o caso 1 marcou 0/5 embora aprovasse. Corrigir o vocabulario (incluindo as formas PT) e re-julgar 1/8/9/10 com replay-evals, zero draw pago; publicar before/after sem reescrever os rates historicos.
<!-- SECTION:DESCRIPTION:END -->
