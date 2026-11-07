---
id: TASK-52
title: 'evals: abort do provider passa como run limpo'
status: To Do
assignee: []
created_date: '2026-11-07T18:45:00Z'
labels: []
dependencies: []
priority: high
type: task
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Na SPEC-0031, o run 2026-11-07T03-08-51--process-inbox--without-skill morreu com provider.go-limit nas 5 reps: result.json tem exit=1, steps=0/2-4, tokens=0, e as 5 asserções ficaram trivialmente verdes porque o agente não agiu. O check-eval-run reporta findings=0 warnings=0 isolated=yes, então o run passaria como controle limpo. O mesmo padrão apareceu com provider.rate-limit (overloaded) em 02-51-15 r3 e 02-03-01 r4. Hoje só timeout e stalled contam como infrastructure (result.mjs). Decidir: abort de provider (go-limit, rate-limit, overloaded) vira infrastructure como timeout/stalled, ou vira finding; um run sem nenhuma ação de caso não pode imprimir isolated=yes. Não aumentar draws nem reescrever runs históricos; o que já foi publicado como aborto fica como está.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Um rep com provider.go-limit|rate-limit|overloaded e exit != 0 nunca conta como clean; o checker o nomeia como infrastructure ou finding.
- [ ] #2 Um run em que todos os reps abortaram não imprime isolated=yes.
- [ ] #3 Teste sintético cobre os três erros e o caso de um rep válido no meio.
- [ ] #4 Nenhum run histórico é reclassificado sem marcador na linha que o cita.
<!-- AC:END -->
