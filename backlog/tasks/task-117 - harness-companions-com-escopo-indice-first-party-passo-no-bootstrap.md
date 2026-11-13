---
id: TASK-117
title: 'harness: companions com escopo + indice first-party + passo no bootstrap'
status: Done
assignee: []
created_date: '2026-11-13T20:55:00Z'
updated_date: '2026-11-13T22:26:00Z'
labels:
  - harness
dependencies: []
priority: high
type: task
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: conversa de 2026-11-13 (apos 0.9.0). As skills oficiais medidas (datacontract) sao uma rota de processo; falta o mecanismo para (a) declarar companions com escopo global|projeto + sinal de deteccao + pin + evidencia, (b) agrupar as 15 skills first-party por tipo/dominio num indice unico (sem tocar frontmatter, para nao invalidar skillHash), e (c) um passo opt-in no bootstrap que le os sinais detectados, sugere a interseccao do manifesto e grava a declaracao no repo consumidor. Fronteira: organizacao interna do catalogo proprio, NAO o registry/taxonomia de selecao excluido pela #9.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 companion-skills.json fechado, com scope/signal/pin/license/evidence por entrada; so entram skills medidas.
- [ ] #2 skills.index.json agrupa as 15 first-party por escopo, sem editar frontmatter de SKILL.md.
- [ ] #3 O bootstrap ganha um passo opt-in (ask-first) que instala pinado e grava a declaracao no repo consumidor.
- [ ] #4 A edicao do bootstrap e screeningada (nao derruba o fluxo default) e a staleness e registrada honestamente na coverage.
<!-- AC:END -->
