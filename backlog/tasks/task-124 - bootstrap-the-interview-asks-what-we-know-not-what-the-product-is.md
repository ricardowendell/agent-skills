---
id: TASK-124
title: 'bootstrap: the interview asks what we know, not what the product is'
status: Done
assignee: []
created_date: '2026-11-19T14:01:00Z'
updated_date: '2026-11-19T17:31:00Z'
labels:
  - skills
dependencies: []
references:
  - skills/bootstrap-project-harness/SKILL.md
  - docs/inbox/2026-11-19-bootstrap-aprender-antes-de-decidir.md
priority: high
ordinal: 124000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origin: docs/inbox/2026-11-19-bootstrap-aprender-antes-de-decidir.md (10:40). The interview currently asks for problem, audience, solution, terminology, principles and design/voice, which turns early answers into commitments. Cover instead: problem and audience through a concrete situation; desired outcome independent of any proposed feature; evidence actually observed; proposed solution as a candidate unless already decided; the assumption most likely to change direction; constraints split into imposed requirements and preferences; the first learning objective and the autonomy granted. Detection answers what the repository can answer; the human interview covers only what it cannot. Keep the seven-question cap, the skippable questions and stubs over invented answers.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The interview section covers the seven topics and states that a question the repository can answer is not asked.
- [ ] #2 A proposed solution is captured as a candidate unless it is already decided.
- [ ] #3 Constraints separate imposed requirements from preferences.
- [ ] #4 Completion reports technical environment, product understanding and next action as three independent facts; a working environment with an unresolved hypothesis is a successful bootstrap.
- [ ] #5 The seven-question cap, skippable questions and stub rule are unchanged.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-19T15:21:42.897Z

---

Groomed 2026-11-19 into docs/specs/active/SPEC-0100-bootstrap-interview-asks-what-we-know.md, status: draft; `node scripts/spec-check.mjs --spec ...` reports the contract holds.

Three decisions are recorded there instead of left implicit. The three-fact completion report reuses the four outcomes harness-state already returns (exit 0 complete, 1 partial, 2 empty, 3 project), so no script edit is needed; if implementation finds it cannot, that is a scope stop. The structured certainty field, the optional code-entity column and the instruction-loading boundary stay with TASK-125. The first-learning-objective topic records one objective and runs nothing, so it does not preempt the paused TASK-59.

Screening cells named in the spec: case 1 (fresh repo, where the interview actually runs) and case 2 (existing code, where the candour rules could derail additive preservation), 1-3 draws, recorded as screening and never as a separation claim. Choosing those two cells was mine; override before implementation if a different representative is worth more.

---
<!-- COMMENTS:END -->
