---
id: TASK-127
title: >-
  survey: a deterministic collector for repository state, consumed by
  report-project-status
status: To Do
assignee: []
created_date: '2026-11-19T14:01:00Z'
labels:
  - skills
  - evals
dependencies:
  - TASK-129
references:
  - skills/survey-inflight-work/SKILL.md
  - skills/report-project-status/SKILL.md
  - docs/evals/coverage.md
priority: medium
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origin: docs/inbox/2026-11-19-experimentos-priorizados-survey-bootstrap-review.md (10:54, experiment 1). The skill specifies in prose an algorithm that is computation: enumerate branches, worktrees and PRs; resolve refs; compute changed paths; find overlaps; respect declared dependencies. The collector reports observation time, base/head SHAs, remote and fetch status, branches, PRs, dirty paths and worktrees with provenance, ahead/behind only for resolvable refs, overlap pairs, dependency edges and cycles, and explicit unknowns, failures and truncation. Git CLI through subprocesses; gh structured output; no abstraction library. The agent interprets the snapshot; report-project-status consumes the same snapshot. A script bundled inside a skill is skill content and outside the harness freeze (decision 2026-11-19). Proposed order survey, then bootstrap, then review is a preference, not a decided queue.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One command produces the snapshot with no model in the loop.
- [ ] #2 Unresolvable refs and failed calls appear as explicit unknowns, never as zeros or invented facts.
- [ ] #3 Existing eval trees 1 and 2 (docs/evals/coverage.md:22) are reused as fixtures; the eight situations from the note become cases or declared human review, with no asserted coverage.
- [ ] #4 report-project-status consumes the snapshot instead of collecting a second time.
- [ ] #5 No repository mutation beyond the declared fetch, and the skill states it.
<!-- AC:END -->
