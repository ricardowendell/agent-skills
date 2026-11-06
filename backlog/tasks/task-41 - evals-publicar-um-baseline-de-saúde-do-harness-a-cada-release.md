---
id: TASK-41
title: 'evals: publicar um baseline de saúde do harness a cada release'
status: To Do
assignee: []
created_date: '2026-11-06T15:38:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: medium
type: task
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O retro por release existe como decisão, mas não tem número: o pdlc audit rodou 9 vezes na onda 0.4.0 e não emitiu fato durável, e não há tabela que compare uma release com a anterior. Criar um relatório read-only sobre o store de runs (draws, outcomes, parede, tokens, divergência do judge, proveniência) e sobre o .pdlc/runs.json (retries, gates, status), publicar o baseline 0.4.0 e escrever o loop no CONTRIBUTING.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 node scripts/harness-health.mjs imprime a tabela markdown sobre o store real; --json emite os mesmos números; store e .pdlc/runs.json ficam inalterados.
- [ ] #2 Duas invocações sobre o mesmo store produzem saída idêntica (teste com fixture).
- [ ] #3 Testes cobrem caso único e repetido, pass/fail/unscored, contaminação, infraestrutura, falha de judge, proveniência completa/parcial, retry e gate vermelho do pdlc, --since e flag desconhecida.
- [ ] #4 docs/evals/harness-health.md publica o baseline 0.4.0 com comando, data e números reais, regenerável.
- [ ] #5 CONTRIBUTING.md registra o loop: por release, antes do CHANGELOG, no máximo 3 achados e 1 spec.
- [ ] #6 Zero draw, zero modelo, git diff -- skills/ vazio, cinco gates verdes.
<!-- AC:END -->
