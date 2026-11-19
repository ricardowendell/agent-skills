---
id: SPEC-0100
title: The bootstrap interview asks what we know
status: draft
priority: high
task: TASK-124
created_at: 2026-11-19
updated_at: 2026-11-19
source_docs:
  - backlog/tasks/task-124 - bootstrap-the-interview-asks-what-we-know-not-what-the-product-is.md
  - docs/inbox/2026-11-19-bootstrap-aprender-antes-de-decidir.md
  - docs/specs/SPEC-0086-companion-skills-and-scopes.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills/bootstrap-project-harness/SKILL.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0100-bootstrap-interview-asks-what-we-know.md
  - CHANGELOG.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0100-bootstrap-interview-asks-what-we-know.md
  - node scripts/eval.mjs run bootstrap-project-harness 1 --repeat 1 --root skills
---

# SPEC-0100: The bootstrap interview asks what we know

## Purpose

The interview turns early answers into commitments. It asks for a solution, a
terminology set and principles before anything has been observed, and the
documents it generates then acquire authority: the bootstrap's own templates make
the architecture rules normative, and the generated `.opencode/opencode.json`
loads `architecture.md` and `principles/design.md` as instructions. A guess
written at inception reads as a decision to every later agent.

This spec changes what the interview collects, not what the bootstrap produces.
It asks what has been observed, what is desired, what is constrained and what is
still unknown, and it reports those three facts separately at the end instead of
declaring the product ready because a checklist is populated.

## User Outcome

Someone bootstrapping a new idea answers questions about their problem, their
evidence and their unknowns — not about a solution they have not validated. When
the session ends they get an honest report: the environment works, the product
understanding is partly provisional, and the next action is either implement a
known change, investigate an uncertainty, or obtain a human decision. A working
environment with an unresolved hypothesis reads as success, not as an incomplete
bootstrap.

## Scope

- **F0 — the interview topics (`SKILL.md`).** Replace the "describe the product"
  prompts with seven topics: problem and audience through a concrete situation;
  desired outcome independent of any proposed feature; evidence actually
  observed (personal experience, user feedback, an existing workaround);
  proposed solution as a candidate unless already decided; the assumption most
  likely to change direction; constraints split into imposed requirements and
  preferences (platform, existing integrations, data boundaries, budget); first
  learning objective and the autonomy granted within it.
- **F1 — detection answers first.** A topic the repository can answer is not
  asked. The existing detection (`harness-state.mjs`, stack and profile
  detection) answers the technical half; the human interview covers what the
  repository cannot supply.
- **F2 — the candidate rule.** The proposed solution is recorded as a candidate
  when it is a hypothesis, and as an accepted decision only when the operator
  says it is decided. The vocabulary is the one `TASK-125` formalises; this spec
  does not invent a parallel label set.
- **F3 — the completion report.** The final report states three independent
  facts rather than a checklist verdict: **technical environment** (from the
  existing `harness-state` outcome — exit `0 complete`, `1 partial`, `2 empty`,
  `3 project`), **product understanding** (what is confirmed, provisional or
  unknown, from the interview), and **next action** (implement a known change,
  investigate an uncertainty, or obtain a human decision). Required checks still
  apply before experimental work is promoted; this report does not waive them.
- **F4 — screening.** The `SKILL.md` edit changes the bootstrap's `skillHash`, so
  its measured cells go stale. Run two cells at screening level (1–3 draws):
  case 1 (fresh repo — the interview actually runs, so the new topics and the
  three-fact report are exercised) and case 2 (existing code — the
  solution-as-candidate rule must not derail additive preservation). Record the
  skillHash change, the staleness delta and the reason in `docs/evals/coverage.md`.
  A screening is a direction, not a separation claim.
- **F5 — publish.** A `CHANGELOG.md` `[Unreleased]` entry naming what changed and
  what did not.

**Blast radius.** One skill body and its screening record. No script, no exit
code, no template, no fixture, no corpus and no other skill. Templates and the
loading mechanism are `TASK-125`; regrouping the catalog is `TASK-131`.

## Non-Goals

- **No template changes.** The structured certainty field, the optional
  code-entity column and the instruction-loading boundary are `TASK-125`.
- **No script or exit-code change.** The three-fact report reuses the four
  outcomes `harness-state.mjs` already returns; if it cannot, this spec is
  wrong and returns to groom.
- **No investigation loop.** Recording the first learning objective is not
  running an experiment. That territory belongs to the discovery skills and to
  the paused `TASK-59`; the bootstrap does not gain a probe runner.
