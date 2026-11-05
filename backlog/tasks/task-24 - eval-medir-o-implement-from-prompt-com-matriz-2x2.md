---
id: TASK-24
title: 'eval: medir o implement-from-prompt com matriz 2x2'
status: Done
assignee: []
created_date: '2026-11-05T13:50:00Z'
updated_date: '2026-11-05T16:51:00Z'
labels: []
dependencies: []
priority: high
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A skill com maior buraco de evidência: 8 casos, 3 manuais, nenhum controle medido. Os 33 run dirs históricos são todos with-skill e de versões antigas dos casos. Medir se os casos separam com/sem skill sob o instrumento atual e home isolado, promovendo os 3 manuais quando a fixture sustentar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Os 3 casos manuais (#2, #3, #4) viram runnable ou ficam manuais com motivo escrito; totais do coverage atualizados.
- [ ] #2 Canário de carregamento: 0 falhas de gate em 12 draws do caso #1.
- [ ] #3 Gate A: braço with-skill e controle, n=5, modelo default, com judge gpt-6-luna; classificação por caso (separador / não-discriminador / quebrado).
- [ ] #4 Gate B: separadores remédidos n=12 no default e n=5 no gpt-6-luna.
- [ ] #5 docs/evals/implement-from-prompt-matrix.md publicado com run dirs; coverage.md atualizado.
- [ ] #6 Nenhuma mudança de skill ou runner durante a medição.
<!-- AC:END -->
