---
id: TASK-50
title: 'evals: o #5 do write-implementation-prompt stalls depois do load'
status: To Do
assignee: []
created_date: '2026-11-07T00:15:00Z'
updated_date: '2026-11-08T09:53:00Z'
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

created: 2026-11-08T09:53:49.697Z

---

Reaberta em 2026-11-08 pelo stall da onda do corpus (SPEC-0034). Run de controle #12: 2026-11-08T06-44-22--implement-from-prompt--agentworks-deepseek-v4-1-flash--without-skill, draw r3: exit=stalled, stallMs=120000, durationMs=223091, attempts=2, retries=1, steps=10. check-eval-run confirma 'infrastructure implement-from-prompt#12 r3 — infrastructure: stalled (retried 1x)'. A onda parou em 30/40 draws e o holdout #11 nao foi sorteado, conforme o protocolo. Reabre para diagnostico: provider-side, watchdog ou prompt (AC-1/AC-2 seguem abertas).

---

created: 2026-11-09T02:46:35.666Z

---

Reaberta em 2026-11-08 pelo stall pos-load da onda da SPEC-0045 (stack review). Skill arm, run 2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash, 2 de 40 draws: #16 r1 exit=stalled, stallMs=120000, durationMs=318637, attempts=2, retries=1, steps=30, toolCalls=30, gate 'loaded bootstrap-project-harness'; #17 r1 exit=stalled, stallMs=120000, durationMs=395435, attempts=2, retries=1, steps=22, toolCalls=38, same gate. Padrao identico ao registrado (pos-load, 1 retry, watchdog de 120 s). DESVIO DE PROTOCOLO: a onda NAO foi parada; o runner seguiu apos o retry automatico e completou 38/40 draws uteis, e a arm de controle rodou em seguida. O resultado foi publicado como unresolved (as duas celulas tem 4 draws limpos + 1 stall, nao 5), sem --resume e sem retry manual. Decidir com evidencia se a causa e provider-side, watchdog ou prompt (AC-1/AC-2 seguem abertas).

---

created: 2026-11-11T00:25:20.799Z

---

Revisita 2026-11-10, com o CLI novo. Cinco stalls registrados no store, todos pos-load e todos com cadeia longa de steps: corpus #12 controle r3 (2 tentativas, 223 s, steps=10), stack review #16 r1 (318,6 s, steps=30, toolCalls=30) e #17 r1 (395,4 s, steps=22, toolCalls=38), mais os dois da SPEC-0030. A janela e de 120 s e e medida ENTRE chunks: um modelo lento porem vivo emite eventos de step e reseta o watchdog, entao um silencio de 120 s com o processo ativo e silencio, nao lentidao. Isso nao fecha a causa (provider x watchdog), mas fecha a politica operacional: 120 s fica, stall e infraestrutura, e o draw descartado e retomado, nao 'aumenta o timeout ate passar'. Achado colateral, medido: `--resume` NAO reexecuta um draw de infraestrutura — `readDraw` devolve o r3 stallado e a onda nunca chega a 5 draws limpos, que e exatamente o resume que a SPEC-0034 assumia. Corrigir isso (SPEC-0064) e o desbloqueio real do corpus; nao o limite.

---
<!-- COMMENTS:END -->
