---
id: TASK-50
title: 'evals: o #5 do write-implementation-prompt stalls depois do load'
status: Done
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
- [ ] #1 A causa nao foi fechada: o padrao (4/10 draws, sempre depois do load, com retry) aponta provider, mas nao ha prova que exclua o watchdog. Nao fechar por inferencia.
- [ ] #2 Condicional a AC-1; nenhuma mudanca de watchdog foi feita e nao ha distribuicao medida que justifique uma.
- [x] #3 Pendencia registrada como a AC permite: ~40% dos draws (4/10) com stall pos-load, 1 retry cada, custo ~150-355 s por stall. A regra de reabertura esta em docs/evals/coverage.md.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-08T01:51:00Z

---

Fechada em 2026-11-08 como contingencia, nao como trabalho pendente. AC-3 cumprida como escrita: a pendencia fica registrada (~40% dos draws com stall pos-load, 1 retry cada, 150-355 s por stall). AC-1 e AC-2 ficam abertas com a razao: o padrao aponta provider (sempre depois do load, retry resolve), mas nada exclui o watchdog, e nao houve mudanca de limite. A regra de reabertura esta em docs/evals/coverage.md: se um run pago stallar pos-load de novo, parar a onda, registrar os eventos e reabrir esta task com eles. Sem essa regra, a task ficaria para sempre em 'precisa de groom' sem gatilho.

---
<!-- COMMENTS:END -->
