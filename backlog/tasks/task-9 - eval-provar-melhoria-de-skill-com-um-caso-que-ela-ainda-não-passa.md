---
id: TASK-9
title: 'eval: provar melhoria de skill com um caso que ela ainda não passa'
status: To Do
assignee: []
created_date: '2026-11-02T18:30:00Z'
updated_date: '2026-11-02T19:20:00Z'
labels: []
dependencies: []
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O marco do harness é melhoria mensurável de skill, e ele ainda não foi cumprido: o runner mede comportamento, mas nenhuma mudança de skill foi demonstrada com número.

Alvo: `write-implementation-prompt`. É a única skill cujo valor só aparece fora dela — o prompt gerado é julgado pela implementação que produz. Medir o Markdown gerado mediria conformidade com o template, que é justamente o que não se quer premiar.

Protocolo de duas etapas, sem framework novo:
1. Congelar o baseline: sha da skill, modelo, fixtures, assertions e executor.
2. Editar uma única hipótese no `SKILL.md` — mapeamento explícito AC→verificação por operação.
3. Gerar prompts para os mesmos cenários, 3 repetições por versão.
4. Etapa 2: cada prompt gerado vira o `prompt` de uma execução de implementador sobre a fixture congelada, com `implement-from-prompt` carregada. Aí se afere AC satisfeito, alteração fora de escopo e gate executado.
5. Incluir casos de holdout que não foram usados para formular a mudança.

Mecânica da etapa 2 com o que já existe: um root temporário com a skill `implement-from-prompt` copiada e um `references/evals.md` cujos casos são os prompts gerados, com asserções de resultado. `run-evals --root <tmp>` roda isso sem código novo. Se a mecânica se mostrar desajeitada na prática, a alternativa é uma flag `--prompt-file` — decisão só depois da primeira rodada.

Custo medido: a matriz de `review-code` fez 60 runs em 28 minutos, ~28 s por run; um caso de `write-implementation-prompt` recém-medido levou 62 s. Um experimento de 6 cenários × 2 versões × 3 repetições são 36 runs de geração mais 36 de implementação: entre 35 e 75 minutos de agente, mais a autoria dos casos.

Limite declarado: eu escrevo a mudança, então minha comparação não é cega. A revisão A/B fica com o usuário, ou o resultado é publicado como não-cego.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 baseline congelado e registrado: sha da skill, modelo, fixtures, assertions, executor
- [ ] #2 casos de autoria e de holdout escritos, com a etapa de implementação medindo resultado, não o Markdown
- [x] #3 uma edição única no SKILL.md, em commit separado dos casos
- [x] #4 medição A/B com mesmo modelo e mesmas repetições, antes/depois por caso no comentário
- [x] #5 melhoria descartada se a edição só fizer o artefato satisfazer o template: a skill tem de pedir o comportamento
- [x] #6 limitação de comparação não-cega declarada no resultado
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T18:30:00Z

---

Aberto depois de fechar a TASK-8, porque o backlog ficou sem nenhuma task que produzisse o resultado do marco. A ordem importa: caso que falha primeiro, edição depois. Inverter produz uma edição que "passa" porque a asserção foi afrouxada até aceitar o texto que a skill já produzia — que é o erro que a TASK-9 existe para não repetir.

---

Reescopada em 2026-11-02 para `write-implementation-prompt`, depois de uma revisão externa apontar dois problemas de instrumento. Um deles era falso: o parser lê `state.metadata.metadata.exit` e a ferramenta se chama `shell` — 3.284 eventos `tool_use` em 221 transcripts não têm uma única ocorrência de `bash`. O normalizador proposto normalizaria o formato errado.

O outro era real e foi corrigido antes desta task começar: o caso 4 de `write-implementation-prompt` pedia `SPEC-0012` e afirmava `SPEC-0011`. A migração para o formato v2 (`691a120`) inventou o identificador na linha `prompt`. Um agente que ignorasse o pedido e escrevesse o prompt da spec que estava na fixture passaria.

Também entraram duas proteções, porque o defeito passou por três gates verdes:
- `scripts/lib/evals/events.test.mjs`: transcrição real embutida como fixture; se o OpenCode renomear `shell` ou mover `exit`, o teste falha em vez de `ran`/`ranpass` virarem "the command never ran".
- `scripts/lib/evals/corpus.test.mjs`: caso com fixture só pode citar identificador que a fixture contém, seguindo `git.json.base`; caso que cita spec deliberadamente ausente se marca com a tag `absent-spec`.

O corpus medido no braço with-skill está verde depois de `3098a5e`, então esta task não parte de uma falha existente: ela constrói o caso que expõe a falha, e o AC-2 exige que o resultado seja medido na implementação, não no texto do prompt.
---

Primeira medição em 2026-11-02, em `docs/evals/experiments/wip-operations-contract`. Baseline `A/SKILL.md` (sha256 5eb1ab0c…) contra a candidata `B/SKILL.md`, que acrescenta ao parágrafo de Operations a exigência de resultado observável, o comando que prova e o AC de cada passo.

Dois cenários. s1, com oráculo completo e spec citando o helper compartilhado: A e B 1/1 nos dois estágios. s2, com oráculo parcial — AC-2 existe só na spec, e a sonda confere na implementação que a rejeição nomeia a linha física, com duas linhas em branco empurrando a linha ruim para 4: A 3/3, B 3/3, reuso do helper 4/4 nos dois.

Custo: o prompt de B é 31% maior (10.450 contra 7.954 bytes) e a implementação sai com 23–29 linhas contra 21–26. Durações e tokens não concordam em direção entre os braços com n=3, então o único sinal de custo confiável é o artefato.

Hipótese refutada nos cenários construídos. Duas razões, ambas registradas no README do experimento: a skill de base já copia os ACs literalmente e já mapeia AC→verificação, então parte da mudança proposta já existia; e o prompt não é o único portador de intenção — o implementador lê a spec, o oráculo e o architecture doc por conta própria, então omitir um fato do prompt não o perde.

AC-2 não foi cumprido e o é por mérito: nenhum caso reprovado apareceu. Sem isso a task não fecha como concluída. O próximo passo é um cenário em que o implementador não consiga recuperar o fato sozinho — sem a seção de fluxo da spec, ou com spec e architecture em conflito — e, até que um deles separe os braços, a skill não deve ser editada.

Limitação de cegueira: mantida. Eu escrevi a candidata; a comparação de artefato foi feita por leitura direta, não cega.
<!-- COMMENTS:END -->
