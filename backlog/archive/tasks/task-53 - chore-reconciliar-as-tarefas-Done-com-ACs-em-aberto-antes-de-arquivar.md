---
id: TASK-53
title: 'chore: reconciliar as tarefas Done com ACs em aberto antes de arquivar'
status: Done
assignee: []
created_date: '2026-11-07T20:46:00Z'
updated_date: '2026-11-07T23:05:00Z'
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
- [x] #1 Cada uma das quatro tarefas tem todo AC marcado com evidencia ou uma razão registrada para o não-cumprimento; nenhuma fica Done com AC em aberto sem explicação.
- [x] #2 TASK-24 é reconciliada com a SPEC-0015 (ACs cumpridos ou a task é reaberta com o que falta).
- [x] #3 Só depois disso a TASK-35 pode arquivar; o arquivamento não esconde AC em aberto.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-07T23:05:00Z

---

Reconciliacao concluida. TASK-3: AC-1/3/4 checados; AC-2 aberto com razao (Copilot indisponivel; YAML valido e OpenCode carrega; HEAD upstream valido), sem reabrir. TASK-17: AC-1/3/6 checados; AC-2 nao cumprido como escrito (SPEC-0006 reduziu de tres mutacoes para dois controles), AC-4/AC-5 sem sobreviventes (ambos invalid), razoes na task; follow-ups TASK-21/22. TASK-24: AC-1..6 checados contra a SPEC-0015, com ressalva registrada no AC-6 (SPEC-0016 mudou a regra e o #4 foi remedido; sem tuning). TASK-27: AC-1/3 checados; AC-2 aberto com razao (TASK-40 decidiu a residual, mas #1 nao foi remedido no judge). Nenhuma task foi reaberta sem evidencia. TASK-35 pode arquivar; todo AC aberto tem explicacao na propria task.

---
<!-- COMMENTS:END -->
