---
id: TASK-29
title: 'evals: isolar o control arm de cópias externas do skill e do corpus'
status: To Do
assignee: []
created_date: '2026-11-05T16:51:00Z'
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
- [ ] #1 Transcripts de controle têm zero leituras de SKILL.md/evals.md externos.
- [ ] #2 O controle do #1 no gpt-6-luna é remedido.
- [ ] #3 O gate continua detectando uso da tool skill.
<!-- AC:END -->
