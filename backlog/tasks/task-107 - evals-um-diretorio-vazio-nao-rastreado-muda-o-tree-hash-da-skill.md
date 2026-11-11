---
id: TASK-107
title: 'evals: um diretorio vazio nao rastreado muda o tree hash da skill'
status: To Do
assignee: []
created_date: '2026-11-11T14:32:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/fixture.mjs
  - scripts/check-staleness.mjs
  - docs/evals/coverage.md
priority: medium
type: task
ordinal: 107000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: review da SPEC-0069. skills/groom-backlog/references/ existia vazio e nao rastreado no checkout principal (desde 10/11) e nao em worktree limpo; stagedTreeHash hasheia entradas de diretorio, entao groom-backlog#2 aparecia fresh no principal (e2a3b99f) e stale no worktree (724bb8ad). Resultado: a contagem publicada de staleness (66 citadas / 54 vs 55 vencidas) dependia do cwd. O diretorio foi removido (vazio) em 11/11 e os dois checkouts agora concordam em 55. Decidir: stagedTreeHash ignora diretorios vazios, ou o publicador recusa um hash calculado sobre entradas nao rastreadas, ou documenta que a contagem e por checkout. Zero draws.
<!-- SECTION:DESCRIPTION:END -->
