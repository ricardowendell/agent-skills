---
id: TASK-13
title: 'eval: testar o caminho de execução com agente injetável'
status: To Do
assignee: []
created_date: '2026-11-02T18:55:00Z'
updated_date: '2026-11-02T18:55:00Z'
labels: []
dependencies: []
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Os dois módulos que decidem se um run passou são os únicos sem teste: `scripts/lib/evals/execute.mjs` (103 linhas) e `scripts/lib/evals/agent.mjs` (75). Dos 14 módulos da lib, 12 têm `.test.mjs`; esses dois não.

Não é só falta de cobertura. `executeCase` chama `runAgent` direto, então não há como testá-lo sem subir um agente de verdade — e o CI é estático de propósito, então na prática nunca é testado. O `judge.mjs` já resolveu o mesmo problema: recebe `spawnAgent = runAgent` como parâmetro injetável (linha 188).

O que fica sem prova hoje: a matriz `arm → gate` (with-skill exige a cópia staged, without-skill exige zero cargas, `gate: off` ignora), a classificação de saída (timeout, exit != 0, zero asserções → unscored) e a construção de argumentos/ambiente do `agent.mjs`.

Custo: passar `spawnAgent` como parâmetro e escrever os testes com um agente falso que devolve transcritos fixos.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `executeCase` aceita um agente injetável, com o comportamento atual como padrão
- [ ] #2 teste cobre `arm → gate` nos três casos: with-skill, without-skill e `gate: off`
- [ ] #3 teste cobre a classificação: timeout, exit diferente de zero e caso sem asserção
- [ ] #4 `agent.mjs` testado: `scrubEnv` remove `OPENCODE*` e `AI_AGENT`, `agentArgs` monta os argumentos na ordem esperada
- [ ] #5 `node --test` verde e CI continua estático, sem subir modelo
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T18:55:00Z

---

Aberto a partir da revisão de dívida técnica. Prioridade: é o caminho que produziu todas as medições desta sessão, e a isolação recém-adicionada também passa por ele.
<!-- COMMENTS:END -->
