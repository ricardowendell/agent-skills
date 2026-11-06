---
id: TASK-48
title: 'chore: commands canônicos no repo, global como symlink'
status: To Do
assignee: []
created_date: '2026-11-06T21:23:00Z'
labels: []
dependencies: []
references:
  - docs/README.md
priority: low
type: task
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hoje commands/ do repo e ~/.config/opencode/commands são dois diretórios reais, idênticos por sorte (diff -rq vazio). O padrão já usado em agents/spec-reviewer.md é symlink do global para o repo. Tornar commands/ canônico, apontar o global para ele, e documentar em docs/integrations/opencode.md o que o kit possui e o que a máquina liga. Não duplicar estado: o doctor futuro só verifica divergência.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ~/.config/opencode/commands aponta para o commands/ do repo, sem cópia divergente.
- [ ] #2 docs/integrations/opencode.md diz qual é canônico e como instalar/ligar.
- [ ] #3 Um comando novo no repo aparece no OpenCode sem passo de cópia.
<!-- AC:END -->
