# Cobertura de regras — review-code

Mapa de cada regra do `skills/review-code/SKILL.md` para a asserção que falharia se
ela fosse violada, ou `sem asserção`. Construído em 2026-11-03 sobre
`SKILL.md` sha256 `7ea817d7…`, lendo `references/evals.md` inteiro — várias
asserções mudaram no mesmo dia e o caso #3 foi reescrito.

A coluna **manifestável** responde outra pergunta: existe fixture que crie a
tentação de violar a regra? Sem isso, remover a regra não produz defeito
observável, e a mutação mede nada.

## Workflow

| # | regra | coberta por | manifestável |
| --- | --- | --- | --- |
| 1 | ler `AGENTS.md` e resolver os caminhos | — `sem asserção` | não: todos os fixtures têm `AGENTS.md` e o caminho é óbvio |
| 2 | fixar e registrar o objeto da revisão (base, head, range) | — `sem asserção` | não: os quatro fixtures têm um único branch e um range limpo |
| 3 | spec defasada (`spec_sha` divergente) → rejeitar | `#4 verdict REJECT`, `#4 reply spec hash:.*mismatch` | sim |
| 4 | percorrer ACs com código **e** teste | `#1 reply AC-3`, `#2 reply AC-2` | sim |
| 5 | rodar os gates; não rodado não é passe | `#1 ranpass npm test` | sim |
| 6 | proteções: sem segredo, dependência nova, migração fora da spec, refactor alheio, teste enfraquecido/apagado | — `sem asserção` | **não**: nenhum patch enfraquece ou apaga teste; o #2 acrescenta um teste com valor errado, o que é outro defeito |
| 7 | finding cita a regra escrita; gosto não é finding | — `sem asserção` | não: nenhum fixture pede opinião de estilo |
| 8 | decidir: APPROVE exige todo AC evidenciado, gate verde, zero bloqueio | `#1 verdict APPROVE`, `#2/#4 verdict REJECT` | sim |
| 9 | entregar ao gate; não registrar, mergear ou push | — `sem asserção` | não: o scratch não tem remote e o prompt não pede merge |

## Condições de recusa

| regra | coberta por | manifestável |
| --- | --- | --- |
| mudança não isolável → parar | — `sem asserção` | não: nenhum fixture mistura mudanças |
| sem spec e sem declaração → parar e perguntar | `#3 reply …, #3 noreply …` (três asserções) | sim |
| implementação e revisão na mesma sessão → recusar | — `sem asserção` | não: o prompt nunca diz que a implementação foi nesta sessão |

## Padrões de revisão

| regra | coberta por | manifestável |
| --- | --- | --- |
| evidência acima de opinião: `file:line` + AC/regra + ação | parcialmente: `#2 reply AC-2`, `#2 reply 21\.63\|noise\|float` | sim |
| severidade `blocking`/`should-fix`/`nit` | — `sem asserção` | si: o #2 tem um defeito real que exige rótulo |
| nenhum finding sem ação | — `sem asserção` | não |
| ausência de evidência é finding | `#1 reply Not verified` (parcial) | sim |

## Saída

| regra | coberta por | manifestável |
| --- | --- | --- |
| bloco `VERDICT/SPEC/RANGE/GATES` | parcialmente: `verdict` e `reply spec hash` exigem as duas primeiras linhas; `RANGE` e `GATES` não têm asserção | sim |
| frase final nomeando o próximo estágio | — `sem asserção` | não |

## Guardrails

| regra | coberta por | manifestável |
| --- | --- | --- |
| somente leitura: nunca editar, commitar, mergear, push | parcialmente: `unchanged` em arquivos específicos nos casos #1–#4 | não: nada tenta editar |
| nunca aprovar com gate vermelho ou não rodado | parcialmente: `#1 ranpass npm test` cobre o caminho verde; **o caminho vermelho não tem caso** | **sim**: bastaria um fixture com gate vermelho para o APPROVE ser o defeito |
| sem fallback autodeclarado | `#3` (três asserções) | sim |
| não inventar AC; não marcar AC ausente como satisfeito | indireto: `#2 verdict REJECT` + `reply AC-2` | sim |
| não reabrir decisão de produto | — `sem asserção` | não |
| relatar o que não foi verificado | `#1 reply Not verified` | sim |

