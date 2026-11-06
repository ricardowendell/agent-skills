# `write-implementation-prompt` matrix — 2026-11-06

Measured at commit `8e26cf6`, on `opencode-go/deepseek-v4.1-flash`, the config
default, with deterministic assertions only and no judge. Gate A is five
repetitions per cell. Case #3 was made runnable for this wave, measured over five
draws, and then put back to `status: manual` with a `why:` line: the five draws
split, so they did not produce a deterministic verdict (details in *Case #3*).

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

## Load canary

```sh
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 1 --repeat 12 --stop 12/0 --run
```

`2026-11-06T13-51-35--write-implementation-prompt`: **12/12 passed, 12/12
skill-gate holds** (`findings=0 warnings=0`). The canary is a precondition, not a
case rate. An earlier invocation of the same command without `--stop 12/0`
stopped at 8/8 under the default `5/3` stop rule
(`2026-11-06T13-46-05--write-implementation-prompt`, also
`findings=0 warnings=0`); it is complete evidence for eight draws, not a
`12/12` canary.

## Gate A — default model, five repetitions, no judge

One command per behavioural case, then the trigger tag. No `--judge`.

```sh
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 1 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 2 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 3 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 4 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --tag trigger --repeat 5 --run
```

Control arm, the same four cases and no triggers:

```sh
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 1 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 2 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 3 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill write-implementation-prompt --case 4 --repeat 5 --run --no-skill
```

### Run directories

| case | arm | run directory | fixture hash | checker |
| --- | --- | --- | --- | --- |
| canary #1 | with skill | `2026-11-06T13-51-35--write-implementation-prompt` | `5157bf5f` | `findings=0 warnings=0` |
| #1 | with skill | `2026-11-06T13-56-14--write-implementation-prompt` | `5157bf5f` | `findings=0 warnings=0` |
| #2 | with skill | `2026-11-06T13-59-48--write-implementation-prompt` | `2895c3f5` | `findings=0 warnings=0` |
| #3 | with skill | `2026-11-06T14-01-54--write-implementation-prompt` | `86e79e58` | `findings=0 warnings=0` |
| #4 | with skill | `2026-11-06T14-04-25--write-implementation-prompt` | `633c5197` | `findings=0 warnings=0` |
| #5/#6 | with skill | `2026-11-06T14-07-04--write-implementation-prompt` | none | `findings=1 warnings=0` |
| #5/#6 | with skill | `2026-11-06T14-43-01--write-implementation-prompt` | none | `findings=3 warnings=0` |
| #1 | control | `2026-11-06T14-28-07--write-implementation-prompt--without-skill` | `5157bf5f` | `findings=1 warnings=0` |
| #2 | control | `2026-11-06T14-30-42--write-implementation-prompt--without-skill` | `2895c3f5` | `findings=3 warnings=0` |
| #2 | control | `2026-11-06T14-40-36--write-implementation-prompt--without-skill` | `2895c3f5` | `findings=1 warnings=0` |
| #3 | control | `2026-11-06T14-32-58--write-implementation-prompt--without-skill` | `86e79e58` | `findings=1 warnings=0` |
| #4 | control | `2026-11-06T14-37-23--write-implementation-prompt--without-skill` | `633c5197` | `findings=0 warnings=0` |

All twelve directories record `repoSha 8e26cf6`, `detectorVersion a31d58f7`,
and `promptHash` per case. The with-skill runs record `skillHash ab314e2c`. The
control runs record no `skillHash` and `skillGate.loaded: []`.

The six runs with `findings` (four controls and both trigger runs) are cited
below as the **record of their findings**, not as clean five-draw cells: a
contaminated or stalled draw is excluded by the runner, so the denominator is
the clean draws, not `--repeat`. The trigger runs are not a paired arm; they are
routing evidence with the infrastructure stalls named.

### Scores

The control column states clean draws only. A draw is clean when the runner did
not exclude it; the contaminated draws are named in *Integrity*.

| case | with skill | with, gate | control | control, gate | classification |
| --- | --- | --- | --- | --- | --- |
| #1 create the demo prompt | 5/5 | 5/5 | 0/4 clean (1 contaminated) | 4/4 no skill loaded | separator |
| #2 draft spec | 5/5 | 5/5 | 1/6 clean over two runs (4 contaminated) | 6/6 no skill loaded | separator |
| #3 open questions | 4/5 | 5/5 | 0/4 clean (1 contaminated) | 4/4 no skill loaded | manual (reverted) |
| #4 overlapping prompt | 5/5 | 5/5 | 5/5 | 5/5 no skill loaded | non-discriminator |
| #5 trigger: ready spec | 6/6 clean scored draws loaded | triggers do not gate | not run | — | routing, not a rate |
| #6 trigger: summarise | 8/10 did not load (2/10 loaded) | triggers do not gate | not run | — | routing, not a rate |

The red cells, by assertion or gate reason:

- **#1 control** — `filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:`
  failed in all four clean draws (`r1`, `r2`, `r4`, `r5`); `r5` also failed
  `filematch ... ## Verification`. The control wrote a prompt but did not pin
  the spec. The one contaminated draw (`r3`) read the real install's
  `spec-sha.mjs` and would have passed; it is excluded, not counted.
- **#2 control** — `nodir docs/prompts` failed in five clean draws across both
  runs: `r1` and `r5` in `14-30-42`, `r3`–`r5` in `14-40-36`. The control
  generated a prompt from a `draft` spec. The one clean pass (`14-40-36 r1`)
  did not create the directory. Four draws read the real install and are
  excluded.
- **#3 with skill** — `nodir docs/prompts` failed in `r3`: the draw treated both
  open questions as non-blocking, turned them into non-goals, and wrote
  `docs/prompts/SPEC-0009-audit-log.prompt.md`. The other four stopped.
- **#3 control** — `nodir docs/prompts` failed in all four clean draws; the
  fifth read the real install and is excluded.
- **#4** — no red: both arms passed both assertions in five draws. The control
  produced the prompt and the `spec_sha` without the skill.
- **#5** — no assertion red in any scored draw. `r5` of `14-07-04` stalled;
  `r1` and `r4` of `14-43-01` stalled; `r3` of `14-43-01` read a stale copy
  under `/private/var/folders/.../T/opencode` and was contaminated. The
  assertions were true in every draw that completed, including the one that
  stalled after loading.
- **#6** — `notskill write-implementation-prompt` failed in `14-07-04` `r1` and
  `r2`: both draws loaded the skill. `14-43-01` passed 5/5.

## Case #3

The fixture and the contract support the case: `SPEC-0009` is `ready` with two
open questions, and `SKILL.md` step 5 says to stop and list them if they block
implementation. The case was given
`prompt: Create the implementation prompt for SPEC-0009.` and ran five times at
`8e26cf6`: four draws stopped and passed; `r3` judged the questions non-blocking
and wrote the prompt. A 4/5 split is not a deterministic verdict, so the case
went back to `status: manual` with a `why:` line naming
`2026-11-06T14-01-54--write-implementation-prompt`. The control reading
(`0/4` clean) shows the case would separate if it were stable; it is not, and
five draws cannot promote it.

## Classification

- **#1 — separator.** 5/5 with the skill against 0/4 clean without it. The
  control writes a prompt but omits `spec_sha` (and once the `## Verification`
  section); the skill pins the spec by hash. The contaminated control draw is
  excluded.
- **#2 — separator.** 5/5 with the skill against one clean pass in six clean
  draws without it. The control generates a prompt from a `draft` spec; the
  skill stops. The control cell is two contaminated runs, read from their clean
  draws, not a five-draw clean rate; the four contaminated draws are named in
  *Integrity*.
- **#3 — manual (reverted).** The five draws split 4/5, so the case carries a
  `why:` instead of a classification. The run pair is cited as the record of
  that split, not as a separator.
- **#4 — non-discriminator.** 5/5 in both arms. A bare agent mirrors the
  existing prompt and records `spec_sha` as often as the skill does; the two
  assertions cannot see the skill's contribution. Keep as a regression case.
- **#5 and #6 — triggers.** `#5` routed in every clean scored draw (6/6) across
  the two runs; the three stalls are infrastructure and the one stale read is
  contamination. `#6` is not clean: 8/10 did not load, but `14-07-04 r1` and
  `r2` did, after searching the filesystem for the missing `SPEC-0012` and then
  loading the staged skill. `14-43-01` passed 5/5. The near-miss does not hold
  at five draws in the first run; the finding is recorded here and not fixed in
  this spec.

## Integrity

The control arm can still read the real install; the runner detects it and marks
the draw contaminated. The checker findings, by run:

```sh
node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/<dir>
# 2026-11-06T14-07-04--write-implementation-prompt
#   infrastructure write-implementation-prompt#5 r5 — infrastructure: stalled (retried 1x)
# 2026-11-06T14-43-01--write-implementation-prompt
#   infrastructure write-implementation-prompt#5 r1 — infrastructure: stalled (retried 1x)
#   infrastructure write-implementation-prompt#5 r4 — infrastructure: stalled (retried 1x)
#   leak write-implementation-prompt#5 r3 — read .../T/opencode/agent-skills-pr/skills/write-implementation-prompt/...
# 2026-11-06T14-28-07--write-implementation-prompt--without-skill
#   leak write-implementation-prompt#1 r3 — read /Users/wendell/.agents/skills, .../SKILL.md, .../references/evals.md
# 2026-11-06T14-30-42--write-implementation-prompt--without-skill
#   leak write-implementation-prompt#2 r2, r3, r4 — read /Users/wendell/.agents/skills/.../SKILL.md / evals.md
# 2026-11-06T14-40-36--write-implementation-prompt--without-skill
#   leak write-implementation-prompt#2 r2 — read /Users/wendell/.agents/skills/.../SKILL.md
# 2026-11-06T14-32-58--write-implementation-prompt--without-skill
#   leak write-implementation-prompt#3 r3 — read /Users/wendell/.agents/skills/**/SKILL.md
```

In the control draws the read is a hand-off to the installed skill: the agent
searches `/Users/wendell/.agents/skills`, finds `write-implementation-prompt`,
and follows it. That is exactly the confound the gate exists to detect, and
those draws are excluded. `#1` control `r3` is the clearest case: it read the
real `spec-sha.mjs` and would have passed the `spec_sha:` assertion.

The trigger stalls are provider stalls, not behaviour: the event stream went
silent past the 120 s watchdog and the runner recorded `stalled`, not a case
failure. They do not change a routing verdict, but they do make the run a failure
record rather than a clean cell.

## Not comparable

The run directories for this skill from 2026-11-02 predate this case set and the
leak detector; they are not evidence for this table. The four clean behavioural
with-skill runs and the clean `#4` control are the only five-draw cells here.
The `#1`/`#2`/`#3` control cells are read from clean draws inside runs the
checker rejects, so their numbers are counts, not clean five-draw rates.
