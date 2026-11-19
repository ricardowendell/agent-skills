---
id: TASK-82
title: 'data: migrate-data-pipeline com equivalencia semantica e rollback (issue #17)'
status: Done
assignee: []
created_date: '2026-11-10T15:07:00Z'
updated_date: '2026-11-19T12:37:00Z'
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

created: 2026-11-15T18:13:12.863Z

---

O screen de composicao mediu 10/10 draws re-apontando o estado da fixture e 0/10 corrigindo connect/load_mapping/cutover; a decisao e build, com uma copia staged-only da fixture como primeira celula. O merge da SPEC-0093 fechou esta task mecanicamente; ela reabre porque a skill ainda nao existe.

---

created: 2026-11-19T12:37:15.354Z

---

Gap real era o switch. A celula staged-only (migration-staged-only, sem FIXTURE_STATE) foi medida em 2026-11-19 no repoSha d625d1e: controle 5/5 behavioural e 0/5 scored (2026-11-19T09-08-40--migrate-data-pipeline--without-skill) contra a skill 5/5 behavioural e 4/5 scored (2026-11-19T09-15-09--migrate-data-pipeline), classe nao-discriminador. A skill migrate-data-pipeline foi construida, medida e removida por nao ter delta; nenhuma skill embarcada, e o corpus volta ao estado da main — 121 casos apos o merge. O instrumento fica em docs/analysis/data-corpus/migration-staged-only/ e a decisao vira do not add em decision.md §4, com a historia (0/10 da 0.9.4, build, refutacao) e o limite do oraculo registrados. Task fecha como resultado negativo.

---
<!-- COMMENTS:END -->
