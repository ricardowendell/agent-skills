---
id: TASK-101
title: 'skill: implement-from-prompt nao carrega em 8 de 15 draws (routing)'
status: Done
assignee: []
created_date: '2026-11-11T00:25:00Z'
updated_date: '2026-11-11T13:04:00Z'
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

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-11T12:40:35.991Z

---

Corrigido o numero antes do groom: com o holdout #11 desenhado, sao 8 de 15 draws do braco com skill (4 de 10 em #9/#10, mais 4 de 5 em #11). O titulo antigo dizia 6 de 10, escrito antes do holdout. SPEC-0068 faz o diagnostico por draw e o conserto minimo; a verificacao custa draw e fica no Bloco C (orcamento ainda nao autorizado).

---

created: 2026-11-11T13:04:58.999Z

---

Done via SPEC-0068 (merge em main). Diagnostico de zero draws nos 15 draws: 8/8 sao (b) oferecida e nao escolhida; 0 nunca oferecida, 0 rejeitada pelo gate, 0 carregada e perdida. Conserto: description do SKILL.md nomeia os tres gatilhos do corpus (mudanca local, bug com teste de regressao, pergunta em pedido ambiguo), sem o caso inseguro. A skill segue sem carregar em #11 (recusa vem do AGENTS.md injetado). Fix NAO verificado: custa draw e fica no Bloco C. skillHash mudou (218f51bb), #11 fresh->stale, declarado no corpus.

---
<!-- COMMENTS:END -->
