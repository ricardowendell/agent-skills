---
status: processed
processed_at: 2026-11-03 10:38
---

# agent-skills: guia prático de técnicas e prioridades

**Referência:** 2 de novembro de 2026.  
**Objetivo:** melhorar skills com evidência de comportamento e custo, aproveitando o runner existente.  
**Escopo:** plano de execução, exemplos e critérios de decisão; nenhum experimento foi executado para produzir este guia.

Este documento complementa a análise anterior de EGM. As seis técnicas abaixo têm evidência externa em níveis diferentes; sua aplicação a este repo é uma proposta, não um resultado já comprovado aqui. Os comandos do runner foram conferidos no código; caminhos em `experiments/` e formatos de relatório são sugestões novas.

## 1. Prioridades

| Ordem | Técnica | Primeira aplicação | Entrega pequena | Condição para começar |
| --- | --- | --- | --- | --- |
| 1 — P0 | Mutação de skills e dos verificadores | `review-code`, depois `groom-backlog` | 3 mutações relevantes e a evidência de detecção | Baseline válido dos casos escolhidos |
| 2 — P1 | Análise pareada de resgates, prejuízos e custo | Runs com e sem skill | Um relatório sobre os casos existentes | Artefatos comparáveis e completos |
| 3 — P1 | Ablação de contexto | Leituras de `groom-backlog` | Variante com leitura seletiva | Casos que exigem descobrir conflitos entre specs |
| 4 — P2 | Otimização reflexiva inspirada em GEPA | Uma skill com falhas recorrentes | No máximo 2 candidatas comparadas | Corpus discriminante e casos reservados |
| 5 — P2 | Regras objetivas em mecanismos executáveis | Readiness, hash e gates | Um sensor ou uso de um sensor existente | Regra estável que possa ser verificada por código |
| 6 — P3 | Execução cruzada de candidatos, inspirada em TEX | Bugs difíceis de implementação | Definição de entradas e saídas para o Forge | Runner de composição e orçamento definidos |

As ordens 1 e 2 podem ser invertidas se os resultados pareados já estiverem disponíveis: analisar artefatos custa menos que novas execuções. Não iniciar as seis frentes simultaneamente.

## 2. Preparação comum

Registrar o SHA do repo, hash da skill, modelo efetivamente resolvido, versão do harness, fixture, nível e repetição. Fixar o corpus durante cada comparação; trocar uma assertion exige distinguir resultados anteriores e posteriores.

Na raiz do repo, validar sem chamadas de modelo:

```bash
node scripts/validate-skills.mjs --root skills
node scripts/run-evals.mjs --root skills --list --check
node --test scripts/lib/evals/*.test.mjs
node scripts/check-sensor-parity.mjs
```

Para um piloto, usar uma skill, poucos casos e o modelo que você já utiliza. O custo depende do comprimento das trajetórias; contar execuções não substitui registrar custo e tokens.

Não expor `references/evals.md`, respostas esperadas ou fixtures de outros casos ao agente. Nas variantes, preservar as exclusões do staging. Manter o isolamento padrão do runner; não usar `--shared` ou `--no-isolate` para uma comparação normal.

## 3. P0 — verificar se os evals detectam skills defeituosas

### Resultado esperado

Descobrir quais regras importantes poderiam ser removidas sem que o corpus percebesse. O baseline precisa passar antes: uma mutation não é detectada por um caso que já falhava sem ela.

### Exemplo com review-code

| Mutação proposta | Fixture discriminante | Comportamento que o teste deve detectar |
| --- | --- | --- |
| Permitir aprovação sem rodar gates | Diff aparentemente correto, teste documentado executável | Aprovação sem evidência de execução é defeito |
| Ignorar divergência de `spec_sha` | Prompt carimbado antes de mudança da spec | Revisar como se o contrato fosse atual é defeito |
| Adotar intenção de revisão sem declaração do usuário | Branch sem spec e sem fallback autorizado | Emitir decisão em vez de reter o verdict é defeito |

Alterar uma regra por candidata e remover também instruções contraditórias sobre essa mesma regra. Caso contrário, o restante da skill pode compensar a mutation. Confirmar que a candidata continua carregável: erro de YAML ou falha de proveniência é falha do experimento, não detecção do defeito comportamental.

### Preparar variantes sem inventar uma flag no runner

O runner aceita `--root`; não é necessário criar `--variant` ou `--mutation`.

```bash
mkdir -p experiments/mutation/review-code/baseline/skills
mkdir -p experiments/mutation/review-code/no-gate/skills
cp -R skills/review-code experiments/mutation/review-code/baseline/skills/
cp -R skills/review-code experiments/mutation/review-code/no-gate/skills/
```

Editar apenas o `SKILL.md` da candidata `no-gate`. Os dois roots devem conter os mesmos casos e fixtures. Se adicionar um caso, adicioná-lo aos dois braços antes de executar. Manter as regras de exclusão dos evals do staging.

Exemplo focalizado no caso 1 existente; confirmar que ele continua sendo o caso relevante na revisão utilizada:

