# `write-implementation-prompt` matrix — 2026-11-06

Measured on `opencode-go/deepseek-v4.1-flash`, the config default, with
deterministic assertions only and no judge. The with-skill cells were taken at
`8e26cf6`; the control and trigger re-runs were taken at `fff5b96`, which changed
only the spec document (`docs/specs/active/SPEC-0025-...md`) and no skill, fixture
or runner file. The hashes below prove the two commits are the same measurement
surface: every re-run repeats the `8e26cf6` `fixtureHash`, `promptHash`,
`detectorVersion` and — for the trigger arm — `skillHash`.

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

## What "clean" means — TASK-43 caveat

`findings=0 warnings=0` means the detector saw **no read of an installed skill or
of a `references/evals.md` answer key** outside the scratch. It does **not** mean
the draw was isolated. `scripts/lib/evals/leak.mjs` classifies only skill roots
and `references/evals.md$`; a draw can read the host's `docs/` corpus or the
global `AGENTS.md` and still score `findings=0`. That gap is real and open
(TASK-43), and it applies to **every** control cell here, including the new ones.
The canary's discarded eight-draw run below is one concrete instance.

## Load canary

```sh
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 1 --repeat 12 --stop 12/0 --run
```

`2026-11-06T13-51-35--write-implementation-prompt`: **12/12 passed, 12/12
skill-gate holds** (`findings=0 warnings=0`). The canary is a precondition, not a
case rate.

The earlier eight-draw invocation `2026-11-06T13-46-05--write-implementation-prompt`
(which stopped at 8/8 under the default `5/3` rule) is **discarded, not clean**:
`transcript.r8.md` reads this spec's own worktree under
`.lane/trees/SPEC-0025-.../docs/` and `docs/prompts/`, which the detector does
not cover, so the checker still reports `findings=0`. It is not a 12-draw canary
and it is not evidence for anything below.

## Gate A — default model, five repetitions, no judge

```sh
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 1 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 2 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 3 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 4 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --tag trigger --repeat 5 --run
```

Control arm, the same four cases and no triggers, re-run at `fff5b96` until a
clean run appeared or three attempts were spent:

```sh
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 1 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 2 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 3 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 4 --repeat 5 --run --no-skill
```

### Measurement-surface hashes

| case | fixture (`8e26cf6` = `fff5b96`) | prompt (`8e26cf6` = `fff5b96`) | skill (`8e26cf6` = `fff5b96`) | detector |
| --- | --- | --- | --- | --- |
| #1 | `5157bf5f487ddb68…` | `4ac94dfc39d7b122…` | `ab314e2ceb8f793f…` | `a31d58f79a6c7038` |
| #2 | `2895c3f51c6e8688…` | `01fe5d11c4b8ebe7…` | `ab314e2ceb8f793f…` | `a31d58f79a6c7038` |
| #3 | `86e79e58590365f7…` | `3bfe07b6f3426982…` | `ab314e2ceb8f793f…` | `a31d58f79a6c7038` |
| #4 | `633c5197bda8fa0e…` | `a1b3be1ac79040d2…` | `ab314e2ceb8f793f…` | `a31d58f79a6c7038` |
| #5 | `e3b0c44298fc1c14…` (empty) | `1444109c228bf526…` | `ab314e2ceb8f793f…` | `a31d58f79a6c7038` |
| #6 | `e3b0c44298fc1c14…` (empty) | `027a1b7b44ed9905…` | `ab314e2ceb8f793f…` | `a31d58f79a6c7038` |

The control draws carry the same `fixtureHash`, `promptHash` and
`detectorVersion`; they have no `skillHash` because no skill is staged. The
trigger draws carry the same `skillHash`. The only difference between the two
commits is `repoSha`.

### Behavioural run directories

