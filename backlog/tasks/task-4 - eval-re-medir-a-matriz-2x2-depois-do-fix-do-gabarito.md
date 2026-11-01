---
id: TASK-4
title: 'eval: re-medir a matriz 2x2 depois do fix do gabarito'
status: To Do
assignee: []
created_date: '2026-11-01T22:53:00Z'
labels: []
dependencies: []
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
c876d88 parou de estagiar references/evals.md e references/evals/ junto com a skill: 40 de 194 transcrições liam o gabarito (prompt, expectativas e assertions), e fechar o vazamento mudou audit-docs #3 de 3/3 para 0/3 carregamentos. Os números da matriz 2 modelos x 2 braços x 4 casos publicados antes disso (README, plano 2026-11-01-evals-p0-confiavel) não são mais confiáveis. Fix: rodar de novo com o staging corrigido e o executor único (b9c7534), e comparar com o Promptfoo via provider.mjs, que agora compartilha o mesmo executeCase.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 matriz 2x2x3 re-executada com o staging corrigido
- [ ] #2 contagem por caso e braço igual entre runner e Promptfoo
- [ ] #3 números antigos marcados como obsoletos onde aparecerem
<!-- AC:END -->
