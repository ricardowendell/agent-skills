---
id: TASK-94
title: 'evals: tirar o corpus de dentro do skill (SPEC-0058)'
status: To Do
assignee: []
created_date: '2026-11-10T21:58:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/parse.mjs
  - scripts/lib/evals/fixture.mjs
  - scripts/lib/evals/speccheck.mjs
  - CONTRIBUTING.md
priority: high
type: task
ordinal: 94000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: PR 1 do plano de simplificacao (2026-11-10). Hoje as answer keys moram em skills/<id>/references/evals*, dentro do artefato empacotado, e e por isso que o deny list da SPEC-0046 precisa citar esses paths. Mover os 14 evals.md e 72 diretorios de fixture para evals/<id>/cases.md e evals/<id>/fixtures/<n>/, fazer a descoberta ler so o layout novo, e adicionar um guard determinista contra eval stray em skills/*/references. Inclui o suporte a subtree no files: do speccheck (368 caminhos nao cabem numa lista). Nao reescreve docs/specs nem backlog (registro historico). Zero draws pagos.
<!-- SECTION:DESCRIPTION:END -->
