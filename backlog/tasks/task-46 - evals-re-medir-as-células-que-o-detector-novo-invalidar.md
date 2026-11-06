---
id: TASK-46
title: 'evals: re-medir as células que o detector novo invalidar'
status: To Do
assignee: []
created_date: '2026-11-06T21:23:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A SPEC-0028 troca o detector de leak e o DETECTOR_VERSION muda, então os controles da 0.5.0 deixam de ser comparáveis por definição. O replay da própria SPEC-0028 diz quais células publicadas perdem o status limpo; este é o trabalho de re-medi-las. Entram no mínimo as três unresolved da 0.5.0 (write-implementation-prompt #1, capture-idea #1, process-inbox #1) e qualquer separador que o replay invalidar. Braço com skill e controle na mesma versão do detector, cinco draws limpos por braço numa run. Célula que não couber no orçamento da onda é rebaixada para unresolved com o motivo — nunca mantida como separador por inércia.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Toda célula nomeada pelo replay da SPEC-0028 tem veredito sob o detector v2, ou está anotada como história v1 com o motivo.
- [ ] #2 As três unresolved de 0.5.0 são medidas com os dois braços sob o mesmo detector, cinco draws limpos por braço numa run, ou continuam unresolved com a contagem nova.
- [ ] #3 Nenhum número publicado é reescrito; a linha do coverage.md diz qual detector produziu cada leitura.
- [ ] #4 Separador que não puder ser re-medido é rebaixado para unresolved, não mantido.
<!-- AC:END -->
