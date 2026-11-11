---
id: TASK-109
title: 'evals: o vocabulario do verdict nao le ''not ready'' nem ''not implemented'''
status: To Do
assignee: []
created_date: '2026-11-11T18:12:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/kinds.mjs
  - docs/evals/review-code-matrix.md
  - docs/specs/SPEC-0062-the-verdict-vocabulary-is-closed.md
priority: medium
type: task
ordinal: 109000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0078, caso #4 controle (2026-11-11). Em 3 de 5 draws o controle recusou a spec movida com 'Verdict: not ready' / 'Verdict: not implemented' e a assertion 'verdict REJECT' marcou vermelho com got NOT, porque a tabela fechada da SPEC-0062 nao tem entrada para essas formas. O julgamento e o mesmo do braco com skill (recusar), entao o caso foi publicado como non-discriminator e o artefato foi nomeado; mas o token perdido e a mesma classe do ranpass literal (TASK-102). Decidir: adicionar as formas negativas ('not ready', 'not implemented', 'not mergeable') ao vocabulario, com o custo de re-julgar o store, ou documentar que o guard exige uma das formas fechadas. Zero draws.
<!-- SECTION:DESCRIPTION:END -->
