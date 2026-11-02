---
id: SPEC-0002
title: Text assertions when the reply is not in English
status: implemented
priority: P1
created_at: 2026-11-02
updated_at: 2026-11-02
source_docs:
  - README.md
  - backlog/tasks/task-5 - eval-asserções-em-inglês-não-veem-resposta-em-outro-idioma.md
related_decisions: []
depends_on: []
blocks: []
tests:
  - node --test scripts/lib/evals/assertions.test.mjs
  - node scripts/replay-evals.mjs --skill review-code --case 2 --quiet
  - node scripts/run-evals.mjs --root skills --list --check
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

1. Split the question by what the assertion can know: a `verdict` line names one
   of three stances, so it can be read in any language; a free-form regex cannot.
2. Make `verdict` stance-aware, with a closed vocabulary the cases have evidence
   for.
3. Extend the one stance guard that has seen another language (`review-code` #3)
   to name the words it has seen.
4. Document the limit of `reply`/`noreply` in the README's assertion section.

## Data

No new persistence. The vocabulary lives in `scripts/lib/evals/assertions.mjs`,
the limit is stated in the README, and the evaluator's unit test is the proof.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — The decision is recorded: stance-bearing assertions are language-
  agnostic; free-form `reply`/`noreply` regexes remain the case author's
  vocabulary, with the limit stated in the README.
- AC-2 — `verdict` reads the stance rather than the spelling: `VERDICT`,
  `Verdict`, `Veredicto` and `Parecer` are the same line, accents and markdown
  decoration are ignored, and a token outside the closed vocabulary still
  compares literally. Proven by a unit test in `assertions.test.mjs` that passes
  a Portuguese reply carrying the right stance and fails one carrying the wrong
  stance.
- AC-2' — The README says a reply in a language a `reply`/`noreply` pattern does
  not list is invisible to it, and that `--judge` is the only semantic reading.
- AC-3 — No case gains an instruction appended to its prompt. Verified by
  diffing the `prompt:` lines (none changed).
- AC-4 — `node scripts/run-evals.mjs --root skills --list --check` passes.

**Why the proof is a unit test and not an eval case.** A case cannot make the
agent answer in Portuguese without appending an instruction, which AC-3 forbids
and the README forbids in principle. The evaluator is therefore tested where the
language can be set deliberately.

## Decision

**Stance-bearing assertions are language-agnostic; free-form regexes are not, and
the README says so.**

`verdict` gates a decision from a closed set — APPROVE, REJECT, WITHHELD — so it
can read the word rather than the spelling. The vocabulary is a short list in
`assertions.mjs`, seeded with the English and Portuguese words the corpus has
actually produced, and an unknown word still compares literally, so nothing is
guessed and the list grows only on evidence.

`reply`/`noreply` stay as written by the case author. There is no closed set to
read them against, and a synonym map covering a free-form pattern would be a
language model in the harness — the opposite of what this layer is for. The cost
is stated rather than hidden: a green case means the listed words were absent,
not that the stance was absent. `review-code` #3, the guard this task was opened
for, therefore names the stance in both languages it has seen, and matches it as
a heading or in emphasis as well as after a label — the control wrote
`## Review: **Request changes**` and `**Request changes** — one issue found`,
and both slipped through the label-only version.

The reason to split instead of choosing one side: frequency favoured recording
the limitation (one real reply in 392 transcripts), severity favoured fixing it
(the false pass happened in a control arm, where it costs the measurement). The
split buys the severity fix where it is cheap and keeps the harness free of
translation knowledge where it is not.

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
