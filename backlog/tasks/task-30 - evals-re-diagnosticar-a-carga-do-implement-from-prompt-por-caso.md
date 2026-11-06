---
id: TASK-30
title: 'evals: re-diagnosticar a carga do implement-from-prompt por caso'
status: To Do
assignee: []
created_date: '2026-11-05T16:51:00Z'
updated_date: '2026-11-06T12:37:00Z'
labels: []
dependencies: []
priority: high
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Na SPEC-0015 o canário do #1 deu 12/12, mas o #2 perdeu o gate em 3/5 e o #8 em 1/5. A taxa agregada de ~23% da TASK-10 é caso-específica aqui. Medir a carga por caso com n>=12 e identificar o gatilho antes de rodar outra matriz.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Taxa de carga com n>=12 em #1, #2, #5 e #8 (o canário e os casos com miss observado), com run dir citado; #4 e #7 ficam com a medição anterior, registrada como tal.
- [ ] #2 Causa por caso com evidência de transcript (não chamou a tool, chamou e falhou, ou carregou outra skill), ou registrada como variância.
- [ ] #3 Se a description mudar, medição antes/depois a n=12 no mesmo caso, com as duas taxas publicadas.
- [ ] #4 O #2 fica legível ou é publicado como caso sem célula with-skill legível, com a taxa; nenhuma linha assert: é alterada.
- [ ] #5 Nenhum caso passa a aceitar run sem skill.
<!-- AC:END -->
