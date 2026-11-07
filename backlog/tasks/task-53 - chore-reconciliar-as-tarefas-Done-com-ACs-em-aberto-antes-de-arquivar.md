---
id: TASK-53
title: 'chore: reconciliar as tarefas Done com ACs em aberto antes de arquivar'
status: To Do
assignee: []
created_date: '2026-11-07T20:46:00Z'
labels: []
dependencies: []
priority: medium
type: chore
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-3 (3/4), TASK-17 (0/6), TASK-24 (0/6) e TASK-27 (2/3) estao Done com ACs nao marcados. A TASK-35 vai arquivar as 26 Done; arquivar sem reconciliar esconde trabalho que nao foi verificado. Para cada uma: conferir a evidencia (run dir, doc ou commit), marcar o AC com o que o sustenta, ou registrar no comentario por que foi fechada sem ele (superseded/waived). Nao reescrever historico e nao reabrir sem evidencia; a decisao fica na propria task. TASK-24 aponta para a SPEC-0015, que esta implemented: provavelmente os ACs foram cumpridos e so nao foram marcados.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Cada uma das quatro tarefas tem todo AC marcado com evidencia ou uma razão registrada para o não-cumprimento; nenhuma fica Done com AC em aberto sem explicação.
- [ ] #2 TASK-24 é reconciliada com a SPEC-0015 (ACs cumpridos ou a task é reaberta com o que falta).
- [ ] #3 Só depois disso a TASK-35 pode arquivar; o arquivamento não esconde AC em aberto.
<!-- AC:END -->
