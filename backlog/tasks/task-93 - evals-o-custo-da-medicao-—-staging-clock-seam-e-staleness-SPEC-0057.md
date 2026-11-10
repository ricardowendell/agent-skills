---
id: TASK-93
title: 'evals: o custo da medicao — staging, clock seam e staleness (SPEC-0057)'
status: Done
assignee: []
created_date: '2026-11-10T20:19:00Z'
updated_date: '2026-11-10T21:57:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/fixture.mjs
  - scripts/lib/evals/agent.mjs
  - scripts/lib/evals/runs.mjs
  - docs/evals/coverage.md
  - docs/specs/SPEC-0053-a-deterministic-watchdog-test.md
priority: high
type: task
ordinal: 93000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: analise de custo das waves SPEC-0055/0056 (2026-11-10). Tres defeitos do harness que custam dinheiro ou escondem evidencia. (1) fixture.mjs:121 devolve um scratch vazio em silencio quando o base do git.json nao resolve — foi o que queimou 5 draws no caso 9 da SPEC-0055; --level smoke tambem nao valida o oraculo. (2) agent.mjs:66 usa relogio real, entao o teste do watchdog custa 4.5s de um suite de 4.9s. (3) skillHash e gravado e impresso mas nunca comparado: nenhum script detecta celula vencida, e o buraco da AC-6 da SPEC-0056 foi achado por humano lendo manifesto. Zero draws pagos; nenhum texto de skill, fixture ou oraculo muda. Decisoes humanas: governs default = arvore inteira; check-staleness reporta, nao gateia; o reverso do clock seam supersede a nota da SPEC-0053 dentro da propria spec (nao existe docs/decisions neste repo).
<!-- SECTION:DESCRIPTION:END -->
