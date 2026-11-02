---
id: TASK-9
title: 'eval: provar melhoria de skill com um caso que ela ainda não passa'
status: To Do
assignee: []
created_date: '2026-11-02T18:30:00Z'
updated_date: '2026-11-02T19:40:00Z'
labels: []
dependencies: []
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O marco do harness é melhoria mensurável de skill, e ele ainda não foi cumprido: o runner mede comportamento, mas nenhuma mudança de skill foi demonstrada com número.

Alvo: `implement-from-prompt`. A escolha veio de uma tentativa que falhou. `write-implementation-prompt` foi medido em três desenhos — oráculo completo, oráculo parcial com o critério só na spec, e implementador sem skill carregada — e a candidata proposta (contrato de observabilidade por passo) não separou os braços em nenhum: 3/3 contra 3/3, com prompt 31% maior. O experimento está em `docs/evals/experiments/wip-operations-contract`, com o resultado negativo registrado. A skill não foi alterada.

Por que trocar de alvo: dos seis casos de `implement-from-prompt`, três são `status: manual`, dois medem triggering e apenas um exercita uma implementação de verdade. É a skill com maior chance de ter comportamento não medido — e o comportamento dela é observável no estado do repositório, não no texto que produz.

Modos de falha candidatos, todos verificáveis por estado e não por vocabulário:
1. Marca a spec como `implemented` com o gate vermelho.
2. Segue após `node --test` vermelho e reporta concluído.
3. Altera arquivo fora do que o prompt delimita.

Ordem obrigatória: escrever o caso, rodar contra a skill atual e **provar a falha** antes de qualquer edição. Se a skill passar nos três, o resultado é o mesmo da rodada anterior e a task não fecha — registra-se que o corpus não cobre o comportamento e a busca continua.

Custo: um caso de comportamento custa 20 a 60 s de agente. Três casos com três repetições são cerca de 10 minutos por versão medida.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 baseline congelado e registrado: sha da skill, modelo, fixtures, assertions, executor
- [ ] #2 um caso reprovado de forma reproduzível pela skill atual, com falha observável em arquivo/estado e prova de que o fixture não é a causa
- [ ] #3 uma edição única no SKILL.md ou numa referência, em commit separado do caso
- [ ] #4 re-medição com o mesmo modelo, nível e repetições, com antes/depois por caso no comentário
- [x] #5 melhoria descartada se a edição só fizer o artefato satisfazer o template: a skill tem de pedir o comportamento
- [ ] #6 limitação de comparação não-cega declarada no resultado
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T18:30:00Z

---

Aberto depois de fechar a TASK-8, porque o backlog ficou sem nenhuma task que produzisse o resultado do marco. A ordem importa: caso que falha primeiro, edição depois. Inverter produz uma edição que "passa" porque a asserção foi afrouxada até aceitar o texto que a skill já produzia — que é o erro que a TASK-9 existe para não repetir.

---

Reescopada em 2026-11-02 para `write-implementation-prompt`, depois de uma revisão externa apontar dois problemas de instrumento. Um deles era falso: o parser lê `state.metadata.metadata.exit` e a ferramenta se chama `shell` — 3.284 eventos `tool_use` em 221 transcripts não têm uma única ocorrência de `bash`. O normalizador proposto normalizaria o formato errado.

O outro era real e foi corrigido antes desta task começar: o caso 4 de `write-implementation-prompt` pedia `SPEC-0012` e afirmava `SPEC-0011`. A migração para o formato v2 (`691a120`) inventou o identificador na linha `prompt`. Um agente que ignorasse o pedido e escrevesse o prompt da spec que estava na fixture passaria.

Também entraram duas proteções, porque o defeito passou por três gates verdes: transcrição real embutida em `events.test.mjs`, e `corpus.test.mjs`, que impede um caso com fixture de citar identificador que a fixture não tem.

---

Medição de 2026-11-02, em `docs/evals/experiments/wip-operations-contract`. Baseline `A/SKILL.md` (sha256 5eb1ab0c…) contra a candidata `B/SKILL.md`, que acrescenta ao parágrafo de Operations a exigência de resultado observável, o comando que prova e o AC de cada passo.

Três desenhos, nenhum separou os braços:
- s1, oráculo completo: 1/1 nos dois.
- s2, oráculo parcial (AC-2 só na spec, sonda confere a linha física): 3/3 nos dois, reuso do helper 4/4 nos dois.
- s2 com implementador sem skill carregada (`--no-skill`), para descartar que `implement-from-prompt` estivesse mascarando o efeito: 1/1 nos dois.

Custo: prompt da candidata 31% maior (10.450 contra 7.954 bytes), implementação com 23–29 linhas contra 21–26. Durações e tokens discordam em direção com n=3, então o único sinal de custo confiável é o artefato.

Hipótese refutada. Duas razões medidas: a skill de base já copia os ACs literalmente e já mapeia AC→verificação, então parte do contrato proposto já existia; e o implementador lê a spec, o oráculo e o architecture doc por conta própria, então omitir um fato do prompt não o perde.

---

Troca de alvo em 2026-11-02, para `implement-from-prompt`. Motivo medido: dos seis casos dela, três são manuais, dois medem triggering e um exercita implementação. A skill anterior está bem coberta; esta não está. AC-1 e AC-5 continuam válidos do ciclo anterior; AC-2 segue aberto e é o trabalho real.
<!-- COMMENTS:END -->
