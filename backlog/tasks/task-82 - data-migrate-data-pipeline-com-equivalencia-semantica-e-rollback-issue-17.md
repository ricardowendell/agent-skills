---
id: TASK-82
title: 'data: migrate-data-pipeline com equivalencia semantica e rollback (issue #17)'
status: Done
assignee: []
created_date: '2026-11-10T15:07:00Z'
updated_date: '2026-11-15T17:59:00Z'
labels: []
dependencies:
  - TASK-78
references:
  - https://github.com/ricardowendell/agent-skills/issues/17
priority: high
type: spike
ordinal: 82000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: issue #17 (P1, spike), 2026-11-10. Discovery de dependencias, baseline/golden datasets, migracao em fatias, execucao paralela/reconciliacao e cutover reversivel. Fixture offline multiestagio com retry e mapeamento duplicado; detectar duas falhas semanticas. Compor skills de plataforma antes de criar.
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-14T11:15:01.907Z

---

Instrumento entregue, capacidade nao. A SPEC-0089 (0.9.4) adicionou migration-sliced-cutover (duas falhas independentes: mapping duplicado e rollback incompleto) e a negativa negative-safe-cutover, com exit codes provados e sem draw. Falta a decisao do candidato (skill nova vs compor existentes) e a medicao A/B; por isso o merge da spec nao fecha esta task.

---
<!-- COMMENTS:END -->
