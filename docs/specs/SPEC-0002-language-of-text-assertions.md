---
id: SPEC-0002
title: Text assertions when the reply is not in English
status: draft
priority: P1
created_at: 2026-11-02
updated_at: 2026-11-02
source_docs:
  - README.md
  - backlog/tasks/task-5 - eval-asserções-em-inglês-não-veem-resposta-em-outro-idioma.md
related_decisions: []
depends_on: []
blocks: []
tests: []
---

# SPEC-0002: Text assertions when the reply is not in English

## Purpose

Assertions like `reply`, `noreply` and `verdict` match English tokens. When the
agent answers in Portuguese — which happens without the prompt asking for it —
the case can pass for the wrong reason or fail for a reason nobody reads: the
`review-code` #3 control arm once passed by writing `### Veredicto: **Request
Changes**`, and a `grep` for `VERDICT` saw nothing to object to.

The same review found the mirror image in `bootstrap-project-harness` #8, where
the whole reply is Portuguese.

## User Outcome

Someone reading a red case can tell whether the agent broke the contract or
merely answered in a different language, and a green case means the contract was
met in a form the case actually checks.

## Scope

- Decide how the harness treats a reply whose language differs from the prompt.
- Apply the decision to the assertions that gate verdicts and refusals —
  `verdict`, and the `reply`/`noreply` patterns that encode a stance.
- Add one case that demonstrates the choice: a reply that states the required
  stance in another language is either accepted or rejected, and the case says
  which.

**Measured prevalence before writing this:** 5 of 392 recorded transcripts carry
any Portuguese marker, and one of them is an actual reply in Portuguese; the rest
quote tool output. The failure that opened this task came from a Promptfoo run,
which leaves no transcript in the runner's corpus, so the rate there is not in
that number.

**Blast radius.** The eval harness only. No skill changes, no product surface,
and no change to what any case expects of the agent.

## Non-Goals

- Appending "answer in English" to the prompt. The README already states that
  nothing is appended to make a run cheaper, because a cheaper run is a different
  test; the same argument applies to making it more convenient.
- Translating the case corpus. The cases stay English; this spec is about how
  assertions react when the agent does not.
- A general language detector. Only the vocabulary a case actually gates on.

## Flow

1. Pick one of the two options below and record why in this spec.
2. Apply it to `verdict` and to the stance patterns in the cases that have them.
3. Add a case whose reply is deliberately non-English and whose expected outcome
   follows from the decision.
4. Document the limitation in the README's assertion section, whichever way it
   goes.

## Data

No new persistence. The decision is visible in the case that demonstrates it and
in the README line.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — The spec records the decision (language-agnostic assertions, or record
  the limitation and leave the assertions English) with the reason.
- AC-2 — If language-agnostic: `verdict` accepts the stance in the languages
  observed, and a case proves it by passing with a non-English reply that carries
  the right stance and failing with one that carries the wrong stance.
- AC-2' — If recorded as a limitation: the README says that a reply in another
  language is outside what the text assertions check, and the judge is the only
  semantic reading; a case marks that state.
- AC-3 — No case gains an instruction appended to its prompt. Verified by
  diffing the `prompt:` lines.
- AC-4 — `node scripts/run-evals.mjs --root skills --list --check` passes.

## Open Questions

**Blocking — which option.** Two are defensible and they cost differently:

- **Language-agnostic assertions.** A small map of the stance vocabulary
  (`verdict`/`veredicto`, `withheld`/`retido`, …) inside the assertion evaluator.
  Cost: the map must be maintained, and a loose token can pass a reply the case
  meant to fail. It also puts translation knowledge in the harness, which is the
  layer that is supposed to know nothing about wording.
- **Record the limitation.** Keep assertions English, say in the README that a
  non-English reply is judged only by the optional `--judge`, and accept that a
  case can be green without the token. Cost: a green case can mean less than it
  looks, which is the exact failure this task was opened for.

Evidence favours the second on frequency (one reply in 392) and the first on
severity (it happened in a control arm, where a false pass is the whole point of
the measurement). The decision needs to be made before this leaves `draft`.

## Prompt Notes

- Requirements: the decision is one sentence, and the case is the proof.
- Entities: assertion kind (`verdict`, `reply`, `noreply`), stance token
  (`APPROVE`, `REJECT`, `withheld`), language.
- Approach: start from `verdict`, which has a fixed token set; treat free-form
  `reply` patterns only if the decision is language-agnostic.
- Structure: `scripts/lib/evals/assertions.mjs` (evaluator), one case in
  `skills/review-code/references/evals.md`, README assertion table.
- Operations: decide, implement in one place, add the case, run it three times.
- Norms: no prompt-append; the harness stays wording-light; a case states what it
  checks.
- Safeguards: do not let a translation map weaken the approval guard in
  `review-code` #3 — that case exists to catch an approval, and a synonym it does
  not know is silent.
- Tests: AC-2 or AC-2', plus the existing unit tests for `verdict`.

## Notes

This repo has no `docs/product` or principles tree, so the design checks in the
grooming workflow have nothing to read; the gap is recorded rather than filled.
