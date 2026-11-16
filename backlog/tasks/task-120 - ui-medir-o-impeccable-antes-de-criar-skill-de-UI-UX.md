---
id: TASK-120
title: 'ui: medir o impeccable antes de criar skill de UI/UX'
status: To Do
assignee: []
created_date: '2026-11-16T01:24:00Z'
labels: []
dependencies: []
documentation:
  - docs/analysis/data-corpus/README.md
  - docs/specs/SPEC-0085-contract-ab-measurement.md
  - docs/analysis/paused-specs-review.md
priority: high
type: task
ordinal: 120000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: foco em UI/UX de 2026-11-15. O roadmap afirma que o cluster ui-refactor tem gap 0 porque "impeccable e simplify ja cobrem", mas a auditoria das specs pausadas registra que "no measurement exists" e o companion-skills.json exige medicao para uma entrada. O impeccable esta instalado em skills/impeccable (pbakaus/impeccable, skill 4.8.1, engine 0.1.19) e o diretorio e gitignored, entao a medicao nao pode morar em evals/ na raiz sem quebrar o CI. Entregar no padrao do data corpus (SPEC-0085): corpus duravel em docs/analysis/ui-corpus/ (4 casos: critica de hierarquia, auditoria de acessibilidade, empty state, captura de DESIGN.md), espelho gitignored em .lane/pinned/impeccable/, medicao A/B com controle, decisao por celula e entrada em companion-skills.json so com evidencia. Sem oraculo visual (decisao (b) da SPEC-0077); a metade visual e human review declarado. Teto: US$ 0,50 incluindo draws descartados. Nenhuma skill nova e criada.
<!-- SECTION:DESCRIPTION:END -->
