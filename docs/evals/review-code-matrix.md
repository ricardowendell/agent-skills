# `review-code` matrix — ten cases, measured and replayed

The human-facing record of what `review-code` was measured to do. Every number
here is already published in [`coverage.md`](coverage.md) or recorded in the run
directory it cites: this file reorganises the evidence, it does not measure.

| | |
| --- | --- |
| model | `agentworks/deepseek-v4-1-flash` — the single route of both waves; the `opencode-go` default was over its weekly limit |
| detector | v6 `9149d6ab1ca57343` for the SPEC-0056 draws; `cf2e2e319d975a5b` for the SPEC-0078 draws (cases 3–6). `check-evidence` today reports the current detector `cf2e2e319d975a5b` |
| isolation | macOS seatbelt; every wave manifest records `params.isolation.enforced: true` with `mechanism: "seatbelt"`, and `check-eval-run` on each of the twelve SPEC-0056 wave directories prints `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0`; the six SPEC-0078 directories print the same summary |
| repository state | `repoSha 2aec756`, `skillHash 9a28572…` for the SPEC-0056 wave; `repoSha aabb206`, the same `skillHash 9a28572…` for the SPEC-0078 wave; the case-10 control ran later, at `beca23e`, on the strengthened fixture and the same `fixtureHash` as its skill arm |
| waves | **SPEC-0056 measured 2026-11-10** (five draws per arm); **SPEC-0062 re-judged the same transcripts 2026-11-10** (no model, no new draw); **SPEC-0078 measured cases 3–6 on 2026-11-11** (five draws per measured cell) |
| cost | 65 paid draws in the SPEC-0056 wave: 60 evidence draws (55 planned plus the 5 case-10 control draws the human approved above the original ceiling) and 5 spent on an invalid case-10 setup attempt; **30 scored draws / 32 paid attempts** in the SPEC-0078 wave — `#5 r4` and `#6 r4` each record `execution.attempts: 2, retries: 1`, an infrastructure attempt discarded and re-run once by the harness's own retry, not by `--resume`; the recorded cost `0.349374` is the final attempt's usage only, so real spend is `≥ $0.349374` |

Two cells predate the wave and are history, not measurement: case 3 was drawn
2026-11-03 at `repoSha 8b74222` and case 4 on 2026-11-05 at `7a44564`, both
pre-detector (`warnings=5`, no `fixtureHash`/`promptHash`, `isolated=unknown`).
They are cited as historical direction and cannot underwrite a clean rate.
SPEC-0078 replaced both with cells at `9a28572…`; the old rows stay below as
history, marked.

## How to read this file

- **with skill** — `review-code` is staged into the child's workspace and the
  gate requires that copy to be the one that loaded. **without skill** —
  `--arm without`: nothing is staged and the `skill` tool is denied. The arm
  measures "not auto-loaded", not "text unreachable".
- A cell reads `passed/5`; five repetitions per arm. Five draws show a
  direction, not a per-case population rate.
- **clean draws** is the non-contaminated count for that arm: draws with no
  skill or host read, no abort, no lost gate. A cell's rate is only as good as
  its clean base.
- **measured** is what the assertions said when the draws ran, under the stance
  vocabulary that preceded SPEC-0062. **replayed** is the same stored
  transcripts read under SPEC-0062's closed stance table
  (`node scripts/eval.mjs inspect <dir> --replay`; no model, no write into the run
  directory), attributed to SPEC-0062 on every row. The replayed column carries
  the **cell** (`passed/5`), not the stance token: where only the token moved,
  the cell does not change, which is why cases 1 and 10 read
  `measured == replayed` while their prose records the token moving.
  `coverage.md`'s replayed column gives both numbers as `token / cell`. The two
  columns are not averaged, not merged, and not interchangeable: `measured` is
  the historical record of the token, `replayed` is the judgement-corrected
  reading of the same draws.
- The classes, and only these four:
  - **separator** — the arms differ on the judgement.
  - **token/contract separator** — the arms agree on the judgement and differ on
    the required output contract (the stance token, the `Not verified` section,
    the hash evidence, a `file:line`).
  - **non-discriminator** — the arms agree on both.
  - **trigger** — a routing case drawn one arm by design; the class is about the
    load, not the judgement (SPEC-0078 F2).
- Every path is post-SPEC-0058: the corpus is `evals/review-code/cases.md` with
  its fixtures under `evals/review-code/fixtures/`. Paths from the older layout
  appear only in *History*, labelled as such.

## The ten cases

