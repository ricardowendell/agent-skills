---
id: TASK-96
title: >-
  evals: apagar a superficie especulativa e estreitar o check-evidence
  (SPEC-0059)
status: To Do
assignee: []
created_date: '2026-11-10T22:28:00Z'
labels: []
dependencies: []
references:
  - scripts/check-evidence.mjs
  - scripts/lib/evals/health.mjs
  - scripts/lib/evals/provider-audit.mjs
priority: medium
type: task
ordinal: 96000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: PR 2 do plano de simplificacao (2026-11-10). Apagar provider-audit + audit-provider-aborts (124 linhas + 100 de teste), health + harness-health + harness-health.md (471 linhas + doc). O check-evidence NAO e apagado: e estreitado ao invariante que importa (toda run dir citada existe), porque hoje ele varre todo markdown do repo e emite 100 warnings que ninguem le. docs/pipeline.md fica intocado, entao nao ha human gate. docs/evals/experiments nao entra: 294 arquivos merecem spec propria. Zero draws.
<!-- SECTION:DESCRIPTION:END -->
