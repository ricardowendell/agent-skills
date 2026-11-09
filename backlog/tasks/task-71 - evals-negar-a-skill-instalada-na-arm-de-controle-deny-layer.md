---
id: TASK-71
title: 'evals: negar a skill instalada na arm de controle (deny layer)'
status: To Do
assignee: []
created_date: '2026-11-09T02:52:00Z'
labels: []
dependencies: []
references:
  - docs/evals/coverage.md
priority: high
type: task
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O runner aceita --no-skill, mas a arm de controle ainda le a skill instalada em /Users/wendell/.agents/skills. Medido na SPEC-0045: a run 2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill saiu com skillLeaks=33 e hostReads=7 em 35 draws, isolated=no, e nenhuma celula comportamental chegou a cinco draws limpos. O mesmo bloqueio esta publicado em docs/evals/coverage.md para capture-idea (2026-11-07T08-27-30), groom-backlog (2026-11-06T07-47-34) e write-implementation-prompt (2026-11-07T08-17-29). Consequencia: hoje 'unresolved' significa 'o controle nao foi isolado', nao 'a skill nao separa'. A TASK-43 (Done) corrigiu so o detector e o checker; negar a leitura nunca foi AC dela, entao o coverage.md a cita como 'a metade deny-layer da TASK-43' e essa atribuicao esta errada.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A arm --no-skill nao consegue ler /Users/wendell/.agents/skills nem references/evals.md, e um draw que tenta produz finding nomeado
- [ ] #2 Um controle forcado a ler a skill instalada falha, provando que o deny e efetivo (canario)
- [ ] #3 docs/evals/coverage.md deixa de atribuir o bloqueio a TASK-43 e aponta para esta task
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-09T09:06:31.126Z

---

Groomed em 2026-11-09 e partida em duas specs porque o pdlc mapeia 1 spec -> 1 task. SPEC-0046-deny-control-arm-corpus (ready) cobre AC-1, AC-2 e o antigo AC-4 (agora AC-3): enforcement no boundary do SO onde existir, probe de capacidade no manifest, canario deterministico nao-vacuo, isolated=yes derivado de enforcement + zero findings, e a correcao da atribuicao no coverage.md. A re-medicao das 4 skills saiu para TASK-72 / SPEC-0047 (draft, depends_on SPEC-0046), porque juntar mudanca de harness com onda paga impede separar 'o deny funciona' de 'a skill separa'. Roadmap: deny layer promovido para 0.7.0 como pre-requisito da claim do corpus.

---
<!-- COMMENTS:END -->
