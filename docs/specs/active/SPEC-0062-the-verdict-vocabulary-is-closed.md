---
id: SPEC-0062
title: The verdict vocabulary is closed to valid forms
status: ready
priority: P1
task: TASK-91
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-91 - evals-o-vocabulario-de-veredito-nao-reconhece-formas-valida.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0056-review-proportional-to-diff-risk.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/assertions.mjs
  - scripts/lib/evals/assertions.test.mjs
  - scripts/lib/evals/kinds.mjs
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0062-the-verdict-vocabulary-is-closed.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0062-the-verdict-vocabulary-is-closed.md --base main
---

## Purpose

The `verdict` assertion recognises a fixed list of stances. When the model writes
a valid stance in a form the list does not carry, the cell reads as a failure that
did not happen.

The SPEC-0056 wave published three of them:

| Case | Control arm, in prose | Scored |
| --- | --- | --- |
| #1 | approves 5/5 ("compliant — approve", "Passes SPEC-0007") | 0/5 |
| #8 | rejects 5/5 ("changes requested", "needs changes") | 0/5 |
| #9 | rejects 5/5 ("one blocking defect") | 3/5 |

In each case the classification was corrected in prose during review. The scores
were not: they still say the control missed a judgement it made. A reader who
looks at the table sees a separator on engineering judgement when the difference
is only the token.

## User Outcome

- A control that says "changes requested" scores as a rejection.
- The published rates describe judgement, not vocabulary.
- Re-judging is free: the stored transcripts are replayed, no draw is spent.

## Scope

### F1 — close the vocabulary

`assertions.mjs` maps a stance to a set of accepted forms instead of one literal.
At minimum: `approve`, `approve with nits`, `approve with should-fix`,
`reject`, `request changes`, `changes requested`, `needs changes`,
`blocking`, `do not merge`, and the Portuguese equivalents a reviewer may emit.

The mapping is a closed list, published in `kinds.mjs` next to the other
assertion vocabulary. A form that is not on the list stays a miss — the fix widens
the list, it does not accept anything that looks vaguely negative.

### F2 — re-judge, do not re-measure

Replay the stored runs for `review-code` #1, #8, #9, #10 with
`scripts/replay-evals.mjs` and publish before/after per cell. The historical rates
stay visible: the table gains a **replayed** column, and the original measured
column is not rewritten.

### F3 — say what the assertion measures

`docs/evals/coverage.md` gains one paragraph: the `verdict` assertion scores the
stance line, not the engineering judgement; a token/contract separator is not a
capability separator; the replay column is the judgement-corrected rate.

## Non-Goals

- **No new draw.** Every number here comes from replaying stored transcripts.
- No change to any skill text, case prompt or fixture.
- No change to `speccheck` or the spec contract.
- No rewriting of the SPEC-0056 Results; it records what was measured then.
- No `CHANGELOG.md` edit here: the entry lands in the wave's publication commit so
  this spec can run in parallel with SPEC-0059.

## Flow

1. **F1 — vocabulary.** Rewrite the stance matcher as an explicit form table with
   a test per form, including the near-misses that must stay misses.
2. **F2 — replay.** Re-judge the four cells; record the run directories and the
   before/after counts.
3. **F3 — publish.** The new column, the paragraph, and a Results section.

## Data

- `scripts/lib/evals/assertions.mjs` (the matcher) and `kinds.mjs` (the registry).
- The stored runs cited by `docs/evals/coverage.md`.
- `docs/evals/coverage.md` for the replayed column.

## Acceptance Criteria

1. The stance mapping is an explicit table in `kinds.mjs`; every accepted form has
   a test, in both languages.
2. A near-miss is still a miss: "not approved", "cannot approve", "no changes
   needed" and a sentence that merely contains "approve" must not score as their
   surface reading. Prove each with a test.
3. `reply`/`noreply` behaviour is unchanged; only `verdict` is affected.
4. Replaying `review-code` #1, #8, #9 and #10 reproduces the transcripts cited in
   `coverage.md` and yields the before/after counts published in Results.
5. The historical column is untouched: the published measured rates do not move.
6. The new paragraph states plainly that the assertion scores the stance line, not
   the judgement, and that the replayed column is the judgement-corrected rate.
7. `--list --check` still parses 97 cases; `check-evidence` and `check-staleness`
   exit 0 with their current counts.
8. Zero paid draws.
9. `CHANGELOG.md` is not in this spec's diff.

## Decisions

- **Widen the list, not the matcher.** A fuzzy "mentions approve/reject" rule would
  score "I cannot approve in good conscience" as an approval. The fix is a closed,
  tested table.
