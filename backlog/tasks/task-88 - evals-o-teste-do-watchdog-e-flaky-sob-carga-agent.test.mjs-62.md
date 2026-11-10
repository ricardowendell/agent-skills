---
id: TASK-88
title: 'evals: o teste do watchdog e flaky sob carga (agent.test.mjs:62)'
status: Done
assignee: []
created_date: '2026-11-10T15:13:00Z'
updated_date: '2026-11-10T16:23:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/agent.test.mjs
  - docs/specs/SPEC-0052-the-eval-store-is-an-answer-key.md
priority: medium
type: task
ordinal: 88000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Descoberto em 2026-11-10 ao verificar a SPEC-0052. scripts/lib/evals/agent.test.mjs:62 ('a slow but live stream resets the watchdog and survives') falhou 2x sob load ~12 com 301ms contra stallMs=300; passou 3/3 em re-run e em isolamento. O teste depende de timing e bloqueia o commit hook e o pdlc verify sem ser regressao do diff. Investigar a margem (janela de 300ms contra 5 eventos a cada 30ms) ou tornar o teste deterministico; nao baixar o gate.
<!-- SECTION:DESCRIPTION:END -->
