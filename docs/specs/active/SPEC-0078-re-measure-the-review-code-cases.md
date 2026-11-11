---
id: SPEC-0078
title: Re-measure the review-code cases the hash moved under
status: ready
priority: P1
task: TASK-92
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-92 - evals-re-medir-os-casos-3-6-do-review-code-no-skillHash-atual.md
  - docs/specs/SPEC-0056-review-code-cases.md
  - docs/evals/review-code-matrix.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/evals/coverage.md
  - docs/evals/review-code-matrix.md
  - docs/specs/active/SPEC-0078-re-measure-the-review-code-cases.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0078-re-measure-the-review-code-cases.md --base main
---

## Purpose

`SPEC-0056` changed `review-code`'s `SKILL.md` and re-measured cases 8–10 and the
regressions 1, 2 and 7. Cases **3, 4, 5 and 6** were left at their historical
evidence: they were never drawn at the current tree hash (`9a28572…`), and the
published cells predate the skill edit.

Everything measured since then used an instrument that has changed four times
(`ranpass` by effect, isolation per draw, deterministic tree hash, stance by last
clause). This is the first re-measurement that runs on an oracle worth trusting,
and it is the last big spend on the board.

## User Outcome

- Cases 3–6 have cells measured at the current `skillHash`, with both arms where
  the arm means something.
- The published `review-code` row says which cells are measured and at which
  hash, instead of citing history as if it were current.
- The spend is declared, counted draw by draw, and stops at a stated ceiling.

## Scope

### F1 — what is drawn, and why the trigger controls are not

**Behavioural cases 3 and 4**, both arms, five draws each — **20 draws**:

```
node scripts/eval.mjs run review-code 3 --arm with    --repeat 5 --model agentworks/deepseek-v4-1-flash
node scripts/eval.mjs run review-code 3 --arm without --repeat 5 --model agentworks/deepseek-v4-1-flash
node scripts/eval.mjs run review-code 4 --arm with    --repeat 5 --model agentworks/deepseek-v4-1-flash
node scripts/eval.mjs run review-code 4 --arm without --repeat 5 --model agentworks/deepseek-v4-1-flash
```

**Trigger cases 5 and 6**, `--arm with` only, five draws each — **10 draws**:

```
node scripts/eval.mjs run review-code 5 --arm with --repeat 5 --model agentworks/deepseek-v4-1-flash
node scripts/eval.mjs run review-code 6 --arm with --repeat 5 --model agentworks/deepseek-v4-1-flash
```

Case 5 asserts `skill review-code`; case 6 asserts `notskill review-code`. A
control run stages no skill at all, so case 5's control fails by construction and
case 6's passes by construction: the ten draws would buy no information. This is
the one place the task's 4 × 2 × 5 arithmetic is reduced, and it is recorded.

**Target: 30 draws. Ceiling: 40.** The remaining 10 are reserved for re-running
draws the harness discarded (stalls, provider aborts) — never for redrawing a cell
to get a greener number.

### F2 — classify

- **separator** — the arms differ on the judgement.
- **non-discriminator** — they agree, including both pass.
- **trigger** — a routing case drawn one arm by design; the class is about the
  load, not the judgement.
- **unresolved** — a cell cannot reach five clean draws, or the arm never
  exercised the thing under test.

Case 3 is the hard one: its control has historically reached 2/3, 4/10 and then
0/3 across three generations of the guard, so a 5/5 vs 4/5 result is not a
separator and must not be published as one.

### F3 — publish before/after

- `docs/evals/coverage.md`, the `review-code` row: for each of 3–6, the run dir,
  clean draws, passed, class, `skillHash`, model, and `isolated=`.
- `docs/evals/review-code-matrix.md`: the four cases' rows updated to the new
  cells, with the historical rows kept as history (marked), not deleted.
- The spec's `## Results`: the before/after table, the class per case, the red
  assertion per red cell, the spend per draw, and the list of cells that remain
  historical.

## Non-Goals