```bash
node scripts/run-evals.mjs --root experiments/mutation/review-code/baseline/skills --skill review-code --case 1 --repeat 3 --run
node scripts/run-evals.mjs --root experiments/mutation/review-code/no-gate/skills --skill review-code --case 1 --repeat 3 --run
```

Executar a mutation uma vez e inspecionar o trace antes de pagar pelas repetições. Se ela continuar cumprindo a regra, o resultado é inconclusivo sobre a sensibilidade do teste; não force um modelo a falhar para produzir uma porcentagem bonita.

### Critério para encerrar

Classificar cada mutation como detectada, sobrevivente ou inválida. Para sobreviventes, registrar se o defeito foi manifestado e não detectado ou se o agente não manifestou o defeito. Criar novos casos apenas para lacunas relevantes. Um piloto de três mutações é suficiente para decidir o próximo passo; não instalar uma plataforma de mutation testing de prompts agora.

## 4. P1 — medir resgates e prejuízos, não apenas médias

O repo já tem `--no-skill`, repetições e evidência de carregamento. Começar reaproveitando esses dados.

### Como fazer

1. Selecionar runs do mesmo caso, fixture, modelo, nível e política de orçamento.
2. Verificar que a skill correta foi carregada no braço tratado e que o controle não carregou skills.
3. Separar qualidade do resultado, cumprimento do protocolo e routing. Requisitos próprios da skill, como o seu carregamento, não servem como medida compartilhada de utilidade do controle.
4. Comparar taxas por caso nas repetições. Não escolher pares vencedores depois de ver os resultados.
5. Mostrar custo também nos casos em que o resultado final não mudou.

Para novas medições, comandos já existentes:

```bash
node scripts/run-evals.mjs --root skills --skill review-code --repeat 3 --run
node scripts/run-evals.mjs --root skills --skill review-code --repeat 3 --run --no-skill
```

Esses comandos podem executar mais casos do que um piloto precisa. Usar `--case` para restringir e alternar a ordem dos braços em blocos, reduzindo efeitos de variação do provedor. Confirmar a política atual de isolamento no trace do controle.

### Exemplo de interpretação — números fictícios

| Grupo | Com skill | Sem skill | Decisão |
| --- | --- | --- | --- |
| Contrato desatualizado | Recusa consistente | Não percebe mudança | Manter proteção específica |
| Bug evidente na lógica | Detecta | Detecta | Não atribuir ganho de diagnóstico à skill |
| Alteração simples | Correta, 12 ações | Correta, 4 ações | Investigar procedimento desnecessário |

O efeito condicionado ao carregamento, inspirado no RAE, é informativo, mas não substitui o resultado do sistema inteiro: mostrar também casos em que a skill deveria ter sido carregada e não foi. Não confundir uma comparação de grupos diferentes com efeito causal da skill.

### Critério para encerrar

Uma página com quais procedimentos ajudam, quais acrescentam custo e quais casos não discriminam. Automatizar a classificação só se a análise manual se repetir. Não é necessário alterar o formato canônico dos evals para começar.

## 5. P1 — reduzir contexto por experimento

### Hipótese

Ler um índice e as specs relacionadas pode preservar os resultados de `groom-backlog` com menos leitura que a instrução atual de ler todas as specs. Isso pode falhar quando a relação importante não aparece no índice; o corpus precisa capturar esse risco.

### Exemplo de candidata

```text
Antes de escrever:
1. Leia AGENTS.md e localize as fontes normativas.
2. Consulte o índice de specs e busque termos da funcionalidade.
3. Leia as specs, ADRs e jornadas relacionadas.
4. Expanda a busca se houver dependência, sobreposição ou conflito.
5. Mantenha a spec draft se uma lacuna bloqueante não puder ser resolvida.
```

Esse texto é uma proposta para teste, não uma substituição já aprovada. Se não existir índice confiável, usar busca e links existentes antes de criar outra fonte de verdade.

### Casos mínimos

- Item simples com documentação suficiente.
- Spec relacionada que redefine um termo importante.
- Conflito em uma spec cujo título não contém as palavras do item.
- Repo com layout diferente do padrão.

Usar roots separados como no experimento de mutation. Registrar leituras observadas, tokens quando disponíveis e resultado. Arquivo disponibilizado não equivale a arquivo lido.

### Critério para continuar

Nenhuma regressão crítica observada e redução de custo ou ações em mais de um caso; repetir antes de promover. Se a economia depende de deixar um conflito passar, rejeitar a candidata.

## 6. P2 — otimizar uma skill com reflexão sobre falhas

### Começar manualmente, com o mecanismo do GEPA

Escolher `groom-backlog` ou `write-implementation-prompt` apenas se houver uma falha recorrente e um caso que a detecte. Não começar por otimizar uma skill que já passa tudo num corpus pouco discriminante.

Separar três conjuntos: desenvolvimento, seleção e teste reservado. O otimizador vê os traces de desenvolvimento; seleção limita o número de candidatas; o teste reservado é usado uma vez para a decisão final. Se os dados forem poucos, declarar a limitação em vez de criar uma falsa precisão.

Prompt sugerido para produzir uma candidata:

