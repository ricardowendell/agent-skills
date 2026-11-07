---
id: TASK-54
title: 'evals: auditar os transcripts do store por abort de provider'
status: To Do
assignee: []
created_date: '2026-11-07T20:50:00Z'
updated_date: '2026-11-07T23:20:00Z'
labels: []
dependencies: []
priority: high
type: task
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A TASK-52 passou a classificar abort de provider em runs novos, mas os artefatos antigos nao tem execution.error: o 03-08-51 continua com findings=0 isolated=yes no checker, e so foi pego a mao. Antes do gate do 0.6.2, varrer os transcripts do store por provider.go-limit|provider.rate-limit|overloaded, listar run/case/rep e comparar com o result.json. Para cada run citado como limpo em docs/evals/, ou o abort e seguido de retry bem-sucedido (nao e abort), ou a linha ganha um marcador. Nao reescrever numero e nao rodar draw; o resultado do run antigo fica como esta.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Um comando read-only lista todo transcript com erro provider.* e diz se o result.json registra infrastructure/error.
- [x] #2 Todo run citado como limpo que tem abort de provider e marcado, ou provado que o erro foi seguido de retry bem-sucedido.
- [x] #3 Nenhum numero historico reescrito; so marcador/nota na linha.
- [x] #4 A auditoria e deterministica e roda sem modelo.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-07T23:20:00Z

---

Auditoria concluida. AC-1: `node scripts/audit-provider-aborts.mjs [--dir <store>] [--json]` lista cada transcript com `provider.*` e informa `recorded` (execution.error), `infrastructure` e `retried`; a logica esta em `scripts/lib/evals/provider-audit.mjs`, com teste em `provider-audit.test.mjs`. AC-2: 1413 transcripts, 14 aborts, 14 unrecorded, 0 retried. Marcados: `09-05-36--review-code` #7 r1 (`provider.transport` depois do review, exit 1) em `review-code-matrix.md`; `08-14-24--capture-idea` #1 r1-r5 (`provider.go-limit`, gate miss causado pelo abort antes do load) em `SPEC-0031`. Ja estavam marcados: `02-03-01--write...#4 r4` (1 abort), `02-51-15--process-inbox #1 r3` (1 abort), `03-08-51--process-inbox #1 r1-r5` (5 aborts). `07-38-29--review-code` #4 r1 (`provider.transport`) so aparece em SPEC-0009 historica; nao foi editado, esta registrado em `docs/evals/provider-aborts.md`. AC-3: nenhum numero historico reescrito; so marcadores/notas e o doc de auditoria. AC-4: 100% deterministico, sem chamada de modelo; o teste usa um store sintetico. Gate: selftest 365+17, parity 2/2, check-evidence 0 erros.

---
<!-- COMMENTS:END -->
