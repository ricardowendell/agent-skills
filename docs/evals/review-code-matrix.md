# `review-code` matrix — ten cases, measured and replayed

The human-facing record of what `review-code` was measured to do. Every number
here is already published in [`coverage.md`](coverage.md) or recorded in the run
directory it cites: this file reorganises the evidence, it does not measure.

| | |
| --- | --- |
| model | `agentworks/deepseek-v4-1-flash` — the single route of the wave; the `opencode-go` default was over its weekly limit |
| detector | v6 `9149d6ab1ca57343` |
| isolation | macOS seatbelt; every wave manifest records `params.isolation.enforced: true` with `mechanism: "seatbelt"`, and `check-eval-run` on each of the twelve wave directories prints `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0` |
| repository state | `repoSha 2aec756`, `skillHash 9a28572…`; the case-10 control ran later, at `beca23e`, on the strengthened fixture and the same `fixtureHash` as its skill arm |
| waves | **SPEC-0056 measured 2026-11-10** (five draws per arm); **SPEC-0062 re-judged the same transcripts 2026-11-10** (no model, no new draw) |
| cost | 65 paid draws in the wave: 55 evidence draws, 5 on an invalid case-10 setup attempt, and the 5 case-10 control draws the human approved above the original ceiling |

Two cells predate the wave and are history, not measurement: case 3 was drawn
2026-11-03 at `repoSha 8b74222` and case 4 on 2026-11-05 at `7a44564`, both
pre-detector (`warnings=5`, no `fixtureHash`/`promptHash`, `isolated=unknown`).
They are cited as historical direction and cannot underwrite a clean rate.

## How to read this file

- **with skill** — `review-code` is staged into the child's workspace and the
  gate requires that copy to be the one that loaded. **without skill** —
  `--no-skill`: nothing is staged and the `skill` tool is denied. The arm
  measures "not auto-loaded", not "text unreachable".
- A cell reads `passed/5`; five repetitions per arm. Five draws show a
  direction, not a per-case population rate.
- **clean draws** is the non-contaminated count for that arm: draws with no
  skill or host read, no abort, no lost gate. A cell's rate is only as good as
  its clean base.
- **measured** is what the assertions said when the draws ran, under the stance
  vocabulary that preceded SPEC-0062. **replayed** is the same stored
  transcripts read under SPEC-0062's closed stance table
  (`node scripts/replay-evals.mjs --run <dir>`; no model, no write into the run
  directory), attributed to SPEC-0062 on every row. The two columns are not
  averaged, not merged, and not interchangeable: `measured` is the historical
  record of the token, `replayed` is the judgement-corrected reading of the
  same draws.
- The classes, and only these three:
  - **separator** — the arms differ on the judgement.
  - **token/contract separator** — the arms agree on the judgement and differ on
    the required output contract (the stance token, the `Not verified` section,
    the hash evidence, a `file:line`).
  - **non-discriminator** — the arms agree on both.
- Every path is post-SPEC-0058: the corpus is `evals/review-code/cases.md` with
  its fixtures under `evals/review-code/fixtures/`. Paths from the older layout
  appear only in *History*, labelled as such.

## The ten cases

| case | what it stages | measured (with / without) | replayed (with / without) | class |
| --- | --- | --- | --- | --- |
| 1 | clean diff, every AC satisfied | 5/5 / 0/5 | 5/5 / 0/5 | token/contract separator |
| 2 | rounding before tax, noisy test | 4/5 / 4/5 | 4/5 / 5/5 | non-discriminator |
| 3 | no spec in the repo | 5/5 / 1/5 | — | separator |
| 4 | spec moved after the stamp | 5/5 / 3/5 | — | token/contract separator |
| 5 | trigger: a branch handed over | no arm cell | — | — |
| 6 | near-miss: debugging a build | no arm cell | — | — |
| 7 | gate already red on `main` | 5/5 / 0/5 | 5/5 / 0/5 | separator (holdout) |
| 8 | interface break, green suite | 5/5 / 0/5 | 5/5 / 5/5 | token/contract separator |
| 9 | introduced injection, green suite | 5/5 / 3/5 | 5/5 / 4/5 | token/contract separator |
| 10 | risky-looking change that must pass | 5/5 / 0/5 | 5/5 / 0/5 | token/contract separator |

`—` in the replayed column means SPEC-0062 did not re-judge that cell. It
re-read the eight directories behind the four SPEC-0056 citations (cases 1, 8, 9
and 10) and the two regression rows that cite the same wave (cases 2 and 7); cases
3 and 4 were outside that set, and cases 5 and 6 have no draw to replay.

## Case 1 — review against SPEC-0007

A clean diff that satisfies every acceptance criterion. The control approves it
in prose 5/5 ("compliant — approve", "Passes SPEC-0007") and misses on the
contract: `verdict APPROVE` in r1 and r4, `reply Not verified` in all five.

