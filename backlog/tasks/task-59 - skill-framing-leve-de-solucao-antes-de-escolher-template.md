---
id: TASK-59
title: 'skill: framing leve de solucao antes de escolher template'
status: To Do
assignee: []
created_date: '2026-11-08T00:48:00Z'
updated_date: '2026-11-10T15:06:00Z'
labels: []
dependencies:
  - TASK-56
references:
  - https://github.com/ricardowendell/agent-skills/issues/9
priority: low
type: task
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: issue #9 (P2), 2026-11-08. Comparar primeiro com capture-idea, groom-backlog e find-blind-spots: a saida precisa ser um recorte verificavel (problema, persona, resultado observavel, restricoes, hipoteses, duvidas bloqueantes), sem entrevista longa e sem marcar ready. Bloqueada pela TASK-56; se nao houver ganho incremental sobre as skills atuais, a decisao registrada e nao criar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dois pedidos ambiguos produzem perguntas relevantes sem inventar regra de negocio.
- [ ] #2 Um pedido suficientemente claro produz recorte minimo e criterios testaveis sem entrevista.
- [ ] #3 Caso com dados privados ou efeito externo identifica autorizacao e limite de escopo.
- [ ] #4 Sem catalogo valido, nao inventa nome nem capacidade de template.
- [ ] #5 A saida distingue confirmed / assumed / open de forma verificavel.
- [ ] #6 A medicao sustenta criar ou estender; sem valor incremental, registrar a decisao de nao criar.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-08T01:43:00Z

---

Groomed em 2026-11-08 para docs/specs/active/SPEC-0037-solution-framing.md, status: draft. Bloqueio: precisa da evidencia da SPEC-0034 e de uma comparacao contra groom-backlog, capture-idea e find-blind-spots que nomeie uma lacuna real, nao uma reformulacao.

---

created: 2026-11-08T02:11:00Z

---

Repriorizada em 2026-11-08: medium -> low, e a SPEC-0037 foi para paused/P3. Base: nenhum cluster da analise de 58 sessoes mapeia para framing; capture-idea, groom-backlog e find-blind-spots ja cobrem o territorio. Reabre se a SPEC-0034 mostrar que o incumbent erra um pedido mal especificado de um jeito que as tres nao cobrem, e houver sinal de demanda.

---

created: 2026-11-19T14:02:11.822Z

---

Bounded investigation, appended 2026-11-19 from inbox notes docs/inbox/2026-11-19-experimentos-para-resolver-incerteza.md (09:50) and docs/inbox/2026-11-19-skills-componiveis-com-evidencia.md (10:48).

Compare against capture-idea, groom-backlog and find-blind-spots before any new skill is considered. find-blind-spots should classify each unknown by what would resolve it — human judgment, inspection of documentation or code, a bounded probe, or a comparison of prototypes against a concrete follow-up change — and end with an experiment assignment instead of only a question. process-inbox should say whether a small experiment could answer an exploratory item, preserving the distinction between an idea, evidence and a decision. groom-backlog keeps its readiness role and, when readiness is blocked, names the smallest investigation that would unblock it.

An operator answer is not evidence: it must not be the only path out of an unknown. This stays a candidate. No skill is created before the corpus shows a gap, and bounded investigation is proposed as behaviour inside the existing discovery skills.

---
<!-- COMMENTS:END -->
