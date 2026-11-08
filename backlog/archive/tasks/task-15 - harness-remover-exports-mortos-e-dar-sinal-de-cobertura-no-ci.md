---
id: TASK-15
title: 'harness: remover exports mortos e dar sinal de cobertura no CI'
status: Done
assignee: []
created_date: '2026-11-02T18:55:00Z'
updated_date: '2026-11-05T12:59:00Z'
labels: []
dependencies: []
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dois resíduos pequenos que só aparecem quando alguém procura.

**Exports mortos.** `ARMS` em `scripts/lib/evals/execute.mjs` é exportado e não é usado em lugar nenhum — a única menção é a própria definição. `gateFor` (mesmo arquivo), `isInside` (`assertions.mjs`) e `listTree` (`glob.mjs`) são exportados mas só têm uso interno; a exportação não serve a ninguém e aumenta a superfície que parece contrato.

**Sem sinal de cobertura.** O CI roda `node --test scripts/lib/evals/*.test.mjs` e fica verde, mas não diz o que não foi tocado. Foi assim que `execute.mjs` e `agent.mjs` passaram a sessão inteira sem teste e ninguém viu. O Node 20 (versão do CI) já suporta `--experimental-test-coverage`, mas limiar numérico só existe em versões mais novas; então o primeiro passo é o relatório, não o portão.

Ordem: medir a cobertura atual e publicá-la no log do CI; só depois, e com a TASK-13 feita, transformar o número num piso.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `ARMS` removido e `gateFor`/`isInside`/`listTree` deixam de ser exportados se o uso for só interno
- [x] #2 nenhum import quebrado, `node --test` e CI verdes
- [x] #3 cobertura aparece no log do CI com a versão de Node que o workflow usa
- [x] #4 nenhum limiar numérico imposto antes de a TASK-13 fechar
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T18:55:00Z

---

Aberto a partir da revisão de dívida técnica. Deliberadamente pequeno: o valor aqui é o sinal, não o número.
Groomed into `docs/specs/SPEC-0010-coverage-signal-and-dead-exports.md` (draft). O CI já fixa Node 24, então o motivo original do "sem limiar" mudou; o spec mantém o relatório de cobertura como escopo e deixa o piso numérico para uma task seguinte. Corrige também o comentário que ainda declara Node 20.

<!-- COMMENTS:END -->