| arm | run directory | clean draws | measured | replayed | class |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-10T15-20-12--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 | token/contract separator |
| without skill | `2026-11-10T15-23-10--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 0/5 | token/contract separator |

**Class: token/contract separator.** Both arms approve the change. SPEC-0062
re-reads r1 and r4 as `APPROVE`, so the token moves 3/5 → 5/5, and the cell
stays 0/5 because `reply Not verified` fails 5/5. The 0/5 is the missing
response contract, not a different engineering judgement.

## Case 2 — rounding before tax

The branch applies rounding to the subtotal, so the returned total still carries
float noise, and the added test asserts the noisy value. Both arms find AC-2 and
reject; a diff-reading case cannot separate reviewers that read the same code.

| arm | run directory | clean draws | measured | replayed | class |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-10T15-26-12--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | 4/5 | non-discriminator |
| without skill | `2026-11-10T15-28-46--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 4/5 | 5/5 | non-discriminator |

**Class: non-discriminator.** Measured 4/5 vs 4/5; replayed the control's r5
(`changes requested`) reads `REJECT`, so it moves to 5/5, while the skill arm
stays 4/5 because its r4 emits no `VERDICT:` line — a token miss on the skill
side, not a judgement difference. Both arms reject the change in substance. The
case is kept as a regression case: it fails a reviewer that misses an obvious AC
violation, or one that approves because the suite is green.

## Case 3 — no spec in the repo

The case prunes `docs/specs` and `docs/prompts` before the base commit, so the
review has to ask for the intent instead of inventing acceptance criteria.

| arm | run directory | clean draws | measured | replayed | class |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-03T10-06-33--review-code` | 5 draws, not checkable (pre-detector, `warnings=5`) | 5/5 | — | separator |
| without skill | `2026-11-03T09-56-47--review-code--without-skill` | 5 draws, not checkable (pre-detector, `warnings=5`) | 1/5 | — | separator |

**Class: separator.** The skill withholds or names the missing basis 5/5; the
control returns a verdict in 4/5. The single control pass ended under a
`### Verdict` heading with `**Hold the merge**` — a stance the guard did not name
at the time, not a confident approval. The current assertions name that stance
and require the reply to say what is missing; replaying the recorded transcripts
under them keeps every skill run passing and flips only control runs. The cell
is historical: it was not re-measured at `skillHash 9a28572…`, and its published
counts are pre-detector history.

## Case 4 — spec moved after the stamp

The branch rewords AC-3 and changes nothing else: the spec hashes to `36c915b0…`
while the prompt still pins `feb763b1…`. The stale spec is the only defect.

| arm | run directory | clean draws | measured | replayed | class |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-05T07-34-32--review-code` | 5 draws, not checkable (pre-detector, `warnings=5`) | 5/5 | — | token/contract separator |
| without skill | `2026-11-05T07-47-21--review-code--without-skill` | 5 draws, not checkable (pre-detector, `warnings=5`) | 3/5 | — | token/contract separator |

**Class: token/contract separator.** Both arms reject the change; the two
control misses are `reply feb763b1` and `reply 36c915b0` — rejections that do
not show both hash prefixes. The arms agree on the judgement and differ on the
required contract. `coverage.md` publishes no class for this cell; the class
here is the definition applied to the published cell, not a second count. It is
historical: not re-measured at `skillHash 9a28572…`, and the luna cells were
never re-measured on the revised fixture.

## Case 5 — trigger: a branch is handed over for review

A prompt that never names the skill ("Review this branch before I merge it").
The case measures reachability — `skill review-code` — with `gate: off`, so it
is skipped at `--level behavior` and has no with/without arm cell.

`coverage.md` publishes no trigger run for `review-code`, and the store holds no
run directory for this case. Nothing is measured here, so the case carries no
class; inventing one would be a claim without a subject.

## Case 6 — near-miss: a failure being debugged

Same vocabulary (branch, build, failure) without a change to approve. The case
asserts `notskill review-code` and, like case 5, is a trigger case with
`gate: off`. No run directory and no published number exist for it, so it has
no arm cell and no class.

## Case 7 — a gate that is already red

`main` already fails `npm test`: `test/legacy.test.js` asserts a packaging fee
nobody implemented. The branch adds `total()` and its tests without touching the
failing test, so the diff is clean and the gate is the only failing signal.
`AGENTS.md` names the gate command but does not say it must pass.

| arm | run directory | clean draws | measured | replayed | class |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-10T15-31-48--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 | separator |
| without skill | `2026-11-10T15-35-51--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 0/5 | separator |

**Class: separator.** The control fails `verdict REJECT` in all five draws: in
the earlier v2 holdout measurement (`2026-11-07T09-07-52--review-code--agentworks-deepseek-v4-1-flash`
against `2026-11-07T09-11-14--review-code--agentworks-deepseek-v4-1-flash--without-skill`,
5/5 vs 0/5) three controls approved despite the red gate and two named the gate
without emitting the token. The case was frozen in SPEC-0033 before the first
draw; see [`discriminating-cases.md`](discriminating-cases.md).

## Case 8 — interface break with a green suite

The branch exports `total({ items, taxRate })` where AC-1 fixes
`total(items, taxRate)` and updates every call and test, so `npm test` passes.
The public contract is broken and the green suite does not make it acceptable.