- **Replay, never re-measure.** The transcripts already contain the judgement; the
  only thing that was wrong is how it was read. A new draw would buy noise.
- **Do not rewrite SPEC-0056.** Its numbers were correct under the old vocabulary;
  the replayed column is the corrected reading of the same evidence.

## Open Questions

None.

## Prompt Notes

- Start from the four transcripts the review cited, not from the assertion code.
  The forms that matter are the ones the controls actually emitted.
- Keep the matcher pure and table-driven; the test file should read as the table.
- The Portuguese forms are not decoration: a reviewer writing in Portuguese is a
  real case in this repo's own history.

## Results

**F1 — the vocabulary is a closed table.** `VERDICT_FORMS` in
`scripts/lib/evals/kinds.mjs` maps each accepted phrase to `APPROVE`, `REJECT` or
`WITHHELD`, and the matcher in `assertions.mjs` reads the stance line with it. The
table is the published list: 55 forms, English and Portuguese.

| stance | forms (after accent/case normalisation) |
| --- | --- |
| `APPROVE` | `approve`, `approved`, `approves`, `approving`, `approve with nits`, `approve with minor nits`, `approved with nits`, `approve with should-fix`, `approve with should fix`, `compliant`, `passes spec`; `aprovar`, `aprovado`, `aprovada`, `aprovacao`, `aprovo`, `aprovado com ressalvas`, `aprovado com nits` |
| `REJECT` | `request changes`, `request change`, `changes requested`, `change requested`, `needs changes`, `needs change`, `blocking`, `do not merge`, `don't merge`, `should not merge`, `not merge`, `reject`, `rejected`, `rejects`, `rejecting`; `rejeitar`, `rejeitado`, `rejeitada`, `recusar`, `recusado`, `mudancas solicitadas`, `solicito mudancas`, `solicitar mudancas`, `solicitando mudancas`, `precisa de mudancas`, `precisa de ajustes`, `nao aprovo`, `bloqueante`, `bloqueador`, `nao mergear` |
| `WITHHELD` | `withheld`, `withhold`, `withholding`; `retido`, `retida`, `reter`, `retenho` |

