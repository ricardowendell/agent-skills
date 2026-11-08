---
id: TASK-57
title: 'spike: refinamento localizado sem spec completa (quick-refine)'
status: To Do
assignee: []
created_date: '2026-11-08T00:48:00Z'
labels: []
dependencies:
  - TASK-56
references:
  - https://github.com/ricardowendell/agent-skills/issues/7
priority: high
type: task
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: issue #7 (P0, spike), 2026-11-08. Hipotese: um procedimento opcional de refinamento de baixo risco reduz overhead sem relaxar limites de edicao. Bloqueado pela TASK-56: sem corpus discriminativo, o spike nao tem como provar ganho. Se a fatia da 0.7.0 mostrar que implement-from-prompt ja cobre os casos, o spike fecha como 'do not add skill'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tres casos: alteracao visual low-risk, pequena mudanca funcional, e pedido inseguro (recusado ou escalado ao fluxo formal).
- [ ] #2 Teste negativo detecta alteracao em auth/policy ou arquivo fora do escopo.
- [ ] #3 O agente nao afirma teste executado sem saida real, e nao inventa status de spec.
- [ ] #4 Medicao compara baseline atual com o procedimento, no mesmo commit, modelo e ambiente, com repeticoes.
- [ ] #5 Sem ganho real, o spike encerra com 'do not add skill' documentado; se houver ganho, a recomendacao e estender implement-from-prompt ou criar skill, com a decisao registrada.
- [ ] #6 implement-from-prompt preserva comportamento e testes atuais.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-08T01:41:00Z

---

Groomed em 2026-11-08 para docs/specs/active/SPEC-0035-quick-refine-spike.md (status: ready, depende de SPEC-0034). Condicao de parada: se a SPEC-0034 mostrar que o incumbent cobre os 4 casos, a spec fecha como 'do not add skill' com zero draws. Extensao e a hipotese preferida; skill nova exige razao escrita.

---
<!-- COMMENTS:END -->