| arm | run directory | clean draws | measured | replayed | class |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-10T15-02-35--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 | token/contract separator |
| without skill | `2026-11-10T15-05-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 5/5 | token/contract separator |

**Class: token/contract separator.** The control rejects the same break in prose
5/5 ("changes requested", "needs changes", "one blocking defect"); the closed
stance table only accepts `request changes`/`reject`, so the measured token
scores 0/5. SPEC-0062 re-reads all five as `REJECT`, and the cell becomes 5/5.
The arms agree on the judgement; the 0/5 was the missing token.

## Case 9 — introduced vulnerability with a green suite

The branch adds `exportCart`, which builds a shell string from `filename` — a
value forwarded from the request query string — and runs it through `execSync`.
The test asserts only the built string, so the suite stays green while the
command path is injectable.

| arm | run directory | clean draws | measured | replayed | class |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-10T15-08-51--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 | token/contract separator |
| without skill | `2026-11-10T15-12-14--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 3/5 | 4/5 | token/contract separator |

**Class: token/contract separator.** The control rejects the injection in prose
5/5; r1, r2 and r5 emit a recognised stance, r3 and r4 do not, so it measures
3/5. SPEC-0062 re-reads r4 (`The branch as a whole should not merge`) as
`REJECT`; r3 still names no listed stance, so the token and the cell both read
4/5. The other red — `reply src/export\.js:[0-9]+` — is r3 only. Both arms
reject; the gap is the token.

## Case 10 — a risky-looking change that must not block

The branch adds a bounded exponential-backoff retry with its own spec
(SPEC-0008) and tests for the waits, the defaults, the exhausted budget and the
non-integer inputs. The timers, the `catch` and the exponent look risky to a
scanner; the loop is bounded and the error is rethrown.

| arm | run directory | clean draws | measured | replayed | class |
| --- | --- | --- | --- | --- | --- |
| with skill (fixed fixture) | `2026-11-10T15-39-17--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 | token/contract separator |
| without skill | `2026-11-10T15-54-47--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 0/5 | token/contract separator |

**Class: token/contract separator.** The control approves the same correct retry
in prose 5/5 but emits no `VERDICT: APPROVE` and no `Not verified` section, so it
measures 0/5. SPEC-0062 reads r2, r3 and r5 as `APPROVE` — the token moves to
3/5 — while r1 and r4 state the stance only in prose and `reply Not verified`
fails 5/5, so the cell stays 0/5. Both arms approve; the gap is the contract.

The first skill arm of this case,
`2026-11-10T15-15-21--review-code--agentworks-deepseek-v4-1-flash`, is **not
evidence**: it reviewed the original fixture and correctly blocked it, because
the tests did not cover AC-2's delay schedule or AC-3's defaults and non-integer
inputs. The fixture was strengthened and the case re-measured; no `expect:` line
or assertion was changed, and the fixture change did not lower the bar.

## Where this file disagreed with `coverage.md`

`coverage.md` is the source of numbers and classes; where the two documents
disagreed, it won and this file was corrected. The disagreements found were in
the older version of this file, not in the per-cell table:

- **Case 1 was called a separator.** The replaced version published a 15/15 vs
  0/15 aggregate and read it as "the skill separates on #1 and #4". For the
  current cell `coverage.md` publishes **token/contract separator**: both arms
  approve and the control loses on `verdict APPROVE`/`reply Not verified`. The
  aggregate was over three cases whose fixtures have since been revised or
  retired, which is why it is history rather than a smaller version of these
  numbers.
- **Case 2 carried the retired fixture's 5/5 vs 5/5.** `coverage.md` publishes
  the current cell at 4/5 vs 4/5, replayed 4/5 vs 5/5, still a
  **non-discriminator**. The class did not move; the number did.
- **Cases 3 and 4 have no published class.** `coverage.md` publishes classes for
  cases 1, 2 and 7–10 only. For these two this file applies the definitions above
  to the published cells and says so in the row, instead of claiming a published
  class that does not exist. Case 3 separates on the judgement (withhold vs
  verdict); case 4 agrees on the judgement and differs on the hash evidence.
- **Cases 5 and 6 have no published measurement.** They are trigger cases with
  `gate: off`; `coverage.md` lists `review-code` as ten cases with two triggers
  and no manual case, and publishes no trigger run. Their rows say `no arm cell`
  rather than inventing a rate.

## History

The first publication (2026-11-01, revised 2026-11-02 and 2026-11-05) covered
three cases and measured them with a layout in which the eval corpus still lived
inside the skill (`references/evals.md` and `references/evals/`, retired by
SPEC-0058) and before home isolation: the child saw every skill installed on the
machine, so those numbers answer a different question and are not comparable
with the ones above. That publication also counted two assertion defects in the
skill's favour — `verdict` read capitalisation instead of stance, and the case-3
guard required a label — and those are why the control cells were re-measured
rather than carried forward. The runs from that period are cited in
`coverage.md` as pre-detector history, with their `warnings` counts, and are not
used here.

## Reproduce

```sh
node scripts/run-evals.mjs --root skills --list
node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/<run-dir>
node scripts/replay-evals.mjs --run <run-id>
node scripts/check-evidence.mjs
```
