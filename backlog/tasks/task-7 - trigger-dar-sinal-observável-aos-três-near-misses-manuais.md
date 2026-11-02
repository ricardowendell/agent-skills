---
id: TASK-7
title: 'trigger: dar sinal observável aos três near-misses manuais'
status: To Do
assignee: []
created_date: '2026-11-01T22:53:00Z'
updated_date: '2026-11-02T14:49:00Z'
labels: []
dependencies: []
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Três near-misses ficaram status: manual porque o agente às vezes carrega a skill só para conferir se é o caso, e responde certo em seguida: find-blind-spots #4 (2/3 e 1/3 carregamentos), tighten-harness #5 (1/3) e audit-docs #3 (1/3 depois de a descrição separar auditoria de revisão de diff). O assert notskill mede curiosidade, não roteamento. Fix: trocar roteamento por resultado observável (arquivo intocado, nenhum ADR, nenhum spec criado) ou manter manual com a taxa medida.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 cada um dos três tem asserção de resultado observável ou justificativa registrada no caso
- [ ] #2 nenhum caso fica vermelho por ruído de carregamento
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T14:49:00Z

---

Groomed em 2026-11-02: docs/specs/SPEC-0004-observable-near-misses.md (ready) e docs/prompts/SPEC-0004-observable-near-misses.prompt.md. Os três casos ganham fixture (hoje nenhum deles tem: #4 e #5 não têm diretório de fixture e #3 não tem git.json, então a 'outcome' que a task pedia não existia para ser medida). A asserção notskill sai e vira estado de arquivo: plan.md intocado, eslint.config.js/justfile intocados, outros docs intocados e nenhum ADR criado.

---
<!-- COMMENTS:END -->
