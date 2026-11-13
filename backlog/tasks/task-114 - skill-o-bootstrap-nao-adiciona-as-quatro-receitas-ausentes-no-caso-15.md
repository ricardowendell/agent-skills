---
id: TASK-114
title: 'skill: o bootstrap nao adiciona as quatro receitas ausentes no caso 15'
status: To Do
assignee: []
created_date: '2026-11-13T15:58:00Z'
labels:
  - evals
dependencies: []
priority: medium
type: task
ordinal: 114000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0084 (F2, run 2026-11-13T10-59-24--bootstrap-project-harness). Com o oraculo corrigido, o caso 15 mediu 1/5: em 4 dos 5 draws a skill preservou o justfile e nao adicionou as quatro receitas (coverage, audit, build, install), embora o SKILL.md:246 mande "add only the missing recipes". O controle fez 0/4 limpos, entao a celula e unresolved. Decidir: corrigir a skill para adicionar as receitas ausentes, ou registrar que o contrato nao exige e enfraquecer o oraculo, com a evidencia dos run dirs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A decisao esta escrita com os 4 draws e o trecho do SKILL.md.
- [ ] #2 A correcao (skill ou oraculo) roda e o caso 15 e re-medido com 5 draws por braco.
- [ ] #3 A coverage/CHANGELOG citam o run dir e a classificacao; nenhuma taxa publicada e recomputada.
<!-- AC:END -->