```text
Analise a skill e os traces de desenvolvimento fornecidos.
Identifique uma causa recorrente, citando a evidência.
Proponha a menor edição capaz de corrigir essa causa.
Não altere permissões, regras de aprovação, proveniência nem verificadores.
Não codifique nomes ou respostas das fixtures na skill.
Entregue o diff e a hipótese; não declare que melhorou sem medição.
```

Isso é otimização reflexiva manual inspirada em GEPA, não uma execução do algoritmo GEPA. Adotar a biblioteca só quando automatizar a busca reduzir trabalho real. Evitar criar um segundo runner: o avaliador continua sendo o existente.

### Limite inicial

No máximo duas candidatas por ciclo. Comparar com baseline e com uma edição humana simples. Promover somente com evidência no teste reservado, revisão do diff e registro das limitações. Se a melhoria não sobreviver à reserva, manter a versão atual.

## 7. P2 — mover garantias objetivas para sensores

Separar julgamento de verificação. A skill explica e decide; um sensor pode conferir se há status `ready`, hash correspondente e evidência de gate.

Exemplo de divisão proposta:

| Responsabilidade | Dono |
| --- | --- |
| Decidir se a intenção está suficientemente clara | Skill e usuário |
| Comparar o hash declarado com a spec | Helper ou sensor do projeto |
| Avaliar se um AC é significativo | Skill ou revisão humana |
| Impedir uma transição proibida no Forge | FSM ou policy engine do Forge |

Reutilizar `spec-sha` e sensores existentes. Não acrescentar dependência de runtime às skills apenas para fazer verificações que o projeto já oferece. A inspiração em HASP é tornar condições acionáveis; não é necessário reproduzir seu framework.

Começar por uma única regra. A entrega deve demonstrar um estado válido aceito, um inválido recusado e o tratamento explícito da falta de evidência.

## 8. P3 — deixar TEX para a camada de execução

O agent-skills deve definir a atividade, não virar um orquestrador de patches. Para um futuro piloto TEX no Forge, a skill de implementação pode produzir um diff e testes candidatos vinculados ao mesmo contrato.

Exemplo: dois agentes corrigem um importador CSV. A primeira solução cobre linha vazia; a segunda cobre delimitador dentro de aspas. O executor aplica os testes de ambos às duas soluções. Esse cruzamento pode revelar uma fragilidade que cada autor não encontrou sozinho.

Não combinar patches automaticamente nem aceitar o candidato que passa mais testes sem conferir se os testes representam o contrato. Até existir suporte a composição, registrar essa interface como proposta e continuar com o fluxo simples.

## 9. Primeiro lote de trabalho

1. Selecionar dois casos de `review-code` e reproduzir o baseline.
2. Analisar os pares com/sem skill já existentes nesses casos.
3. Executar uma mutation de alto impacto e inspecionar o trace.
4. Corrigir uma lacuna do corpus, se encontrada, e testar a mutation novamente.
5. Só então escolher entre ablação de contexto e otimização reflexiva.

Não rodar uma matriz de todas as skills, modelos e variantes neste primeiro lote. O resultado procurado é uma melhoria pequena, explicável e reproduzível.

## 10. Referências e força da evidência

- [GEPA, ICLR 2026](https://proceedings.iclr.cc/paper_files/paper/2026/hash/0e9e708b6f48e14fd0ac29e167413f76-Abstract-Conference.html): otimização reflexiva com avaliação experimental; os ganhos publicados não são uma previsão para este repo.
- [Mutation-Guided LLM-based Test Generation at Meta, 2025](https://arxiv.org/abs/2501.12862): aplicação industrial para testes de código; extrapolação para mutation de skills exige avaliação própria.
- [TDAD, 2026](https://arxiv.org/abs/2603.08806): mutation semântica de prompts e testes ocultos; evidência inicial em escopo limitado.
- [Skill Following, EMNLP Findings 2026](https://aclanthology.org/2026.findings-emnlp.244/): medição do efeito nos casos com carregamento observado.
- [Agent Skills Can Be Harmful, Microsoft Research, 2026](https://www.microsoft.com/en-us/research/publication/agent-skills-can-be-harmful-an-empirical-study-of-skill-induced-failures-in-llm-agents/): análise diferencial de falhas e custos.
- [Evaluating AGENTS.md, 2026](https://www.sri.inf.ethz.ch/publications/gloaguen2026agentsmd): evidência para testar contexto mínimo, não para remover instruções indiscriminadamente.
- [HASP, EMNLP 2026](https://aclanthology.org/2026.emnlp-main.2086/): skills com intervenções executáveis; adaptação sugerida aqui é menor que o framework original.
- [TEX, Salesforce, 2026](https://www.salesforce.com/blog/tex-test-time-scaling/): execução cruzada de testes e patches em benchmarks.
- [Runner do agent-skills](https://github.com/ricardowendell/agent-skills/blob/main/scripts/run-evals.mjs) e [evals de grooming](https://github.com/ricardowendell/agent-skills/blob/main/skills/groom-backlog/references/evals.md): fontes para adaptar os exemplos à revisão utilizada.
