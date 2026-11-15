---
id: TASK-119
title: 'evals: ancorar o oraculo do caso 1 do gerador no passo de teste'
status: To Do
assignee: []
created_date: '2026-11-15T00:06:00Z'
labels:
  - evals
dependencies: []
priority: medium
type: task
ordinal: 119000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0090 (0.9.5). O caso 1 de write-implementation-prompt usa ## Operations[\s\S]{0,600}?(test|spec file)[\s\S]{0,300}?(implement|add and export); a janela de 300 e case-sensitive, entao dois draws test-first (r2, r3 de 2026-11-14T09-20-09) viraram falso-fail e a celula ficou unresolved (oracle-limited). Correcao: ancorar no step de teste (case-insensitive, sem janela fixa, ou exigir o step de teste abrindo Operations), com correcao registrada e re-medicao 5+5; human gate.
<!-- SECTION:DESCRIPTION:END -->
