---
id: TASK-92
title: 'evals: re-medir os casos 3-6 do review-code no skillHash atual'
status: Done
assignee: []
created_date: '2026-11-10T19:07:00Z'
updated_date: '2026-11-11T18:13:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
  - docs/specs/SPEC-0056-review-proportional-to-diff-risk.md
priority: medium
type: task
ordinal: 92000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: AC-6 da SPEC-0056 (2026-11-10). Os casos 3-6 do review-code nao foram re-medidos no skillHash 9a28572 depois da mudanca do SKILL.md; as celulas publicadas sao historicas. Re-medir os quatro casos, cinco draws por braco (40 draws), e publicar before/after; se o orcamento nao for aprovado, manter a nota de known hole e nao reivindicar verde no hash atual.
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-11T18:14:03.961Z

---

Done via SPEC-0078. 30 draws pontuados / 32 tentativas pagas (dois stalls reexecutados pelo retry de infra do proprio harness: #5 r4 e #6 r4), custo real >= US$ 0,349. #3 separator 5/5 vs 0/5 no julgamento; #4 non-discriminator 5/5 vs 2/5 — o controle nunca aprovou, escreveu 'not ready'/'not implemented' fora do vocabulario (TASK-109); #5 e #6 trigger, um braco por design. Todos no skillHash 9a28572, isolated=yes; staleness caiu de 55 para 51, zero celulas review-code vencidas.

---
<!-- COMMENTS:END -->
