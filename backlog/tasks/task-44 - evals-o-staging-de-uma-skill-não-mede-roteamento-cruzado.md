---
id: TASK-44
title: 'evals: o staging de uma skill não mede roteamento cruzado'
status: Done
assignee: []
created_date: '2026-11-06T20:51:00Z'
updated_date: '2026-11-06T22:21:00Z'
labels: []
dependencies: []
references:
  - docs/evals/pipeline-bookends-matrix.md
priority: medium
type: task
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Medido na SPEC-0026: capture-idea #3 exige que process-inbox carregue, e process-inbox #3 exige que capture-idea carregue; o fixture.mjs copia só a skill sob revisão para o scratch, então os dois casos dão 0/4 e 0/5 por construção, não por comportamento da skill. Afeta também o par equivalente em outras skills com roteamento entre si. Decidir entre: (a) stagear a skill irmã nomeada pelo caso, com a superfície de medição registrada; (b) trocar a asserção de skill tool por asserção de reply; (c) marcar os casos como manual até o runner suportar multi-skill staging. A escolha muda o que 'skillGate' significa, então precisa de spec própria e de antes/depois.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Os dois casos de roteamento cruzado deixam de ser 0/N por construção: ou medem o roteamento de verdade, ou ficam manual com motivo escrito.
- [x] #2 A superfície de medição (quais skills são staged) fica registrada no run e no coverage.md.
- [x] #3 Um caso que não pode passar no ambiente limpo não é publicado como falha da skill.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T22:21:00Z

---

Fechada pela SPEC-0029 (merge). AC-1: capture-idea #3 e process-inbox #3 medem roteamento de verdade, 5/5 cada com a irma staged (runs 2026-11-06T19-06-50 e 19-09-27, findings=0 isolated=yes); a skill do braco nao carrega, entao o passe e roteamento. AC-2: stagedSkills com id e hash no result e no manifest, e a matriz/coverage dizem o que estava staged. AC-3: com o staging declarado os dois casos deixam de ser 0/N por construcao; nenhuma assercao enfraquecida e o controle ignora a declaracao.

---
<!-- COMMENTS:END -->
