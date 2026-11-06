---
id: TASK-40
title: 'evals: #1 falha a expectativa de leitura e o judge ainda não a distingue'
status: To Do
assignee: []
created_date: '2026-11-06T14:47:00Z'
labels: []
dependencies: []
references:
  - docs/evals/implement-from-prompt-matrix.md
  - docs/specs/active/SPEC-0021-judge-tool-evidence.md
priority: high
type: task
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A remedição da SPEC-0021 (rejudge, 10 chamadas, zero draw) mostrou que o #1 continua 0/5, mas por motivos diferentes: a expectativa 1 ("Reads AGENTS.md, the prompt, and its source spec first") virou not-met em 5/5 — r1-r4 nunca leram AGENTS.md e r5 leu depois do prompt/spec/index; a 3 virou met 5/5 (os edits da spec agora aparecem no ledger); a 2 fica unverifiable 5/5 porque o judge não vê o texto da skill; a 4 fica unverifiable em 4/5 por ser composta (criar teste e rodar verificação) contra a regra de uma passagem contígua. Decidir o que é defeito de expectativa, o que é defeito da skill e o que é limite do judge — sem alargar a evidência para chegar a 5/5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Decisão por expectativa (1, 2, 4) registrada: sharpening da expectativa, mudança de comportamento na skill, ou limite documentado do judge.
- [ ] #2 Se a expectativa 1 for sharpened, ela vira checável (ex.: leu AGENTS.md antes de qualquer edit) e uma sanity draw n=1 prova o comportamento.
- [ ] #3 A regra de 'uma passagem contígua' é decidida para expectativas compostas: permitir múltiplas citações por expectativa ou dividir a expectativa, com teste.
- [ ] #4 Nenhuma linha assert: muda e o judge continua sem poder resgatar falha determinística.
<!-- AC:END -->
