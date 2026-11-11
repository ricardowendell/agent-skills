---
id: SPEC-0074
title: The vocabulary contract says what the matcher does
status: implemented
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

**F1 — the comment.** `scripts/lib/evals/kinds.mjs:90-107` now states what the
matcher does, in the order F1 asks: (1) `.` `;` `:` `—` `–` end a clause, and so
does a comma; (2) a negator before the boundary does not reach the next clause,
while one inside the same clause still blocks the form; (3) `if`, `unless` and
`whether` are the exception, read against the wider sentence, so a conditional
before the comma still blocks a stance after it; (4) the stance is the last clause
that names one, with `REJECT` winning inside a clause. The true example
`not approved — request changes` and the new `approved, but do not merge` /
`If the tests were fixed, approve` examples each pin one of those points.

The adjacent sentence at 90-91 was also stale: it said a form is a stance only
when "the clause it sits in carries no negator or conditional", but the conditional
guard reaches across commas. It now reads "no negator sits in its clause and no
conditional sits earlier in its sentence". No other comment was edited.
`VERDICT_FORMS` / `VERDICT_BLOCKERS` are untouched; `git diff` for `kinds.mjs`
adds and removes only `//` lines.

**F2 — checked against the code, not the spec.** Every sentence maps to
`assertions.mjs`: comma in `CLAUSE_BOUNDARIES` (:54) and absent from
`CONDITION_BOUNDARIES` (:55); negators tested with the comma boundary and
conditionals without it in `blockedBefore` (:82-87); `stance()` (:104-128) taking
the last `boundaryCut` with `STANCE_PRECEDENCE` (`REJECT` > `WITHHELD` >
`APPROVE`) on ties. The three examples are already pinned by
`assertions.test.mjs` (`not approved — request changes` → REJECT, :308-312;
`If the tests were fixed, approve` → no stance, :399;
`approved, but do not merge` → REJECT, :342-346). No disagreement between code
and spec was found.

**Gates.** All exit 0, run in this worktree:

- `node scripts/validate-skills.mjs --root skills` — 14 `SKILL.md`, all clear;
- `node scripts/eval.mjs check --root skills` — 101 cases (98 runnable, 3 manual),
  98 fixtures staged, no findings;
- `node --test scripts/lib/evals/*.test.mjs` — **565 pass, 0 fail**;
- `node --test scripts/lib/*.test.mjs` — 13 pass, 0 fail;
- `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` — 42 pass,
  0 fail;
- `node scripts/check-sensor-parity.mjs` — 2/2 fixtures in parity;
- `node scripts/check-evidence.mjs` — 6 documents, 0 errors, 0 warnings;
- `node scripts/check-staleness.mjs` — 66 cited cells, 55 stale, 3 uncited, same
  as `main`;
- `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0074-… --base main`
  — no errors.

**Cost.** Zero paid draws. No eval was run, no store written, no fixture or skill
edited.
