---
id: TASK-41
title: 'evals: publicar um baseline de saúde do harness a cada release'
status: Done
assignee: []
created_date: '2026-11-06T15:38:00Z'
updated_date: '2026-11-06T16:26:00Z'
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
- [x] #1 node scripts/harness-health.mjs imprime a tabela markdown sobre o store real; --json emite os mesmos números; store e .pdlc/runs.json ficam inalterados.
- [x] #2 Duas invocações sobre o mesmo store produzem saída idêntica (teste com fixture).
- [x] #3 Testes cobrem caso único e repetido, pass/fail/unscored, contaminação, infraestrutura, falha de judge, proveniência completa/parcial, retry e gate vermelho do pdlc, --since e flag desconhecida.
- [x] #4 docs/evals/harness-health.md publica o baseline 0.4.0 com comando, data e números reais, regenerável.
- [x] #5 CONTRIBUTING.md registra o loop: por release, antes do CHANGELOG, no máximo 3 achados e 1 spec.
- [x] #6 Zero draw, zero modelo, git diff -- skills/ vazio, cinco gates verdes.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T16:26:00Z

---

Fechada pela SPEC-0024 (merge edc6b54). AC-1: harness-health read-only, markdown + --json, hashes do store e do .pdlc iguais antes/depois. AC-2: duas invocacoes byte-identicas. AC-3: 12 testes em health.test.mjs cobrem single/repeated, pass/fail/unscored, contaminacao, infra, judge, proveniencia, retry/gate do pdlc, --since/--until e flags invalidas. AC-4: docs/evals/harness-health.md publica o snapshot 2026-11-06T16:12:50Z, reproduzivel com --until; 173 runs, 844 draws, elegivel 827/814 = 67.2%, estrito 90/87/3 = 96.7%, infra 9, proveniencia 95/745, parede 12h10m14s. AC-5: CONTRIBUTING tem o loop por release (<=3 achados, 1 spec). AC-6: zero draw, git diff -- skills/ vazio, 252 testes, gates verdes.

---
<!-- COMMENTS:END -->
