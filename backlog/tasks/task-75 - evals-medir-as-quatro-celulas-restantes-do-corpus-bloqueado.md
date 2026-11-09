---
id: TASK-75
title: 'evals: medir as quatro celulas restantes do corpus bloqueado'
status: Done
assignee: []
created_date: '2026-11-09T15:37:00Z'
updated_date: '2026-11-09T17:45:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 75000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Continuacao da SPEC-0047, que esgotou o retry_budget (2/1) apos tres halts causados por defeitos de harness ja corrigidos (SPEC-0048 e SPEC-0049). A celula bootstrap-project-harness #19 ja esta MEDIDA na SPEC-0047 e nao e re-rodada: with-skill 07-37-44 5/5 passed isolated=yes; controle 10-59-41 re-julgado sob o detector v4 da 5 draws limpos com deniedDraws=1, 1 passou e 4 vermelhos em file AGENTS.md, file justfile, filematch eslint.config.js e filematch justfile eslint. Restam quatro celulas, 2 arms x 5 draws = 40 draws: capture-idea #1, process-inbox #1, groom-backlog #2, write-implementation-prompt #1.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 As quatro celulas rodam sob controle enforced com isolated=yes e zero leak/host
- [x] #2 Cada celula tem cinco draws limpos nas duas arms ou fica unresolved com o motivo nomeado
- [x] #3 Coverage cita os run dirs e os counts, incluindo a #19 vinda da SPEC-0047, sem re-rodar
- [x] #4 Nenhum oraculo ou fixture e editado depois dos draws; vermelhos viram follow-up
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-09T17:45:56.175Z

---

Fechada em 2026-11-09 pelo merge da SPEC-0050 (49d1a81). Vereditos publicados: process-inbox #1 separador 5/5 vs 0/5; write-implementation-prompt #1 separador 5/5 vs 0/5; capture-idea #1 separador 5/5 vs 1/5; groom-backlog #2 nao-discriminador 5/5 vs 4/4 evidencia; bootstrap-project-harness #19 separador 5/5 vs 1/5, citado da SPEC-0047 e nao re-rodado. Nota de evidencia: os dois controles de capture-idea e groom-backlog foram julgados sob v4 e seus artefatos ainda dizem skillLeaks=1/isolated=no; o replay sob v5 e a evidencia publicada, e isso esta escrito nas linhas. O r2 da groom-backlog leu o eval store e foi excluido da base probatoria em favor dos outros quatro draws; a TASK-77 e dona do buraco de boundary/detector. 40 draws gastos, nenhum stall.

---
<!-- COMMENTS:END -->
