---
id: TASK-97
title: >-
  evals: fixar o trade do reject-vins e a fronteira de virgula no verdict
  (SPEC-0062)
status: Done
assignee: []
created_date: '2026-11-10T22:46:00Z'
updated_date: '2026-11-11T16:36:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/assertions.mjs
  - docs/specs/SPEC-0062-the-verdict-vocabulary-is-closed.md
priority: low
type: task
ordinal: 97000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: review da SPEC-0062 (2026-11-10). Dois residuos latentes do matcher, nenhum com instancia no store (0 de 315 draws movem). (1) A precedencia REJECT > APPROVE gera falso reject quando a linha rejeita uma alternativa e aprova a mudanca: 'reject the alternative; approve the change' le REJECT. O teste atual so cobre a direcao que queremos; falta o teste inverso. (2) A virgula nao e fronteira de clausula, entao um negador anterior anula um stance posterior: 'AC-2 is not implemented, changes requested' nao pontua. So sub-pontua, nunca infla. Fixar as duas com teste e re-rodar o replay: os mesmos 17 draws devem mover.
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-11T16:36:31.164Z

---

Done via SPEC-0073 (merge em main). O stance agora vem da ultima clausula que nomeia um stance, com REJECT ainda vencendo dentro da clausula; virgula encerra clausula para todo blocker exceto if/unless/whether, que sao lidos na frase inteira para preservar os dois misses condicionais da SPEC-0062. Seis testes novos por evaluateAssertions. Replay: 0 assertions movem contra a main em 343 linhas; contra o leitor pre-0062 movem os mesmos 17 draws, fail->pass, e nada mais. Paragrafo do replay CLI corrigido (66 transcripts, 13 diffs herdados: 11 up, 2 down pre-existentes). Zero draws.

---
<!-- COMMENTS:END -->
