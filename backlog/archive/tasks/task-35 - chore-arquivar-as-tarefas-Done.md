---
id: TASK-35
title: 'chore: arquivar as tarefas Done'
status: Done
assignee: []
created_date: '2026-11-05T20:55:00Z'
updated_date: '2026-11-08T00:40:00Z'
labels: []
dependencies: []
priority: low
type: chore
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As tarefas Done continuam em backlog/tasks/, poluindo backlog task list e pdlc plan. Mover para backlog/archive/tasks/ sem reutilizar id. O numero do titulo ("26") estava defasado: eram 51 em 2026-11-08, porque a fila cresceu depois que a task foi escrita.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 As tarefas Done estao em backlog/archive/tasks/ — 51 arquivadas em 2026-11-08 (TASK-3 primeiro, como teste de integridade: o arquivo ficou byte-identico, sha256 igual antes e depois).
- [x] #2 `backlog task list` mostra apenas To Do e In Progress: TASK-36, TASK-50, TASK-55 (e a propria TASK-35 sai em seguida).
- [x] #3 Nenhum id e reutilizado: `archive` move sem renumerar e o proximo id livre continua sendo TASK-56.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-08T00:42:00Z

---

Arquivamento executado em 2026-11-08. 51 tarefas Done movidas para backlog/archive/tasks/, uma a uma com `backlog task archive`. TASK-3 foi o teste de integridade: sha256 identico antes e depois (o comando move, nao reescreve).

---

O numero do titulo estava defasado (26); o correto era 51. Ficam em backlog/tasks/ apenas TASK-36 (In Progress), TASK-50 e TASK-55 (To Do) — e a propria TASK-35, arquivada em seguida.

Reconciliacao previa: TASK-53. As quatro tasks que ficam Done com AC aberto (TASK-3 AC-2, TASK-17 AC-2/4/5, TASK-27 AC-2) tem a razao registrada na propria task; o arquivamento nao esconde AC sem explicacao.

---
<!-- COMMENTS:END -->
