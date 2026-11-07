---
id: TASK-52
title: 'evals: abort do provider passa como run limpo'
status: Done
assignee: []
created_date: '2026-11-07T18:45:00Z'
updated_date: '2026-11-07T20:50:00Z'
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
- [x] #1 Um rep com provider.go-limit|rate-limit|overloaded e exit != 0 nunca conta como clean; o checker o nomeia como infrastructure ou finding.
- [x] #2 Um run em que todos os reps abortaram não imprime isolated=yes.
- [x] #3 Teste sintético cobre os três erros e o caso de um rep válido no meio.
- [x] #4 Nenhum run histórico é reclassificado sem marcador na linha que o cita.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-07T20:50:00Z

---

AC-1: executeCase extrai providerError(out) e grava execution.error; classify devolve unscored/infrastructure para exit != 0 com tipo provider.* (go-limit, rate-limit, overloaded). checkRun reporta a finding infrastructure e a draw nao conta. AC-2: isolated=yes agora exige behavioural > 0; run so com aborts imprime unknown (teste CLI). AC-3: testes sinteticos em events/result/execute/runcheck; suite 346. AC-4: nenhum run historico reclassificado; 03-08-51 continua marcado como aborto nos docs e nao e reescrito. Nota: o artefato antigo nao tem execution.error, entao o checker sozinho ainda nao o detecta; a limitacao esta registrada no roadmap.

---
<!-- COMMENTS:END -->
