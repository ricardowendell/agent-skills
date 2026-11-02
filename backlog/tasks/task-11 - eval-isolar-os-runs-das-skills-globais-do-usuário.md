---
id: TASK-11
title: 'eval: isolar os runs das skills globais do usuário'
status: Done
assignee: []
created_date: '2026-11-02T18:20:00Z'
updated_date: '2026-11-02T18:40:00Z'
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
- [x] #1 ambiente isolado que ainda autentica no provider e mantém os plugins que afetam o comportamento medido, ou registro explícito do que foi perdido
- [x] #2 taxa de carregamento remedida com n≥12 por caso, antes/depois, no mesmo modelo e nível
- [x] #3 nenhum caso passa a aceitar run sem skill, e o gate continua exigindo a cópia staged
- [x] #4 se a isolação não melhorar a taxa, registra-se o resultado negativo e a TASK-10 fica como está
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T18:20:00Z

---

Aberta no lugar de um conserto apressado. Trocar o ambiente de execução é trocar o instrumento, e a medição da TASK-9 depende dele — então a mudança precisa provar que melhora a taxa antes de virar padrão.
---

Fechada em 2026-11-02, com a isolação adotada como padrão.

**Ambiente** (AC-1). O filho recebe um HOME descartável: entradas de config são symlinkadas (plugins, vendor, node_modules, json), diretórios de estado compartilhado são symlinkados para fora (`.local`, `.secrets`, `.bun`, `.gitconfig`, `.npm`), e `skills` é a única entrada deixada de fora. Nada é copiado, então não há custo por run, e o cleanup remove links — nunca os alvos. Provider autentica, plugins carregam. Verificado: o agente passa a ver 1 skill da corpus + 2 built-ins do OpenCode, contra 23 antes.

**Efeito** (AC-2). Mesmo modelo, mesmo nível, mesmo instrumento, 12 repetições por caso:

| caso | antes (home real) | depois (home isolado) |
| --- | --- | --- |
| #8 | 10/12 | **12/12** |
| #7 | 8/12 | **12/12** |

Os 6 misses em 24 viraram 0 em 24. A taxa de 23% da TASK-10 não era do modelo nem da descrição da skill: era do ambiente com 22 skills concorrendo.

**Gate** (AC-3). `--no-skill` continua negando a ferramenta e o gate continua exigindo a cópia staged. A isolação só remove concorrentes; não afrouxa nada.

**Custo** (AC-1, o que foi perdido). O `~/.agents` deixa de existir no HOME do agente, então um caso que peça para rodar um script do harness falharia. Nenhum caso faz isso hoje. `--no-isolate` reproduz o ambiente antigo quando a comparação histórica exigir.

Implementação em `scripts/lib/evals/isolation.mjs`, ligada por padrão no CLI e no provider do Promptfoo, com 3 testes próprios.
<!-- COMMENTS:END -->
