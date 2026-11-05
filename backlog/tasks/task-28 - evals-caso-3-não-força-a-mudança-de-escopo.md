---
id: TASK-28
title: 'evals: caso #3 não força a mudança de escopo'
status: To Do
assignee: []
created_date: '2026-11-05T16:51:00Z'
labels: []
dependencies: []
priority: medium
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A sanity draw da SPEC-0015 falhou: a fixture do #3 só sugere src/text.js, o agente segue o prompt literal para src/index.js, o teste fica verde e a mudança de escopo não é forçada. O caso segue manual até a fixture tornar o caminho literal impossível ou o prompt desatualizado.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A fixture faz o caminho literal do prompt falhar ou exigir atualização do prompt.
- [ ] #2 Uma sanity draw de 1 repetição prova que a mudança é forçada antes de o caso sair de manual.
<!-- AC:END -->
