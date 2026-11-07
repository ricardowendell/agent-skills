---
id: TASK-50
title: 'evals: o #5 do write-implementation-prompt stalls depois do load'
status: To Do
assignee: []
created_date: '2026-11-07T00:15:00Z'
labels: []
dependencies: []
references:
  - docs/evals/write-implementation-prompt-matrix.md
priority: medium
type: task
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Medido na SPEC-0030: em duas runs de trigger, 4 de 10 draws morreram por stall, sempre DEPOIS de carregar a skill (o tool skill dispara entre 0.2 s e 2.4 s; o stream fica silencioso e o watchdog mata aos 120 s). Ultimos eventos: 19-32-45 r1 161.6 s, r4 27.2 s; 19-53-34 r3 355.0 s, r5 145.0 s. Todos com 1 retry, e 19-32-45 r2 stallou na primeira tentativa e passou na segunda. O load 10/10 esta medido; o que nao esta e uma run stall-free. Decidir com evidencia se a causa e provider-side (silenciamento de stream), runner (watchdog curto para respostas longas) ou prompt (trigger que gera resposta longa). Nao aumentar o numero de draws sem hipotese.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A causa e nomeada com evidencia (gap de eventos, tentativa, modelo) ou o caso e declarado ruido de provider com o limite medido.
- [ ] #2 Se for o watchdog, o limite e justificado com a distribuicao de gaps e tem teste.
- [ ] #3 Uma run stall-free de #5 existe, ou a pendencia fica registrada com a probabilidade observada e o custo de tentar.
<!-- AC:END -->
