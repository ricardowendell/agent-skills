# Pipeline bookends matrix — 2026-11-06

Measured at commit `db7c49a` on `opencode-go/deepseek-v4.1-flash`, the config
default, with deterministic assertions only and no judge. The three skills hold
the two ends of the pipeline: `capture-idea` catches the note, `process-inbox`
classifies it, and `record-decision` writes the ADR. Eleven cases: five
behavioural and six routing triggers. Everything below runs under
`node scripts/run-evals.mjs --root skills`.

The SPEC-0031 re-measure at `eb9903e` used `agentworks/deepseek-v4-1-flash`:
the default provider's weekly limit was exhausted (HTTP 429), so the same model
family was reached through a different route. Those rows name the model; a v2 row
and a v1 row are not a same-model pair.

All arms were taken at `db7c49a`; the tree stayed clean between runs, so the
`fixtureHash`, `promptHash` and `detectorVersion` in the hash table are identical
across the two arms, and the `skillHash` is shared by the with-skill and trigger
arms. No skill, fixture, assertion, runner or policy file changed.

## What the arms mean

- **with skill** — the skill under review is copied into
  `<scratch>/.opencode/skills/<id>/` and shadows any global install; the gate
  requires that copy to be the one that loaded.
- **without skill** — `--no-skill`: nothing is staged and the `skill` tool is
  denied. This measures "not auto-loaded", not "the text is unreachable"; the
  child can still read the real install under `/Users/wendell/.agents/skills`,
  and the detector marks those draws contaminated.
- **trigger** — the same skill staging as the with-skill arm, but the cases carry
  `gate: off`. A trigger cell is a routing result, not a case rate, and it has no
  control arm.

A deterministic cell reads `passed/reps`; a draw that lost its skill gate is not
a pass and does not count as one. No judge ran, so there is no judge column.

## What "clean" means — TASK-43 caveat

`findings=0 warnings=0` means the detector saw **no read of an installed skill or
of a `references/evals.md` answer key** outside the scratch. It does **not** mean
the draw was isolated. `scripts/lib/evals/leak.mjs` classifies only skill roots
and `references/evals.md$`; a draw can read the host's `docs/` corpus, the global
`AGENTS.md`, or this worktree and still score `findings=0`. That gap is real and
open (TASK-43), and it applies to every control cell below, whose clean scored
draws can still have read the host's `docs/` and `AGENTS.md`. The contamination
the checker *does* catch is a read of the installed skill or its eval corpus; all
control exclusions below are that kind of read.

## Load canaries

```sh
node scripts/run-evals.mjs --root skills --skill capture-idea --case 1 --repeat 12 --stop 12/0 --run
node scripts/run-evals.mjs --root skills --skill process-inbox --case 1 --repeat 12 --stop 12/0 --run
node scripts/run-evals.mjs --root skills --skill record-decision --case 1 --repeat 12 --stop 12/0 --run
```

| skill | run directory | result | gate | checker |
| --- | --- | --- | --- | --- |
| `capture-idea` | `2026-11-06T16-30-55--capture-idea` | 12/12 | 12/12 | `findings=0 warnings=0` |
| `process-inbox` | `2026-11-06T16-33-51--process-inbox` | 12/12 | 12/12 | `findings=0 warnings=0` |
| `record-decision` | `2026-11-06T16-37-00--record-decision` | 12/12 | 12/12 | `findings=0 warnings=0` |

`--stop 12/0` disables the default `5/3` stop rule so the denominator really is
twelve. The canary is a precondition, not a case rate.

## Gate A — default model, five repetitions, no judge

```sh
node scripts/run-evals.mjs --root skills --skill capture-idea --case 1 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill process-inbox --case 1 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill record-decision --case 1 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill record-decision --case 2 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill record-decision --case 3 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill capture-idea --tag trigger --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill process-inbox --tag trigger --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill record-decision --tag trigger --repeat 5 --run
```

Control arm, the same five behavioural cases and no triggers:

```sh
node scripts/run-evals.mjs --root skills --skill capture-idea --case 1 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill process-inbox --case 1 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill record-decision --case 1 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill record-decision --case 2 --repeat 5 --run --no-skill
node scripts/run-evals.mjs --root skills --skill record-decision --case 3 --repeat 5 --run --no-skill
```

