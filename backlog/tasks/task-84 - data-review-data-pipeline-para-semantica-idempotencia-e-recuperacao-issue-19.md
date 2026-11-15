---
id: TASK-84
title: >-
  data: review-data-pipeline para semantica, idempotencia e recuperacao (issue
  #19)
status: Done
assignee: []
created_date: '2026-11-10T15:07:00Z'
updated_date: '2026-11-15T18:03:00Z'
labels: []
dependencies:
  - TASK-78
  - TASK-80
  - TASK-81
  - TASK-83
references:
  - https://github.com/ricardowendell/agent-skills/issues/19
priority: high
type: spike
ordinal: 84000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: issue #19 (P1, spike), 2026-11-10. Revisao de diferencas semanticas em pipelines: grao/cardinalidade, joins, CDC/upsert, idempotencia, schema evolution, lineage e PII. Opt-in por arquivos de pipeline; reutilizar testes/planos existentes; decidir extend review-code vs compose vs build vs no-op. Depende de #15/#16/#18.
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-15T18:03:20.227Z

---

SPEC-0094: review/ops decides **do not add**, read from the two composition screens already merged (no new draw). join/quality: control 5/5 clean (2026-11-15T13-16-31--implement-from-prompt--without-skill) vs skill 3/5 scored / 4/5 behavioural (2026-11-15T13-21-22--implement-from-prompt) — the grain/cardinality fault is reached without a skill, so extending review-code has no measured delta there. migration: skill 1/5 (2026-11-15T14-06-13--implement-from-prompt) vs control 2/5 (2026-11-15T13-56-31--implement-from-prompt--without-skill), 10/10 draws re-pointed the state and 0/10 touched the fault body — a builder gap with no rate, already owned by the build in decision.md §4 (TASK-82). compose is contradicted by the 3/5 and 1/5 skill arms; build for review/ops is not underwritten. No review-code file changed; decision.md §4, coverage.md and CHANGELOG.md carry the result. Closes on the negative result.

---
<!-- COMMENTS:END -->
