---
id: TASK-27
title: 'evals: judge marca unverifiable quando a evidência está em tool calls'
status: To Do
assignee: []
created_date: '2026-11-05T16:51:00Z'
labels: []
dependencies: []
priority: high
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Na SPEC-0015, o #1 deu 5/5 determinístico com skill mas 0/5 no judge, e o controle do #7 deu 5/5 determinístico mas 1/5 no judge. O judge não vê a evidência que está em tool calls e marca unverifiable, que o runner conta como falha. O judge deve poder citar tool calls ou unverifiable não deve derrubar o caso.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 O judge lê tool calls/command output ou unverifiable deixa de falhar o caso.
- [ ] #2 #1 with e #7 control passam a refletir a leitura determinística.
- [ ] #3 O judge continua sem poder resgatar um caso que falhou determinísticamente.
<!-- AC:END -->