- **No new question count.** Still at most seven questions, still skippable,
  still stubs over invented answers.
- **No product direction invented.** An honest unknown is a valid output; the
  bootstrap does not fill `vision.md` with a solution it was handed.
- **No measured claim.** The screening cells are not a pass rate.

## Flow

1. Read the current interview section and the completion-report prose; note where
   the report currently derives a verdict from the document checklist.
2. Rewrite the topics in place, keeping the question cap, the skip rule and the
   stub rule.
3. Add the candidate rule next to the solution topic, and the imposed-versus-
   preference split next to constraints.
4. Rewrite the completion report as three facts, mapping the technical half to
   the existing `harness-state` outcome rather than a new signal.
5. Screen cases 1 and 2 at 1–3 draws; record the skillHash change and the
   staleness delta.
6. Add the `CHANGELOG.md` entry and record the screening in `Results`.

## Data

No new data. The interview writes the same documents as before; what changes is
what it asks and what the session reports. The one boundary this spec states
explicitly: the generated `.opencode/opencode.json` loads `architecture.md` and
`principles/design.md` as instructions, so anything the interview records as a
hypothesis must not arrive in those files looking like an accepted constraint.
`TASK-125` owns the mechanism; this spec must not create content that mechanism
cannot mark.

## Acceptance Criteria

1. The interview section names all seven topics, and states that a question the
   repository can answer is not asked; a reader can map each topic to one prompt.
2. A proposed solution is recorded as a candidate unless the operator says it is
   decided; the spec of the output distinguishes the two in words, not by
   implication.
3. Constraints separate imposed requirements from preferences.
4. The completion report states technical environment, product understanding and
   next action as three independent facts, and the technical fact quotes the
   `harness-state` outcome rather than a re-derived one.
5. A session that ends with a working environment and an unresolved hypothesis is
   reported as a successful bootstrap, with `investigate` named as the next
   action; no AC of this spec allows a missing solution to block completion.
6. The seven-question cap, the skippable questions and the stub-over-invention
   rule are unchanged (`grep` of the section shows the same limits).
7. Screening runs on cases 1 and 2 at 1–3 draws and is recorded in
   `docs/evals/coverage.md` with the skillHash change, the staleness delta and
   the words "screening, not a separation claim".
8. `node scripts/validate-skills.mjs --root skills` prints `All clear` and
   `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0100-bootstrap-interview-asks-what-we-know.md`
   reports no errors.

## Open Questions

- **Is `find-blind-spots` territory creeping in?** The seventh topic asks for the
  first learning objective. It does not run anything: it records one objective
  and the autonomy granted. If the wording starts describing methods, budgets or
  evidence contracts, it belongs in `TASK-59`, not here.
- **Which cells are representative?** This spec names cases 1 and 2. Case 1 is
  the fresh-repo path where the interview runs; case 2 is the additive path where
  the new candour rules could most plausibly derail preservation. Both are
  screening, so a wrong choice costs two paid draws, not a matrix.
- **Does the three-fact report belong in `harness-state.mjs`?** The mapping is
  deliberately prose here because the script owns only the technical half. If
  implementation finds the report cannot be produced without a script change,
  that is a scope stop, not an extension.

## Prompt Notes

- Requirements: seven topics, candidate rule, imposed-versus-preference split,
  three-fact report, unchanged limits. Nothing else moves.
- Entities: topic, candidate, accepted decision, imposed requirement, preference,
  first learning objective, autonomy, technical environment, product
  understanding, next action.
- Approach: edit `SKILL.md` prose; the file is the contract the host reads, so
  length matters — keep the topics as a list, not an essay.
- Structure: one file. The screening record lives in `docs/evals/coverage.md` and
  the release entry in `CHANGELOG.md`.
- Operations: read the current section, rewrite it, run the validator, screen
  cases 1 and 2, record the numbers, add the changelog line.
- Norms: the bootstrap's existing voice (imperative, additive-only, never invent
  product direction); the seven-question cap stays visible; a screening is never
  written as a rate.
- Safeguards: no templates, no scripts, no new exit codes, no investigation
  runner, no imagined product direction, no claim that a stale cell was
  refreshed.
- Tests: (1) inspect the interview section and map each of the seven topics to
  its prompt; (2) stage a fresh repo and confirm the report states three facts
  and names `investigate` as next action when the hypothesis is unresolved;
  (3) stage case 2 and confirm additive preservation still holds; (4) confirm
  the limits are textually unchanged.
