---
id: TASK-69
title: '[stack] evals e documentação do stack review'
status: Done
assignee: []
created_date: '2026-11-08T10:00:00Z'
updated_date: '2026-11-09T07:27:00Z'
labels: []
dependencies:
  - TASK-66
  - TASK-67
  - TASK-68
references:
  - https://github.com/ricardowendell/agent-skills/issues/12
priority: medium
type: task
ordinal: 69000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fatia 5 da issue #12 (umbrella TASK-64): evals comportamentais com/sem skill, paridade de templates, fixtures das stacks, linha de coverage e CHANGELOG; fecha a issue.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Evals com e sem skill provam bootstrap executavel, preservacao do projeto existente e ausencia de toolchain paralela
- [x] #2 Fixtures cobrem repo vazio, Bun existente, Node+pnpm, lint/format existente, monorepo e conflito
- [x] #3 Coverage e CHANGELOG atualizados; Python, sensores e roteamento intactos
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-09T07:27:59.327Z

---

AC-1 (evals com e sem skill provam bootstrap executavel, preservacao e ausencia de toolchain paralela) NAO foi cumprida e nao foi marcada. A metade com skill foi medida (4-5/5 limpos em #16-#23 menos os vermelhos #20 e #15); a metade sem skill nunca chegou a cinco draws limpos em nenhuma celula, porque a arm de controle ainda le a skill instalada (skillLeaks=33 em 35 draws). Por isso a SPEC-0045 publica todas as celulas comportamentais como unresolved, nunca como separador. AC-2 e AC-3 cumpridas. O deny layer e a re-medicao estao na TASK-71; a issue #12 segue aberta por causa disso.

---

created: 2026-11-10T15:07:12.765Z

---

AC-1 fechada depois do merge: SPEC-0047/0050 mediram o stack default sob o deny layer e o #19 e separator (5/5 vs 0/4). A task permanece Done; nenhuma nova medicao foi feita aqui.

---
<!-- COMMENTS:END -->
