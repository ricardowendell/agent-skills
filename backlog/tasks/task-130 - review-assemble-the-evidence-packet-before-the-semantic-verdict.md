---
id: TASK-130
title: 'review: assemble the evidence packet before the semantic verdict'
status: To Do
assignee: []
created_date: '2026-11-19T14:01:00Z'
labels:
  - skills
  - evals
dependencies:
  - TASK-129
references:
  - skills/review-code/SKILL.md
  - docs/inbox/2026-11-19-experimentos-priorizados-survey-bootstrap-review.md
priority: medium
ordinal: 130000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origin: docs/inbox/2026-11-19-experimentos-priorizados-survey-bootstrap-review.md (10:54, experiment 3). review-code already names scanners and checks; the opportunity is consistent execution and interpretation. A thin helper fixes the range and records the spec hash, discovers the project's existing checks, runs the installed ones with bounded execution, captures command, version, exit status, findings and failures, separates pre-existing from introduced findings where the tool supports it, and emits a compact packet. Semantic judgment stays with the reviewer: whether an acceptance criterion holds, whether a test proves the behaviour, whether a public contract broke. Proposed order survey, then bootstrap, then review is a preference, not a decided queue.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The packet carries the range, the spec hash, and per tool the version, command, exit status and findings, with failures explicit.
- [ ] #2 The APPROVE/REJECT contract, the verdict format and the read-only boundary are unchanged.
- [ ] #3 A packet is reused only for the same commit; a stale packet is named as stale, never silently reused.
- [ ] #4 The eight-case experiment is recorded in docs/evals as cases or declared human review, with no unsupported rate.
<!-- AC:END -->
