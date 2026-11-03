---
id: TASK-21
title: 'review-code: fixture de gate vermelho para cobrir o caminho de REJECT'
status: To Do
assignee: []
created_date: '2026-11-03T11:05:00Z'
updated_date: '2026-11-03T11:05:00Z'
labels: []
dependencies: []
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Achado do mapa de cobertura da SPEC-0006 (`docs/evals/experiments/mutation/review-code/rule-coverage.md`). A regra "nunca aprovar com gate vermelho ou não rodado" tem **metade do contrato coberta**: o caso #1 prova o caminho verde (`ranpass npm test`), e nenhum caso apresenta um gate vermelho esperando REJECT.

Isso não apareceu na lista de "sem asserção" porque a regra tem asserção — só que para a metade fácil. O caminho de falha é o que impede um merge ruim, e é justamente o que ninguém mede.

Não é lacuna de asserção: é de fixture. Uma asserção nova não tem contra o que falhar enquanto um caso não encenar um gate vermelho.

O que o caso precisa:

- um projeto pequeno com `npm test` (ou equivalente) que **falha** de forma reproduzível, sem depender de instalação de dependências;
- um prompt de revisão legítimo, com spec e diff;
- asserções de estado: `verdict REJECT`, `ranpass` (o gate foi executado e falhou), e a spec/diff intocados.

Cuidado com o que a mutação ensinou: o defeito precisa ser **manifestável**. Um fixture onde o agente roda o gate e vê a falha é o mínimo; se o gate não roda, o caso mede outra coisa.

Cuidado com a discriminação, aprendido no controle da SPEC-0006: se o prompt ou o `AGENTS.md` do fixture declararem "`npm test` must pass", o braço sem skill também roda o gate e rejeita, e o caso mede o fixture em vez da skill. O gate vermelho precisa ser o único defeito do fixture.

A spec #1 (matriz) e o #2 mostram que o corpus prefere fixtures com defeito de AC. Este é diferente: o defeito está no gate, não no código.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 caso novo com gate que falha por motivo reproduzível e local, sem install
- [ ] #2 asserção exige `verdict REJECT` e prova de que o gate foi executado (`ranpass`), não apenas citado
- [ ] #3 rodado 3 vezes; se o agente aprovar mesmo assim, o defeito é da skill e vira task própria
- [ ] #4 `--list --check` continua verde e o caso entra como runnable
- [ ] #5 a matriz é atualizada com o caso e a taxa
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-03T11:05:00Z

---

Aberta a partir do mapa de cobertura da SPEC-0006. É a lacuna que o piloto de mutação encontrou sem precisar rodar mutação: a regra existe, a asserção existe, o fixture não.
<!-- COMMENTS:END -->
