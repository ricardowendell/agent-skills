---
id: TASK-34
title: 'evals: decidir audit-code-quality #4 e review-code #2'
status: Done
assignee: []
created_date: '2026-11-05T20:54:00Z'
updated_date: '2026-11-06T15:33:00Z'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Os dois estão publicados como regression case sem decisão registrada. audit-code-quality #4 só separa quando o controle quebra o contrato, e review-code #2 mediu 5/5 nos dois braços e saiu da matriz. Falta a decisão explícita: fica como guarda de regressão ou sai do corpus.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Cada caso recebe decisao explicita: fica como regressao ou sai do corpus.
- [x] #2 A decisao vai para coverage.md com o run dir que a sustenta.
- [x] #3 Nenhum caso fica classificado como discriminador sem separacao medida.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T15:33:00Z

---

Fechada pela SPEC-0023 (merge 61630c3). AC-1: Dispositions no coverage com decisao explicita para os dois — regression, nao removed. AC-2: review-code #2 cita 2026-11-02T10-27-26 e 10-31-40--without-skill (5/5 ambos); audit-code-quality #4 cita 21-57-53 (pre-contrato, 5 asserts), 21-59-17 with e without (8 asserts; 1/1 vs 0/1). AC-3: auditoria de separadores cobre implement-from-prompt #1/#8, review-code #1/#3/#4/#7, survey #1/#2 e audit-code-quality #1; nenhum promovido sem controle. A auditoria corrigiu dois numeros publicados: #4 nao separa 'as vezes' (o par final separou 1/1 vs 0/1, mas com 1 draw por braco) e #3 e 1/10 contra 10/10, nao 0/10.

---
<!-- COMMENTS:END -->