| case | arm | run directory | repo | checker |
| --- | --- | --- | --- | --- |
| #1 | with skill | `2026-11-06T13-56-14--write-implementation-prompt` | `8e26cf6` | `findings=0 warnings=0` |
| #2 | with skill | `2026-11-06T13-59-48--write-implementation-prompt` | `8e26cf6` | `findings=0 warnings=0` |
| #3 | with skill | `2026-11-06T14-01-54--write-implementation-prompt` | `8e26cf6` | `findings=0 warnings=0` |
| #4 | with skill | `2026-11-06T14-04-25--write-implementation-prompt` | `8e26cf6` | `findings=0 warnings=0` |
| #1 | control (1) | `2026-11-06T15-15-52--write-implementation-prompt--without-skill` | `fff5b96` | `findings=2` |
| #1 | control (2) | `2026-11-06T15-18-26--write-implementation-prompt--without-skill` | `fff5b96` | `findings=1` |
| #1 | control (3) | `2026-11-06T15-20-43--write-implementation-prompt--without-skill` | `fff5b96` | `findings=2` |
| #2 | control (1) | `2026-11-06T15-25-06--write-implementation-prompt--without-skill` | `fff5b96` | `findings=2` |
| #2 | control (2) | `2026-11-06T15-27-30--write-implementation-prompt--without-skill` | `fff5b96` | `findings=2` |
| #2 | control (3) | `2026-11-06T15-30-39--write-implementation-prompt--without-skill` | `fff5b96` | `findings=0 warnings=0` |
| #3 | control | `2026-11-06T14-32-58--write-implementation-prompt--without-skill` | `8e26cf6` | `findings=1` |
| #4 | control | `2026-11-06T14-37-23--write-implementation-prompt--without-skill` | `8e26cf6` | `findings=0 warnings=0` |

The older #1 control run `2026-11-06T14-28-07` appears only in the #1
unresolved history; the older #2 runs (`14-30-42`, `14-40-36`) are superseded by
the clean `15-30-39` and are not used.

The three #1 attempts never produced a clean five-draw run. Their clean counts
are `0/3` (`15-15-52`), `0/4` (`15-18-26`) and `0/3` (`15-20-43`); every clean
draw failed. The three #2 attempts are `0/3`, `0/3` and **`0/5`**; the third is
the clean cell.

### Trigger runs

The trigger fixture is an **empty scratch** (`fixtureHash e3b0c442…`, the SHA-256
of empty input); it contains no `SPEC-0012`, the document both prompts name.
That is a construction defect of the trigger cases, not an isolation result.

| run directory | repo | #5 | #6 | checker |
| --- | --- | --- | --- | --- |
| `2026-11-06T14-07-04--write-implementation-prompt` | `8e26cf6` | 4/5, `r5` stalled | 3/5; `r1`,`r2` loaded | `findings=1` |
| `2026-11-06T14-43-01--write-implementation-prompt` | `8e26cf6` | 2/5; `r1`,`r4` stalled, `r3` contaminated | 5/5 | `findings=3` |
| `2026-11-06T15-33-16--write-implementation-prompt` | `fff5b96` | 3/3 clean scored loaded; `r1` contaminated+stalled, `r4` contaminated | 5/5 | `findings=2` |
| `2026-11-06T15-49-43--write-implementation-prompt` | `fff5b96` | 3/3 clean scored loaded; `r1` stalled, `r3` contaminated | 3/5; `r1`,`r2` loaded | `findings=2` |
| `2026-11-06T16-02-56--write-implementation-prompt` | `fff5b96` | 3/3 clean scored loaded; `r1`,`r2` contaminated | 4/5; `r2` loaded | `findings=2` |

No trigger run reached five clean scored draws for #5: every attempt lost one or
two draws to contamination, and the first two also lost one to a stall. The
latest run `16-02-56` is the one to quote: **#5 3/3 clean scored draws loaded**
(two contaminated, no stall), **#6 4/5** (`r2` loaded). The stalls are
infrastructure, not a routing verdict; the contamination is a read of the real
skill or a stale copy.

### Scores

| case | with skill | with, gate | control | control, gate | classification |
| --- | --- | --- | --- | --- | --- |
| #1 create the demo prompt | 5/5 | 5/5 | no clean run; largest clean subset 0/4 | 4/4 no skill loaded | **unresolved** |
| #2 draft spec | 5/5 | 5/5 | **0/5 clean** | 5/5 no skill loaded | **separator** |
| #3 open questions | 4/5 | 5/5 | 0/4 clean (1 contaminated) | 4/4 no skill loaded | **manual** (reverted) |
| #4 overlapping prompt | 5/5 | 5/5 | **5/5 clean** | 5/5 no skill loaded | **non-discriminator** |

The red cells, by assertion or gate reason:

- **#1 control** — `filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:`
  failed in every clean draw of all three attempts (and in the older
  `14-28-07` attempt); some draws also failed
  `filematch ... ## Verification`. The control writes a prompt but does not pin
  the spec. Every attempt also lost one or two draws to a read of the real
  install (`15-15-52` `r1`,`r3`; `15-18-26` `r3`; `15-20-43` `r2`,`r5`). The
  contaminated draws are excluded, and no attempt has five clean draws.
- **#2 control** — the clean run `15-30-39` failed `nodir docs/prompts` in **5/5**:
  the control generated a prompt from a `draft` spec. The two rejected attempts
  (`15-25-06`, `15-27-30`) failed the same assertion in their three clean draws
  each; their two contaminated draws read the real install.
- **#3 with skill** — `nodir docs/prompts` failed in `r3`: the draw treated both
  open questions as non-blocking, turned them into non-goals, and wrote
  `docs/prompts/SPEC-0009-audit-log.prompt.md`. The other four stopped.
- **#3 control** — `nodir docs/prompts` failed in all four clean draws; the
  fifth read the real install and is excluded.
- **#4** — no red: both arms passed both assertions in five draws. The control
  produced the prompt and the `spec_sha` without the skill.
- **#5** — no assertion red in any clean scored draw. Stalls: `14-07-04 r5`,
  `14-43-01 r1`/`r4`, `15-33-16 r1` (also contaminated), `15-49-43 r1`.
  Contamination: `14-43-01 r3` (stale copy under
  `/private/var/folders/.../T/opencode`), `15-33-16 r4`, `15-49-43 r3`,
  `16-02-56 r1`/`r2` (real install).
- **#6** — `notskill write-implementation-prompt` failed wherever the skill
  loaded: `14-07-04 r1`,`r2`; `15-49-43 r1`,`r2`; `16-02-56 r2`. The first
  action in those draws **is** the `skill` call, before any filesystem search:
  `14-07-04 r1` says "I'll load the skill first, then find the spec" and calls
  `skill`; `r2` says "this looks like a spec-related request" and calls `skill`;
  `15-49-43 r2` says "I'll load the skill that handles spec-to-prompt work, then
  find the spec." The near-miss prompt itself routes to the skill; it is not a
  consequence of roaming.

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

- **#1 — unresolved.** Four control attempts, no five-draw clean run: `15-15-52`
  0/3 clean, `15-18-26` 0/4 clean, `15-20-43` 0/3 clean, and the older
  `14-28-07` 0/4 clean. Every clean draw failed `spec_sha:`, but the AC-2 rule
  forbids promoting a separator from a rejected run, and draws from different
  runs are not summed into a five-draw cell. Re-measure after the control arm
  can no longer read the install.
- **#2 — separator.** 5/5 with the skill against **0/5** clean without it in
  `15-30-39`. The clean run is a single directory with `findings=0 warnings=0`;
  the two earlier attempts are history, not part of the denominator.
- **#3 — manual (reverted).** The five draws split 4/5, so the case carries a
  `why:` instead of a classification. The run pair is cited as the record of
  that split, not as a separator.
- **#4 — non-discriminator.** 5/5 in both arms. A bare agent mirrors the
  existing prompt and records `spec_sha` as often as the skill does. Keep as a
  regression case.
- **#5 and #6 — triggers, not rates.** `#5` loaded in 3/3 clean scored draws in
  the latest run (`16-02-56`), with two contaminated draws; no trigger run has
  five scored draws. `#6` is not deterministic: 5/5 in `15-33-16`, 3/5 in
  `15-49-43` (`r1`,`r2` loaded), 4/5 in `16-02-56` (`r2` loaded), and 3/5 in
  `14-07-04`. The failing draws load the skill as their first action, so the
  near-miss prompt itself routes to the skill. Recorded here; no fix in this
  spec.

## Integrity

The control arm can still read the real install; the runner detects it and marks
the draw contaminated. The checker findings, by run:

```sh
node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/<dir>
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
# 2026-11-06T15-30-39--write-implementation-prompt--without-skill
#   findings=0 warnings=0
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
leak detector; they are not evidence for this table. The with-skill cells are
`8e26cf6` and the control/trigger re-runs are `fff5b96`; the hash table proves the
measurement surface is identical. The `#1` control has no five-draw clean run and
stays `unresolved`. The `#2`, `#3` and `#4` control cells are one run each
(`15-30-39`, `14-32-58`, `14-37-23`); the first is clean, the other two are read
from clean draws with the leak named.