`capture-idea #1` and `process-inbox #1` were re-run twice more, and
`record-decision #2` once more, to try for a five-draw clean control run. Three
attempts is a budget cap, not a spec rule.

### Measurement-surface hashes

| case | fixture | prompt | skill | detector |
| --- | --- | --- | --- | --- |
| `capture-idea` #1 | `23167e4f19715688…` | `5fc0e606f48b260b…` | `ca93be4c42d19c11…` | `a31d58f79a6c7038` |
| `capture-idea` #2 | `3d529bddbd4fe027…` | `7a320c5f0e2ec4db…` | `ca93be4c42d19c11…` | `a31d58f79a6c7038` |
| `capture-idea` #3 | `3d529bddbd4fe027…` | `7f1f12f2223375fc…` | `ca93be4c42d19c11…` | `a31d58f79a6c7038` |
| `process-inbox` #1 | `7427edae879155e5…` | `7f1f12f2223375fc…` | `003ddb1565dddc02…` | `a31d58f79a6c7038` |
| `process-inbox` #2 | `e3b0c44298fc1c14…` (empty) | `f0e7cb87d9ba8328…` | `003ddb1565dddc02…` | `a31d58f79a6c7038` |
| `process-inbox` #3 | `e3b0c44298fc1c14…` (empty) | `cf124064ee6bae9b…` | `003ddb1565dddc02…` | `a31d58f79a6c7038` |
| `record-decision` #1 | `989f42d11f0d9d84…` | `870b9a7e179164f6…` | `64a7cc64e76a5ed3…` | `a31d58f79a6c7038` |
| `record-decision` #2 | `989f42d11f0d9d84…` | `0690ad250528ab12…` | `64a7cc64e76a5ed3…` | `a31d58f79a6c7038` |
| `record-decision` #3 | `989f42d11f0d9d84…` | `f7415a53f0b5a9c4…` | `64a7cc64e76a5ed3…` | `a31d58f79a6c7038` |
| `record-decision` #4 | `3d529bddbd4fe027…` | `86b9462d551f933a…` | `64a7cc64e76a5ed3…` | `a31d58f79a6c7038` |
| `record-decision` #5 | `66a3d636a10dc7a7…` | `ae54369a606ad2c3…` | `64a7cc64e76a5ed3…` | `a31d58f79a6c7038` |

The control draws carry the same `fixtureHash`, `promptHash` and
`detectorVersion`; they have no `skillHash` because no skill is staged. The
trigger draws carry the same `skillHash` as the with-skill arm.

### Behavioural run directories

