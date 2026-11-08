---
id: TASK-60
title: 'skill: revisao de experiencia (read-only) com evidencia e limites'
status: To Do
assignee: []
created_date: '2026-11-08T00:48:00Z'
labels: []
dependencies:
  - TASK-56
  - TASK-61
references:
  - https://github.com/ricardowendell/agent-skills/issues/10
priority: medium
type: task
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: issue #10 (P1), 2026-11-08. Revisao da experiencia observada, read-only, que nao substitui review-code nem gates deterministicos. Sem browser ou preview, declara cobertura parcial em vez de aprovar. Bloqueada pela TASK-56 e pela TASK-61 (oraculo visual): os achados precisam de evidencia reproduzivel, e o que nao for mensuravel permanece unverifiable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fixture com botao sem nome acessivel e sem estado de erro produz achados reproduziveis.
- [ ] #2 Sem navegador, screenshot ou preview, indica cobertura incompleta e nao conclui aprovacao.
- [ ] #3 Operacao read-only: nao altera codigo, assets, policy nem gates.
- [ ] #4 A avaliacao distingue violacao comprovavel de preferencia estetica e registra falso positivo.
- [ ] #5 Nunca aprova merge, muda policy ou publica.
- [ ] #6 Cada finding vincula evidencia concreta; unknown continua explicito.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-08T01:44:00Z

---

Groomed em 2026-11-08 para docs/specs/active/SPEC-0038-experience-review.md, status: draft. Bloqueio: mesmo oraculo visual da SPEC-0036, mais um contrato de preview autorizado que o repo ainda nao tem.

---
<!-- COMMENTS:END -->