- **No `#1`, `#2`, `#7`–`#10`.** They were re-measured under `SPEC-0056` and are
  not in this budget.
- **No case, prompt, fixture, assertion or gate change.** If a case cannot
  discriminate, that is a finding about the case, published as such.
- **No `stallMs` change.** A stall is resumed once; the re-run counts against the
  ceiling.
- **No claim of a separator where the arms agree.**
- **No draw outside the 30 measured cells.**

## Flow

1. **F1** — the six runs, in the order above; record each run dir as it prints.
2. **F2** — classify from the stored `result.json` files.
3. **F3** — publish; every cited run passes `check-eval-run`.

## Data

- `evals/review-code/cases.md` — cases 3–6, with their `why:` and assertions.
- `docs/evals/review-code-matrix.md` — the current rows to update.
- `docs/evals/coverage.md:19` — the `review-code` row.
- Historical runs cited there: `2026-11-01T22-02-37`, `2026-11-02T20-34-11`,
  `2026-11-07T15-46-26`, `2026-11-10T15-*` (the `SPEC-0056` wave).

## Acceptance Criteria

1. Exactly six runs: 3 and 4 both arms, 5 and 6 with-skill, five draws each.
2. Total paid draws ≤ 40; the target is 30 and any excess is a discarded-draw
   re-run, named with its reason.
3. Every cited run has a run dir, `skillHash`, model and `isolated=` published,
   and passes `check-eval-run`.
4. Each of the four cases has a class from F2, with the red assertion named per
   red cell.
5. A case whose arms agree is published as a non-discriminator even if the skill
   arm looks better; a 5/5 vs 4/5 is not called a separator.
6. The historical rows in the matrix survive as history, marked.
7. No case, prompt, fixture, assertion or gate changed; `stallMs` unchanged.
8. Every command in `tests:` exits 0.

## Decisions

- **Skip the trigger controls.** A control stages no skill, so `skill review-code`
  fails and `notskill review-code` passes by construction. Ten draws for a
  tautology is not a measurement.
- **The ceiling is for discarded draws, not for better numbers.** A stall is
  infrastructure: it is re-run once, and if the ceiling is reached the cell
  publishes at its clean count with the missing draw named.
- **Re-measure now, because the oracle changed.** Publishing new numbers under an
  instrument that scored the string would have been worse than the history it
  replaces.

## Open Questions

None.

## Prompt Notes

- `--model agentworks/deepseek-v4-1-flash` on every run; the config default is
  another provider and a cell must not mix them.
- Record the run dir the CLI prints, verbatim, and `check-eval-run` it before
  citing.
- Do not read the transcripts to tune anything. Read them to publish the routing
  and red assertions, and stop there.
- If a draw stalls post-load, `--resume` once; that re-runs only the discarded
  slot and counts as a draw.

## Results

Measured 2026-11-11 in this worktree at `repoSha aabb206`, model
`agentworks/deepseek-v4-1-flash`, detector `cf2e2e319d975a5b`, level `behavior`,
concurrency 4, `stallMs` 120000 (unchanged). Every run records
`params.isolation.enforced: true` (seatbelt); the with-skill runs record the
tree hash `9a28572…`
(`9a28572110c6ed3f09d1aad20406a9a3a15c1d12b8eaf27291f9ec111b351595`), and every
run records the governed files it shares with that checkout
(`SKILL.md c43fb3e2…`, `references/deterministic-checks.md 9c92a4e7…`) — the
control arms stage no skill, so their `skillHash` is `null` by construction.

### Spend — 30 scored draws, 32 paid attempts, 2 discarded

Six runs in the order F1 fixes, five scored draws each. The store records **32
paid attempts**: `#5 r4` (`2026-11-11T14-49-32…`) and `#6 r4`
(`2026-11-11T14-54-36…`) each carry `execution.attempts: 2, retries: 1`. Both
were discarded on an infrastructure exit and re-run **once by the harness's own
infra retry** — `scripts/lib/evals/execute.mjs:30` retries only `stalled` and
`timeout`, and `:137` caps it at one. This is not `--resume`: no resumed run, no
new invocation, and no redraw for a greener number. The harness stores the count,
not which of the two exits fired, so the ledger records them as infrastructure
without naming one.

