# Piloto de mutação — `review-code`

Mede se o corpus de avaliação percebe uma regra removida da skill. O mapa de
cobertura está em [`rule-coverage.md`](./rule-coverage.md); este README registra
o que foi executado, o que aconteceu e o que o resultado permite concluir.

## Pergunta

Se a regra "rode os gates" desaparecer do `SKILL.md`, alguma asserção do caso #1
falha? O controle existe para provar que o método detecta uma mutação antes de
gastar execuções em sondas.

## Ambiente

- Repositório no sha `a248f6c`.
- Modelo `opencode-go/deepseek-v4.1-flash` (default da configuração), agente
  `build`, nível `behavior`.
- Home do processo filho isolado (padrão do runner desde TASK-16).
- `--timeout 240`.
- Data: 2026-11-03.

## Roots

| root | `SKILL.md` sha256 | hash da árvore no runner |
| --- | --- | --- |
| `baseline/` | `7ea817d7a5a5702ef263192365288f9201ee631c89c1714d5eb9d633fd35727d` | `e63daed34099e20de8d7c8962d8ce97ac5a66346a7a6f09c150bf49910411bff` |
| `no-gates/` | `0a41448c2d08eec9795263b4d6f1f7ddbca441bbd9f1c31a007d1c72457b2d1c` | `a903f4696e7e2a67205153fef656d00b4c5471a216c1483efd53cf0bfb168a83` |

`diff -rq` entre os dois roots reporta apenas `SKILL.md`. O runner não encena
`references/evals.md` nem `references/evals/`, então o agente não lê o gabarito.

A mutação `no-gates` removeu três trechos do `SKILL.md`:

- o passo 5 inteiro (rodar os gates);
- a cláusula "gates green or explicitly not applicable" do passo 8;
- o guardrail "Never approve with a failing or unrun gate".

## Comandos

```sh
node scripts/run-evals.mjs \
  --root docs/evals/experiments/mutation/review-code/baseline/skills \
  --skill review-code --case 1 --repeat 5 --timeout 240 --run

node scripts/run-evals.mjs \
  --root docs/evals/experiments/mutation/review-code/no-gates/skills \
  --skill review-code --case 1 --repeat 3 --timeout 240 --run
```

## Resultado

| etapa | execuções | resultado | run |
| --- | --- | --- | --- |
| baseline, caso #1 | 5 | 5/5 | `2026-11-03T11-18-06--review-code` |
| controle `no-gates`, caso #1 | 3 | 3/3 | `2026-11-03T11-22-05--review-code` |

Em todas as 8 execuções `skillGate.ok` é `true` e `loaded` é `["review-code"]`,
então nenhuma é inválida por falta de carga. O baseline passa as seis asserções
do caso #1 em 5/5, incluindo `ranpass npm test` com `exit 0`.

O controle **não foi detectado**: as três repetições passaram em todas as
asserções, inclusive `ranpass npm test` com `exit 0`.

## Classificação: `invalid`

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

## Consequência

- O piloto para aqui, como a SPEC-0006 manda quando o controle não é detectado.
- Nenhuma sonda é executada e nenhum caso novo é criado.
- A regra do gate não é testável por uma mutação só do `SKILL.md` no caso #1,
  porque o fixture repete a instrução.
- A lacuna de fixture da TASK-21 continua de pé, com uma condição a mais para a
  discriminação: um caso de gate vermelho só mede a skill se o fixture não
  declarar a exigência no prompt ou no `AGENTS.md`. Se declarar, o braço sem
  skill também roda o gate e rejeita, e o caso deixa de separar os dois braços.
  O gate vermelho precisa ser o único defeito do fixture.
- Um controle limpo precisa de uma regra que o fixture não repita. O candidato
  óbvio é `ignore-spec-sha` no caso #4: o fixture carimba o hash, mas nada nele
  diz ao revisor para comparar.

## Reconstruir os roots

Os roots são artefatos de scratch e não entram no git; o `.gitignore` desta
pasta os exclui. Para recriá-los a partir do estado atual da skill:

```sh
base=docs/evals/experiments/mutation/review-code
mkdir -p "$base/baseline/skills" "$base/no-gates/skills"
cp -R skills/review-code "$base/baseline/skills/"
cp -R skills/review-code "$base/no-gates/skills/"
```

Depois aplique as três remoções ao `no-gates/skills/review-code/SKILL.md`:

1. apague o passo 5 inteiro (as duas linhas que começam com `5. Run the gates`
   e `gate that cannot run locally`);
2. no passo 8, troque "APPROVE requires every AC evidenced, gates green or
   explicitly not applicable, and zero blocking findings" por "APPROVE requires
   every AC evidenced and zero blocking findings";
3. apague o guardrail "Never approve with a failing or unrun gate.".

Confira com `diff -rq "$base/baseline/skills/review-code"
"$base/no-gates/skills/review-code"`: só `SKILL.md` deve diferir.

## Custo

8 execuções de modelo: 5 do baseline e 3 do controle. Nenhuma execução de
validação descartável — as três do controle já provam a carga da skill. Os dois
`--list --check` não chamam modelo.
