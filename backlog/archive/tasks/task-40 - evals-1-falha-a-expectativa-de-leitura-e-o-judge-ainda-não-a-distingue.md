---
id: TASK-40
title: 'evals: #1 falha a expectativa de leitura e o judge ainda não a distingue'
status: Done
assignee: []
created_date: '2026-11-06T14:47:00Z'
updated_date: '2026-11-07T22:54:00Z'
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
- [x] #1 Decisão por expectativa (1, 2, 4) registrada: sharpening da expectativa, mudança de comportamento na skill, ou limite documentado do judge.
- [x] #2 Se a expectativa 1 for sharpened, ela vira checável (ex.: leu AGENTS.md antes de qualquer edit) e uma sanity draw n=1 prova o comportamento.
- [x] #3 A regra de 'uma passagem contígua' é decidida para expectativas compostas: permitir múltiplas citações por expectativa ou dividir a expectativa, com teste.
- [x] #4 Nenhuma linha assert: muda e o judge continua sem poder resgatar falha determinística.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-07T22:54:00Z

---

AC-1: decisoes registradas em docs/evals/implement-from-prompt-matrix.md. Exp1: sharpening da expectativa para 'Reads AGENTS.md, the prompt and its source spec before the first edit'. Exp2: limite documentado do judge (ele nao ve o texto da skill por design, SPEC-0021 Non-Goals). Exp4: expectativa composta agora aceita multiplas citacoes verbatim separadas por ' | '. AC-2: a expectativa sharpened e checavel pelo ledger; a sanity n=1 e o draw armazenado r5 de 2026-11-05T11-45-57 (read: AGENTS.md no call 6, primeiro edit no 7); r1-r4 nunca leram AGENTS.md. Nenhum draw novo. AC-3: judgePrompt permite uma ou mais passagens contiguas unidas por ' | ', mantem a proibicao de elipse; verifyEvidence ja valida os segmentos e rejeita juncao fabricada; testes em judge.test.mjs. AC-4: nenhuma linha assert: mudou (git diff -- skills/ so a linha expect:); a regra de nao-resgate segue intacta e testada. 363 testes, lint/selftest/parity/check-evidence/preflight verdes.

---
<!-- COMMENTS:END -->
