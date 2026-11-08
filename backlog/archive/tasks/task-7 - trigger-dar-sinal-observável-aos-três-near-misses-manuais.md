---
id: TASK-7
title: 'trigger: dar sinal observável aos três near-misses manuais'
status: Done
assignee: []
created_date: '2026-11-01T22:53:00Z'
updated_date: '2026-11-02T15:43:00Z'
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
- [x] #1 cada um dos três tem asserção de resultado observável ou justificativa registrada no caso
- [x] #2 nenhum caso fica vermelho por ruído de carregamento
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T14:49:00Z

---

Groomed em 2026-11-02: docs/specs/SPEC-0004-observable-near-misses.md (ready) e docs/prompts/SPEC-0004-observable-near-misses.prompt.md. Os três casos ganham fixture (hoje nenhum deles tem: #4 e #5 não têm diretório de fixture e #3 não tem git.json, então a 'outcome' que a task pedia não existia para ser medida). A asserção notskill sai e vira estado de arquivo: plan.md intocado, eslint.config.js/justfile intocados, outros docs intocados e nenhum ADR criado.

---

created: 2026-11-02T15:43:00Z

---

Implementado em 2026-11-02 (SPEC-0004). Os três casos ganharam fixture e asserção de resultado: find-blind-spots #4 (plan.md + AGENTS.md), tighten-harness #5 (src/huge.js de 120 linhas, eslint.config.js, justfile, package.json) e audit-docs #3 (git.json + change.patch reescrevendo só docs/architecture.md). notskill saiu dos três; agora o que se mede é plan.md intocado e nenhum spec/prompt, config/runner/AGENTS.md intocados, e o resto dos docs intocado sem ADR nem spec. Medido 3/3 em cada um: find-blind-spots carregou a skill em 3/3 runs e passou; tighten-harness em 0/3 e passou; audit-docs em 3/3 (uma vez junto com review-code) e passou. O carregamento não decide mais nada — fica registrado no transcript. Totais: 63 casos, 58 executáveis, 5 manuais.

---
<!-- COMMENTS:END -->
