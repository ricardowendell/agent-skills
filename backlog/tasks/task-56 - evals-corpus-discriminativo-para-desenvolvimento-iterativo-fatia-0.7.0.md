---
id: TASK-56
title: 'evals: corpus discriminativo para desenvolvimento iterativo (fatia 0.7.0)'
status: To Do
assignee: []
created_date: '2026-11-08T00:48:00Z'
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
