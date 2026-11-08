---
id: TASK-46
title: 'evals: re-medir as células que o detector novo invalidar'
status: Done
assignee: []
created_date: '2026-11-06T21:23:00Z'
updated_date: '2026-11-07T11:49:00Z'
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
- [x] #1 Toda célula nomeada pelo replay da SPEC-0028 tem veredito sob o detector v2, ou está anotada como história v1 com o motivo.
- [x] #2 As três unresolved de 0.5.0 são medidas com os dois braços sob o mesmo detector, cinco draws limpos por braço numa run, ou continuam unresolved com a contagem nova.
- [x] #3 Nenhum número publicado é reescrito; a linha do coverage.md diz qual detector produziu cada leitura.
- [x] #4 Separador que não puder ser re-medido é rebaixado para unresolved, não mantido.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-07T11:49:00Z

---

Fechada pela SPEC-0031 (merge em a8d095e). AC-1: as 26 linhas do replay colapsam em 7 braços re-medidos + os with-skill/triggers da SPEC-0030 + #3 manual; todas têm veredito v2 ou história anotada. AC-2: capture #1 (skill 5/5, control 0/0 limpos), process #1 (5/5, 0/2), write #1 (0/2) e #2 (0/4) permanecem unresolved com as contagens cruas e o finding nomeado: o controle ainda lê /Users/wendell/.agents/skills. AC-3: nenhum número reescrito; cada linha diz o detector e o modelo. AC-4: write #2 era separador e virou unresolved; #4 continua não-discriminador. Issue #5 NÃO foi satisfeita por estes três: os separadores terão de vir de implement-from-prompt #1/#8 e review-code #7.

---
<!-- COMMENTS:END -->
