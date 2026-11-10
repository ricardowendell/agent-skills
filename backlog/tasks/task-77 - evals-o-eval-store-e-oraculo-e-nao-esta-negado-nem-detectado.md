---
id: TASK-77
title: 'evals: o eval store e oraculo e nao esta negado nem detectado'
status: Done
assignee: []
created_date: '2026-11-09T17:25:00Z'
updated_date: '2026-11-10T15:07:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Descoberto no review da SPEC-0050 (2026-11-09). O controle da groom-backlog #2, draw r2, leu o eval store: transcript.r2.md mostra sed em ~/.local/share/opencode/evals/groom-backlog/2.md, o result.json anterior do mesmo caso, transcripts with-skill anteriores (2.r1.md) e o transcript de controle anterior; a resposta repete a anterior. Nem o boundary da SPEC-0046 nem o detector da SPEC-0048/0049 cobrem esse caminho: corpusRoots nao inclui o eval store e findLeaks nao o reconhece como answer key. Consequencia: um controle pode aprender a resposta de runs anteriores e ainda ser publicado como limpo. A classificacao da 0050 sobreviveu porque os outros quatro draws limpos tambem passam, mas o buraco vale para todas as medisoes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 O eval store entra no corpus roots e e negado sob enforcement, como as raizes instaladas
- [x] #2 Uma leitura do eval store produz finding nomeado de answer key, com ou sem enforcement
- [x] #3 Teste cobre os dois estados e uma transcript real que le o store
- [x] #4 coverage.md e a regra nomeiam o eval store como corpus
<!-- AC:END -->
