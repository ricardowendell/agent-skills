---
id: TASK-115
title: >-
  evals: a alternacao prova uma receita, nao as quatro (e um maxLines cobre duas
  regras)
status: To Do
assignee: []
created_date: '2026-11-13T15:58:00Z'
labels:
  - evals
dependencies: []
priority: medium
type: task
ordinal: 115000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0084. A assertion filematch justfile (coverage|build|audit|install): prova pelo menos uma das quatro receitas, e um unico maxLines cobre as duas regras de linha do Biome; a claim publicada diz "as quatro". Adicionar assertions por receita/por limite (ou ajustar a claim), com a correcao registrada e o caso re-medido.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A assertion distingue uma receita adicionada de quatro.
- [ ] #2 A claim e o oraculo dizem a mesma coisa.
- [ ] #3 A re-medicao e a coverage citam o run dir; o oraculo nao e editado retroativamente sem registro.
<!-- AC:END -->
