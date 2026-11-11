---
id: TASK-111
title: 'harness: reduzir os arquivos gigantes de evals antes do freeze'
status: Done
assignee: []
created_date: '2026-11-11T20:43:00Z'
updated_date: '2026-11-11T22:25:00Z'
labels: []
dependencies: []
documentation:
  - scripts/lib/evals/assertions.mjs
  - docs/evals/coverage.md
  - docs/pipeline.md
priority: medium
type: task
ordinal: 111000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: reavaliacao de 2026-11-11 (0.7.6) e condicao pre-freeze do mantenedor: antes de congelar features do harness, reduzir os arquivos gigantes. Medicoes no main: scripts/lib/evals/assertions.mjs 29,3 KB (parsing de veredito, parsing de comando, gates, oraculos e dispatcher no mesmo modulo); docs/evals/coverage.md 85,1 KB (a narrativa por onda da SPEC-0050/55/56/78 ocupa ~440 das ~915 linhas); assertions.test.mjs 42,5 KB e os demais testes de eval 25-46 KB. Entregar: split de assertions.mjs por concern com a superficie publica intacta, testes movidos sem delegacao, coverage.md como scorecard operacional com o historico em docs/evals/coverage-history.md. Gate: nenhum veredito ou contagem publicada muda; lint e selftest verdes.
<!-- SECTION:DESCRIPTION:END -->
