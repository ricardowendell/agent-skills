# Piloto de mutação — `review-code`

Mede se o corpus de avaliação percebe uma regra removida da skill. O mapa de
cobertura está em [`rule-coverage.md`](./rule-coverage.md); este README registra
o que foi executado, o que aconteceu e o que o resultado permite concluir.

## Pergunta

Se uma regra que importa desaparecer do `SKILL.md`, alguma asserção falha? E a
falha corresponde ao comportamento, ou apenas ao texto que a skill manda
escrever? O controle existe para provar as duas coisas antes de gastar execuções
em sondas.

## Ambiente

- Primeira tentativa (baseline #1 e `no-gates`) no sha `a248f6c`; segunda
  (baseline #4 e `ignore-spec-sha`) no sha `6054b49`.
- Modelo `opencode-go/deepseek-v4.1-flash` (default da configuração), agente
  `build`, nível `behavior`.
- Home do processo filho isolado (padrão do runner desde TASK-16).
- `--timeout 240` nas primeiras execuções. O caso #4 estourou 240 s em três
  repetições com transcript vazio (`loaded: []` em duas e parada no primeiro
  passo na terceira); a medição foi refeita com `--timeout 600`, que é o número
  registrado aqui. O timeout não foi tratado como comportamento.
- Data: 2026-11-03.

## Roots

| root | `SKILL.md` sha256 | hash da árvore no runner |
| --- | --- | --- |
| `baseline/` | `7ea817d7a5a5702ef263192365288f9201ee631c89c1714d5eb9d633fd35727d` | `e63daed34099e20de8d7c8962d8ce97ac5a66346a7a6f09c150bf49910411bff` |
| `no-gates/` | `0a41448c2d08eec9795263b4d6f1f7ddbca441bbd9f1c31a007d1c72457b2d1c` | `a903f4696e7e2a67205153fef656d00b4c5471a216c1483efd53cf0bfb168a83` |
| `ignore-spec-sha/` | `96ab850eb3484b66c2bd11067764f4a96d0e687752f939f3032acd2fd3a4b844` | `ce737a350a022904c0ebd5eb019e30729907c32951a0ef1031605b23130b59fd` |

`diff -rq` entre cada mutante e o baseline reporta apenas `SKILL.md`. O runner
não encena `references/evals.md` nem `references/evals/`, então o agente não lê o
gabarito.

A mutação `no-gates` removeu três trechos do `SKILL.md`:

- o passo 5 inteiro (rodar os gates);
- a cláusula "gates green or explicitly not applicable" do passo 8;
- o guardrail "Never approve with a failing or unrun gate".

A mutação `ignore-spec-sha` removeu outros três:

- a cláusula de hash do passo 3 (comparar `spec_sha` e rejeitar spec defasada);
- o campo `(spec hash: match|mismatch|n/a)` do template de saída;
- o guardrail "A stale spec is a grooming problem, not a code problem".

## Comandos

```sh
node scripts/run-evals.mjs \
  --root docs/evals/experiments/mutation/review-code/baseline/skills \
  --skill review-code --case 1 --repeat 5 --timeout 240 --run

node scripts/run-evals.mjs \
  --root docs/evals/experiments/mutation/review-code/no-gates/skills \
  --skill review-code --case 1 --repeat 3 --timeout 240 --run

node scripts/run-evals.mjs \
  --root docs/evals/experiments/mutation/review-code/baseline/skills \
  --skill review-code --case 4 --repeat 5 --timeout 240 --run   # 2/5, timeout ambiente

node scripts/run-evals.mjs \
  --root docs/evals/experiments/mutation/review-code/baseline/skills \
  --skill review-code --case 4 --repeat 5 --timeout 600 --run

node scripts/run-evals.mjs \
  --root docs/evals/experiments/mutation/review-code/ignore-spec-sha/skills \
  --skill review-code --case 4 --repeat 3 --timeout 240 --run   # primeiro controle, antes do baseline 5/5

node scripts/run-evals.mjs \
  --root docs/evals/experiments/mutation/review-code/ignore-spec-sha/skills \
  --skill review-code --case 4 --repeat 3 --timeout 600 --run
```

## Resultado

| etapa | execuções | resultado | run |
| --- | --- | --- | --- |
| baseline, caso #1 | 5 | 5/5 | `2026-11-03T11-18-06--review-code` |
| controle `no-gates`, caso #1 | 3 | 3/3 | `2026-11-03T11-22-05--review-code` |
| baseline, caso #4, 240 s | 5 | 2/5 (timeout ambiente) | `2026-11-03T11-52-15--review-code` |
| controle `ignore-spec-sha`, caso #4, 240 s | 3 | 0/3 | `2026-11-03T12-05-36--review-code` |
| baseline, caso #4, 600 s | 5 | 5/5 | `2026-11-03T12-12-41--review-code` |
| controle `ignore-spec-sha`, caso #4, 600 s, após o baseline | 3 | 0/3 | `2026-11-03T12-21-41--review-code` |

Em todas as execuções válidas `skillGate.ok` é `true` e `loaded` é
`["review-code"]`. Nenhuma é inválida por falta de carga. O baseline do caso #4
fecha 5/5 nas cinco repetições de 600 s, incluindo `reply spec hash:.*mismatch`.

## Primeiro controle: `no-gates` (caso #1) — `invalid`

O controle **não foi detectado**: as três repetições passaram em todas as
asserções, inclusive `ranpass npm test` com `exit 0`.

Não é `detected` (nenhuma asserção falhou) e não é `survivor`: um sobrevivente
exige que o defeito tenha acontecido. O trace mostra o contrário — em r1, r2 e r3
o agente executou `npm test` e viu 6 testes passando. O defeito que o mutante
deveria produzir (aprovar sem rodar o gate) nunca apareceu.

Também não é redundância da regra. O mutante não removeu a regra de verdade: ela
continua escrita em quatro lugares fora do trecho mutado.

| onde | texto que resta |
| --- | --- |
| `SKILL.md:22` (passo 1, no mutante) | "Resolve: … the gate commands." |
| `SKILL.md:75` (bloco de saída, no mutante) | `GATES: pass\|fail\|partial\|n/a — <exact commands and results>` |
| fixture `AGENTS.md` | "Gates: `npm test` — runs `node --test`." |
| fixture `docs/prompts/SPEC-0007-cart-tax.prompt.md` | "`npm test` must pass." |

As duas primeiras estão no mesmo arquivo mutado e poderiam ser removidas junto.
As duas últimas são do fixture e uma mutação só da skill não as alcança. Enquanto
o prompt de revisão disser "`npm test` must pass", o agente tem motivo para rodar
o gate independentemente do passo 5. Por isso a asserção `ranpass` não pode ser
atribuída à regra removida: o controle não isola o que diz medir.

A classificação correta é `invalid`, com a causa no desenho do controle, não no
método. O baseline 5/5 e a carga da skill em 8/8 mostram que o runner e a
instrumentação estavam íntegros.

## Segundo controle: `ignore-spec-sha` (caso #4) — `invalid`

O caso #4 parecia o controle limpo: o fixture carimba `spec_sha` no prompt, mas
nada nele manda o revisor comparar o hash. O mutante remove a única instrução que
mandava comparar, o campo de saída e o guardrail.

O baseline reproduziu **5/5** antes do controle. O controle rodou **0/3**:
`verdict REJECT` e `unchanged` passaram nas três; só `reply spec hash:.*mismatch`
falhou.

A falha da asserção **não é detecção do defeito**. Nas três repetições o agente
calculou os dois hashes, comparou com o pin e rejeitou nomeando a spec defasada:

- r1: "The base-ref spec hashes to `feb763b1…`, which is exactly the `spec_sha`
  pinned … the branch copy hashes to `fa0d1363…`."
- r2: "the branch spec now hashes to `fa0d1363…`, so the pairing `docs-check` is
  designed to detect is already broken."
- r3: "the working spec now hashes to `fa0d1363…` (verified with
  `node spec-sha.mjs`)."

O comportamento que o mutante deveria produzir — revisar como se o contrato fosse
atual — não apareceu. A asserção falhou porque o mutante removeu a linha do
template que ela cita (`SPEC: <id> (spec hash: mismatch)`), e o agente escreveu
`SPEC: SPEC-0007` com o mismatch na prosa. É falso positivo de wording.

O veredito também não isola a regra: o diff do caso #4 tem um segundo defeito
(AC-3 passou a exigir rejeição de `non-finite`, e o código só rejeita negativo),
então `verdict REJECT` passa sem a checagem do hash. A única asserção específica
da regra é a de texto — e ela mede o template.

Pela definição da spec, `detected` exige a asserção falhando **e** o trace
mostrando o defeito. Aqui só a primeira aconteceu. A classificação é `invalid`:
o mutante nunca chegou ao comportamento mutado. A ordem também foi corrigida: a
primeira rodada do controle (12:05) precedeu o baseline 5/5 (12:12); a rodada de
12:21 veio depois e repetiu 0/3.

## O que os dois controles mudam no corpus

1. **Uma asserção que cita o template não mede comportamento.** `reply spec
   hash:.*mismatch` é sensível à frase que o mutante pode remover. Um revisor que
   compara os hashes e escreve `MISMATCH` na prosa falha a asserção sem ter
   cometido o defeito.
2. **Um controle precisa remover a regra e todo texto que a repete**, inclusive
   o template de saída e o fixture. `no-gates` falhou por deixar a regra no
   passo 1, no bloco `GATES`, no `AGENTS.md` e no prompt de implementação.
3. **Um caso só mede a regra se o defeito for o único do fixture.** No #4, o
   `REJECT` é sobredeterminado pelo defeito de AC-3; a checagem do hash não muda
   o veredito.

Nenhum dos dois controles valida o método como detecção. Os dois revelam defeitos
do corpus, que é o que o piloto devia encontrar — mas a conclusão é negativa, não
"o método funciona".

## Consequência

- O piloto para aqui, como a SPEC-0006 manda quando o controle não é detectado.
- Nenhuma sonda é executada e nenhum caso novo é criado.
- A regra do gate não é testável por uma mutação só do `SKILL.md` no caso #1,
  porque o fixture repete a instrução. A lacuna de fixture da TASK-21 continua de
  pé, com uma condição a mais para a discriminação: um caso de gate vermelho só
  mede a skill se o fixture não declarar a exigência no prompt ou no `AGENTS.md`.
- A asserção de hash do caso #4 precisa de um fixture em que a spec defasada seja
  o único defeito e de uma asserção que aceite relato semântico. Ficou na
  TASK-22; a SPEC-0006 não conserta o que o sobrevivente expõe.
- O método segue sem um controle positivo limpo. O próximo experimento deve
  escolher uma regra que o fixture não repita e cujo defeito mude o veredito,
  não só o texto da resposta.

## Reconstruir os roots

Os roots são artefatos de scratch e não entram no git; o `.gitignore` desta
pasta os exclui. Para recriá-los a partir do estado atual da skill:

```sh
base=docs/evals/experiments/mutation/review-code
mkdir -p "$base/baseline/skills" "$base/no-gates/skills" "$base/ignore-spec-sha/skills"
cp -R skills/review-code "$base/baseline/skills/"
cp -R skills/review-code "$base/no-gates/skills/"
cp -R skills/review-code "$base/ignore-spec-sha/skills/"
```

Depois aplique as remoções de `no-gates` descritas acima e, em
`ignore-spec-sha/skills/review-code/SKILL.md`:

1. no passo 3, apague as quatro linhas do hash e mantenha só "Read the source
   spec named in the prompt frontmatter (`spec:`), plus the prompt's
   Safeguards.";
2. no bloco de saída, troque `SPEC: <id> (spec hash: match|mismatch|n/a)` por
   `SPEC: <id>`;
3. apague a frase final "A stale spec is a grooming problem, not a code problem —
   say so in the verdict.".

Confira com `diff -rq` contra o baseline: só `SKILL.md` deve diferir.

## Custo

24 execuções de modelo: 5 do baseline #1, 3 do `no-gates`, 5 do baseline #4 a
240 s (3 terminaram em timeout), 3 do primeiro controle, 5 do baseline #4 a
600 s e 3 do controle repetido. Os `--list --check` e os `diff -r` não chamam
modelo. O primeiro controle a 240 s e o baseline a 240 s estão no custo mesmo
tendo sido refeitos: são evidência do ambiente, não resultados descartados em
silêncio.
