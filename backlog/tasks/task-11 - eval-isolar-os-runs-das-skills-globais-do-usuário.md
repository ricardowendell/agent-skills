---
id: TASK-11
title: 'eval: isolar os runs das skills globais do usuário'
status: To Do
assignee: []
created_date: '2026-11-02T18:20:00Z'
updated_date: '2026-11-02T18:20:00Z'
labels: []
dependencies: []
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Achado ao medir a TASK-10: o harness não isola o run das skills instaladas na máquina.

Evidência, 2026-11-02: scratch vazio, nenhuma skill staged, o agente lista **22 skills globais** em **3 de 3** execuções — incluindo `implement-from-prompt`, a skill sob teste. O `scrubEnv` remove `OPENCODE*` e `AI_AGENT`, mas não isola o diretório de configuração, então a descoberta global continua acontecendo.

Por que importa, em ordem de gravidade:

1. **Diluição.** O agente vê 23 skills para escolher; a taxa de 23% de runs que não carregam nenhuma (TASK-10) tem aqui um candidato a causa que ainda não foi testado.
2. **Caso #6 pode passar por engano.** Ele afirma `notskill implement-from-prompt`; se o agente carregar `write-implementation-prompt` ou outra skill qualquer, o caso continua verde e ninguém vê.
3. **Armadilha de proveniência.** O gate exige a cópia staged dentro do scratch. Uma execução que carregue a cópia global do mesmo id é reportada como "não carregou", o que é falso — hoje não aconteceu, mas o id duplicado existe.

Testado e descartado: não existe opção de configuração para desligar a descoberta global. `skills` só aceita caminhos adicionais (`paths`, `urls`) e a permissão `skill` filtra chamadas, não a listagem — verificado no schema de `https://opencode.ai/config.json`.

O que sobra é isolar por ambiente (config/XDG próprios, com provider e auth copiados). Isso também desliga plugins (`rtk`, `mem`, `pdlc`), e o plugin `rtk` reescreve comandos de shell — ou seja, mudar o ambiente muda o que se mede. A task começa medindo esse custo antes de adotar.

Ordem: medir a taxa de carregamento com n≥12 por caso no ambiente atual (baseline da TASK-10), isolar, remedir com a mesma n. Só adotar se a taxa melhorar e nenhum plugin dos que afetam comportamento tiver sido perdido em silêncio.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ambiente isolado que ainda autentica no provider e mantém os plugins que afetam o comportamento medido, ou registro explícito do que foi perdido
- [ ] #2 taxa de carregamento remedida com n≥12 por caso, antes/depois, no mesmo modelo e nível
- [ ] #3 nenhum caso passa a aceitar run sem skill, e o gate continua exigindo a cópia staged
- [ ] #4 se a isolação não melhorar a taxa, registra-se o resultado negativo e a TASK-10 fica como está
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T18:20:00Z

---

Aberta no lugar de um conserto apressado. Trocar o ambiente de execução é trocar o instrumento, e a medição da TASK-9 depende dele — então a mudança precisa provar que melhora a taxa antes de virar padrão.
<!-- COMMENTS:END -->
