---
id: TASK-24
title: 'eval: medir o implement-from-prompt com matriz 2x2'
status: Done
assignee: []
created_date: '2026-11-05T13:50:00Z'
updated_date: '2026-11-07T23:05:00Z'
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
- [x] #1 Os 3 casos manuais (#2, #3, #4) viram runnable ou ficam manuais com motivo escrito; totais do coverage atualizados.
- [x] #2 Canário de carregamento: 0 falhas de gate em 12 draws do caso #1.
- [x] #3 Gate A: braço with-skill e controle, n=5, modelo default, com judge gpt-6-luna; classificação por caso (separador / não-discriminador / quebrado).
- [x] #4 Gate B: separadores remédidos n=12 no default e n=5 no gpt-6-luna.
- [x] #5 docs/evals/implement-from-prompt-matrix.md publicado com run dirs; coverage.md atualizado.
- [x] #6 Nenhuma mudança de skill ou runner durante a medição.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-07T23:05:00Z

---

TASK-53 (reconciliacao) contra a SPEC-0015. AC-1 met: coverage de implement-from-prompt com 8 casos, 0 manual; #2, #3 e #4 runnable ou com motivo (matriz, Classification). AC-2 met: canario 12/12 em 2026-11-05T11-36-10, zero gate misses. AC-3 met: Gate A n=5, modelo default, judge gpt-6-luna, com run dirs na matriz. AC-4 met: Gate B n=12 default e n=5 gpt-6-luna para os separadores #1/#8. AC-5 met: matriz publicada com run dirs e coverage atualizado. AC-6 met com ressalva registrada: a SPEC-0016 mudou a regra durante a onda e o #4 foi remedido depois; o detector de contaminacao entrou em 8777e0b. Nao houve tuning para passar, e as leituras pre-fix ficam no doc. Nao reabrir.

---
<!-- COMMENTS:END -->
