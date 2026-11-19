---
id: TASK-123
title: 'harness: index agentworks-harness in skills.index.json'
status: Done
assignee: []
created_date: '2026-11-19T14:01:00Z'
labels:
  - harness
dependencies: []
references:
  - skills.index.json
  - docs/evals/coverage.md
  - evals/agentworks-harness/cases.md
priority: high
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origin: docs/inbox/2026-11-19-skills-componiveis-com-evidencia.md (10:48, verified 10:52). skills.index.json lists 16 first-party skills. skills/agentworks-harness and evals/agentworks-harness landed in eb6ea36 (2026-11-16); the index was edited later in fd848f3 (2026-11-17) to add python-luminary without it. Result: the only first-party skill with measured coverage (docs/evals/coverage.md:12) that no scope names. Nothing catches it: no script under scripts/ reads skills.index.json. This is a content fix, not a new mechanism.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 agentworks-harness appears in exactly one scope, with an `about` line that names its territory.
- [ ] #2 Every count stated in the file matches the actual array length.
- [ ] #3 No SKILL.md frontmatter is edited and no other entry moves.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-19T15:06:09.974Z

---

Decision of 2026-11-19, taken before grooming: include the skill, do not document an exclusion.

skills.index.json:3 states that a skill which only makes sense in one repo type belongs to a scope, not to a stack filter, and SPEC-0086:73-76 built five scopes for the skills that existed then. agentworks-harness postdates that spec (eb6ea36, 2026-11-16) and the index was edited afterwards without it, so no exclusion was ever deliberate.

Remedy: add a `platform` scope whose `about` names the territory — operating a live external platform the repo is wired to (catalog, flows, deployments, runs) — and place agentworks-harness in it. Update the count in `about` from 16 to 17, which is what the validator already reports: `node scripts/validate-skills.mjs --root skills` prints "Scanned 17 SKILL.md across 1 roots". Folding it into `maintain` is the weaker option: that scope is "bootstrap, tighten one gate, catch a branch up with its base", all local work, not a live platform.

The file stays data: no SKILL.md frontmatter is edited, so no skillHash moves.

Related and out of scope here: docs/integrations/ holds only datacontract.md and opencode.md while AGENTS.md carries an AgentWorks block. The integration doc is the natural companion to the new scope and currently has no owner.

---

created: 2026-11-19T15:14:06.068Z

---

Groomed 2026-11-19 into docs/specs/active/SPEC-0099-platform-scope-agentworks-harness.md, status: draft.

Contract check passes: `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0099-platform-scope-agentworks-harness.md` prints "contract holds". The decision recorded above is the spec's scope — one `platform` scope, one member, count 16 to 17 — with regrouping (TASK-131) and the missing docs/integrations/agentworks.md named as non-goals rather than folded in.

Facts observed at grooming, to be re-observed after the edit rather than trusted: validator reports `Scanned 17 SKILL.md across 1 roots`; skills.index.json holds 16 ids; `node scripts/check-staleness.mjs` reports 85 cited, 55 stale, 3 uncited. The spec turns those three into its verification, so the edit cannot claim a refreshed measurement.

Readiness: every gate item in the grooming skill passes; status stays draft because the skill starts new specs as draft and the draft-to-ready transition is the maintainer's call.

---

created: 2026-11-19T15:21:42.833Z

---

Implemented 2026-11-19 in direct mode (docs/pipeline.md:30), spec SPEC-0099 at status: in_progress. The edit is in the working tree and uncommitted.

Observed after the edit, not quoted from the plan: `node scripts/validate-skills.mjs --root skills` reports "Scanned 17 SKILL.md across 1 roots" and "All clear"; the index now reads pipeline:7 verify:3 observe:2 maintain:3 platform:1 record:1 data:0, with 17 ids, 17 unique, and the top-level about stating 17; no first-party id is missing and none is indexed without a directory. `node scripts/check-staleness.mjs` is unchanged at 85 cited / 55 stale / 3 uncited, which is the evidence that no measured cell moved.

Remaining: the commit and the flip of SPEC-0099 to implemented are the maintainer's decision, so this task stays To Do rather than closing itself.

---
<!-- COMMENTS:END -->
