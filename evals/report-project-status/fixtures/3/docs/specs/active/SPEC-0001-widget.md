---
id: SPEC-0001
title: The widget total is rounded once
status: ready
priority: P2
task: TASK-1
files:
  - src/app.js
---

# SPEC-0001: The widget total is rounded once

## Purpose

The widget adds up line items in cents and rounds at the end, so a receipt and
its total never disagree by a cent.

## Acceptance Criteria

1. `total()` rounds once, at the end.
2. `src/app.js` keeps its exported shape.
