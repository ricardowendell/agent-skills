---
id: TASK-115
title: >-
  evals: a alternacao prova uma receita, nao as quatro (e um maxLines cobre duas
  regras)
status: Done
assignee: []
created_date: '2026-11-13T15:58:00Z'
updated_date: '2026-11-14T10:58:00Z'
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
- [x] #1 A assertion distingue uma receita adicionada de quatro.
- [x] #2 A claim e o oraculo dizem a mesma coisa.
- [x] #3 A re-medicao e a coverage citam o run dir; o oraculo nao e editado retroativamente sem registro.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-14T10:58:27.567Z

---

Resolvida na 0.9.3 (SPEC-0088): o caso 15 tem quatro assertions independentes (uma por receita) e o caso 20 asserta as duas regras de linha do Biome com os dois valores, ao lado de complexity e params. A claim 'as quatro' agora e o que o oraculo prova; a re-medida e o separador 4/5 vs 0/5 em 2026-11-14T07-05-09 (com o controle reusado de 21-36-29), com a taxa antiga como historia.

---
<!-- COMMENTS:END -->