The matcher takes the **earliest** form in the stance line, longest first at the
same position, so `compliant — approve with minor test nit` reads `compliant` and
`one blocking defect` reads `blocking`. A form is void when the word immediately
before it is in `VERDICT_BLOCKERS` (`not`, `no`, `nao`, `never`, `cannot`, `can't`,
`cant`, `unable`, `without`, `non`, `if`, `unless`, `whether`, `would`, `could`,
`might`, `may`): `not approved`, `cannot approve`, `would approve`,
`non-blocking` and `não aprovado` are misses, while `not approved — request
changes` still reads `REJECT` because the guard is adjacent, not whole-line. A
form not in the table is a miss; there is no "mentions approve/reject" rule.
`reply`/`noreply` are untouched (`assertions.test.mjs`, "reply and noreply are
untouched by the stance vocabulary").

Tests (`scripts/lib/evals/assertions.test.mjs`, 480 pass in
`scripts/lib/evals/*.test.mjs`):

- "every accepted form scores as its stance and not as another" — one assertion
  per table entry (both languages), and each form scores neither of the other two
  stances.
- "the stance table is closed, normalised and covers both languages" — duplicate
  phrases, accent-normalised form, and at least one EN and one PT form per stance.
- "a form is read in a prose verdict line, after a lead-in" — the seven shapes the
  SPEC-0056 controls actually wrote.
- "a negated form is not its surface reading" — `not approved`, `cannot approve`,
  `can't approve`, `never approved`, `without approval`, `I would approve this if
  the tests were fixed.`, `I cannot approve in good conscience`, `não aprovado`,
  `não aprove`.
- "a negative form is not a rejection" — `no changes needed`, `non-blocking
  findings only`, `not blocking`.
- "the negation guard is adjacent, so a later stance still reads".
- "the blocker list is the whole negation guard" — every listed blocker blocks
  the adjacent form.

**F2 — replay, no draw.** `node scripts/replay-evals.mjs --run <dir>` over the
eight stored directories, before and after the table (before = HEAD, after = this
branch). The measured column in `coverage.md` is not touched.

| cell | arm | run directory | verdict `passed` before → after | cell before → after |
| --- | --- | --- | --- | --- |
| #1 | with-skill | `2026-11-10T15-20-12--review-code--agentworks-deepseek-v4-1-flash` | 5/5 → 5/5 | 5/5 → 5/5 |
| #1 | control | `2026-11-10T15-23-10--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 3/5 → **5/5** | 0/5 → 0/5 |
| #8 | with-skill | `2026-11-10T15-02-35--review-code--agentworks-deepseek-v4-1-flash` | 5/5 → 5/5 | 5/5 → 5/5 |
| #8 | control | `2026-11-10T15-05-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 → **5/5** | 0/5 → **5/5** |
| #9 | with-skill | `2026-11-10T15-08-51--review-code--agentworks-deepseek-v4-1-flash` | 5/5 → 5/5 | 5/5 → 5/5 |
| #9 | control | `2026-11-10T15-12-14--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 3/5 → **4/5** | 3/5 → **4/5** |
| #10 | with-skill | `2026-11-10T15-39-17--review-code--agentworks-deepseek-v4-1-flash` | 5/5 → 5/5 | 5/5 → 5/5 |
| #10 | control | `2026-11-10T15-54-47--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 → **3/5** | 0/5 → 0/5 |

The before replay reproduces the counts `coverage.md` published (0/5, 0/5, 3/5,
0/5 with the red assertions it names), so the transcripts are the cited ones.

What the remaining red is, per draw — these are misses, not regressions:

- #1 control: the verdict moves 3/5 → 5/5 (r1 `compliant — approve with minor
  test nit`, r4 `✅ Passes SPEC-0007`); the cell stays 0/5 because
  `reply Not verified` fails 5/5.
- #9 control: r4 (`The branch as a whole should not merge`) now reads `REJECT`.
  **r3 still misses**, and the review's "rejects 5/5" is a whole-reply judgement,
  not a stance line: r3's `VERDICT:` line is the prose "The SPEC-0007 change
  itself … is correct and fully covered. The branch also ships an unrelated,
  remotely exploitable shell-injection bug … Ship the cart change; drop the export
  change." It names no listed stance, so the stance-line rate is 4/5. Reported,
  not adjusted.
- #10 control: r2 (`Approves against SPEC-0008`) and r3 (`compliant`) now read
  `APPROVE`, r5 (`I'd approve the code with minor changes`) too; **r1 and r4 still
  miss** (`The implementation satisfies AC-1 … npm test passes (8/8)` and `the
  three acceptance criteria are met. Findings below are non-blocking.`), so the
  token reads 3/5. The cell stays 0/5 (`reply Not verified` 5/5).

Blast radius, whole store: a comparison of the verdict assertion over all 315
stored transcripts that carry one moves **17 draws, all `false → true`, none the
other way**. Eleven are the cells above (two in the #1 control, five in #8, one in
#9, three in #10); the other six are two legacy `matrix` draws of `review-code` #4
(`2026-11-01T22-02-37` r3, `2026-11-02T20-34-11` r2), two draws of the older #1
control `2026-11-07T15-42-21` (r1, r2), the older #2 control
`2026-11-07T15-46-26` r3, and the SPEC-0056 #2 control
`2026-11-10T15-28-46` r5. That last one is disclosed
because SPEC-0056 recorded it red: the #2 control's `changes requested` now reads
`REJECT`, so that arm replays 5/5, while #2's skill arm stays 4/5 (its r4 emits no
`VERDICT:` line) — #2 is still a non-discriminator. `coverage.md` gained a
`replayed` column for the twelve SPEC-0056 rows so the edited class is visible,
and its SPEC-0056 narrative and measured numbers are unchanged.

**Deliberately left out.** `satisfies`, `correct`, `met` and bare `passes` are not
forms. The corpus is the reason: #9 r4 says "the cart change *satisfies*
SPEC-0007" and then "should not merge", and #10 r1 says "the implementation
*satisfies* AC-1" while listing gaps — reading those as the branch stance would
answer the wrong question. `passes spec` is in the table because a verdict line
that says the branch passes a named spec is stating a stance; "npm test passes" is
not. `merge` alone is absent too: only the negative forms (`do not merge`, `should
not merge`, `not merge`) are stances.

**F3 — what the assertion measures.** `docs/evals/coverage.md` gains the
judgement-corrected paragraph under the replayed column, plus the updated Known
Hole: the assertion scores the stance line, not the engineering judgement, and a
token/contract separator is not a capability separator.

**Gates.** All exit 0: `validate-skills --root skills`; `run-evals --root skills
--list --check` (97 cases, 94 runnable, 3 manual); `node --test
scripts/lib/evals/*.test.mjs` (480 pass); `node --test scripts/lib/*.test.mjs`;
`node --test skills/bootstrap-project-harness/scripts/*.test.mjs`;
`check-sensor-parity`; `check-evidence` (0 errors, 100 warnings);
`check-staleness` (62 cited cells, 51 stale, 3 uncited — identical to `main`);
`spec-check --base main`.

**Cost.** Zero paid draws: every number above comes from stored transcripts, and
no skill, case prompt or fixture was edited. `CHANGELOG.md` is not in this diff.

