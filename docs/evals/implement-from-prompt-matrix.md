# `implement-from-prompt` matrix — 2026-11-05

Measured at commit `3779a20`, after the instrument froze (SPEC-0015 F0). Gate A
is five repetitions per cell on `opencode-go/deepseek-v4.1-flash`, the config
default, judged by `opencode-go/gpt-6-luna`. Gate B tops the two separators to
`n=12` on the default model and `n=5` on `opencode-go/gpt-6-luna`, both arms.
Case #4 was re-measured at commit `6dd38aa` after SPEC-0016 changed the rule;
the *Re-measurement* section below is the current reading for it, and the Gate A
row is the pre-fix one.

## What the arms mean

- **with skill** — the skill is copied into `<scratch>/.opencode/skills/implement-from-prompt/`
  and shadows any global install; the gate requires that copy to be the one that
  loaded.
- **without skill** — `--no-skill`: nothing is staged and the `skill` tool is
  denied. This measures "not auto-loaded", not "text unreachable".

A deterministic cell reads `passed/reps`: every assertion passed and the skill
gate held, both scored without the judge. The judge column is separate because the
judge only runs on a repetition whose deterministic assertions and gate already
passed — it can fail a case, never rescue one. When the evidence lived in a tool
call or in command output rather than in the reply it could read, the judge
marked the expectation `unverifiable` and the case failed. That is a defect of
the judge, not of the run; the deterministic cell is the decision.

## Load canary

Before Gate A, case #1 ran 12 draws with the skill to check the load gate:

```sh
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 --repeat 12 --run
```

`2026-11-05T11-36-10--implement-from-prompt`: 12/12 passed, 0 skill-gate
misses. The canary is a precondition, not a case rate; Gate A later showed the
load defect in #2 and #8.

## Gate A — default model, five repetitions, judge `opencode-go/gpt-6-luna`

```sh
node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --run --judge opencode-go/gpt-6-luna
node scripts/run-evals.mjs --root skills --tag trigger --repeat 5 --run
node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --no-skill --run --judge opencode-go/gpt-6-luna
```

Run directories: with skill `2026-11-05T11-45-57--implement-from-prompt`, trigger
`2026-11-05T11-52-43--implement-from-prompt`, control
`2026-11-05T12-00-00--implement-from-prompt--without-skill`.

| case | with skill, deterministic | with, gate | control, deterministic | control, gate | judge with | judge control |
| --- | --- | --- | --- | --- | --- | --- |
| #1 implement the demo prompt | 5/5 | 5/5 | 0/5 | 5/5 | 0/5 (five `unverifiable`) | not judged (no green rep) |
| #2 missing prompt file | 5/5 | 2/5 | 2/5 | 5/5 | 2/2 | 1/2 |
| #4 verification cannot run locally | 1/5 | 5/5 | 1/5 | 5/5 | 0/1 | 0/1 |
| #7 a red gate the prompt cannot green | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 1/5 (four `unverifiable`) |
| #8 the prompt assumes a missing module | 5/5 | 4/5 | 1/5 | 5/5 | 4/4 | 1/1 |

Trigger cases run in the skill arm only: **#5 4/5** (one run did not load the
skill: `skill implement-from-prompt`), **#6 5/5**; both gates held 5/5.

The red cells, by assertion or gate reason:

- **#1 control** — `filematch docs/specs/SPEC-0007-demo.md status: implemented`
  failed in all five runs. The control edited the code and left the spec `ready`.
- **#1 with** — every deterministic assertion passed; the judge marked an
  expectation `unverifiable` in all five runs because the evidence was in the
  tool calls, and once also reported expectation 3 not met. The case still
  separates on the deterministic reading.
