---
id: TASK-129
title: 'scripts: one evidence contract for every helper a skill bundles'
status: To Do
assignee: []
created_date: '2026-11-19T14:01:00Z'
labels:
  - harness
  - skills
dependencies: []
references:
  - skills/python-luminary/scripts/analyze.py
  - skills/review-code/SKILL.md
  - skills/audit-code-quality/SKILL.md
priority: high
ordinal: 129000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origin: docs/inbox/2026-11-19-skills-componiveis-com-evidencia.md (10:48, verified 10:52). Composition currently makes incompatible assumptions: python-luminary fetches missing tools through uvx (SKILL.md:60) while review-code:140 and audit-code-quality:33,147 forbid installing during the operation. Decision of 2026-11-19: the caller's authority prevails, a skill declares its tool and network needs instead of assuming them, and no helper installs implicitly. Contract for any bundled helper: the commit and scope inspected; tool, version and exact command; exit status and output location; findings separated from unavailable, failed and unmeasured checks; explicit mutation behaviour; no implicit dependency installation. Reuse one snapshot where several skills need the same observation and refresh it when the commit or state changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The contract is written once and referenced by every skill that bundles a helper.
- [ ] #2 A helper never installs implicitly and reports what it would have needed.
- [ ] #3 Exit status separates findings from unmeasured checks; python-luminary analyze.py currently returns 0 on every path (scripts/analyze.py:120-150).
- [ ] #4 Skills state their tool and network needs, and composition precedence is documented where the caller reads it.
<!-- AC:END -->
