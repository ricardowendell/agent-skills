---
id: TASK-10
title: 'implement-from-prompt: medir por que a skill não carrega em parte dos runs'
status: To Do
assignee: []
created_date: '2026-11-02T20:10:00Z'
updated_date: '2026-11-02T20:10:00Z'
labels: []
dependencies: []
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fechando a TASK-9, o caso #8 de `implement-from-prompt` ficou vermelho por um motivo que não é o comportamento medido: em parte das execuções a skill simplesmente não carrega.

Dados de 2026-11-02, todos os runs de `implement-from-prompt` com gate registrado: 30 repetições, 3 sem carregar. As três estão no caso #8, cujo prompt é `Implement docs/prompts/SPEC-0021-format-currency.prompt.md.` — a mesma forma dos casos #1 e #7, que carregaram em 22 de 22.

Taxa: 3/8 no #8, 0/22 nos outros. Amostra pequena, então a hipótese de ser específico do caso #8 não está estabelecida; pode ser variância do modelo. O transcript de uma execução perdida mostra 10 chamadas de ferramenta — ler AGENTS.md, listar a árvore, rodar `node --test`, reportar — e nenhuma chamada ao `skill`. Não é falha do gate: é decisão de não carregar.

Por que isso importa mais do que parece: um run sem skill é indistinguível de "a skill não ajudou" no agregado. Se a taxa for real, todo número de melhoria fica contaminado por ela.

Fix provável, em ordem: (a) nada, se for variância — então o caso precisa de mais repetições e o número fica documentado; (b) descrição, se o agente não reconhece o gatilho; (c) caso, se o fixture sugerir que a tarefa é pequena demais para valer a skill.

Não vale afrouxar o gate. O `skill`/`notskill` media roteamento e é o que impede um run anônimo de passar por run da skill.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 taxa de carregamento medida por caso (#1, #5, #6, #7, #8) com repetições suficientes para não ser ruído
- [ ] #2 causa identificada com evidência de transcript, ou registrada como variância se a taxa não se reproduzir
- [ ] #3 uma mudança só (descrição, caso, ou nenhuma), medida antes/depois nos mesmos casos
- [ ] #4 gate de skill preservado: nenhum caso passa a aceitar run sem skill
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T20:10:00Z

---

Aberto ao fechar a TASK-9, que entregou a primeira melhoria medida e encontrou isto no caminho. O caso #8 fica vermelho por near-miss, não por comportamento — e deixá-lo assim esconde a diferença entre "a skill falhou" e "a skill não foi chamada", que é justamente o que o harness existe para distinguir.
<!-- COMMENTS:END -->