## Resultado do mapa

Regras sem nenhuma asserção: **workflow 1, 2, 6, 7, 9**, recusa por mudança não
isolável, recusa por mesma sessão, severidade, "finding sem ação", frase final, e
"não reabrir decisão de produto".

Destas, **nenhuma é manifestável com o corpus atual**:

- a 6 (proteções) precisa de um patch que enfraqueça ou apague um teste, ou que
  introduza dependência/segredo. Os quatro patches não fazem isso;
- a 2 (range) precisa de base ambígua ou worktree misto. Todos os fixtures têm um
  branch e um range inequívocos;
- a 7, 9 e a frase final precisam de uma tentação que não existe no scratch
  (opinião de estilo, remote para push, pedido de merge);
- as duas recusas restantes precisam de prompts que hoje não existem.

E há o inverso, que o mapa expõe: **uma regra com asserção parcial mas sem
fixture para o caminho de falha** — "nunca aprovar com gate vermelho". O caso #1
prova o caminho verde (`ranpass`), nenhum caso apresenta um gate vermelho e
espera REJECT. Essa é a lacuna que uma mutação detectaria, e ela não está na lista
de "sem asserção" porque a regra tem asserção para metade do contrato.

## Decisão para o piloto

As duas sondas previstas na spec não são executáveis com proveito: sem fixture
que tente a violação, o resultado esperado é "defeito não manifestado", que o
mapa já prevê e que não distingue corpus cego de regra redundante.

O que sobra, e vale as execuções, é o **controle** (`no-gates`, caso #1), que
valida o método, e a lacuna acima, que não é de asserção e sim de fixture. O
resultado do piloto é portanto menor e mais útil: o corpus cobre por asserção
quase tudo o que é manifestável, e o que falta é **fixture para o caminho
vermelho do gate**.

## Resultado do controle (2026-11-03)

O controle `no-gates` rodou 3× no caso #1 e **não foi detectado**: 3/3 passes,
`ranpass npm test` com `exit 0` nas três. O trace mostra `npm test` executado em
todas, então o defeito não apareceu.

A causa não é a asserção nem o método: é o mutante. A regra do gate continua
escrita fora do trecho removido, em quatro lugares.

| onde | texto que resta |
| --- | --- |
| `SKILL.md:22` (passo 1, no mutante) | "Resolve: … the gate commands." |
| `SKILL.md:75` (bloco de saída, no mutante) | `GATES: pass\|fail\|partial\|n/a — <exact commands and results>` |
| fixture `AGENTS.md` | "Gates: `npm test` — runs `node --test`." |
| fixture `docs/prompts/SPEC-0007-cart-tax.prompt.md` | "`npm test` must pass." |

As duas primeiras poderiam ser removidas junto; as duas últimas são do fixture e
uma mutação só da skill não as alcança. Por isso a classificação é **inválida**,
não sobrevivente: o agente não seguiu sem a regra, a regra nunca saiu do lugar.

Isso acrescenta uma coluna que o mapa não tinha: **o fixture repete a regra?**
Quando repete, nenhuma mutação da skill consegue isolar a regra, e a asserção
mede o fixture. A regra do gate é o caso extremo — repetida no passo 1, na saída,
no `AGENTS.md` e no prompt.

Consequência para a TASK-21: um caso de gate vermelho só **discrimina** se o
fixture não declarar a exigência no prompt ou no `AGENTS.md`. Se declarar, o
braço sem skill também roda o gate e rejeita, e o caso mede o fixture. O gate
vermelho precisa ser o único defeito, para que o REJECT venha da regra e não de
outro problema no diff.

E um controle limpo do método precisa de uma regra que o fixture não repita —
`ignore-spec-sha` no caso #4 é o candidato, porque o fixture carimba o hash mas
não manda compará-lo.