The two discarded attempts come **out of the 30's slots**, not on top of a 31st
or 32nd draw: the 10-draw reserve was not drawn on as a reserve. Total paid
attempts 32, against the ceiling of 40. The recorded cost is **$0.349374**, and
it is the final attempt's usage per draw (`execute.mjs:198-205` keeps
`tokens`/`cost` for the attempt that produced the reply), so the two discarded
attempts are not in it: real spend is **≥ $0.349374**.

No `#1`, `#2` or `#7`–`#10` draw was taken.

| # | cell | run directory | scored | attempts | r1 | r2 | r3 | r4 | r5 | clean | passed | cumulative (scored / paid) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | #3 with skill | `2026-11-11T14-32-10--review-code--agentworks-deepseek-v4-1-flash` | 5 | 5 | pass | pass | pass | pass | pass | 5/5 | 5/5 | 5 / 5 |
| 2 | #3 without skill | `2026-11-11T14-37-56--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5 | 5 | fail | fail | fail | fail | fail | 5/5 | 0/5 | 10 / 10 |
| 3 | #4 with skill | `2026-11-11T14-43-55--review-code--agentworks-deepseek-v4-1-flash` | 5 | 5 | pass | pass | pass | pass | pass | 5/5 | 5/5 | 15 / 15 |
| 4 | #4 without skill | `2026-11-11T14-46-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5 | 5 | pass | pass | fail | fail | fail | 5/5 | 2/5 | 20 / 20 |
| 5 | #5 trigger | `2026-11-11T14-49-32--review-code--agentworks-deepseek-v4-1-flash` | 5 | **6** | pass | pass | pass | pass | pass | 5/5 | 5/5 | 25 / 26 |
| 6 | #6 trigger | `2026-11-11T14-54-36--review-code--agentworks-deepseek-v4-1-flash` | 5 | **6** | pass | pass | pass | pass | pass | 5/5 | 5/5 | 30 / 32 |

The trigger controls were not drawn: a control stages no skill, so case 5's
`skill review-code` fails and case 6's `notskill review-code` passes by
construction (F1, Decisions). Ten draws for a tautology would have bought no
information, and it is the only place the task's `4 × 2 × 5` arithmetic is
reduced.