| case | arm | run directory | draws | checker |
| --- | --- | --- | --- | --- |
| `capture-idea` #1 | with skill | `2026-11-06T16-40-32--capture-idea` | 5/5 | `findings=0 warnings=0` |
| `capture-idea` #1 | control (1) | `2026-11-06T17-07-09--capture-idea--without-skill` | 0/2 clean, 3 contaminated | `findings=3` |
| `capture-idea` #1 | control (2) | `2026-11-06T17-23-44--capture-idea--without-skill` | 0/2 clean, 3 contaminated | `findings=3` |
| `capture-idea` #1 | control (3) | `2026-11-06T17-32-50--capture-idea--without-skill` | 0/0 clean, 5 contaminated | `findings=5` |
| `process-inbox` #1 | with skill | `2026-11-06T16-41-50--process-inbox` | 5/5 | `findings=0 warnings=0` |
| `process-inbox` #1 | control (1) | `2026-11-06T17-08-43--process-inbox--without-skill` | 0/1 clean, 4 contaminated | `findings=4` |
| `process-inbox` #1 | control (2) | `2026-11-06T17-25-52--process-inbox--without-skill` | 0/1 clean, 4 contaminated | `findings=4` |
| `process-inbox` #1 | control (3) | `2026-11-06T17-34-41--process-inbox--without-skill` | 0/1 clean, 3 contaminated, 1 stalled | `findings=4` |
| `capture-idea` #1 | with skill (v2) | `2026-11-07T08-25-21--capture-idea--agentworks-deepseek-v4-1-flash` | 5/5 | `findings=0 warnings=0 isolated=yes` |
| `capture-idea` #1 | control (v2) | `2026-11-07T08-27-30--capture-idea--agentworks-deepseek-v4-1-flash--without-skill` | 0/0 clean, 5 contaminated | `findings=5 isolated=no` |
| `process-inbox` #1 | with skill (v2) | `2026-11-07T08-29-45--process-inbox--agentworks-deepseek-v4-1-flash` | 5/5 | `findings=0 warnings=0 isolated=yes` |
| `process-inbox` #1 | control (v2) | `2026-11-07T08-31-34--process-inbox--agentworks-deepseek-v4-1-flash--without-skill` | 0/2 clean, 3 contaminated | `findings=4 isolated=no` |
| `record-decision` #1 | with skill | `2026-11-06T16-43-33--record-decision` | 4/5 | `findings=0 warnings=0` |
| `record-decision` #1 | control | `2026-11-06T17-11-37--record-decision--without-skill` | 1/5 | `findings=0 warnings=0` |
| `record-decision` #2 | with skill | `2026-11-06T16-45-46--record-decision` | 4/5 | `findings=0 warnings=0` |
| `record-decision` #2 | control (1) | `2026-11-06T17-15-33--record-decision--without-skill` | 0/4 clean, 1 stalled | `findings=1` |
| `record-decision` #2 | control (2) | `2026-11-06T17-28-10--record-decision--without-skill` | 0/5 | `findings=0 warnings=0` |
| `record-decision` #3 | with skill | `2026-11-06T16-48-00--record-decision` | 4/5 | `findings=0 warnings=0` |
| `record-decision` #3 | control | `2026-11-06T17-20-53--record-decision--without-skill` | 5/5 | `findings=0 warnings=0` |

The control draws that were excluded read the real install under
`/Users/wendell/.agents/skills`; the stalled draws are counted as
infrastructure, not failures. `capture-idea #1` produced four clean control
draws across three v1 runs (`0/2`, `0/2`, `0/0`) and `process-inbox #1` three
(`0/1`, `0/1`, `0/1`); no run has five clean draws.

SPEC-0031 re-ran both cells at `eb9903e` under v2 on
`agentworks/deepseek-v4-1-flash` (five draws per arm). The skill arms are clean
5/5. The controls are not: `capture-idea` #1 is `0/0` clean (5 contaminated,
every draw read the installed `SKILL.md`) and `process-inbox` #1 is `0/2` clean
(3 contaminated; both clean draws failed `unchanged` and `nodir docs/backlog`).
Both stay **unresolved** with the new clean counts. The clean counts are not
rates.

### Trigger runs

| run directory | `capture-idea` #2 | `capture-idea` #3 | checker |
| --- | --- | --- | --- |
| `2026-11-06T16-50-30--capture-idea` | 5/5 routed | 0/4 clean, `r3` contaminated | `findings=1` |

| run directory | `process-inbox` #2 | `process-inbox` #3 | checker |
| --- | --- | --- | --- |
| `2026-11-06T16-55-11--process-inbox` | 4/5, `r1` stalled (4 clean scored) | 0/5 | `findings=1` |

| run directory | `record-decision` #4 | `record-decision` #5 | checker |
| --- | --- | --- | --- |
| `2026-11-06T17-04-07--record-decision` | 5/5 routed | 5/5 routed | `findings=0 warnings=0` |

The two trigger runs with findings are cited as failure records, not clean
rates; their clean scored subsets are named above.

### Scores

