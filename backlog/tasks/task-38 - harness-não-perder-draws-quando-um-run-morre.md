---
id: TASK-38
title: 'harness: não perder draws quando um run morre'
status: Done
assignee: []
created_date: '2026-11-06T12:46:00Z'
updated_date: '2026-11-07T20:57:00Z'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O result.json só é escrito depois de todas as repetições. O run 2026-11-06T07-09-52 morreu e o diretório ficou vazio: as draws já pagas foram perdidas e refeitas. Falta persistência incremental por draw, retomada de um run interrompido, e uma sonda de auth antes do lote para não falhar devagar em cada draw.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Cada draw grava seu resultado parcial antes do próximo começar.
- [x] #2 --resume <run-dir> retoma do primeiro draw ausente sem refazer os concluídos.
- [x] #3 Sonda de auth no início do lote falha rápido e nomeia o provider.
- [x] #4 Um run morto no meio deixa evidência utilizável e o runcheck a classifica como incompleta, não como limpa.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-07T20:57:00Z

---

AC-1: cada draw completo grava cases/<case>/draws/r<i>.json antes do proximo (writeDraw em runs.mjs; runCase chama antes de retornar). AC-2: --resume <dir> reabre o run, valida arm/level/repeat/label e le os draws persistidos; o teste CLI resume um run smoke sem modelo. AC-3: authProbe roda opencode auth list + models antes do primeiro draw pago, falha rapido e nomeia o provider; testado com spawn injetado e no ambiente real (opencode-go: credentials present). AC-4: run com draws e sem result.json continua incomplete no check-eval-run (isolated=unknown), nunca limpo; teste sintetico. Nao reescreve runs historicos.

---
<!-- COMMENTS:END -->
