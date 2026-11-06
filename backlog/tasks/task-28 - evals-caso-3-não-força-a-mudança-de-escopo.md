---
id: TASK-28
title: 'evals: caso #3 não força a mudança de escopo'
status: Done
assignee: []
created_date: '2026-11-05T16:51:00Z'
updated_date: '2026-11-06T15:33:00Z'
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
- [x] #1 A fixture faz o caminho literal do prompt falhar ou exigir atualização do prompt.
- [x] #2 Uma sanity draw de 1 repetição prova que a mudança é forçada antes de o caso sair de manual.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T15:33:00Z

---

Fechada pela SPEC-0022 (merge 75e2784). AC-1: copia local do fixture — baseline node --test exit 0; slugify em src/index.js exit 1 (generated-barrel test); a mesma implementacao em src/text.js exit 0. AC-2: sanity draw 1/1 com skill em 2026-11-06T11-28-49--implement-from-prompt, changed prompt + filematch src/text.js slugify, check-eval-run 0/0; o caso saiu de manual como regression case, nao separador (sem controle).

---
<!-- COMMENTS:END -->