`check-eval-run` on each of the six directories exits 0 and prints
`findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0`. No
directory exits 1: no routing `gate-miss` occurred, because the with-skill draws
loaded `review-code` through the skill tool in all of them
(`skillGate.source: "tool"` for #3 and #4; `loaded: ["review-code"]` for #5 and
`loaded: []` for #6).

### Before / after

The before column is the published cell this spec replaces; the after column is
this wave. The hash is the same `9a28572…` the SPEC-0056 wave published, so the
comparison is at one `skillHash` for the first time.

| case | before (historical) | before class | after, 5 draws per measured cell | class now |
| --- | --- | --- | --- | --- |
| #3 no spec in the repo | 2026-11-03, `5/5 vs 1/5`, pre-detector (`warnings=5`), no recorded hash | separator (derived — no class published) | `5/5 vs 0/5` | **separator** |
| #4 spec moved after the stamp | 2026-11-05, `5/5 vs 3/5`, pre-detector (`warnings=5`), no recorded hash | token/contract separator (derived) | `5/5 vs 2/5` | **non-discriminator** on the judgement |
| #5 trigger: branch handed over | no run, no cell | none | `5/5` loaded | **trigger** |
| #6 near-miss: debugging a build | no run, no cell | none | `5/5` not loaded | **trigger** |

### Class per case, and the red assertion per red cell

**#3 — separator.** The arms differ on the judgement. With the skill, r1–r5
withhold the verdict and ask for the intent ("no spec, no prompt, no spec hash",
"Basis needed — one of: the spec id… or your explicit declaration"). The control
reviews the diff anyway, invents a rounding policy as an acceptance criterion,
and issues a verdict in all five draws ("request changes", "Approve with one
small fix", "Bottom line: …"). Red in every control draw, and only there:

- `reply (?:(?:provide|share|send)[ \t]+(?:the[ \t]+|me[ \t]+the[ \t]+)?(?:source[ \t]+)?spec|(?:confirm|authori[sz]e)[^.\n]{0,40}(?:review|basis)|withh(?:eld|old)|hold(?:ing)?[ \t]+(?:the[ \t]+)?verdict|(?:can'?t|cannot|could not|won'?t)[ \t]+(?:(?:issue|produce|give|make)[ \t]+(?:a |the )?verdict|review[ \t]+(?:against|without|this|it)))` — r1–r5
- `noreply (?:^|\n)…(?:verdict|veredicto|parecer)…(?:approve[ds]?|reject(?:ed)?|request changes|changes requested|…)` — r1–r5

This is not the `5/5 vs 4/5` shape the spec warns about: the control reached
`0/5` because it answered the question the case says must not be answered, not
because a token moved. The historical `1/5` pass is English — a `### Verdict`
heading followed by `**Hold the merge**` — the stance the guard did not name at
the time, and `review-code-matrix.md` records it as such; the current guard reads
the stance in both languages, and nothing in these five draws matched the refusal
vocabulary.

**#4 — non-discriminator.** Both arms reject the branch against the moved spec;
the arms agree on the judgement. Red in control r3, r4 and r5, and only there:

- `verdict REJECT` — r3, r4, r5. They write `**Verdict: not ready — the spec is
  not implemented at all.**`, `## Verdict: not implemented`, and `**Verdict:
  not implemented.**`; the closed stance table does not read a negated form
  (follow-up `TASK-109`), and
  the stored reader records `got NOT`. r5 ends "Reject / return for
  implementation"; r4 says "Nothing here is mergeable as SPEC-0007". The four
  other assertions pass in all five control draws, including `reply feb763b1`
  and `reply 36c915b0`.

Under F2 this is **non-discriminator**: the arms agree on the judgement and the
gap is the stance token, so publishing it as a separator would be a claim the
draws do not support. In the matrix's older vocabulary the same cell reads
"token/contract separator"; that phrase is kept in the per-case history, but the
class published for this wave is the spec's.

**#5 — trigger, one arm by design.** `skill review-code` passes 5/5: the skill
is loaded in all five draws from the prompt "Review this branch before I merge
it." Red assertions: none. No control is drawn, so there is no separation to
claim; the measured fact is reachability.

**#6 — trigger, one arm by design.** `notskill review-code` passes 5/5: the
skill is not loaded for "Why did my build fail on Node 20?" in any draw. Red
assertions: none. No control is drawn; the measured fact is the absence of a
false trigger.

### Cells that remain historical

- `review-code` #1, #2 and #7–#10 were **not** drawn in this wave. They keep the
  SPEC-0056 cells (measured 2026-11-10 at the same `skillHash 9a28572…`), which
  are current by hash but are another wave's measurement.
- The pre-detector #3 (`2026-11-03T10-06-33--review-code` /
  `2026-11-03T09-56-47--review-code--without-skill`, `5/5 vs 1/5`) and #4
  (`2026-11-05T07-34-32--review-code` /
  `2026-11-05T07-47-21--review-code--without-skill`, `5/5 vs 3/5`) cells stay in
  `review-code-matrix.md` **as history, marked**, not deleted.
- No `review-code` cell remains historical at an older `skillHash`: all ten cases
  are now published at `9a28572…`, six of them by this wave and four by
  SPEC-0056.

### What did not change

No case, prompt, fixture, assertion, `why:` line or gate was edited. `stallMs`
stays 120000. No transcript was read to tune anything; the replies above were
read to publish the routing and the red assertions.