| case | with skill | with, gate | control | control, gate | classification |
| --- | --- | --- | --- | --- | --- |
| `capture-idea` #1 capture the idea | 5/5 | 5/5 | v2 0/0 clean (5 contaminated); v1 subsets 0/2, 0/2, 0/0 | no skill loaded | **unresolved** |
| `process-inbox` #1 process the inbox | 5/5 | 5/5 | v2 0/2 clean (3 contaminated); v1 subsets 0/1, 0/1, 0/1 | no skill loaded | **unresolved** |
| `record-decision` #1 record an ADR | 4/5 | 5/5 | **1/5 clean** | 5/5 no skill loaded | **separator** |
| `record-decision` #2 refuse an incomplete decision | 4/5 | 5/5 | **0/5 clean** | 5/5 no skill loaded | **separator** |
| `record-decision` #3 supersede ADR-0002 | 4/5 | 5/5 | **5/5 clean** | 5/5 no skill loaded | **non-discriminator** |
| `capture-idea` #2 trigger | 5/5 | gate off | — | — | trigger, routed 5/5 |
| `capture-idea` #3 routing | 0/4 clean | gate off | — | — | trigger, not routed (staging) — **superseded** by the SPEC-0029 section below |
| `process-inbox` #2 trigger | 4/5, `r1` stalled | gate off | — | — | trigger, routed 4/5 |
| `process-inbox` #3 near-miss | 0/5 | gate off | — | — | trigger, not routed (staging) — **superseded** by the SPEC-0029 section below |
| `record-decision` #4 trigger | 5/5 | gate off | — | — | trigger, routed 5/5 |
| `record-decision` #5 near-miss | 5/5 | gate off | — | — | trigger, routed 5/5 |

The three `record-decision` behavioural cases carry one miss each. The spec's
readability rule allows a cell with one miss in five; `skillGate.ok` was `true`
in every draw, including the misses.

### Red cells by assertion

- **`capture-idea` #1 control** — `filematch docs/inbox/*.md status: unprocessed`
  failed in **4/4 clean draws** across the three runs. The control wrote a note
  under `docs/inbox/` but without the `status: unprocessed` frontmatter. The
  other eleven draws were excluded for reading the installed skill.
