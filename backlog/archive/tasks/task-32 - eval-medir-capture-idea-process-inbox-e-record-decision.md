---
id: TASK-32
title: 'eval: medir capture-idea, process-inbox e record-decision'
status: Done
assignee: []
created_date: '2026-11-05T20:54:00Z'
updated_date: '2026-11-06T20:52:00Z'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Os três bookends do pipeline, 11 casos somados, todos com fixture e nenhuma medição. Fecha a cobertura de 9/13 para 13/13 quando somado ao TASK-31. Mesmo desenho dos anteriores: 5 draws por braço, modelo default, sem judge.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 5 draws por braco por skill, com run dir citado.
- [x] #2 Classificacao por caso, com o motivo de cada vermelho.
- [x] #3 Casos que nao separam viram regressao registrada em Known holes do coverage.md.
- [x] #4 Numeros sem run dir marcados none, nao como medicao.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T20:52:00Z

---

Fechada pela SPEC-0026 (merge). AC-1: 5 draws por braco por skill, com run dir; os controles de capture-idea #1 e process-inbox #1 nunca tiveram 5 draws limpos em uma run, entao a celula e unresolved com as contagens reais (0/2, 0/2, 0/0 e 0/1 x3) e os draws poluidos nomeados. AC-2: record-decision #1 separa 4/5 vs 1/5, #2 4/5 vs 0/5, #3 non-discriminator 4/5 vs 5/5; triggers publicados por run, nao como taxa. AC-3: capture-idea #1, process-inbox #1 e record-decision #3 (mais write-implementation-prompt #1/#4 da SPEC-0025) estao em Known holes como regressao com motivo. AC-4: nenhum numero sem run dir; o total do coverage.md bate com --list --check. Achados abertos: TASK-43 (detector de leak) e TASK-44 (staging multi-skill).

---
<!-- COMMENTS:END -->
