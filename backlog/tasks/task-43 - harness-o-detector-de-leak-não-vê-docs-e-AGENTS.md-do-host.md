---
id: TASK-43
title: 'harness: o detector de leak não vê docs/ e AGENTS.md do host'
status: Done
assignee: []
created_date: '2026-11-06T18:15:00Z'
updated_date: '2026-11-06T22:03:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Medido na SPEC-0025: um draw de controle leu /Users/wendell/.agents/docs/specs/SPEC-0012-*.md e /Users/wendell/.agents/AGENTS.md com read/sed e o run saiu findings=0. O leak.mjs só casa raízes de skill e references/evals.md$, então leitura do corpus de docs do host e do AGENTS.md global é invisível; o mesmo vale para .lane/trees (o canário de 8 draws leu o worktree da própria spec e saiu limpo). Consequência: 'clean' hoje significa 'não leu a skill', não 'isolado', e um controle pode aprender a resposta no corpus do host sem ser marcado. Corrigir o detector (ou o checker) para cobrir o corpus do host e os worktrees, e separar explicitamente 'no skill read' de 'isolated' no resumo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Um draw que lê docs/specs/*.md, AGENTS.md ou .lane/trees do host produz finding nomeado, não findings=0.
- [x] #2 O checker distingue 'sem leitura de skill' de 'isolado'; o resumo diz qual dos dois foi verificado.
- [x] #3 Testes com fixture sintética cobrem cada raiz nova e o caso limpo.
- [x] #4 Os runs já publicados não são reescritos; a mudança vale para runs novos e o coverage.md diz a partir de quando.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T22:03:00Z

---

Fechada pela SPEC-0028 (merge). AC-1: leitura da raiz do checkout, docs/, AGENTS.md, scripts/, skills/, runs/ e .lane/trees produz finding host nomeado; scratch e home descartavel continuam limpos. AC-2: check-eval-run imprime skillLeaks, hostReads e isolated=yes|no|unknown; v1 nunca sai yes. AC-3: fixtures por raiz, dois negativos e o digest dourado (a31d58f7 -> 71bfb85a). AC-4: os 49 run dirs da onda 0.5.0 foram replayados sem reescrever nada; 26 celulas dirty publicadas em coverage.md, incluindo as 5 novas que a raiz do checkout revelou; #2 e #4 marcados pendentes da SPEC-0031.

---
<!-- COMMENTS:END -->
