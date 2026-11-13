---
id: TASK-1
title: 'widget: round the total once'
status: To Do
assignee: []
created_date: '2026-11-10T09:00:00Z'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The total is rounded per line and again at the end, so a receipt and its total
can disagree by a cent. Round once, at the end.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `total()` rounds once, at the end
- [ ] #2 `src/app.js` keeps its exported shape
<!-- AC:END -->
