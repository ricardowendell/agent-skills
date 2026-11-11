---
id: SPEC-0074
title: The vocabulary contract says what the matcher does
status: ready
priority: P3
task: TASK-108
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-108 - evals-o-contrato-de-KINDS-diz-que-virgula-nao-e-fronteira-de-clausula.md
  - docs/specs/SPEC-0073-the-stance-is-the-last-clause.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/kinds.mjs
  - docs/specs/active/SPEC-0074-the-vocabulary-contract-says-what-the-matcher-does.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0074-the-vocabulary-contract-says-what-the-matcher-does.md --base main
---

## Purpose

`scripts/lib/evals/kinds.mjs:99-101` documents the verdict contract. After
`SPEC-0073` it says a comma is not a clause boundary, which is true only for
`if`/`unless`/`whether` — the other blockers do reset at the comma. The file that
*is* the vocabulary contract now misdescribes the matcher.

This is a comment-only fix: one paragraph, no code.

## User Outcome

- A reader of `kinds.mjs` learns the rule the matcher implements: a comma ends a
  clause, except that the three conditionals are read across it.
- No behaviour changes.

## Scope

### F1 — the comment

Rewrite the clause-boundary paragraph (`kinds.mjs:99-101` and any adjacent line it
contradicts) to state:

- a comma, like `.` `;` `:` `—` `–`, ends a clause;
- a negator before the comma does not reach the next clause, one inside the same
  clause still blocks;
- `if`, `unless` and `whether` are the exception: they are read against the wider
  sentence, so a conditional before the comma still blocks a stance after it;
- the stance is the last clause that names one, with `REJECT` still winning inside
  a clause (`SPEC-0073`).

Keep it a comment: no exported name, no list, no behaviour change.

## Non-Goals

- **No code change.** `git diff` for `kinds.mjs` must be comment lines only.
- **No new form, blocker or locution.**
- **No paid draw.**
- **No edit to other comments** that are already true.

## Flow

1. **F1** — rewrite the paragraph against `assertions.mjs`'s actual
   `CLAUSE_BOUNDARIES` / `SENTENCE_BLOCKERS` / `stance()`.
2. Verify each sentence against the code, not against the spec.

## Data

- `scripts/lib/evals/kinds.mjs:99-101` — the stale comment.
- `scripts/lib/evals/assertions.mjs` — `CLAUSE_BOUNDARIES`, `SENTENCE_BLOCKERS`,
  `stance()`.

## Acceptance Criteria

1. The comment states the four points in F1 and nothing the code does not do.
2. `git diff` for `kinds.mjs` touches comment lines only (no code, no exports).
3. `node --test scripts/lib/evals/*.test.mjs` still passes unchanged.
4. Zero paid draws; every command in `tests:` exits 0.

## Decisions

- **Comment-only, in the contract file.** The vocabulary belongs in `kinds.mjs`;
  a second explanation in a doc would drift again.
- **No behaviour change.** `SPEC-0073` shipped the rule with tests; this spec only
  stops the contract from contradicting them.

## Open Questions

None.

## Prompt Notes

- Quote the rule from the code: `CLAUSE_BOUNDARIES` includes `,`; the conditionals
  are the ones read against the sentence clause. If the two disagree, the comment
  follows the code and you report the disagreement.

## Results

_Filled during implementation._
