# Interações repetidas que merecem skill

Janela: 2026-10-24 a 2026-11-07 (14 dias)
Fonte: `~/.local/share/opencode/opencode.db` (SQLite, `session_v2` + `session_message`)
Script: `~/.agents/scripts/session-intent-report.py` — **removido em 2026-11-08**, a
pedido. A extração rodou uma vez; as contagens abaixo não podem ser reproduzidas
sem reescrevê-lo.

## Resumo

- 3.226 sessões no período. **58 humanas**, 3.168 descartadas como ruído (evals, harness, worktrees automatizados, prompts de fixture).
- 58 sessões, **$67,51** e **2.190 turnos de usuário**.
- Padrão dominante: o usuário abre com uma pergunta de estado ("como estamos?", "quais os próximos passos?") e só depois desce para a tarefa. Esse turno de abertura é o que mais se repete.
- Top 3: `report-project-status`, `sync-branch`, `diagnose-local-env`.

## Método e limites

Custo por sessão = maior valor entre a soma de `cost` das mensagens e o `cost` da sessão. Quinze sessões somam 415 turnos com `$0,00` registrado (modelo sem preço), então **turnos de usuário são o proxy principal de esforço**; custo em dólar subestima.

Cluster = intenção de abertura, não o trabalho inteiro. Sessões com mais de 60 turnos são marcadas como mistas no texto: o custo bruto do cluster inclui trabalho que a skill não substitui. Por isso o ranking usa frequência e repetibilidade de forma, não só dólar.

Clusterização manual sobre título e primeiro turno (58 casos, revisável). Quatro sessões ficaram em `other` (probes, automação de issue, esta própria análise).

## Ranking

F = frequência (3: ≥8 sessões; 2: 3 a 7; 1: ≤2). E = esforço (3: mediana ≥20 turnos ou custo ≥$5; 2: mediana ≥8 ou custo ≥$1; 1: resto). R = repetibilidade de forma (3: mesma forma; 1: heterogêneo). G = lacuna de cobertura (2: nada cobre; 1: parcial; 0: já coberto).

| Cluster | n | Custo | Turnos | Mediana | Projetos | F | E | R | G | Score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| report-project-status | 15 | $20,26 | 635 | 15 | 5 | 3 | 3 | 3 | 1 | **10** |
| sync-branch | 6 | $7,74 | 394 | 20 | 2 | 2 | 3 | 3 | 2 | **10** |
| review-change | 6 | $5,75 | 107 | 15 | 4 | 2 | 3 | 3 | 1 | 9 |
| ui-refactor | 3 | $6,90 | 348 | 63 | 1 | 2 | 3 | 2 | 0 | 7 |
| bootstrap-harness | 2 | $13,83 | 163 | 82 | 2 | 1 | 3 | 3 | 0 | 7 |
| workspace-meta | 6 | $5,30 | 240 | 20 | 4 | 2 | 3 | 1 | 1 | 7 |
| diagnose-local-env | 5 | $0,02 | 56 | 3 | 3 | 2 | 1 | 2 | 2 | 7 |
| model-catalog | 5 | $0,17 | 21 | 4 | 1 | 2 | 1 | 3 | 1 | 7 |
| databricks-lifecycle | 1 | $0,67 | 48 | 48 | 1 | 1 | 3 | 1 | 2 | 7 |
| local-cleanup | 1 | $0,00 | 55 | 55 | 1 | 1 | 3 | 1 | 2 | 7 |
| ci-debug | 1 | $2,40 | 24 | 24 | 1 | 1 | 3 | 1 | 2 | 7 |
| docs-authoring | 3 | $4,42 | 91 | 6 | 3 | 2 | 2 | 1 | 1 | 6 |

Após remover os clusters já cobertos (`review-change`, score 9, e `bootstrap-harness`, score 7), o 3º lugar fica entre seis clusters empatados em 7. A escolha de `diagnose-local-env` é julgamento explícito, não desempate numérico: priorizei forma repetível, lacuna real (G2) e risco baixo. `ui-refactor` e `workspace-meta` têm o mesmo score mas já são servidos por `impeccable`/`simplify` e por `skill-creator`/`audit-*`; `model-catalog` é resolvido pelo MCP `agentworks`; `databricks-lifecycle`, `local-cleanup` e `ci-debug` têm uma única ocorrência na janela e ficam como menção.

## 1. report-project-status

**Evidência:** 15 sessões em 5 projetos (ai4de-core, energisa-poc-parts-agent, forge, pdlc, .agents), 635 turnos, $20,26 brutos. Aberturas reais: "como estamos no repo agora?", "avalia nosso backlog, prs pendentes ou issues abertas", "quais os proximos passos?", "como esta nosso backlog e proximos passos?", "o que podemos fazer agora?", "verifique como está o estado das PRs".

**Escopo:** um retrato de uma página com quatro blocos: estado git/PR (delegado ao `survey-inflight-work`, sem reimplementar enumeração), prontidão de backlog e specs, saúde de CI, e no máximo 3 próximas ações com evidência. Read-only.

**Ganho:** substitui os 5 a 15 turnos de coleta que abrem essas sessões. Não elimina o trabalho de projeto (as sessões longas continuam longas), mas remove a fase de reconstrução de contexto, que hoje se repete a cada retomada.

