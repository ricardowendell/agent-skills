---
id: TASK-61
title: 'evals: oraculo visual para casos de UI (screenshot, DOM, contraste)'
status: To Do
assignee: []
created_date: '2026-11-08T01:42:00Z'
labels: []
dependencies:
  - TASK-56
references:
  - docs/roadmap.md
  - docs/specs/active/SPEC-0036-visual-change-planning.md
  - docs/specs/active/SPEC-0038-experience-review.md
priority: low
type: task
ordinal: 61000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O roadmap da 0.8.0 diz 'a browser/visual oracle, then TASK-58 and TASK-60', mas nenhuma task ou spec entregava esse oraculo: as duas skills apenas o citavam como bloqueio. Isso deixava dois P1 esperando por um item sem dono, e o backlog dizia que eles desbloqueavam junto com a TASK-56. Esta task e o dono. Decisao a tomar, com custo: (a) adicionar um caminho de assertion visual ao runner — screenshot, query de DOM, estilo computado ou axe — ou (b) aceitar revisao humana declarada e nao reivindicar separacao medida. A opcao (b) e legitima, mas precisa aparecer no claim da release, nao virar caso 'manual' contado como cobertura.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A decisao entre (a) oraculo automatizado e (b) revisao humana declarada esta registrada, com custo e consequencia para o claim da release.
- [ ] #2 Se (a): o tipo de assertion novo tem teste, e um caso com fixture sabidamente ruim falha e um sabidamente bom passa — o oraculo precisa provar que reprova algo.
- [ ] #3 Se (a): versao de browser/ferramenta fica registrada no manifesto do run; sem isso a medicao nao e reproduzivel.
- [ ] #4 Se (b): o formato do caso declara a cobertura limitada e nenhuma release afirma separacao a partir dele.
- [ ] #5 Nao escrever browser engine do zero: reusar Playwright/axe quando o projeto consumidor ja tiver, e declarar quando nao houver.
- [ ] #6 So depois desta task fechada a TASK-58 e a TASK-60 saem do bloqueio.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-08T02:13:00Z

---

Repriorizada em 2026-11-08: high -> low, e fica deferida. O oraculo so existe para servir a TASK-58 e a TASK-60; com as duas em paused/P3, ele perde consumidor e nao se paga. Nao ha status 'paused' no backlog, entao fica To Do com prioridade low e este registro: reabre quando uma das duas voltar a ready, ou quando a SPEC-0034 mostrar que o determinístico nao enxerga 'mudanca pequena' e um oraculo passar a ser pre-requisito do corpus.

---
<!-- COMMENTS:END -->
