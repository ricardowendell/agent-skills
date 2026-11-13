---
id: TASK-116
title: 'evals: uma medicao valida do contrato precisa de prompt neutro e A sem CLI'
status: To Do
assignee: []
created_date: '2026-11-13T20:11:00Z'
labels:
  - evals
dependencies: []
priority: medium
type: task
ordinal: 116000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0085 (0.9.0, A/B das datacontract-skills). O A/B foi nao-discriminador nas 4 celulas, mas o instrumento tem tres limites declarados: (a) o prompt do caso semantico entrega a direcao; (b) o datacontract esta no PATH nos dois bracos (A mede skill card vs CLI, nao familia vs controle); (c) n=5 nao exclui efeito pequeno. Uma medicao valida exige prompt neutro, braco A sem o CLI, e uma descricao cujo impacto o controle precise inferir. O resultado "nenhuma skill local (C) justificada" ja esta registrado; esta task e sobre medir o valor da skill externa, nao sobre construir C.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 O prompt e neutro (nao anuncia que o schema passa) e o braco A nao tem o CLI no PATH.
- [ ] #2 A medicao compara A vs B nas 4 celulas com 5 draws limpos por braco e publica os counts crus.
- [ ] #3 O veredito e registrado no decision.md/coverage; nenhuma taxa herdada e recomputada.
<!-- AC:END -->
