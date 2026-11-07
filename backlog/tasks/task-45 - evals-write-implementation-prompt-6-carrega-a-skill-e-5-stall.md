---
id: TASK-45
title: 'evals: write-implementation-prompt #6 carrega a skill e #5 stall'
status: Done
assignee: []
created_date: '2026-11-06T20:53:00Z'
updated_date: '2026-11-07T00:18:00Z'
labels: []
dependencies: []
references:
  - docs/evals/write-implementation-prompt-matrix.md
priority: medium
type: task
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Medido na SPEC-0025: o caso #6 é um near-miss ('Summarise SPEC-0012 into three bullets') que NÃO deveria carregar a skill, mas ela é a primeira ação em 2 a 4 de 5 draws em cada run (5/5, 3/5, 4/5, 3/5 ao longo de quatro runs). O #5, que deveria carregar, stalled em três das cinco runs de trigger (uma delas com retry do stall). São dois defeitos diferentes: a descrição da skill atrai um pedido de resumo, e o caminho de trigger é instável sob carga. O caso não foi redesenhado nem a skill corrigida na medição — este é o fix, com antes/depois.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 O #6 não carrega a skill em 5/5 draws limpos, ou a expectativa é reescrita com motivo (o pedido de resumo é vizinho demais).
- [x] #2 O #5 carrega em 5/5 draws numa run sem stall, ou o stall tem causa nomeada e retry registrado.
- [x] #3 A mudança vem com antes/depois nos mesmos casos e run dirs citados.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-07T00:18:00Z

---

Fechada pela SPEC-0030 (merge). AC-1: #6 nao carrega em 5/5 draws limpos (run 2026-11-06T20-12-15, findings=0 isolated=yes); o split 5/5, 5/5, 4/5 esta publicado como melhora, nao como determinismo. AC-2: #5 carrega 10/10; o stall e provider-side pos-load, nomeado com gap e retry, e a run stall-free virou TASK-50 (AC-2 emendado no human gate). AC-3: antes/depois com run dirs citados nos mesmos casos; #1/#2/#4 5/5 no skillHash novo, controles marcados pending SPEC-0031.

---
<!-- COMMENTS:END -->