**Risco:** virar dashboard genérico. Mitigação no stub: limite de 3 ações, delegação obrigatória do bloco git/PR e proibição de editar.

## 2. sync-branch

**Evidência:** 6 sessões, 394 turnos, $7,74. "algo no remote?" (275 turnos, $5,61), "atualize develop" (76 turnos), "va pra branch develop", "volte pra develop", "mude para develop e avalie novidades do remote". Duas sessões concentram quase todo o custo e os turnos: o padrão não é o comando, é o ciclo com divergência, conflito e verificação.

**Escopo:** contraparte mutável do `survey-inflight-work`, que é read-only por desenho e nunca faz checkout. Passos: ler política do projeto (base, merge ou rebase, gates), registrar estado, `fetch --prune`, tratar árvore suja (stash nomeado ou abortar), checkout, decidir fast-forward/rebase/merge, parar no primeiro conflito sem escolher lado, rodar gates, reportar delta com SHAs antes e depois.

**Ganho:** reduz um fluxo de 20 a 275 turnos para poucos turnos determinísticos e elimina decisões repetidas sobre stash, rebase e verificação.

**Risco:** operação destrutiva em git. Guardrails no stub: nunca `--force`, nunca `reset --hard`, nunca push sem pedido explícito, nunca resolver conflito descartando um lado, `--abort` limpo em falha.

## 3. diagnose-local-env

**Evidência:** 5 sessões em 3 projetos, 56 turnos. "quando saio do opencode tem uma mensagem: jenv:11: command not found", "vamos revisar minha instalacao e configuracao do zsh e deixa-la mais consistente, sem lixos", "remova o profile parkland das minhas contas do gh", "preciso fazer o login, mas parece que nao esta funcionando", "pode verificar esse passo a passo?" (OpenCode v2). Recorrência histórica fora da janela inclui nix, alertas de chipset no macOS e gestores de versão.

**Escopo:** diagnóstico read-only de deriva de ambiente: ordem dos arquivos de init do zsh, PATH duplicado e entradas mortas, variáveis órfãs de gerenciadores removidos (`JENV_*`, `PYENV_*`, `NVM_*`), contas do `gh` e estado de auth, login de CLI de agente, versão de plugins. Saída em tabela com `arquivo:linha`, severidade e correção mínima.

**Ganho:** 56 turnos em tarefas de manutenção que não geram produto, com risco de regressão silenciosa entre shells. Um roteiro fixo evita redescobrir a causa a cada sintoma.

**Risco:** virar "instalador de tudo". Mitigação: read-only por padrão, nenhuma alteração sem confirmação, nada de `sudo` ou desinstalação, uma correção por achado.

## Melhorias em skills existentes

Estes padrões apareceram com força, mas a lacuna é de cobertura parcial, não de skill nova.

- **bootstrap-project-harness**: 2 sessões, $13,83, mediana de 82 turnos. A skill existe e é usada, mas a execução vira uma entrevista longa de decisões (lib de CLI, referências fora de contexto, layout de docs). Melhor capturar decisões em um bloco de configuração do projeto e não repetir perguntas já respondidas.
- **review-code**: 6 sessões, $5,75, 4 projetos. A skill já cobre PR e range, então não é skill nova. Os gaps são dois: revisão independente em sessão nova contra `origin/develop..HEAD` e geração de comentário sucinto e acionável para publicar no PR. Vale um modo no `review-code`, não um `review-pr` paralelo.

## Descartados

| Cluster | Motivo |
| --- | --- |
| ui-refactor | 1 projeto, trabalho único de redesenho; `impeccable` e `simplify` já cobrem |
| workspace-meta | Heterogêneo e coberto por `skill-creator`, `audit-code-quality`, `audit-docs`, `docs-check`, `groom-backlog` |
| model-catalog | 5 sessões mas $0,17; o MCP `agentworks` já responde; melhor um comando curto que uma skill |
| docs-authoring | 3 sessões sem forma comum (Slidev, pastas do AgentWorks, Q&A de produto) |
| databricks-lifecycle | 1 sessão na janela, mas recorrência histórica e custo real de nuvem; confirmar em 30 dias antes de autorar |
| local-cleanup | 1 sessão de 55 turnos, tarefa pontual |
| ci-debug | Falha específica de projeto (Node 22 vs 24), não um padrão |

## Limites

- 58 sessões é amostra pequena. Frequência absoluta baixa significa que os scores medem forma e esforço, não volume estatístico.
- Custo em dólar está incompleto (modelos sem preço registrado). O ranking não depende só dele.
- Evals e harness foram excluídos por diretório e por padrão de prompt. Restaram 4 sessões em `other`, incluindo esta análise.
- A estimativa de ganho é qualitativa. O passo seguinte é um piloto de uma semana com a skill nº 1 e medição de turnos até a primeira ação.

## Stubs

`report-project-status` foi promovido em 2026-11-07 para `skills/report-project-status/`, com `references/evals.md` e o comando `/status`. Os outros dois continuam em `docs/analysis/skill-stubs/`, fora de `skills/` para não serem carregados.
