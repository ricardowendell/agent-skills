---
id: TASK-97
title: >-
  evals: fixar o trade do reject-vins e a fronteira de virgula no verdict
  (SPEC-0062)
status: To Do
assignee: []
created_date: '2026-11-10T22:46:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/assertions.mjs
  - docs/specs/SPEC-0062-the-verdict-vocabulary-is-closed.md
priority: low
type: task
ordinal: 97000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: review da SPEC-0062 (2026-11-10). Dois residuos latentes do matcher, nenhum com instancia no store (0 de 315 draws movem). (1) A precedencia REJECT > APPROVE gera falso reject quando a linha rejeita uma alternativa e aprova a mudanca: 'reject the alternative; approve the change' le REJECT. O teste atual so cobre a direcao que queremos; falta o teste inverso. (2) A virgula nao e fronteira de clausula, entao um negador anterior anula um stance posterior: 'AC-2 is not implemented, changes requested' nao pontua. So sub-pontua, nunca infla. Fixar as duas com teste e re-rodar o replay: os mesmos 17 draws devem mover.
<!-- SECTION:DESCRIPTION:END -->