- **#2 with** — the gate missed in three runs (`skill 'implement-from-prompt'
  was not loaded`), so only two cells are usable. This is the load defect below,
  not a property of the case.
- **#2 control** — `reply write-implementation-prompt` failed in three runs; of
  the two green repetitions, the judge passed one and called the other
  `unverifiable`.
- **#4 with** — `file src/echo.js` failed in four runs. The transcripts show the
  skill reading "in `src/echo.js`, add and export `echo`" as a blocking gap
  ("`src/` and `src/echo.js` do not exist"), then stopping rather than treating
  the file as the thing to create. The one green run then failed the judge.
- **#4 control** — `reply (?:[Nn]ot run|...)` failed in four runs; the green run
  claimed `just check` passed with no justfile, and the judge marked expectation
  1 not met.
- **#7 control** — all five deterministic cells passed, but the judge passed only
  one: four replies were `unverifiable` because the gate evidence was a shell
  call. The deterministic reading is a tie, so this case does not discriminate.
- **#8 with** — the gate missed in one run (`skill ... was not loaded`).
- **#8 control** — `nofile src/format.js` failed in four runs: the control
  invented the missing module. The one clean run passed the judge.

## Gate B — the two separators

Default model, `--repeat 12`, no judge:

```sh
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 --repeat 12 --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 --repeat 12 --no-skill --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 8 --repeat 12 --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 8 --repeat 12 --no-skill --run
```

Second model, `--repeat 5`, no judge:

```sh
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 --repeat 5 --model opencode-go/gpt-6-luna --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 --repeat 5 --model opencode-go/gpt-6-luna --no-skill --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 8 --repeat 5 --model opencode-go/gpt-6-luna --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 8 --repeat 5 --model opencode-go/gpt-6-luna --no-skill --run
```

| model | case | reps | with skill | control | failing assertion in the control |
| --- | --- | --- | --- | --- | --- |
| `deepseek-v4.1-flash` | #1 | 12 | 12/12 | 0/12 | `filematch docs/specs/SPEC-0007-demo.md status: implemented` (12) |
| `deepseek-v4.1-flash` | #8 | 12 | 12/12 | 0/12 | `nofile src/format.js` (12) |
| `gpt-6-luna` | #1 | 5 | 5/5 | 0/5 | `filematch docs/specs/SPEC-0007-demo.md status: implemented` (5) |
| `gpt-6-luna` | #8 | 5 | 5/5 | 1/5 | `nofile src/format.js` (4) |

Default-model runs: #1 with `2026-11-05T12-35-30--implement-from-prompt`, #1
control `2026-11-05T12-42-05--implement-from-prompt--without-skill`; #8 with
`2026-11-05T12-48-46--implement-from-prompt`, #8 control
`2026-11-05T12-56-03--implement-from-prompt--without-skill`. Luna runs: #1 with
`2026-11-05T13-18-27--implement-from-prompt--opencode-go-gpt-6-luna`, #1 control
`2026-11-05T13-22-08--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`;
#8 with `2026-11-05T13-25-10--implement-from-prompt--opencode-go-gpt-6-luna`, #8
control `2026-11-05T13-28-38--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`.

The luna #1 control's single pass was not a clean control: transcript
`transcript.r1.md` searched `/Users/wendell/.agents/skills` and read the real
`implement-from-prompt/SKILL.md`, then followed it. The skill gate cannot see a
file read, so the run scored as a control pass. The runner now detects that read
as contamination, so the cell was re-measured at `8777e0b`:

```sh
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 --repeat 5 --model opencode-go/gpt-6-luna --no-skill --run
```

`2026-11-06T07-05-38--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`:
**0/5**, zero contaminated. The separator is 5/5 against 0/5 on both models. The
default-model control had no such read in its 12 draws.

## Re-measurement — #4 after the rule fix (SPEC-0016)

SPEC-0016 split the rule in step 3 into a **write target** and a **read
dependency**, and added `references/evals/4/package.json` so the module system is
no longer a second reason to stop. Measured at commit `6dd38aa`, default model,
no judge:

```sh
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 4 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 4 --repeat 5 --no-skill --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 7 --repeat 5 --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 8 --repeat 5 --run
```

| case | arm | run directory | passed | gate |
| --- | --- | --- | --- | --- |
| #4 | with skill | `2026-11-05T15-00-48--implement-from-prompt` | 5/5 | 5/5 |
| #4 | control | `2026-11-05T15-06-58--implement-from-prompt--without-skill` | 3/5 | 5/5 (no skill loaded) |
| #1 | with skill | `2026-11-05T15-30-10--implement-from-prompt` | 5/5 | 5/5 |
| #7 | with skill | `2026-11-05T15-36-40--implement-from-prompt` | 5/5 | 5/5 |
| #8 | with skill | `2026-11-05T15-44-35--implement-from-prompt` | 5/5 | 5/5 |

The fix works on the case that was broken: #4 is 5/5 with the skill, and the
transcript that stopped on "the files and gate it builds on do not exist" is
gone. #8 still stops on the missing `src/format.js` at 5/5, so the rule kept the
side it was supposed to keep.

The case does not separate. The fixture change lowered the bar for the control
as well: the pre-fix control passed 1/5 with no `package.json`; with the file in
place it passes **3/5**. The two red control draws are not behavioral: both are
`exit: timeout` at 600 s (2 and 5 steps, no error event), a provider stall that
never reached `src/echo.js`. So the control is **at least 3/5**, and a bare agent
creates the file and reports the missing gate about as often as the skill does.
Per SPEC-0016 AC-2 the case is published as a **non-discriminator** and kept as a
regression case; no assertion was changed to restore the split.

## Classification

- **#1 — separator.** 12/12 with the skill against 0/12 without it on the
  default model. The control writes the code and leaves the spec `ready`; the
  skill closes the spec. Gate B confirms it on the default model; on
  `gpt-6-luna` it is 5/5 against **0/5** after the contaminated control pass was
  re-measured at `8777e0b` (see *Integrity*).
- **#8 — separator.** 12/12 against 0/12 on the default model. The control
  invents `src/format.js`; the skill stops and reports the missing prerequisite.
  On `gpt-6-luna` it is 5/5 against 1/5: one control run also stopped, with no
  read of the skill or the eval corpus. The default model separates cleanly; the
  second model leaves one clean control pass.
- **#7 — non-discriminator.** 5/5 in both arms on the deterministic reading. The
  judge failed four control runs as `unverifiable`, but the assertions that
  decide the case pass in both arms. Keep as a regression case.
- **#2 — broken with the skill (skill-load).** The with-skill arm lost its gate
  in 3 of 5 runs, so the cell cannot be read as skill behaviour; the control
  scored 2/5, but one of those passes read a stale `references/evals.md` outside
  the scratch and another run read the real `SKILL.md`; neither is a clean
  control. The cell is contaminated, not a reading of the case. Re-run after the
  load and isolation defects are fixed.
- **#4 — non-discriminator after the SPEC-0016 fix.** 5/5 with the skill against
  3/5 without it at `6dd38aa` (the Gate A row, 1/5 against 1/5, is the pre-fix
  reading). The skill now creates the file the prompt names and reports the
  missing gate, which is the behaviour the case wants; the control does the same
  often enough that the case does not separate. Keep as a regression case.
- **#3 — manual.** The fixture only suggests `src/text.js`; it does not force
  the scope change, so the sanity draw failed and the case stays manual.
- **#5 and #6 — triggers.** #5 routed 4/5 (one miss), #6 routed 5/5. Routing
  only; no control comparison.

## Not comparable

The 33 historical run directories for this skill are not evidence for this
table. They are all `with-skill`, they were produced against older case versions,
and they predate home isolation. They answer a different question.

## Integrity

The staging fix holds: no with-skill run read a `references/evals.md` inside its
scratch directory, and the runner's `the staged skill carries no eval corpus`
test still passes. But the absolute claim — zero transcripts read the file — is
**false for the cited run directories**. The raw grep finds one hit:

```sh
for d in <cited runs>; do grep -rl "references/evals.md" "$d/cases"; done
# 2026-11-05T12-00-00--implement-from-prompt--without-skill/cases/implement-from-prompt--02/transcript.r1.md
```

That control run searched `/private/var/folders/…/T/opencode` and read a stale
copy at `…/opencode/agent-skills-pr/skills/implement-from-prompt/references/evals.md`;
it is also an assertion-green control repetition in #2. A second leak is a
control reading the real skill:

```sh
grep -rl "/Users/wendell/.agents/skills/implement-from-prompt/SKILL.md" <cited runs>/cases
# 2026-11-05T12-00-00--implement-from-prompt--without-skill/cases/implement-from-prompt--02/transcript.r3.md
# 2026-11-05T13-22-08--implement-from-prompt--opencode-go-gpt-6-luna--without-skill/cases/implement-from-prompt--01/transcript.r1.md
```

The isolation scrubs the child's home and stages the skill in the scratch, but it
does not hide `/Users/wendell/.agents` or `/private/var/folders`. Since SPEC-0017
the runner **detects** those reads and marks the repetition contaminated, so the
raw grep above is now a build artefact (`leak` in `result.json`) instead of a
manual check. It also means the old absolute claim is retired: a run is clean
because the detector says so, not because nobody looked. The default-model Gate B
control runs that carry the #1/#8 separation contain zero of either read, and they
remain clean under the detector.

The permission attempt in SPEC-0017 did **not** block the read: the `#2` control
below read `/Users/wendell/.agents/skills/...` with
`permission.external_directory: "deny"` in the child config. Detection is the
guarantee; denial is not. Closing the filesystem path stays open (TASK-29's
follow-up in SPEC-0018's scope).

The five run directories of the SPEC-0016 re-measurement contain zero reads of a
`references/evals.md` and zero reads of `/Users/wendell/.agents/skills`, and no
transcript reads anything outside its own scratch directory:

```sh
for d in <the five runs above>; do
  grep -rl "references/evals.md" "$d/cases"
  grep -rl "/Users/wendell/.agents/skills" "$d/cases"
done
# no output
```

The one-draw sanity run that preceded them (`2026-11-05T14-58-06--implement-from-prompt`)
ran against the same uncommitted skill (`repoSha: e37c0e4`, post-fix `skillHash`)
and is also clean; it is a precondition, not a measurement.

## Follow-ups

- **TASK-25 — closed.** The hook leaked `GIT_DIR`/`GIT_INDEX_FILE` into the tests;
  it now clears them after resolving `ROOT`, and the commits after `81f3677` run
  through the hook with no `--no-verify`.
- **#4 — closed by SPEC-0016.** The rule now separates a write target from a read
  dependency, and the fixture carries `package.json`. The case is a regression
  case, not a separator; see *Re-measurement*.
- **#3** — the fixture must force `src/text.js` instead of suggesting it before
  the case can leave `manual`.
- **#2** — re-diagnose the load defect in light of the canary: #1 loaded 12/12
  while #2 lost 3/5 and #8 lost 1/5, so TASK-10's aggregate ~23% is case-specific
  here, not a universal miss.
- **Judge calibration** — the judge calls an expectation `unverifiable` when the
  evidence sits in a tool call; #1 with and #7 control are the clearest cases.
  Either give the judge the evidence or stop it from failing those runs.
- **Control-arm isolation** — `--no-skill` denies the skill tool and stages
  nothing, but the child can still read `/Users/wendell/.agents/skills/…` and
  stale copies under `/private/var/folders/…/T/opencode`. Two control transcripts
  did exactly that. Close the filesystem path before the next matrix.
