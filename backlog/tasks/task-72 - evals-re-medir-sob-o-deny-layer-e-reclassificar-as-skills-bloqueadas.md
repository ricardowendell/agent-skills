---
id: TASK-72
title: 'evals: re-medir sob o deny layer e reclassificar as skills bloqueadas'
status: In Progress
assignee: []
created_date: '2026-11-09T09:05:00Z'
updated_date: '2026-11-09T10:36:00Z'
labels: []
dependencies:
  - TASK-71
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Segunda metade da TASK-71, partida em duas para nao juntar mudanca de harness com onda paga. Bloqueada pela SPEC-0046 (deny layer). Alvo: uma celula comportamental de cada skill com bloqueio publicado em docs/evals/coverage.md -- capture-idea #1 (2026-11-07T08-27-30), process-inbox #1 (2026-11-06T17-25-52, dirty leak+host), groom-backlog #2 (2026-11-06T07-47-34), write-implementation-prompt #1 (2026-11-07T08-17-29) e bootstrap-project-harness (2026-11-08T22-51-39) -- atinge cinco draws limpos no controle e e reclassificada como separator, non-discriminator ou unresolved. Nenhuma celula e promovida sem cinco draws limpos; a regra de cinco draws nao baixa. Custo estimado: 5 skills x 1 caso x 5 draws x 2 arms = 50 draws, mais canarios.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 As cinco skills bloqueadas rodam com o deny layer efetivo e o resumo nao diz isolated=no em nenhuma celula
- [ ] #2 Cada celula atinge cinco draws limpos no controle ou permanece unresolved com o motivo nomeado
- [ ] #3 Cada reclassificacao (separator, non-discriminator, unresolved) e publicada no coverage.md com o run dir
- [ ] #4 Nenhum oraculo e editado depois dos draws; vermelhos viram follow-up
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-09T12:27:45.253Z

---

Onda parada em 2026-11-09 no F0.1, apos 1 de 5 celulas. A arm com skill fechou 5/5 isolated=yes; o controle rodou sob seatbelt (enforced=true) mas o detector contou a leitura NEGADA como leak, entao o resumo deu isolated=no e a onda parou. 40 draws nao gastos. Evidencia: runs 2026-11-09T07-37-44 (skill) e 2026-09T07-52-50 (controle, r3-r5 contaminados com EPERM no transcript). Branch parkeada no tag parked/SPEC-0047-remeasure-wave; a spec ficou paused. Destrava pela TASK-73/SPEC-0048 (denied != leak), que roda sem draw pago e re-julga esses runs por replay.

---
<!-- COMMENTS:END -->
