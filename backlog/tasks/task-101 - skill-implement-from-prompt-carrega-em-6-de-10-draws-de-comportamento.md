---
id: TASK-101
title: 'skill: implement-from-prompt carrega em 6 de 10 draws de comportamento'
status: To Do
assignee: []
created_date: '2026-11-11T00:25:00Z'
labels: []
dependencies: []
references:
  - evals/implement-from-prompt/cases.md
  - docs/specs/SPEC-0034-iterative-corpus.md
priority: high
type: task
ordinal: 101000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: corpus 0.7.0 (SPEC-0034), wave pausada em 2026-11-08. Medido nos 10 draws do braco com skill: #9 r5, #10 r2, #10 r3 e #10 r5 terminaram com 'skill implement-from-prompt was not loaded' e foram pontuados como failed, nao como sem-skill. Sao 4 de 10. O caso #10 fica 1/5 quando o denominador honesto e 2 draws em que a skill carregou. Isto e routing do artefato, nao comportamento do procedimento: nao reclassificar no harness para esconder; publicar como unresolved e tratar como achado de produto que alimenta o veredito da TASK-57. Zero draws.
<!-- SECTION:DESCRIPTION:END -->
