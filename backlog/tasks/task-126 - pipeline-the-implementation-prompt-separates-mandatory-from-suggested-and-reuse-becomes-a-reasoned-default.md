---
id: TASK-126
title: >-
  pipeline: the implementation prompt separates mandatory from suggested, and
  reuse becomes a reasoned default
status: To Do
assignee: []
created_date: '2026-11-19T14:01:00Z'
labels:
  - skills
dependencies: []
references:
  - skills/write-implementation-prompt/SKILL.md
  - skills/implement-from-prompt/SKILL.md
  - docs/inbox/2026-11-19-experimentos-para-resolver-incerteza.md
priority: medium
ordinal: 126000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origin: docs/inbox/2026-11-19-experimentos-para-resolver-incerteza.md (09:50). write-implementation-prompt prescribes detailed implementation operations before any code exists; implement-from-prompt requires reuse and says never duplicate. Split the prompt into Required (observable behavior, compatibility, data boundaries, verification) and Suggested (likely files, sequence, reusable helpers), each constraint marked with where it came from. An unresolved item does not enter the prompt: it returns to groom. Decision of 2026-11-19: the `status: ready` gate is preserved, so this is not a policy change. In implement-from-prompt, reuse is the default with a stated reason, and a scoped comparison is allowed when an abstraction's value is uncertain; existing project rules still bind.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The prompt distinguishes Required from Suggested and names the origin of each constraint.
- [ ] #2 A prompt is still generated only from a `ready` spec; an unresolved item blocks generation and names the return to groom.
- [ ] #3 implement-from-prompt treats reuse as a reasoned default and permits a bounded comparison against a named follow-up change.
- [ ] #4 Spec hashing, acceptance-criteria handling and the review boundary are unchanged.
<!-- AC:END -->
