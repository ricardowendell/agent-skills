---
id: TASK-1
title: 'eval: estagiar fixtures com git'
status: To Do
assignee: []
created_date: '2026-10-29T13:26:00Z'
labels: []
dependencies: []
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
scripts/run-evals.mjs:241-243 estagia cada caso com mkdtemp + cpSync(fixture, scratch): arvore plana, sem git init e sem commit base. Os evals do review-code precisam de historico (base + diff para git diff main...HEAD), entao hoje ficam behavior-only e a referencia registra o bloqueio (skills/review-code/references/evals.md, linhas 3-9). Quem consome isso tambem e qualquer skill que rode gates git (groom, preflight, diff). Fix: quando a fixture pedir, criar o repo no scratch e commitar o conteudo antes de rodar o caso; asserts existentes (file, nofile, unchanged, changed) precisam continuar valendo porque comparam com a fixture original. Specs: n/a (repo sem PDLC) — task direto.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 fixture marcada roda num repo git com commit base antes do caso
- [ ] #2 asserts file/nofile/unchanged/changed seguem funcionando num repo
- [ ] #3 --list e dry-run não criam repositório nem tocam a fixture
- [ ] #4 node scripts/validate-skills.mjs verde
<!-- AC:END -->
