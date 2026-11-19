---
spec: SPEC-0100
spec_sha: 83de60c0f8d71c04c30c933c431c4f140553ccfc8ca430725287164e5331b406
---

# Implementation Prompt: SPEC-0100 The bootstrap interview asks what we know

## Source Spec

- `docs/specs/active/SPEC-0100-bootstrap-interview-asks-what-we-know.md` (pin `83de60c0…`)
- Depends on: nothing. `SPEC-0099` (implemented) is a sibling, not a prerequisite.
- Unblocks: `TASK-125` (templates carry structured certainty).

## Requirements

**User outcome.** Someone bootstrapping a new idea answers questions about their
problem, their evidence and their unknowns — not about a solution they have not
validated. The session ends with three independent facts: the environment works,
product understanding is partly provisional, and the next action is implement,
investigate or obtain a human decision.

**What must become true, copied from the spec's Acceptance Criteria.**

1. The interview section names all seven topics and states that a question the
   repository can answer is not asked; a reader can map each topic to one prompt.
2. A proposed solution is recorded as a candidate unless the operator says it is
   decided.
3. Constraints separate imposed requirements from preferences.
4. The completion report states technical environment, product understanding and
   next action as three independent facts, and the technical fact quotes the
   `harness-state` outcome rather than a re-derived one.
5. A session ending with a working environment and an unresolved hypothesis is a
   successful bootstrap, with `investigate` named as the next action.
6. The seven-question cap, the skippable questions and the stub-over-invention
   rule are unchanged.
7. Screening on cases 1 and 2 is recorded in `docs/evals/coverage.md`; the first
   draw of case 1 runs alone; the pass criterion in Scope > F4 holds in both
   halves.
8. The validator prints `All clear` and `spec-check` reports no errors.

**Non-goals.** No template changes (TASK-125). No script or exit-code change. No
investigation loop. No new question count. No invented product direction. No
measured claim.

## Entities

| Term | Meaning here |
|---|---|
| topic | One of the seven interview subjects listed in Scope > F0 |
| candidate | A proposed solution that is not yet an accepted decision |
| accepted decision | A solution the operator says is decided |
| imposed requirement | A constraint that must be respected (platform, integration, data boundary, budget) |
| preference | A constraint that is a wish, not a requirement |
| first learning objective | The next useful investigation, with the autonomy granted within it |
| technical environment | The `harness-state` outcome: `0 complete`, `1 partial`, `2 empty`, `3 project` |
| product understanding | What is confirmed, provisional or unknown after the interview |
| next action | `implement`, `investigate`, or obtain a human decision |

## Approach

Prose edit of one file. The change is a contract the host reads, so it is written
as a list of topics and a report shape, not as an essay. Everything the spec
forbids stays where it is: the question cap, the skip rule and the stub rule are
preserved verbatim in meaning, and the templates are untouched. The completion
report maps its technical half onto the outcome the state script already returns;
the other two facts come from the interview, which is why they stay prose in the
skill rather than new fields in the script.

## Structure

- `skills/bootstrap-project-harness/SKILL.md` — the only code-adjacent file: the
  interview section and the completion-report section.
- `docs/evals/coverage.md` — the staleness note for the skillHash change.
- `CHANGELOG.md` — one `[Unreleased]` line.
- No test file is added: the change is prose, and the spec does not claim a unit
  test for it. Its verification is an eval case, stated in Verification.

## Operations

1. Run the validator and record the baseline: `node scripts/validate-skills.mjs
   --root skills`. It must print `All clear` **before** any edit, so a later
   failure is attributable.
2. Read the existing interview section and the completion-report prose. Note
   where the report currently derives a verdict from the document checklist.
3. **No test precedes this step, deliberately.** Rewrite the interview topics as
   the seven listed in the spec: problem and audience through a concrete
   situation; desired outcome independent of a proposed feature; evidence
   actually observed; proposed solution as a candidate unless already decided;
   the assumption most likely to change direction; constraints split imposed
   versus preference; first learning objective and the autonomy granted.
4. Add the candidate rule next to the solution topic and the imposed-versus-
   preference split next to constraints. Keep the phrasing in the bootstrap's own
   voice: imperative, additive-only, never invent product direction.
5. Rewrite the completion report as three facts. The technical fact must quote
   the `harness-state` outcome. If the existing prose cannot express the report
   without a script change, **stop and report** — that is a scope stop, not an
   extension.
6. Re-run `node scripts/validate-skills.mjs --root skills`; it must still print
   `All clear`.
7. Record the skillHash change and the staleness delta in
   `docs/evals/coverage.md`, with the words "screening, not a separation claim".
   **Do not write draw counts or pass rates**: the draws have not run yet, and
   inventing them is the failure the coverage file exists to prevent.
8. Add the `CHANGELOG.md` `[Unreleased]` line naming what changed and what did
   not (templates, scripts, exit codes).
9. Run the prompt's `spec-check` and fix only contract breakage, never scope.

## Norms

- Conventional Commits, subject ≤ 72 characters:
  `feat(SPEC-0100-bootstrap-interview-asks-what-we-know): <summary>`.
- The bootstrap's voice: direct, imperative, no hedging. Existing wording that
  this spec does not change stays untouched.
- One test per acceptance criterion is **not** the shape here: the criteria are
  prose contracts and a screening draw. Do not manufacture unit tests for prose.
- Keep the seven-question cap visible in the text. A cap that disappears from the
  prose is a silent scope change.

## Safeguards

- Do not edit `skills/bootstrap-project-harness/templates/**` or
  `.opencode/opencode.json`: TASK-125 owns the certainty field and the
  instruction-loading boundary.
- Do not change `scripts/harness-state.mjs` or its exit codes `0/1/2/3`.
- Do not add an eighth question, a probe runner, a budget field or an evidence
  contract.
- Do not write a measured rate, a run directory, or the outcome of a screening
  that has not run.
- Do not invent product direction, and do not fill a hypothesis into a document
  that the generated configuration loads as an instruction.
- Do not push. The branch lives locally until fan-in.

## Verification

| AC | Check |
|---|---|
| 1 | Read the interview section; map each of the seven topics to one prompt line; confirm the "repository answers first" sentence exists |
| 2 | Confirm the candidate rule is stated next to the solution topic, in words that distinguish candidate from accepted decision |
| 3 | Confirm the constraints topic splits imposed requirements from preferences |
| 4 | Confirm the report names three facts, and that the technical one cites the `harness-state` outcome rather than a re-derived signal |
| 5 | Read the report: a working environment with an unresolved hypothesis must be reported as successful, with `investigate` as next action |
| 6 | `grep` the section: the seven-question cap, the skip rule and the stub rule are still present |
| 7 | After the worker's commit: run case 1 once, read the transcript against the pass criterion (machine asserts standing **and** three facts visible), then 2–3 draws and case 2 |
| 8 | `node scripts/validate-skills.mjs --root skills` → `All clear`; `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0100-bootstrap-interview-asks-what-we-know.md` → no errors |

The work is done when every AC passes, the screening is recorded honestly, and
the spec moves to `implemented` in the bookkeeping commit — not before.
