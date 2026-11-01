---
id: TASK-6
title: 'bootstrap-project-harness: medir o caminho harness completo -> parar'
status: To Do
assignee: []
created_date: '2026-11-01T22:53:00Z'
labels: []
dependencies: []
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O caso 7 de bootstrap-project-harness registra o bloqueio no topo de references/evals.md: o runner estagia árvore plana sem histórico, então a skill lê o repo como vazio e roda bootstrap completo em vez de parar quando o harness já existe. Duas limitações concretas: staging de histórico (parcialmente resolvido por git.json no stageFixture) e ausência de resposta para o passo de aprovação, que hoje faz qualquer caminho interativo virar manual.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 um caso usa git.json com commit base e chega ao ramo 'harness completo, parar'
- [ ] #2 o passo de aprovação tem uma resposta estagiada, explícita no caso
- [ ] #3 os casos manuais que viraram executáveis saem de status: manual
<!-- AC:END -->
