# `write-implementation-prompt` matrix — 2026-11-06

Measured on `opencode-go/deepseek-v4.1-flash`, the config default, with
deterministic assertions only and no judge. The behavioural and trigger cells
were re-taken at `dcf5177` after the description/boundary change; their
`skillHash` is `046369c29a8383db…`. The controls are the earlier runs and were
**not** re-run: they stage no skill, so the description edit cannot move their
`fixtureHash` or `promptHash`; their `detectorVersion` is still v1 and their
clean status is governed by the v2 replay below. The new with-skill cells (#1,
#2, #4), the trigger cells (#5, #6) and the #6-only run carry detector v2
(`71bfb85a91cd68ab`). `stageSkill` excludes `references/evals.md` from
`skillHash`; `promptHash` covers only the prompt text, so the fixture and prompt
hashes repeat the 0.5.0 values. #3 is `status: manual` and produced 0 draws, as
the corpus intends.

The skill is six cases: `#1`–`#4` are behavioural, `#5`/`#6` are routing
triggers. Everything below runs under `node scripts/run-evals.mjs --root skills
--skill write-implementation-prompt`.

## What the arms mean

- **with skill** — the skill under review is copied into
  `<scratch>/.opencode/skills/write-implementation-prompt/` and shadows any
  global install; the gate requires that copy to be the one that loaded.
- **without skill** — `--no-skill`: nothing is staged and the `skill` tool is
  denied. This measures "not auto-loaded", not "the text is unreachable"; the
  child can still read the real install under `/Users/wendell/.agents/skills`,
  and the detector marks those draws contaminated.

A deterministic cell reads `passed/reps`: every assertion passed and the skill
gate held. A draw that lost its skill gate is not a pass and does not count as
one. No judge ran, so there is no judge column.

## What "clean" means — detector v2 correction

The 0.5.0 measurements in this matrix were written by detector v1
(`a31d58f79a6c7038`). V1 saw **no read of an installed skill or a
`references/evals.md` answer key** outside the scratch, so `findings=0` meant
that and nothing more: a draw could read the host checkout and still score
`findings=0`. V2 (`71bfb85a91cd68ab`) adds the `host` finding, including the
checkout root. The 0.5.0 numbers below are unchanged and remain history; where
the replay changes a cell, the correction is beside it and the clean five-draw
measurement is **pending SPEC-0031**. The clean SPEC-0030 cells are v2 and print
`isolated=yes`; the dirty trigger runs are named with their findings.

`node scripts/replay-evals.mjs --leaks <run-dir>` re-judged the stored
transcripts with no model. Two control dirs are `dirty(host)`:

- `2026-11-06T15-30-39--write-implementation-prompt--without-skill` (#2): `r1`
  globbed `/Users/wendell/.agents` and was denied by `external_directory`. The
  v1 "0/5 clean" is **0/4 replay-clean**; all four clean draws still failed
  `nodir docs/prompts`. The direction is unchanged, but the clean five-draw
  control does not exist.
- `2026-11-06T14-37-23--write-implementation-prompt--without-skill` (#4): `r5`
  grepped `/Users/wendell/.agents` and was denied. The v1 "5/5 clean" is **4/5
  draws clean (4/4 passed)**; the non-discriminator reading holds on the clean
  subset, but it is not a five-draw clean cell.

`check-eval-run` cannot see this in the old artifacts: they carry v1 and print
`isolated=unknown`, not `yes`. The replay is the citation.

## Load canary

```sh
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 1 --repeat 12 --stop 12/0 --run
```

`2026-11-06T13-51-35--write-implementation-prompt`: **12/12 passed, 12/12
skill-gate holds** (`findings=0 warnings=0`; v1). The v2 replay is `clean`, so
this remains replay-verified history; it is a precondition, not a case rate.

The earlier eight-draw invocation `2026-11-06T13-46-05--write-implementation-prompt`
(which stopped at 8/8 under the default `5/3` rule) is **discarded, not clean**:
`transcript.r8.md` reads this spec's own worktree under
`.lane/trees/SPEC-0025-.../docs/` and `docs/prompts/`. V1 did not cover that, so
the old checker reported `findings=0`; the v2 replay marks the cell
`dirty(host)`. It is not a 12-draw canary and it is not evidence for anything
below.

## Gate A — default model, five repetitions, no judge

```sh
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 1 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 2 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 4 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --tag trigger --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 6 --repeat 5 --run
```

`--case 3` is intentionally absent: the case is `status: manual`, so the same
command produced 0 runnable draws. The trigger command runs #5 and #6; the
separate #6-only invocation produced the clean cell.

Control arm, the same four cases and no triggers, was **not re-run** here. The
0.5.0 attempts at `fff5b96` are the record — a budget cap, not a spec rule; #1
never produced a clean five-draw run and stayed `unresolved`:

```sh
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 1 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 2 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 3 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 4 --repeat 5 --run --no-skill
```

### Measurement-surface hashes

| case | fixture (unchanged) | prompt (unchanged) | skill (`dcf5177`) | detector (new cells) |
| --- | --- | --- | --- | --- |
| #1 | `5157bf5f487ddb68…` | `4ac94dfc39d7b122…` | `046369c29a8383db…` | `71bfb85a91cd68ab` |
| #2 | `2895c3f51c6e8688…` | `01fe5d11c4b8ebe7…` | `046369c29a8383db…` | `71bfb85a91cd68ab` |
| #3 | `86e79e58590365f7…` | `3bfe07b6f3426982…` | `046369c29a8383db…` | (manual; no run) |
| #4 | `633c5197bda8fa0e…` | `a1b3be1ac79040d2…` | `046369c29a8383db…` | `71bfb85a91cd68ab` |
| #5 | `e3b0c44298fc1c14…` (empty) | `1444109c228bf526…` | `046369c29a8383db…` | `71bfb85a91cd68ab` |
| #6 | `e3b0c44298fc1c14…` (empty) | `027a1b7b44ed9905…` | `046369c29a8383db…` | `71bfb85a91cd68ab` |

`046369c29a8383db…` is the hash of the staged skill after the SPEC-0030
description and boundary edit. The old `ab314e2ceb8f793f…` cells are history.
The control draws carry the 0.5.0 `fixtureHash`/`promptHash` and v1 detector;
they have no `skillHash` because no skill is staged. The hashes do not cover the
assertion set — `skillHash` excludes `references/evals.md` — so the evidence
for an unchanged case is the skills diff cited at the top, not the table alone.

### Behavioural run directories

| case | arm | run directory | repo | checker |
| --- | --- | --- | --- | --- |
| #1 | with skill | `2026-11-06T19-25-26--write-implementation-prompt` | `dcf5177` | `findings=0 warnings=0 isolated=yes` |
| #2 | with skill | `2026-11-06T19-28-47--write-implementation-prompt` | `dcf5177` | `findings=0 warnings=0 isolated=yes` |
| #3 | manual | — | — | 0 draws; `14-01-54` is history |
| #4 | with skill | `2026-11-06T19-30-26--write-implementation-prompt` | `dcf5177` | `findings=0 warnings=0 isolated=yes` |
| #1 | control | the four attempts in the history below | `fff5b96` | no five-draw clean run — **unresolved** |
| #2 | control | `2026-11-06T15-30-39--write-implementation-prompt--without-skill` | `fff5b96` | v1 `findings=0`; v2 replay `dirty(host)` (`r1`, 0/4 clean) — **pending SPEC-0031** |
| #3 | control | `2026-11-06T14-32-58--write-implementation-prompt--without-skill` | `8e26cf6` | `findings=1`; 0/4 clean |
| #4 | control | `2026-11-06T14-37-23--write-implementation-prompt--without-skill` | `8e26cf6` | v1 `findings=0`; v2 replay `dirty(host)` (`r5`, 4/5 draws clean, 4/4 passed) — **pending SPEC-0031** |

The three with-skill cells that ran are clean five-draw runs at the new
`skillHash`. #3 is `status: manual`: the five-draw run at `8e26cf6`
(`14-01-54`) is the record of the 4/5 split that sent it back to `manual`; it is
not a re-measurement and no new draws exist. The old with-skill dirs
(`13-56-14` #1, `13-59-48` #2, `14-04-25` #4) remain history at
`ab314e2ceb8f793f…`.

The controls were not re-run. #1 never produced a clean five-draw run: clean
subsets are `0/3` (`15-15-52`), `0/4` (`15-18-26`), `0/3` (`15-20-43`) and the
older `0/4` (`14-28-07`), and every clean draw failed `spec_sha:`; it is
**unresolved**, not a control. #2 is **0/4 replay-clean** under v2 (`r1` is
`dirty(host)`) and #4 is **4/5 draws clean (4/4 passed)** (`r5` is
`dirty(host)`); both are **pending SPEC-0031**, so neither is a five-draw clean
cell in this matrix. #3's control is a leak-verified 0/4 clean, and the case
itself is manual. That is why "the controls stay citable" from the spec is
superseded: the description edit does not move them, but detector v2 already
removed the two clean five-draw controls.

### Trigger runs

The trigger fixture is an **empty scratch** (`fixtureHash e3b0c442…`, the SHA-256
of empty input); it contains no `SPEC-0012`, the document both prompts name.
That is a construction defect of the trigger cases, not an isolation result.

| run directory | repo | #5 | #6 | checker |
| --- | --- | --- | --- | --- |
| `2026-11-06T19-32-45--write-implementation-prompt` | `dcf5177` | 1/1 clean scored loaded (`r2`); `r1`/`r4` stalled, `r3`/`r5` contaminated; **5/5 loaded** | **5/5** | `findings=6`, `isolated=no` |
| `2026-11-06T19-53-34--write-implementation-prompt` | `dcf5177` | 2/2 clean scored loaded (`r1`,`r2`); `r3`/`r5` stalled, `r4` stale copy; **5/5 loaded** | **4/5**; `r3` loaded | `findings=3`, `isolated=no` |
| `2026-11-06T20-12-15--write-implementation-prompt` | `dcf5177` | — (case 6 only) | **5/5** | `findings=0 warnings=0 isolated=yes` |

The 0.5.0 trigger rows below are history at the old `skillHash`:

| run directory | repo | #5 | #6 | checker |
| --- | --- | --- | --- | --- |
| `2026-11-06T14-07-04--write-implementation-prompt` | `8e26cf6` | 4/5, `r5` stalled | 3/5; `r1`,`r2` loaded | `findings=1` |
| `2026-11-06T14-43-01--write-implementation-prompt` | `8e26cf6` | 2/5; `r1`,`r4` stalled, `r3` contaminated | 5/5 | `findings=3` |
| `2026-11-06T15-33-16--write-implementation-prompt` | `fff5b96` | 3/3 clean scored loaded; `r1` contaminated+stalled, `r4` contaminated | 5/5 | `findings=2` |
| `2026-11-06T15-49-43--write-implementation-prompt` | `fff5b96` | 3/3 clean scored loaded; `r1` stalled, `r3` contaminated | 3/5; `r1`,`r2` loaded | `findings=2` |
| `2026-11-06T16-02-56--write-implementation-prompt` | `fff5b96` | 3/3 clean scored loaded; `r1`,`r2` contaminated | 4/5; `r2` loaded | `findings=2` |

`2026-11-06T20-12-15--write-implementation-prompt` is the clean #6 cell: five
draws, no skill load, `findings=0 warnings=0 isolated=yes`. The two trigger runs
that also carried #5 are dirty because of #5, not #6: in `19-32-45` #6 was 5/5
and in `19-53-34` it was 4/5 (`r3` loaded). The near-miss is no longer
deterministic in five draws; the split (5/5, 5/5, 4/5) is recorded rather than
rounded.

No trigger run reached a stall-free five-draw #5 cell. In `19-32-45` all five
draws loaded the skill, but `r1` and `r4` lost the event stream (`r1` last event
at 161.6 s, `r4` at 27.2 s, then 120 s of silence before the watchdog; both
retried once), and `r3`/`r5` read the installed skill or host corpus. In
`19-53-34` all five loaded again; `r3` stalled after its last event at 355.0 s
and `r5` at 145.0 s (both retried once), and `r4` read a stale copy under
`/private/var/folders/.../opencode/agent-skills-pr`. `r2` in `19-32-45` also
took two attempts (a first-attempt stall, then a pass). The stall is provider
silence after the skill had already loaded, not a routing failure; the
contamination is the runner letting the child roam to the host. Neither is
fixed here.

Under v2, `14-07-04` `r1` (#5 and #6) and `15-33-16` `r1` (#6) are also
`dirty(host)` (checkout-root reads, denied). The v1 columns are unchanged; those
cells lose one clean draw, and their five-clean-draw readings remain pending
SPEC-0031.

### Scores

| case | with skill | with, gate | control | control, gate | classification |
| --- | --- | --- | --- | --- | --- |
| #1 create the demo prompt | **5/5** (new) | 5/5 | no clean run; largest clean subset 0/4 | 4/4 no skill loaded | **unresolved** |
| #2 draft spec | **5/5** (new) | 5/5 | **0/4 replay-clean** (v1 0/5; `r1` host) | 5/5 no skill loaded | **separator**, pending SPEC-0031 |
| #3 open questions | 4/5 (history) | 5/5 (history) | 0/4 clean (1 contaminated) | 4/4 no skill loaded | **manual** (reverted; not re-run) |
| #4 overlapping prompt | **5/5** (new) | 5/5 | **4/4 replay-clean** (v1 5/5; `r5` host, 4/5 draws) | 5/5 no skill loaded | **non-discriminator**, pending SPEC-0031 |

The red cells, by assertion or gate reason:

- **#1 control** — `filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:`
  failed in every clean draw of all three attempts (and in the older
  `14-28-07` attempt); some draws also failed
  `filematch ... ## Verification`. The control writes a prompt but does not pin
  the spec. Every attempt also lost one or two draws to a read of the real
  install (`15-15-52` `r1`,`r3`; `15-18-26` `r3`; `15-20-43` `r2`,`r5`). The
  contaminated draws are excluded, and no attempt has five clean draws.
- **#2 control** — `15-30-39` failed `nodir docs/prompts` in all five v1 draws:
  the control generated a prompt from a `draft` spec. Under v2 `r1` is
  `dirty(host)` (glob of the checkout root, denied), so the reading is **0/4
  replay-clean**. The two rejected attempts (`15-25-06`, `15-27-30`) failed the
  same assertion in their three clean draws each; three of the four contaminated
  draws read the real install and one (`15-27-30 r3`) a stale copy under
  `/private/tmp/as-remote/...`.
- **#3 with skill** — not re-run: the case is `status: manual`. The history is
  `nodir docs/prompts` failed in `r3` of `14-01-54`: the draw treated both open
  questions as non-blocking, turned them into non-goals, and wrote
  `docs/prompts/SPEC-0009-audit-log.prompt.md`. The other four stopped.
- **#3 control** — `nodir docs/prompts` failed in all four clean draws; the
  fifth read the real install and is excluded.
- **#4** — no red: both arms passed both assertions in five draws under v1. The
  control produced the prompt and the `spec_sha` without the skill; under v2 its
  `r5` is `dirty(host)` (grep of the checkout root, denied), leaving **4/5 draws
  clean (4/4 passed)**, so the clean five-draw cell is pending SPEC-0031.
- **#5** — no assertion red in any clean scored draw: all five draws loaded the
  skill in both new trigger runs. Stalls: `14-07-04 r5`, `14-43-01 r1`/`r4`,
  `15-33-16 r1` (also contaminated), `15-49-43 r1`; new at `dcf5177`:
  `19-32-45 r1` (last event 161.6 s, then 120 s silence, retried once) and `r4`
  (27.2 s, retried once), `19-53-34 r3` (355.0 s, retried once) and `r5`
  (145.0 s, retried once). `19-32-45 r2` also needed a retry (first attempt
  stalled) and then passed. Contamination: `14-43-01 r3` (stale copy under
  `/private/var/folders/.../T/opencode`), `15-33-16 r4`, `15-49-43 r3`,
  `16-02-56 r1`/`r2` (real install); new: `19-32-45 r3`/`r5` (installed skill and
  host corpus), `19-53-34 r4` (stale copy under
  `/private/var/folders/.../opencode/agent-skills-pr`). No stall-free five-draw
  #5 cell exists.
- **#6** — the SPEC-0030 edit changed the failure mode. Before it, the `skill`
  call was the first action in the failing draws (`14-07-04 r1` says "I'll load
  the skill first, then find the spec"; `r2` "this looks like a spec-related
  request"; `15-49-43 r2` "I'll load the skill that handles spec-to-prompt
  work"). After it, the clean cell `20-12-15` is **5/5 with no skill load**
  (`findings=0 warnings=0 isolated=yes`), and `19-32-45` is also 5/5. It is not
  deterministic: `19-53-34 r3` still says "I'll start by loading the skill that
  governs this kind of request" and calls `skill` before reading the boundary,
  so that run is 4/5. The split (5/5, 5/5, 4/5 of five) is recorded; the case and
  its `notskill` assertion are unchanged.

## Case #3

The fixture and the contract support the case: `SPEC-0009` is `ready` with two
open questions, and `SKILL.md` step 5 says to stop and list them if they block
implementation. The case was given
`prompt: Create the implementation prompt for SPEC-0009.` and ran five times at
`8e26cf6`: four draws stopped and passed; `r3` judged the questions non-blocking
and wrote the prompt, failing `nodir docs/prompts`. A 4/5 split is not a
deterministic verdict, so the case went back to `status: manual` with a `why:`
line naming `2026-11-06T14-01-54--write-implementation-prompt` and that
assertion. The control reading (`0/4` clean) shows the case would separate if it
were stable; it is not, and five draws cannot promote it.

## Classification

- **#1 — unresolved.** With the skill it is **5/5 clean at `dcf5177`**
  (`19-25-26`), but four control attempts still have no five-draw clean run:
  `15-15-52` 0/3 clean, `15-18-26` 0/4 clean, `15-20-43` 0/3 clean, and the
  older `14-28-07` 0/4 clean. Every clean draw failed `spec_sha:`, but the AC-2
  rule forbids promoting a separator from a rejected run, and draws from
  different runs are not summed into a five-draw cell. Re-measure after the
  control arm can no longer read the install.
- **#2 — separator, pending SPEC-0031 under detector v2.** 5/5 with the skill
  (re-measured 5/5 at `dcf5177`, `19-28-47`) against **0/5** clean without it in
  `15-30-39` under v1. The v2 replay marks
  `r1` `dirty(host)` (glob of the checkout root, denied), so the reading is
  **0/4 replay-clean**: the direction is unchanged, but the five-draw clean
  control does not exist and must be re-measured. The two earlier attempts are
  history, not part of the denominator.
- **#3 — manual (reverted).** The five draws split 4/5, so the case carries a
  `why:` instead of a classification. The run pair is cited as the record of
  that split, not as a separator.
- **#4 — non-discriminator, pending SPEC-0031 under detector v2.** 5/5 with the
  skill at `dcf5177` (`19-30-26`) and 5/5 in both arms under v1. The control's
  `r5` is `dirty(host)` (grep of the checkout root, denied), so the v2 reading
  is **4/5 draws clean (4/4 passed)**: the
  non-discriminator reading holds on the clean subset, but the five-draw clean
  cell is pending. A bare agent mirrors the existing prompt and records
  `spec_sha` as often as the skill does. Keep as a regression case.
- **#5 — trigger, not a rate; no five-draw clean cell.** `#5` loaded in **5/5
  draws** in both new runs (`19-32-45`, `19-53-34`), but the saved outcome
  stalled in four of those ten draws, a fifth stall recovered on retry
  (`19-32-45 r2`), and contamination took three more. The best clean-scored
  subsets are 1/1 and 2/2. The stall is provider silence after
  the skill loaded, not a routing failure; it is named with its event gap above
  and with the retry count. It is not fixed here.
- **#6 — near-miss improved, not deterministic.** The clean cell
  `20-12-15` is **5/5 with no skill load** and `findings=0 warnings=0
  isolated=yes`; `19-32-45` is also 5/5. `19-53-34` is **4/5** because `r3`
  still loads the skill before reading the boundary. The pre-fix draws loaded it
  as their first action; after the edit the clean draws search first and cite
  the boundary when they do read the staged `SKILL.md`. The case and its
  `notskill` assertion are unchanged.

## Integrity

The control arm can still read the real install; the runner detects it and marks
the draw contaminated. The checker findings, by run:

```sh
node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/<dir>
# 2026-11-06T19-25-26--write-implementation-prompt
#   cases=1 reps=5 findings=0 warnings=0 isolated=yes (#1)
# 2026-11-06T19-28-47--write-implementation-prompt
#   cases=1 reps=5 findings=0 warnings=0 isolated=yes (#2)
# 2026-11-06T19-30-26--write-implementation-prompt
#   cases=1 reps=5 findings=0 warnings=0 isolated=yes (#4)
# 2026-11-06T19-32-45--write-implementation-prompt
#   findings=6 isolated=no — #5 r1,r4 stalled; #5 r3,r5 leak+host; #6 5/5 clean
# 2026-11-06T19-53-34--write-implementation-prompt
#   findings=3 isolated=no — #5 r3,r5 stalled; #5 r4 stale copy; #6 r3 loaded
# 2026-11-06T20-12-15--write-implementation-prompt
#   cases=1 reps=5 findings=0 warnings=0 isolated=yes (#6)
# 2026-11-06T13-46-05--write-implementation-prompt   (discarded canary)
#   8 draws, findings=0 warnings=0, but r8 read .lane/trees/SPEC-0025-.../docs/
# 2026-11-06T14-07-04--write-implementation-prompt
#   infrastructure write-implementation-prompt#5 r5 — stalled (retried 1x)
# 2026-11-06T14-43-01--write-implementation-prompt
#   infrastructure #5 r1, r4 — stalled
#   leak #5 r3 — stale copy under .../T/opencode/agent-skills-pr
# 2026-11-06T15-15-52--write-implementation-prompt--without-skill
#   leak #1 r1, r3 — /Users/wendell/.agents/skills/... SKILL.md, evals.md, spec-sha.mjs
# 2026-11-06T15-18-26--write-implementation-prompt--without-skill
#   leak #1 r3 — /Users/wendell/.agents/skills/... SKILL.md, evals.md
# 2026-11-06T15-20-43--write-implementation-prompt--without-skill
#   leak #1 r2, r5 — /Users/wendell/.agents/skills/... and ~/.claude/skills
# 2026-11-06T15-25-06--write-implementation-prompt--without-skill
#   leak #2 r3, r4 — /Users/wendell/.agents/skills/...
# 2026-11-06T15-27-30--write-implementation-prompt--without-skill
#   leak #2 r3, r4 — /private/tmp/as-remote/... and /Users/wendell/.agents/skills/...
# 2026-11-06T14-37-23--write-implementation-prompt--without-skill
#   findings=0 warnings=0 (v1; v2 replay: dirty(host), r5)
# 2026-11-06T15-30-39--write-implementation-prompt--without-skill
#   findings=0 warnings=0 (v1; v2 replay: dirty(host), r1)
# 2026-11-06T15-33-16--write-implementation-prompt
#   infrastructure #5 r1 — stalled; leak #5 r4 — stale copy
# 2026-11-06T15-49-43--write-implementation-prompt
#   infrastructure #5 r1 — stalled; leak #5 r3 — real install
# 2026-11-06T16-02-56--write-implementation-prompt
#   leak #5 r1, r2 — real install
```

In the control draws the read is a hand-off to the installed skill: the agent
searches `/Users/wendell/.agents/skills`, finds `write-implementation-prompt`,
and follows it. In the trigger draws the same read is the model consulting the
installed copy while the staged copy is what the gate sees. Both are excluded.

The trigger stalls are provider stalls: the event stream went silent past the
120 s watchdog and the runner recorded `stalled`, not a case failure.

## Not comparable

The run directories for this skill from 2026-11-02 predate this case set and the
leak detector; they are not evidence for this table. The new with-skill and
trigger cells are `dcf5177` at `skillHash 046369c29a8383db…`; the 0.5.0
with-skill cells are `8e26cf6` at `ab314e2ceb8f793f…` and the controls are
`fff5b96`/`8e26cf6`. The hash table proves which fixture and prompt each run
used. The `#1` control has no five-draw clean run and stays `unresolved`. The
`#2`, `#3` and `#4` control cells are one run each (`15-30-39`, `14-32-58`,
`14-37-23`). Under v2 the first and third are `dirty(host)` (`15-30-39 r1`,
`14-37-23 r5`), so their readings are **0/4** and **4/4** replay-verified and
the five-draw clean cells are pending SPEC-0031; the middle is a leak, read from
its clean draws with the leak named. The #5 trigger has no stall-free five-draw
cell in any wave; it is a trigger direction, not a rate.
