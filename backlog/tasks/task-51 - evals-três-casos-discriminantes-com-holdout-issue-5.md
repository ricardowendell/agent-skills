---
id: TASK-51
title: 'evals: três casos discriminantes com holdout (issue #5)'
status: To Do
assignee: []
created_date: '2026-11-07T11:49:00Z'
labels: []
dependencies: []
priority: high
type: task
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Issue #5 (https://github.com/ricardowendell/agent-skills/issues/5): entregar três casos que separem dois braços com asserção machine-checkable, n>=3 por braço, um deles holdout, medidos num SHA. A SPEC-0031 mostrou que capture-idea #1, process-inbox #1 e write #2 não servem: os controles ainda leem a instalação e ficam unresolved. Candidatos com controle replay-clean: implement-from-prompt #1 e #8 (12/12 vs 0/12 no default; 5/5 vs 0/5 e 1/5 no gpt-6-luna) e review-code #7 (3/3 vs 0/3, red gate). Re-medir os dois braços sob detector v2 (5 draws por braço, ~30 draws) e escolher três; congelar UM holdout ANTES de olhar o resultado e não desenhá-lo contra o caso. Se um controle contaminar, o fallback é o próximo candidato, não baixar a regra. Metadado: why: diz o que o caso mede e por que o braço sem skill falha; tags: separator/holdout. Publicar docs/evals/discriminating-cases.md e responder na issue com o SHA.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Três casos com n>=3 por braço, asserção filesystem/routing, runs citados com check-eval-run; um holdout designado antes da medição e registrado.
- [ ] #2 Um doc novo lista os três, o que cada um mede, o run dir de cada braço, o detector e o holdout.
- [ ] #3 Nenhuma mudança de comportamento em skill/caso além do metadado; nenhum número v1 reescrito.
<!-- AC:END -->
