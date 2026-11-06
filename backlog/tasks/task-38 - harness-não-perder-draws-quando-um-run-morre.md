---
id: TASK-38
title: 'harness: não perder draws quando um run morre'
status: To Do
assignee: []
created_date: '2026-11-06T12:46:00Z'
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
- [ ] #1 Cada draw grava seu resultado parcial antes do próximo começar.
- [ ] #2 --resume <run-dir> retoma do primeiro draw ausente sem refazer os concluídos.
- [ ] #3 Sonda de auth no início do lote falha rápido e nomeia o provider.
- [ ] #4 Um run morto no meio deixa evidência utilizável e o runcheck a classifica como incompleta, não como limpa.
<!-- AC:END -->
