---
id: TASK-58
title: 'skill: planejamento de mudanca visual ancorado em elemento e design tokens'
status: To Do
assignee: []
created_date: '2026-11-08T00:48:00Z'
labels: []
dependencies:
  - TASK-56
references:
  - https://github.com/ricardowendell/agent-skills/issues/8
priority: medium
type: task
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: issue #8 (P1), 2026-11-08. Resolver elemento -> componente/arquivo por evidencia observavel; sem correspondencia, responder unresolved em vez de inventar caminho. Bloqueada pela TASK-56 e pela decisao de oraculo visual: enquanto o runner nao tiver caminho de browser, os casos ficam manuais e isso precisa ser declarado, nao escondido.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Caso com elemento identificado recomenda o componente correto e evita CSS global nao solicitado.
- [ ] #2 Caso ambiguo aponta incerteza e recusa adivinhar o arquivo.
- [ ] #3 Contraste insuficiente exige medicao objetiva antes de alegar aderencia a WCAG.
- [ ] #4 Fixture com HTML malicioso nao instrui execucao de ferramentas nem amplia permissao.
- [ ] #5 Avaliacao inclui diffs fora de escopo e regressao visual; o que nao tiver oraculo objetivo fica como revisao humana declarada.
- [ ] #6 Funciona com tokens do proprio projeto, sem hardcode de marca.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-08T01:42:00Z

---

Groomed em 2026-11-08 para docs/specs/active/SPEC-0036-visual-change-planning.md, status: draft. Bloqueio nomeado na spec: o runner nao tem oraculo visual (sem browser/screenshot/DOM), entao casos visuais viram manual e nao separam braco. Depende da decisao de oraculo da 0.8.0.

---
<!-- COMMENTS:END -->