| case | what it stages | measured (with / without) | replayed (with / without) | class |
| --- | --- | --- | --- | --- |
| 1 | clean diff, every AC satisfied | 5/5 / 0/5 | 5/5 / 0/5 | token/contract separator |
| 2 | rounding before tax, noisy test | 4/5 / 4/5 | 4/5 / 5/5 | non-discriminator |
| 3 | no spec in the repo | 5/5 / 0/5 | — | separator |
| 4 | spec moved after the stamp | 5/5 / 2/5 | — | non-discriminator |
| 5 | trigger: a branch handed over | 5/5 loaded (with-skill only) | — | trigger |
| 6 | near-miss: debugging a build | 5/5 not loaded (with-skill only) | — | trigger |
| 7 | gate already red on `main` | 5/5 / 0/5 | 5/5 / 0/5 | separator (holdout) |
| 8 | interface break, green suite | 5/5 / 0/5 | 5/5 / 5/5 | token/contract separator |
| 9 | introduced injection, green suite | 5/5 / 3/5 | 5/5 / 4/5 | token/contract separator |
| 10 | risky-looking change that must pass | 5/5 / 0/5 | 5/5 / 0/5 | token/contract separator |

Rows 3–6 are the **SPEC-0078** wave (2026-11-11, `skillHash 9a28572…`,
detector `cf2e2e319d975a5b`); rows 1, 2 and 7–10 are the **SPEC-0056** wave
(2026-11-10, the same `skillHash`). Cases 5 and 6 are trigger cases measured
with the skill arm only, by design.

`—` in the replayed column means SPEC-0062 did not re-judge that cell. It
re-read the eight directories behind the four SPEC-0056 citations (cases 1, 8, 9
and 10) and the two regression rows that cite the same wave (cases 2 and 7); cases
3 and 4 were outside that set, and the cases 5 and 6 routing draws assert a skill
load, which the replay does not re-judge.

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
float noise, and the added test asserts the noisy value. Every draw that produced
a review, in either arm, finds AC-2 and rejects; a diff-reading case cannot
separate reviewers that read the same code.

| arm | run directory | clean draws | measured | replayed | class |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-10T15-26-12--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | 4/5 | non-discriminator |
| without skill | `2026-11-10T15-28-46--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 4/5 | 5/5 | non-discriminator |

**Class: non-discriminator.** Measured 4/5 vs 4/5. The skill arm's miss is not a
token miss: its r4 stopped after its last tool call and returned **no review at
all** — the transcript's only assistant text is the opening preamble, the final
step emits two output tokens, and `verdict REJECT`, `reply AC-2` and
`reply 21\.63|noise|float` fail for that reason. The four skill draws that
produced a review reject the change; the control rejects in all five, its r5
(`changes requested`) being a stance the measurement-time table did not read.
SPEC-0062 re-reads that r5 as `REJECT`, so the control moves to 5/5 while the
skill arm stays 4/5. The class is `coverage.md`'s: a diff-reading case cannot
separate reviewers that read the same code. It is kept as a regression case — it
fails a reviewer that misses an obvious AC violation, or one that approves
because the suite is green.

## Case 3 — no spec in the repo

The case prunes `docs/specs` and `docs/prompts` before the base commit, so the
review has to ask for the intent instead of inventing acceptance criteria.

Measured 2026-11-11 (SPEC-0078) at `skillHash 9a28572…`, detector
`cf2e2e319d975a5b`, `agentworks/deepseek-v4-1-flash`:

| arm | run directory | clean draws | passed | class |
| --- | --- | --- | --- | --- |
| with skill | `2026-11-11T14-32-10--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | separator |
| without skill | `2026-11-11T14-37-56--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | separator |

**Class: separator.** The skill withholds and asks for the intent in r1–r5
("Basis needed — one of: the spec id and file … or your explicit declaration").
The control reviews the diff anyway, invents a rounding policy as an acceptance
criterion, and issues a stance in all five draws ("request changes", "Approve
with one small fix", "Bottom line: …"). Both red assertions fail in every control
draw: the `reply` refusal vocabulary and the `noreply` verdict line. This is not
the `5/5 vs 4/5` shape the spec warned about — the control reached `0/5` because
it answered the question the case says must not be answered.

**History — pre-detector, not measurement.** The 2026-11-03 cells are the cells
SPEC-0056 left in place, kept here marked as history; they cannot underwrite a
clean rate.

| arm | run directory | clean draws | measured | replayed | class |
| --- | --- | --- | --- | --- | --- |
| with skill (history) | `2026-11-03T10-06-33--review-code` | 5 draws, not checkable (pre-detector, `warnings=5`) | 5/5 | — | separator (derived — no class published) |
| without skill (history) | `2026-11-03T09-56-47--review-code--without-skill` | 5 draws, not checkable (pre-detector, `warnings=5`) | 1/5 | — | separator (derived — no class published) |

The historical control returned a verdict in 4/5; the single pass ended under a
`### Verdict` heading with `**Hold the merge**` — a stance the guard did not name
at the time, not a confident approval. A replay of the historical skill arm
(`node scripts/eval.mjs inspect ~/.local/share/opencode/evals/runs/2026-11-03T10-06-33--review-code --replay`)
re-judges all five draws `passed → failed`, so it contradicts rather than
confirms that row: the recorded scratch no longer exists and the load path
carries a `/private` prefix, so `skillGate`'s containment check cannot match and
the reply assertions are never reached. That irreproducibility is why the
pre-detector cell was never the claim; SPEC-0078 replaces it with the measured
cell above.

