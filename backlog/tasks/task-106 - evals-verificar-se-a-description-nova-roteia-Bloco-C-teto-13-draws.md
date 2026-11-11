---
id: TASK-106
title: 'evals: verificar se a description nova roteia (Bloco C, teto 13 draws)'
status: Done
assignee: []
created_date: '2026-11-11T14:20:00Z'
updated_date: '2026-11-11T14:35:00Z'
labels: []
dependencies: []
references:
  - docs/specs/SPEC-0069-does-the-description-actually-route.md
  - skills/implement-from-prompt/SKILL.md
priority: high
type: task
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0068. A description do implement-from-prompt passou a nomear os tres gatilhos do corpus, mas o conserto e hipotese nao medida; o skillHash foi para 218f51bb e o #11 ficou stale. Verificar com teto de 13 draws: fumaca de 3 no #11 com skill (3/3 carregou -> segue; <3/3 -> para e publica a falha + reverte a description) e, se passar, 5+5 no mesmo caso e modelo explicito (agentworks/deepseek-v4-1-flash). Zero draw fora desse teto; stall se resume uma vez, nunca sobe stallMs.
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-11T14:35:19.625Z

---

Done via SPEC-0069 (merge em main). Fumaca de 3 draws no #11 com skill: 0/3 carregaram (skillGate.source null), ambos os assertions verdes. Regra de parada disparou: sem F2, sem controle, sem redraw. Custo real: 3 draws, US$ 0,0189. A description foi revertida byte-a-byte para a de 0.7.0 (tree 9147487f); #11 mantem a classe non-discriminator e as citacoes medidas. Leitura honesta: a description nao roteia o #11 — nao que ela piore o roteamento (baseline era 1/5). Proximo lever: corpo/menu (TASK-105).

---
<!-- COMMENTS:END -->
