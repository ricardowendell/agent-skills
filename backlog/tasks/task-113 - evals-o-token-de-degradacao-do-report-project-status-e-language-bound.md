---
id: TASK-113
title: 'evals: o token de degradacao do report-project-status e language-bound'
status: To Do
assignee: []
created_date: '2026-11-13T13:22:00Z'
labels:
  - evals
dependencies: []
priority: medium
type: task
ordinal: 113000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0083 (F2, run 2026-11-13T09-53-13--report-project-status). O caso 3 asserta reply ISSUES...unknown e reply CI...unknown; no r1 o braco com skill respondeu "desconhecido" no relatorio em portugues, e o red foi nomeado sem editar o oraculo. Decidir: (a) aceitar desconhecido|unknown na assertion, com a correcao registrada, ou (b) exigir o literal unknown no SKILL.md e re-medir. A classe separator (4/5 vs 0/5) nao muda em nenhum dos dois caminhos.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A decisao esta escrita com a evidencia do r1 e a regra de nao reescrever o oraculo depois do draw.
- [ ] #2 A correcao escolhida roda e o caso 3 fica verde nos 5 draws de um braco, ou o limite e registrado.
- [ ] #3 A coverage cita o run dir e o resultado; nenhuma taxa publicada e recomputada.
<!-- AC:END -->
