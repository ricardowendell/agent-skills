---
id: TASK-2
title: 'review-code: caso de eval com fixture de git'
status: To Do
assignee: []
created_date: '2026-10-29T13:26:00Z'
labels: []
dependencies: []
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Com o runner estagiando git, o review-code ganha um caso que prova o veredito contra um repo de verdade: base commitada, spec com ACs, e uma mudanca que deixa o AC-2 descoberto e apaga uma assercao. Hoje os 3 casos sao behavior-only e o caminho REJECT nunca passa por um diff real (references/evals.md). Fix: references/evals/1/ com o repositorio minimo (spec + branch), o caso marcado para estagiar git, e assert de que o transcript termina em VERDICT: REJECT com o gap do AC-2 como blocking e file:line. Manter os casos behavior-only onde nao faz sentido fixture.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 caso 1 roda a partir de references/evals/1/ num repo git
- [ ] #2 transcript mostra VERDICT: REJECT e o AC-2 como blocking com file:line
- [ ] #3 casos behavior-only existentes continuam passando
- [ ] #4 validate-skills.mjs verde e SKILL.md aponta a fixture
<!-- AC:END -->
