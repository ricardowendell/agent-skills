---
id: TASK-36
title: 'harness: pdlc não marca a task vinculada no dispatch/verify'
status: To Do
assignee: []
created_date: '2026-11-05T20:55:00Z'
updated_date: '2026-11-06T11:25:00Z'
labels: []
dependencies: []
references:
  - https://github.com/ricardowendell/pdlc
priority: medium
type: task
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Em dois ciclos seguidos o pdlc disse 'não foi possível marcar SPEC-0016 como In Progress' e repetiu para In Review, embora a spec declare task: TASK-26. O vínculo por slug não resolve o task: do frontmatter; a task foi marcada à mão nas duas vezes. Investigar src/backlog.mjs do pdlc e decidir entre corrigir upstream e documentar o workaround.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Causa identificada no codigo do pdlc (resolucao de slug vs task:).
- [ ] #2 Um ciclo de teste marca a task certa sem edicao manual.
- [ ] #3 Se a correcao for upstream, o workaround local fica documentado no AGENTS.md.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T11:25:00Z

---

Segunda ocorrencia (SPEC-0017): o run record c791585e grava spec_sha d6d91033 (pin do dispatch), mas a spec merged tem 8c4a425b. A spec mudou durante o ciclo (files: + secao Results) e o record ficou com o sha antigo. Mesmo padrao da SPEC-0015 (b8115ea vs 7e180704). Investigar junto com o vinculo de task.

---
<!-- COMMENTS:END -->
