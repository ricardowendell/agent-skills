---
id: TASK-29
title: 'evals: isolar o control arm de cópias externas do skill e do corpus'
status: To Do
assignee: []
created_date: '2026-11-05T16:51:00Z'
updated_date: '2026-11-05T21:37:00Z'
labels: []
dependencies: []
priority: high
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Os controles da SPEC-0015 leram uma cópia stale de references/evals.md em /private/var/folders/.../T/opencode e o SKILL.md real em /Users/wendell/.agents/skills/implement-from-prompt. O gate vê a tool skill, não leitura de arquivo, então o passe conta como controle limpo. Fechar esses caminhos no isolamento ou negar a leitura e remedir os controles afetados.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Controles ou não conseguem ler skill/corpus externos, ou o run registra leak e fica marcado contaminado e excluído; nenhuma leitura externa conta como passe.
- [ ] #2 O controle do #1 no gpt-6-luna é remedido e o número publicado reflete a leitura nova.
- [ ] #3 O gate continua detectando uso da tool skill.
<!-- AC:END -->
