---
id: TASK-119
title: 'evals: ancorar o oraculo do caso 1 do gerador no passo de teste'
status: Done
assignee: []
created_date: '2026-11-15T00:06:00Z'
updated_date: '2026-11-15T13:22:00Z'
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

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-15T13:22:17.644Z

---

Resolvida na 0.9.6 (SPEC-0091). O oraculo do caso 1 deixou de ser uma janela de caracteres (600/300) e passou a exigir que um step de Operations nomeie o teste e o estado vermelho na mesma linha; o cap de 80 tambem foi removido por false-failar um step de 507 chars. Validacao pre-draws: passa nos 5 artifacts de 2026-11-13T09-20-09 e no r4 de 01-58-03, falha no fixture implementation-first. Medicao final: separator 5/5 vs 0/5 (02-11-01 / 02-08-11). 20 draws no total: o primeiro conjunto (10) mediu 4/5 com false-fail do cap e o oraculo foi corrigido antes de publicar, excecao autorizada no merge e registrada em Corrections during implementation.

---
<!-- COMMENTS:END -->
