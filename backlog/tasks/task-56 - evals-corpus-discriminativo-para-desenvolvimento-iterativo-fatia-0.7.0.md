---
id: TASK-56
title: 'evals: corpus discriminativo para desenvolvimento iterativo (fatia 0.7.0)'
status: Done
assignee: []
created_date: '2026-11-08T00:48:00Z'
updated_date: '2026-11-11T10:03:00Z'
labels: []
dependencies: []
references:
  - https://github.com/ricardowendell/agent-skills/issues/6
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: issue #6 (P0), criada em 2026-11-08. O pedido completo e um corpus de 8-12 casos com bracos A (baseline) / B (skill externa pinada) / C (candidata). Decisao de 2026-11-08: a 0.7.0 entrega so a fatia deterministica — 3 a 4 casos com oraculo texto/arquivo/shell, sem caminho visual. O resto do escopo (casos visuais, 8-12 casos, A/B/C completo) fica para a 0.8.0, quando existir oraculo de browser; declarar essa lacuna agora e melhor do que marcar casos visuais como manual e chamar de cobertura.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 3 a 4 casos novos rodam no runner existente, com fixture pinada, prompt e hash de versao; nenhum caso depende de browser ou screenshot.
- [ ] #2 Um dos casos e adversarial: pedido que exigiria tocar auth/policy/arquivo fora do escopo; o agente recusa ou escala, mesmo que o resultado pareca correto.
- [ ] #3 A medicao separa skill carregada de skill apenas mencionada (skillGate), e unknown/unverifiable nao conta como pass.
- [ ] #4 Controle --no-skill, repeticao e holdout preservados; o holdout e congelado antes do primeiro draw.
- [ ] #5 Pelo menos 3 casos discriminam com repeticao OU o relatorio admite que nao houve discriminacao, sem ajustar o oraculo para forcar sucesso.
- [ ] #6 Veredito explicito sobre a issue #7 (TASK-57): estender implement-from-prompt ou criar skill nova, com evidencia.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-08T01:40:00Z

---

Groomed em 2026-11-08 para docs/specs/SPEC-0034-iterative-corpus.md (status: ready). Fatia da 0.7.0: 4 casos (#9-#12) no implement-from-prompt, dois bracos, 5 draws cada, 40 draws no total. Holdout: caso #11 (pedido inseguro), nomeado na spec antes do primeiro draw. Escopo visual/UX fica fora (SPEC-0036/0038).

---

created: 2026-11-08T09:59:39.085Z

---

Onda parada por decisao em 2026-11-08. A branch pdlc/SPEC-0034-iterative-corpus em 91ee5ff mantem as 4 fixtures e os Results parciais (30/40 draws; holdout #11 nao sorteado; controle #12 stallou). Retomar exige --resume do controle #12 e os draws do #11; TASK-50 reaberta com os eventos. SPEC-0034 volta a paused ate a decisao.

---

created: 2026-11-09T00:09:46.525Z

---

Branch parkeada migrada para o tag parked/SPEC-0034-iterative-corpus (91ee5ff); o worktree .lane/trees/SPEC-0034-iterative-corpus e a branch pdlc/SPEC-0034-iterative-corpus foram removidos para zerar o drift. Os 6 run dirs continuam como evidencia. Retomar exige novo dispatch + --resume do controle #12 e os draws do holdout #11; TASK-50 reaberta.

---
<!-- COMMENTS:END -->
