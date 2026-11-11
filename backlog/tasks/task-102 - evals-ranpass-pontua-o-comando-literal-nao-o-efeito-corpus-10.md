---
id: TASK-102
title: 'evals: ranpass pontua o comando literal, nao o efeito (corpus #10)'
status: Done
assignee: []
created_date: '2026-11-11T09:57:00Z'
updated_date: '2026-11-11T12:00:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/assertions.mjs
  - evals/implement-from-prompt/cases.md
  - docs/evals/iterative-corpus.md
priority: high
type: task
ordinal: 102000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0034, caso #10 r1 (2026-11-11). A assertion ranpass compara a regex contra input.command; o modelo rodou 'npm test', que o package.json do fixture mapeia para 'node --test', e o teste passou (pass 3, exit 0). A assertion exigia o literal 'node --test' e marcou vermelho: o corpus publicou por um tempo que o incumbent 'nunca rodou a suite'. Mesma classe do vocabulario do verdict (SPEC-0062): o oraculo pontua o token, nao o comportamento. Decidir: aceitar a cadeia npm->script, ou exigir o comando literal e documentar; re-julgar #10 r1 por replay (zero draw).
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-11T11:29:40.955Z

---

Groomed as SPEC-0066. Segundo defeito da mesma classe, medido no store: 33 chamadas com '; echo "exit: $?"' ou pipe que tomam o status, e 5 onde o exit gravado (0) contradiz o que o comando imprimiu (1-3). ranpass pode ficar verde num suite vermelho. Entra no escopo: resolver a cadeia de script pelo package.json do fixture e ler o status impresso, falhando fechado quando nao houver. Republica por replay, zero draw.

---

created: 2026-11-11T12:40:05.620Z

---

Done via SPEC-0066 (merge em main). ranpass/ran resolvem a cadeia de script pelo package.json do fixture e leem o efeito: exit proprio quando atribuivel, senao o status impresso, senao os contadores do runner; sem evidencia, vermelho. Republicado por replay: implement-from-prompt #10 com skill 1/5 -> 2/5 (r1). Nenhum outro numero mudou nos 355 runs. Zero draws. 544 testes.

---
<!-- COMMENTS:END -->
