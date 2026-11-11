---
id: TASK-105
title: >-
  skill: o corpo do implement-from-prompt assume prompt, o corpus exercita
  pedido solto
status: Done
assignee: []
created_date: '2026-11-11T13:05:00Z'
updated_date: '2026-11-11T14:46:00Z'
labels: []
dependencies: []
references:
  - skills/implement-from-prompt/SKILL.md
  - docs/specs/SPEC-0068-the-skill-that-never-loaded.md
priority: medium
type: task
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0068 (open question registrada, corpo nao tocado). A description agora anuncia 'fix a bug with a regression test', mas o corpo abre com 'This skill starts from prompt artifacts' e o passo 2 pede 'the requested implementation prompt'. Os draws #10 r1/r4 passaram sem prompt nenhum. Decidir: (a) o corpo diz o que faz o papel do prompt num pedido solto (o proprio pedido, com a regra write-target vs read-dependency), ou (b) a description para de anunciar isso. Uma edicao de corpo, com evidencia do corpus.
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-11T14:46:35.380Z

---

Done via SPEC-0070 (merge em main). Nenhuma mudanca no corpo: 11 draws carregados com pedido solto (#9 4, #10 2, #12 5), 7 mencionam a regra de prompt-artifacts, 0 pararam por causa dela, 4 limpos. #9/#10 implementam; #12 para e pergunta, que e o esperado. Corpo byte-identico (tree 9147487f), zero draw. Caso 2 continua redirecionando (11/12 nomeiam write-implementation-prompt, r12 para sem nomear). Condicao de reabertura: um draw carregado que pare/redirecione onde o caso mede que o trabalho deve ser feito.

---
<!-- COMMENTS:END -->
