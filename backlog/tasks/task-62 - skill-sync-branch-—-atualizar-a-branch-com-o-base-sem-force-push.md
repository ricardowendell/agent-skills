---
id: TASK-62
title: 'skill: sync-branch — atualizar a branch com o base sem force-push'
status: To Do
assignee: []
created_date: '2026-11-08T01:56:00Z'
labels: []
dependencies:
  - TASK-56
references:
  - docs/analysis/skills-from-sessions-2026-11-07.md
  - docs/analysis/skill-stubs/sync-branch/SKILL.md
priority: medium
type: task
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Maior demanda medida e nao coberta do repo: na analise de 58 sessoes humanas (docs/analysis/skills-from-sessions-2026-11-07.md), o cluster 'sync-branch' tem score 10, 6 sessoes, $7,74, 2 projetos e lacuna 2 (nada cobre). E a mais barata de validar, porque quase tudo e assert deterministico de estado git. Stub ja escrito em docs/analysis/skill-stubs/sync-branch/SKILL.md. Prioridade P1, nao P0: nao disputa a frente com o corpus (TASK-56), mas entra logo depois dele. Operacao git destrutiva, entao as guardrails sao o nucleo da skill, nao um detalhe.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fetch, checkout e atualizacao do base funcionam no caminho feliz, e o delta (commits e arquivos) e reportado.
- [ ] #2 Arvore suja: para ou preserva o trabalho, nunca descarta com reset --hard nem checkout forcado.
- [ ] #3 Conflito: para no primeiro e reporta os arquivos, sem resolver descartando um dos lados.
- [ ] #4 Nunca force-push; nunca reescreve historico publicado sem autorizacao explicita.
- [ ] #5 Roda os gates documentados depois da atualizacao e registra o que rodou e o que nao rodou.
- [ ] #6 Asserts deterministicos cobrem estado git (branch, ahead/behind, unchanged), com pelo menos um caso adversarial de arvore suja e um de conflito.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-08T09:29:32.404Z

---

Groomed em 2026-11-08 para docs/specs/active/SPEC-0039-sync-branch.md (status: paused). Promove o stub; inclui extensao aditiva do fixture git.json (mainPatch + dirty) porque o schema atual nao encena branch atras da base nem arvore suja. Fica paused ate o commit que registra os Results da SPEC-0034: ordem do roadmap, nao dependencia tecnica, por isso nao ha depends_on.

---
<!-- COMMENTS:END -->