## Case 4 — spec moved after the stamp

The branch rewords AC-3 and changes nothing else: the spec hashes to `36c915b0…`
while the prompt still pins `feb763b1…`. The stale spec is the only defect.

Measured 2026-11-11 (SPEC-0078) at `skillHash 9a28572…`, detector
`cf2e2e319d975a5b`, `agentworks/deepseek-v4-1-flash`:

| arm | run directory | clean draws | passed | red assertion(s) | class |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-11T14-43-55--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | — | non-discriminator |
| without skill | `2026-11-11T14-46-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 2/5 | `verdict REJECT` (r3, r4, r5) | non-discriminator |

**Class: non-discriminator.** Both arms reject the change; they agree on the
judgement. The control's r3–r5 write `Verdict: not ready — the spec is not
implemented at all`, `Verdict: not implemented` and `Verdict: not implemented`;
the closed stance table does not read a negated form, so the reader records
`got NOT` and only `verdict REJECT` fails. r5 ends "Reject / return for
implementation". The vocabulary gap is follow-up `TASK-109` (the closed stance
table has no entry for "not ready"/"not implemented"). The two hash assertions
(`reply feb763b1`, `reply 36c915b0`)
pass in all five control draws. Under SPEC-0078's definitions a cell whose arms
agree on the judgement is a non-discriminator, not a separator; the matrix's
older phrase for this shape was "token/contract separator".

**History — pre-detector, not measurement.** The 2026-11-05 cells are kept
marked as history.

| arm | run directory | clean draws | measured | replayed | class |
| --- | --- | --- | --- | --- | --- |
| with skill (history) | `2026-11-05T07-34-32--review-code` | 5 draws, not checkable (pre-detector, `warnings=5`) | 5/5 | — | token/contract separator (derived — no class published) |
| without skill (history) | `2026-11-05T07-47-21--review-code--without-skill` | 5 draws, not checkable (pre-detector, `warnings=5`) | 3/5 | — | token/contract separator (derived — no class published) |

In the historical cell the two control misses were `reply feb763b1` and
`reply 36c915b0`; the revised fixture measures the same agreement on the
judgement, now with the stance token as the only red.

## Case 5 — trigger: a branch is handed over for review

A prompt that never names the skill ("Review this branch before I merge it").
The case measures reachability — `skill review-code` — with `gate: off`.

Measured 2026-11-11 (SPEC-0078), with-skill arm only, `skillHash 9a28572…`,
detector `cf2e2e319d975a5b`:

| arm | run directory | clean draws | passed | loaded | class |
| --- | --- | --- | --- | --- | --- |
| with skill, trigger | `2026-11-11T14-49-32--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 | trigger |

No control is drawn: a control stages no skill, so `skill review-code` fails by
construction, and ten draws for that tautology would buy no information. With one
arm there is no separation to claim, so the class is **trigger**: the measured
fact is the route, not the judgement. Before this wave the case had no run
directory and no published number, which is why it carried no class.

## Case 6 — near-miss: a failure being debugged

Same vocabulary (branch, build, failure) without a change to approve. The case
asserts `notskill review-code` with `gate: off`.

Measured 2026-11-11 (SPEC-0078), with-skill arm only, `skillHash 9a28572…`,
detector `cf2e2e319d975a5b`:

| arm | run directory | clean draws | passed | loaded | class |
| --- | --- | --- | --- | --- | --- |
| with skill, near-miss | `2026-11-11T14-54-36--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 0/5 | trigger |

`notskill review-code` passes 5/5: no draw pulled the skill in for a diagnosis.
The control is skipped for the same reason as case 5 (it passes by construction),
so the case carries the **trigger** class and the measured routing fact.

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
- **Cases 3 and 4 had no published class until SPEC-0078.** `coverage.md`
  published classes for cases 1, 2 and 7–10 only, so this file applied the
  definitions to the published cells and marked them `(derived — no class
  published)`. SPEC-0078 re-measured both at `9a28572…` and publishes #3 as a
  **separator** and #4 as a **non-discriminator**; the derived markers survive
  only on the pre-detector history rows.
- **Cases 5 and 6 had no published measurement until SPEC-0078.** They are
  trigger cases with `gate: off`; their rows said `no arm cell` rather than
  inventing a rate. SPEC-0078 measured both with the skill arm only (`5/5` each)
  and publishes **trigger**, because a case with one arm has no separation
  to claim.

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

SPEC-0078 (2026-11-11) replaced the pre-detector case-3 and case-4 cells with
draws at `skillHash 9a28572…` and measured the two trigger cases for the first
time; the old rows remain above under **History**, marked, and are not deleted.

## Reproduce

```sh
node scripts/eval.mjs list --root skills
node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/<run-dir>
node scripts/eval.mjs inspect <run-dir> --replay
node scripts/check-evidence.mjs
```