- **`process-inbox` #1 control** — `unchanged
  docs/inbox/2026-01-01-digest-email.md` and `nodir docs/backlog` failed in
  **3/3 clean draws** across the three runs. The control marked the note
  processed and created a backlog without waiting; the skill waits for
  confirmation. Twelve draws were excluded (eleven contaminated, one stalled).
- **`record-decision` #1 with skill** — `r3` asked for the missing consequence
  ("what does SQLite make harder that you're accepting?") and wrote nothing, so
  the three `filematch` assertions failed. The other four wrote ADR-0003.
- **`record-decision` #1 control** — `unchanged docs/architecture.md` failed in
  **4/5**; the control edited the architecture doc. One clean draw passed.
- **`record-decision` #2 with skill** — `r1` wrote an ADR for an incomplete
  decision after the `question` tool was refused non-interactively, failing
  `nofile docs/decisions/ADR-0003-*.md` and `unchanged docs/decisions/README.md`.
- **`record-decision` #2 control** — the clean run `17-28-10` failed
  `nofile docs/decisions/ADR-0003-*.md` and `unchanged
  docs/decisions/README.md` in **5/5**: every draw invented the missing trade-off
  and filed ADR-0003. The first attempt failed the same two assertions in its
  four clean draws; the fifth stalled.
- **`record-decision` #3 with skill** — `r3` asked for the queue level and wrote
  nothing; the three `filematch` assertions failed. The other four wrote
  ADR-0003, marked ADR-0002 `superseded by ADR-0003` and updated the index.
- **`record-decision` #3 control** — no red: the control wrote the reversal in
  5/5.
- **`capture-idea` #3** — `skill process-inbox` failed in **4/4 clean draws**;
  one draw was contaminated by a read of the real `process-inbox/SKILL.md`. This
  case names a different skill from the one under review.
- **`process-inbox` #3** — `skill capture-idea` failed in **5/5**; `notskill
  process-inbox` failed in `r3`/`r5` because those draws loaded the staged
  `process-inbox` instead. This case also names a different skill from the one
  under review.
- **`process-inbox` #2** — no red in the four clean scored draws; `r1` stalled.
- **`record-decision` #4/#5** and **`capture-idea` #2** — no red.

### The cross-skill trigger defect

`capture-idea` #3 asserts `skill process-inbox`, and `process-inbox` #3 asserts
`skill capture-idea`. Skill staging copies **only the skill under review** into
the scratch, and the isolated child cannot see the installed skills without
tripping the detector. The target skill is therefore absent from the only clean
environment: a passing draw is impossible, and the one draw that found
`process-inbox` read the real install (`2026-11-06T16-50-30--capture-idea` `r3`,
contaminated). This is a construction defect of the routing pair, not a router
verdict. It was recorded, not fixed, by this measurement wave; SPEC-0029 fixes
it and re-measures the pair below.

### Cross-skill routing with a declared stage — SPEC-0029

The defect above is a staging gap, not a router verdict, and SPEC-0029 closes it.
The two cases now declare the sibling they expect (`- stage: process-inbox` in
`capture-idea` #3, `- stage: capture-idea` in `process-inbox` #3), and the runner
stages that copy beside the arm's skill, hashes it and records it in
`stagedSkills` in `result.json` and the run manifest. `skillHash` and
`skillGate` still describe the arm's skill only.

Re-measured on the same config default (`opencode-go/deepseek-v4.1-flash`), five
draws per case, skill arm only, detector v2 (`71bfb85a91cd68ab`). The runs record
`repoSha d982aba`; the SPEC-0029 implementation was in the working tree, not yet
committed, and `skills/` changed only in the two `evals.md` declarations — the
staged copies (and their hashes) are the same as the 0.5.0 rows.

| case | run directory | staged set | result | checker |
| --- | --- | --- | --- | --- |
| `capture-idea` #3 | `2026-11-06T19-06-50--capture-idea` | arm `capture-idea` + `process-inbox` | 5/5 | `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes` |
| `process-inbox` #3 | `2026-11-06T19-09-27--process-inbox` | arm `process-inbox` + `capture-idea` | 5/5 | `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes` |

| case | fixture | prompt | arm skill | staged sibling | detector |
| --- | --- | --- | --- | --- | --- |
| `capture-idea` #3 | `3d529bddbd4fe027…` | `7f1f12f2223375fc…` | `ca93be4c42d19c11…` | `process-inbox` `003ddb1565dddc02…` | `71bfb85a91cd68ab` |
| `process-inbox` #3 | `e3b0c44298fc1c14…` (empty) | `cf124064ee6bae9b…` | `003ddb1565dddc02…` | `capture-idea` `ca93be4c42d19c11…` | `71bfb85a91cd68ab` |

Every draw in both runs loaded the staged sibling and not the arm's skill: the
assertions `skill process-inbox`/`notskill capture-idea` and `skill
capture-idea`/`notskill process-inbox` were green in all five reps. The earlier
0/4 and 0/5 rows above are the record of the staging defect at `db7c49a` under
detector v1; they are not comparable to this cell, because the sibling was not on
the menu and the one `capture-idea` draw that found it had to read the host
install. Bookends budget: ten draws (five per case).

## Classification

- **`capture-idea` #1 — unresolved.** The skill is 5/5; the v2 control produced
  `0/0` clean draws (5 contaminated: every draw read the installed `SKILL.md`).
  The v1 attempts were `0/2`, `0/2`, `0/0` clean. Every clean draw failed
  `status: unprocessed`, so the direction is a separator, but no run carries
  five clean control draws. Re-measure after the control arm can no longer read
  the install.
- **`process-inbox` #1 — unresolved, not the expected non-discriminator.** The
  skill is 5/5; the v2 control produced `0/2` clean (3 contaminated), and both
  clean draws failed `unchanged` and `nodir docs/backlog`. The v1 attempts were
  `0/1` in each of three runs. The expectation was that a do-nothing control
  would pass the "nothing changed" assertions; measured, each clean control draw
  marked the note processed and created `docs/backlog`. The direction is a
  separator; the cell is unresolved only because the control was never clean
  enough. The case was not redesigned.
- **`record-decision` #1 — separator.** 4/5 with the skill against **1/5**
  clean without it (`17-11-37`). The control edits `docs/architecture.md`; the
  skill links to it. The one clean control pass wrote the ADR without touching
  the architecture doc.
- **`record-decision` #2 — separator.** 4/5 with the skill against **0/5**
  clean without it (`17-28-10`). The control files an ADR for an undecided
  question every time; the skill stops and asks. The first control attempt was
  `0/4` clean with one stall.
- **`record-decision` #3 — non-discriminator.** 4/5 with the skill against
  **5/5** without it (`17-20-53`). A bare agent performs the reversal — writes
  ADR-0003, marks ADR-0002 superseded and updates the index — as reliably as the
  skill. Kept as a regression case.
- **Triggers — routing evidence, not rates.** `capture-idea` #2 routed 5/5;
  `process-inbox` #2 routed 4/5 with `r1` stalled (4 clean scored);
  `record-decision` #4 and #5 routed 5/5. `capture-idea` #3 and `process-inbox`
  #3 are 0/4 and 0/5 on the cross-skill assertion for the structural reason
  above; SPEC-0029 re-measured the pair with the sibling staged and both are
  5/5 (see the declared-stage section).

## Integrity

The checker, by run:

```sh
node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/<dir>
# 2026-11-06T16-30-55--capture-idea                       findings=0 warnings=0
# 2026-11-06T16-33-51--process-inbox                      findings=0 warnings=0
# 2026-11-06T16-37-00--record-decision                    findings=0 warnings=0
# 2026-11-06T16-40-32--capture-idea                       findings=0 warnings=0
# 2026-11-06T16-41-50--process-inbox                      findings=0 warnings=0
# 2026-11-06T16-43-33--record-decision                    findings=0 warnings=0
# 2026-11-06T16-45-46--record-decision                    findings=0 warnings=0
# 2026-11-06T16-48-00--record-decision                    findings=0 warnings=0
# 2026-11-06T16-50-30--capture-idea
#   leak #3 r3 — read /Users/wendell/.agents/skills/process-inbox/SKILL.md
# 2026-11-06T16-55-11--process-inbox
#   infrastructure #2 r1 — stalled
# 2026-11-06T17-04-07--record-decision                    findings=0 warnings=0
# 2026-11-06T17-07-09--capture-idea--without-skill
#   leak #1 r1, r3, r5 — real install
# 2026-11-06T17-08-43--process-inbox--without-skill
#   leak #1 r1, r3, r4, r5 — real install
# 2026-11-06T17-11-37--record-decision--without-skill      findings=0 warnings=0
# 2026-11-06T17-15-33--record-decision--without-skill
#   infrastructure #2 r1 — stalled
# 2026-11-06T17-20-53--record-decision--without-skill      findings=0 warnings=0
# 2026-11-06T17-23-44--capture-idea--without-skill
#   leak #1 r1, r2, r3 — real install
# 2026-11-06T17-25-52--process-inbox--without-skill
#   leak #1 r1, r2, r4, r5 — real install
# 2026-11-06T17-28-10--record-decision--without-skill      findings=0 warnings=0
# 2026-11-06T17-32-50--capture-idea--without-skill
#   leak #1 r1–r5 — real install
# 2026-11-06T17-34-41--process-inbox--without-skill
#   infrastructure #1 r4 — stalled
#   leak #1 r2, r3, r5 — real install (r2, r3) and stale copy /private/tmp/as-remote (r5)
# 2026-11-07T08-25-21--capture-idea--agentworks-deepseek-v4-1-flash
#   findings=0 warnings=0 isolated=yes
# 2026-11-07T08-27-30--capture-idea--agentworks-deepseek-v4-1-flash--without-skill (contaminated)
#   leak #1 r1–r5 — real install
# 2026-11-07T08-29-45--process-inbox--agentworks-deepseek-v4-1-flash
#   findings=0 warnings=0 isolated=yes
# 2026-11-07T08-31-34--process-inbox--agentworks-deepseek-v4-1-flash--without-skill (contaminated)
#   leak #1 r1, r2, r3 — real install; host #1 r3 — checkout root
```

The excluded control draws read the install as a hand-off: the agent searches
`/Users/wendell/.agents/skills`, finds the skill and follows it. The trigger
contamination is the same read while the staged copy is what the gate would see.
Both are excluded. The one `capture-idea` #3 contamination is a read of
`process-inbox`, the skill the case asks for but the runner does not stage.

The stalls are provider stalls: the event stream went silent past the 120 s
watchdog and the runner recorded `stalled`, not a case failure.

## Budget and not comparable

141 draws were spent: 36 canary, 25 with-skill behavioural, 30 trigger, and 50
control (25 first attempt, 15 second, 10 third). The estimate was about 116; the
overrun is the control re-runs made necessary by contamination.

The earlier run directories for these skills — the 2026-11-01 `capture-idea`
runs and the 2026-11-06 `agentworks-gpt-oss-120b` runs — are a different model
and/or an earlier case set. They are not evidence for this table. Every cell
above is at `db7c49a`, with the hashes in the table proving the measurement
surface is the same in both arms.
