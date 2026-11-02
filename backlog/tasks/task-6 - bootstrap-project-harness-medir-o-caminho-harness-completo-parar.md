---
id: TASK-6
title: 'bootstrap-project-harness: medir o caminho harness completo -> parar'
status: To Do
assignee: []
created_date: '2026-11-01T22:53:00Z'
updated_date: '2026-11-02T04:46:00Z'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Medição em 2026-11-02, três repetições: o agente leu o fixture como 'partial harness' e completou o que faltava, nos três runs. Motivo dado: eslint.config.js vazio, sem dependências instaladas, lefthook/justfile incompletos, docs faltando, typecheck falha. A tabela do SKILL.md define completo por existência de arquivos ('does lefthook.yml, .prettierrc, etc. exist'), mas o agente audita rodando os gates. Enquanto a definição for essa, um fixture sem toolchain instalada nunca parecerá completo — e instalar toolchain dentro do fixture não é aceitável. Próximo passo é decidir a definição (existência vs gates rodando) antes de construir o caso; o caso 14 foi revertido para não deixar vermelho medindo a coisa errada.
<!-- SECTION:NOTES:END -->
