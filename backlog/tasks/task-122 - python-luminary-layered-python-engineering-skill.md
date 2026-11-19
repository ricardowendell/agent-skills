---
id: TASK-122
title: 'skill: draft layered Python Luminary implementation judgment'
status: Done
assignee: []
created_date: '2026-11-16'
updated_date: '2026-11-17T14:43:00Z'
labels:
  - skills
  - python
dependencies: []
documentation:
  - docs/specs/active/SPEC-0098-python-luminary.md
priority: medium
type: task
ordinal: 122000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User requested a draft PR for a layered Python skill combining idiomatic patterns,
Fluent Python data-model literacy, and architecture judgment. Add original
instructions with on-demand references, integrate catalog discovery, and author
small evaluation candidates using the existing harness. Preserve existing
toolchains and workflow gates. Publish as a draft, with behavior unmeasured;
do not close this task until local gates and the evaluation decision are recorded.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->
- [ ] #1 Compact core and focused references are reviewable in the draft PR.
- [ ] #2 Catalog, provenance, coverage inventory and changelog agree.
- [ ] #3 Six candidate cases remain outside the installed skill.
- [ ] #4 Required gates and baseline checks run with actual outputs recorded.
- [ ] #5 Candidate/control evidence determines whether to keep, narrow, or remove the skill.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-17T14:43:02.301Z

---

Measured outcome 2026-11-17: keep, scoped to codebase analysis. Round 1 (micro-fix judgment, cases 3-7) and round 2 (design judgment, cases 8-9) showed no separation on deepseek-v4.1-flash; cases 6 and 7 retired. Round 3 (codebase analysis, case 10) is a separator at evidence level: skill 5/5 vs control 0/5 (2026-11-17T10-23-12--python-luminary / 2026-11-17T10-18-13--python-luminary--without-skill, both clean), reproducing 3/3 vs 0/3 screening. The control describes the defects but never runs a tool; the skill runs scripts/analyze.py (ruff/ty/vulture orchestration) and reports file:line with each rule's blind spot. Known weakness: #9 regressed 1/3 vs 3/3 on an exit-masking draw, logged not patched to keep the #10 measurement valid. PR #23 marked ready.

---

created: 2026-11-19T14:02:20.450Z

---

Exit status of the bundled analyzer, appended 2026-11-19 from the inbox verification in docs/inbox/2026-11-19-skills-componiveis-com-evidencia.md (10:52).

skills/python-luminary/scripts/analyze.py returns 0 on every path (lines 128, 144, 150) and calls sys.exit(main(...)) at 154, so a scan with findings and a clean scan are indistinguishable by exit code. That is acceptable as evidence and unusable as a gate: no caller can read success as clean.

Related composition gap, owned elsewhere: the skill fetches missing tools through uvx (SKILL.md:60) while review-code:140 and audit-code-quality:33,147 forbid installing during their operation. TASK-129 holds the contract that the caller's authority prevails.

Not changed here: this spec's measurement is at the current tree, and editing the tree would stale case 10's run.

---
<!-- COMMENTS:END -->
