# Experiment: per-step observability in implementation prompts

Status: mechanic validated, hypothesis not yet measured. This directory is the
working area for TASK-9.

## Hypothesis

`write-implementation-prompt` asks each Operation step to be specific and
committable, but not to say what is observable when it is done or how that is
checked. The candidate adds that, plus the acceptance criterion each step serves.

If the hypothesis is right, prompts from the candidate produce implementations
that satisfy the spec's acceptance criteria and run the gate more often than
prompts from the baseline — without more work and without touching files outside
the prompt's scope.

## Why the measurement is two-stage

The artifact under test is a prompt. Judging the Markdown measures conformance
to a template, which is exactly what this experiment must not reward. So the
prompt is judged by what an implementer produces from it.

- **Stage 1** runs a frozen copy of `write-implementation-prompt` over a fixture
  and produces `docs/prompts/SPEC-0014-*.prompt.md`.
- **Stage 2** runs `implement-from-prompt` over the same fixture, with the
  produced prompt copied in. Assertions are outcome-only.

Both stages use the existing runner. `run.sh` copies the frozen skills and the
fixture into `.work/<arm>/`, which is what `--root` already understands. Nothing
here is part of the harness.

## Frozen baseline

| item | value |
| --- | --- |
| skill A | `A/SKILL.md`, sha256 `5eb1ab0c1d497ab7314d955fb265449fe7c95f4ddad9a44e935b7cf365a45ec1` |
| skill B | `B/SKILL.md`, identical except the Operations paragraph |
| stage-2 skill | `skills/implement-from-prompt/SKILL.md` at the time of the run |
| model | config default (`opencode-go/deepseek-v4.1-flash`) |
| fixture | `fixture/` — a Node ESM repo whose acceptance oracle fails until `src/import.js` exists |
| oracle | `fixture/test/import.test.js`, asserted `unchanged` so it cannot be weakened |

## What stage 2 measures

| measure | how |
| --- | --- |
| AC satisfied | `ranpass node --test`, with the acceptance oracle staged red |
| oracle untouched | `unchanged test/import.test.js` |
| helper reuse | `unchanged src/csv.js` |
| scope | `file src/import.js`, nothing else added |
| cost | duration and tokens from the run artifact |

Deliberately not asserted: the spec status flip to `implemented`. It is the
implementer's own step, it varied between two runs of the same arm, and it is
not a property of the prompt — measured by hand instead.

## Pilot, 2026-11-02

One pair, one repetition, arm A and arm B.

| arm | stage 1 | stage 2 |
| --- | --- | --- |
| A | 1/1 | 1/1 (4/4 assertions) |
| B | 1/1 | 1/1 (4/4 assertions) after the status assertion was dropped |

Both arms pass. That validates the mechanic and says nothing about the
hypothesis: with a visible acceptance oracle, the task is easy enough that both
prompts are sufficient. The next scenario has to put the difficulty where the
prompt is the only thing that can carry it — see "Next" below.

## Next

Build scenarios where the baseline plausibly fails, and keep one holdout that is
never used to develop the change:

1. **Partial oracle** — the staged tests cover AC-1 and AC-3 only; AC-2 (the
   rejection that names a line) is checked by a source assertion. The prompt has
   to convey AC-2 for the implementer to satisfy it.
2. **DRY trap** — the helper that must be reused is not mentioned in the spec,
   only in the architecture doc, and the stage-2 assertion checks that
   `src/csv.js` stays untouched while the new module still passes.
3. **Sequencing** — a spec whose steps only work in one order, so a prompt that
   lists them as unordered bullets produces a red gate.
4. **Holdout** — a spec with a manual-only AC, never used while writing B.

## Cost

A pair costs about two minutes of agent time (stage 1 ~40 s, stage 2 ~110 s).
Three scenarios plus the holdout, two arms, three repetitions: 24 pairs, roughly
50 minutes.
