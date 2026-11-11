---
id: TASK-106
title: 'evals: verificar se a description nova roteia (Bloco C, teto 13 draws)'
status: To Do
assignee: []
created_date: '2026-11-11T14:20:00Z'
labels: []
dependencies: []
references:
  - docs/specs/active/SPEC-0069-does-the-description-actually-route.md
  - skills/implement-from-prompt/SKILL.md
priority: high
type: task
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0068. A description do implement-from-prompt passou a nomear os tres gatilhos do corpus, mas o conserto e hipotese nao medida; o skillHash foi para 218f51bb e o #11 ficou stale. Verificar com teto de 13 draws: fumaca de 3 no #11 com skill (3/3 carregou -> segue; <3/3 -> para e publica a falha + reverte a description) e, se passar, 5+5 no mesmo caso e modelo explicito (agentworks/deepseek-v4-1-flash). Zero draw fora desse teto; stall se resume uma vez, nunca sobe stallMs.
<!-- SECTION:DESCRIPTION:END -->
