---
id: TASK-80
title: 'review: review-code proporcional ao risco do diff (issue #15)'
status: Done
assignee: []
created_date: '2026-11-10T15:07:00Z'
updated_date: '2026-11-10T19:07:00Z'
labels: []
dependencies: []
references:
  - https://github.com/ricardowendell/agent-skills/issues/15
priority: high
type: enhancement
ordinal: 80000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: issue #15 (P1, enhancement), 2026-11-10. Estender review-code, sem segundo gate: correctness/spec primeiro, depois risco do diff (arquitetura, seguranca, performance, testes), com verificacoes deterministicas limitadas ao diff. Findings bloqueantes vs opcionais; perfil rapido para diff simples; benchmark de qualidade e latencia contra a skill atual. Sem dependencia do corpus #13; #7 e referencia, nao bloqueio.
<!-- SECTION:DESCRIPTION:END -->
