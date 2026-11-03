---
id: TASK-13
title: 'eval: testar o caminho de execução com agente injetável'
status: Done
assignee: []
created_date: '2026-11-02T18:55:00Z'
updated_date: '2026-11-03T09:05:00Z'
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
- [x] #1 `executeCase` aceita um agente injetável, com o comportamento atual como padrão
- [x] #2 teste cobre `arm → gate` nos três casos: with-skill, without-skill e `gate: off`
- [x] #3 teste cobre a classificação: timeout, exit diferente de zero e caso sem asserção
- [x] #4 `agent.mjs` testado: `scrubEnv` remove `OPENCODE*` e `AI_AGENT`, `agentArgs` monta os argumentos na ordem esperada
- [x] #5 `node --test` verde e CI continua estático, sem subir modelo
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T18:55:00Z

---

Aberto a partir da revisão de dívida técnica. Prioridade: é o caminho que produziu todas as medições desta sessão, e a isolação recém-adicionada também passa por ele.
---

Fechada em 2026-11-03.

`executeCase` aceita `spawnAgent = runAgent` — a mesma costura que o `judge.mjs` já usava — e o padrão mantém todo chamador atual intacto. `execute.test.mjs` cobre dez casos com agente falso, sem subir modelo:

- gate nos três modos: cópia staged (passa), sem carga (falha com "was not loaded"), carga de fora do scratch (falha com "outside the scratch dir"), braço `--no-skill` com e sem carga, e `gate: off`;
- classificação: timeout → `failed` (não unscored), exit diferente de zero, caso sem asserção → `unscored`, e a razão nomeia a asserção que falhou;
- staging: a fixture e a cópia pinada estão no scratch antes do agente, e o prompt é o último argumento.

`agent.test.mjs` cobre `scrubEnv` (remove `OPENCODE*`/`AI_AGENT`, não muta a entrada) e `agentArgs` (ordem dos argumentos, `--model` antes do prompt, `--standalone` só quando pedido, agente alternativo).

Total: 123 testes verdes. O CI é estático e agora exercita o caminho que decide se um run passou — antes ele só era provado por rodada de 30 minutos com modelo.

Smoke depois da mudança: caso #8, 1 repetição, isolado — passou.
<!-- COMMENTS:END -->
