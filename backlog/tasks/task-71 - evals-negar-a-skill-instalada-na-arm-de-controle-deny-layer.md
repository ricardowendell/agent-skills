---
id: TASK-71
title: 'evals: negar a skill instalada na arm de controle (deny layer)'
status: To Do
assignee: []
created_date: '2026-11-09T02:52:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O runner aceita --no-skill, mas a arm de controle ainda le a skill instalada em /Users/wendell/.agents/skills. Medido na SPEC-0045: a run 2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill saiu com skillLeaks=33 e hostReads=7 em 35 draws, isolated=no, e nenhuma celula comportamental chegou a cinco draws limpos. O mesmo bloqueio esta publicado em docs/evals/coverage.md para capture-idea (2026-11-07T08-27-30), groom-backlog (2026-11-06T07-47-34) e write-implementation-prompt (2026-11-07T08-17-29). Consequencia: hoje 'unresolved' significa 'o controle nao foi isolado', nao 'a skill nao separa'. A TASK-43 (Done) corrigiu so o detector e o checker; negar a leitura nunca foi AC dela, entao o coverage.md a cita como 'a metade deny-layer da TASK-43' e essa atribuicao esta errada.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A arm --no-skill nao consegue ler /Users/wendell/.agents/skills nem references/evals.md, e um draw que tenta produz finding nomeado
- [ ] #2 Um controle forcado a ler a skill instalada falha, provando que o deny e efetivo (canario)
- [ ] #3 Uma celula comportamental de cada skill com bloqueio publicado atinge cinco draws limpos e e reclassificada (separator, non-discriminator ou unresolved)
- [ ] #4 docs/evals/coverage.md deixa de atribuir o bloqueio a TASK-43 e aponta para esta task
<!-- AC:END -->
