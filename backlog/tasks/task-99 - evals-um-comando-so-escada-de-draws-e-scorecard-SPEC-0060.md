---
id: TASK-99
title: 'evals: um comando so, escada de draws e scorecard (SPEC-0060)'
status: To Do
assignee: []
created_date: '2026-11-10T23:18:00Z'
labels: []
dependencies: []
references:
  - scripts/eval.mjs
  - scripts/run-evals.mjs
  - scripts/replay-evals.mjs
  - docs/pipeline.md
priority: high
type: task
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: PR 4 do plano de simplificacao (2026-11-10). Consolidar run-evals.mjs (921 linhas) e replay-evals.mjs (481) em scripts/eval.mjs com list/check/run/compare/inspect. Defaults que refletem o trabalho real: run = 1 draw, compare = 3 por braco, 5+ e promocao explicita; scorecard de uma tela, com rotulo screening (1-3) vs evidence (5+). compare so reusa um braco quando os seis hashes batem (modelo/provider, prompt, fixture, assertion, skill, isolamento) e imprime reused/ran por braco. Nada de wrapper: as duas CLIs sao apagadas e a referencia viva migra (package.json, CI, pre-commit, docs/pipeline.md, CONTRIBUTING, README, docs/README, coverage). docs/pipeline.md e policy: o merge exige human gate. Zero draws.
<!-- SECTION:DESCRIPTION:END -->
