---
id: TASK-27
title: 'evals: judge marca unverifiable quando a evidência está em tool calls'
status: Done
assignee: []
created_date: '2026-11-05T16:51:00Z'
updated_date: '2026-11-07T23:05:00Z'
labels: []
dependencies: []
priority: high
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Na SPEC-0015, o #1 deu 5/5 determinístico com skill mas 0/5 no judge, e o controle do #7 deu 5/5 determinístico mas 1/5 no judge. O judge não vê a evidência que está em tool calls e marca unverifiable, que o runner conta como falha. O judge deve poder citar tool calls ou unverifiable não deve derrubar o caso.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 O judge lê tool calls/command output ou unverifiable deixa de falhar o caso.
- [ ] #2 #1 with e #7 control passam a refletir a leitura determinística.
- [x] #3 O judge continua sem poder resgatar um caso que falhou determinísticamente.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T15:33:00Z

---

Fechada pela SPEC-0021 (merge 084c7fe, HEAD 03c7e3f). AC-1: o judge recebe o ledger de tool calls (skill/read/edit/write/shell com output) e o corpus e exatamente o texto do prompt; AC-3: o judge so roda em passe deterministico e nao resgata falha. AC-2 fica PARCIAL e nao foi marcada: #7 control 1/5 -> 5/5, mas #1 continuou 0/5 por motivo novo — expectativa 1 not-met em 4/5 (r1-r4 nunca leram AGENTS.md; r5 leu antes de editar e foi met) e expectativas 2/4 inverificaveis por construcao. A residual virou TASK-40. Evidencia: 10 chamadas de judge, zero draw; os dois result.json ficaram byte-identicos.

---

TASK-53 (reconciliacao): AC-1 e AC-3 seguem met. AC-2 permanece aberto com razao registrada: #7 control passou a 5/5, mas #1 continuou 0/5 porque a expectativa 1 era comportamento real (r1-r4 nao leram AGENTS.md), nao evidencia faltante. A TASK-40 fechou a residual em 2026-11-07: exp1 sharpened para antes do primeiro edit (r5 prova), exp2 e limite documentado do judge (nao ve o texto da skill), exp4 aceita duas passagens separadas por pipe. Nao foi feito novo draw nem novo rejudge; logo AC-2 nao vira met por decreto. Nao reabrir.

---
<!-- COMMENTS:END -->
