# Experiment: per-step observability in implementation prompts

Status: hypothesis refuted on the built scenarios; no failing case found. This directory is the
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

## Results, 2026-11-02

Two scenarios, both arms, three repetitions on the hard one.

**s1 — full oracle, spec names the shared helper.** Both arms 1/1 at both stages.
The task is easy enough that either prompt suffices.

**s2 — partial oracle, spec does not name the helper.** The staged tests cover
AC-1 and AC-3; AC-2 (a rejection naming the *physical* line, so two blank lines
push the bad row to line 4) exists only in the spec, so the prompt is the only
thing that can carry it to the implementer.

| measure | A (baseline) | B (candidate) |
| --- | --- | --- |
| stage 1 | 3/3 | 3/3 |
| stage 2 (oracle + scope) | 3/3 | 3/3 |
| AC-2 probe | 3/3 | 3/3 |
| reuses `src/csv.js` | 4/4 | 4/4 |
| prompt size | 7,954 B | 10,450 B (+31%) |
| `src/import.js` lines | 21–26 | 23–29 |
| stage 1 duration | 39.2 s mean | 52.9 s mean |
| stage 2 input tokens | 26.0k mean | 21.1k mean |

The two durations and token counts disagree in direction and the samples are
three runs each, so the only cost signal worth trusting is the artifact itself:
the candidate's prompt is a third larger and its implementation a few lines
longer.

## Second lever: a bare implementer

`implement-from-prompt` brings its own verification discipline, which could have
been masking the prompt's. So the same s2 pair was re-run with `--no-skill`: a
plain build agent, skill tool denied, prompt and tree as the only input.

| implementer | arm A | arm B | AC-2 probe |
| --- | --- | --- | --- |
| `implement-from-prompt` | 3/3 | 3/3 | 3/3 |
| bare agent | 1/1 | 1/1 | 1/1 |

Same result. The confound was not the confound: the baseline prompt already
carries the acceptance criteria and their checks, so a bare agent gets them too.

## Verdict

The hypothesis is **not supported**. On a scenario built specifically so that
the prompt is the only carrier of an acceptance criterion, both arms delivered
it three times out of three. The candidate adds prompt length without a
measurable outcome gain.

Three things follow, and none is a reason to ship the change:

- The baseline skill already does more than this experiment assumed. Its
  Requirements copy ACs verbatim and its Verification maps each AC to a check,
  so "add AC→check mapping" was partly already there.
- Removing the downstream skill did not separate the arms either.
- A prompt is not the only carrier of intent in this pipeline. The implementer
  reads the spec, the oracle and the architecture doc for itself, which is why
  omitting a fact from the prompt did not lose it. A prompt-quality experiment
  has to remove the implementer's ability to recover the missing fact, and that
  is a fixture design problem this experiment did not solve.

## Next

A decisive scenario has to stop the implementer from recovering the missing fact
on its own. Candidates, in order of how much they would prove:

1. **Strip the source of truth.** Stage 2 runs against a tree where the spec's
   flow section is absent and the acceptance oracle covers only what the prompt
   states. If the prompt omits it, nothing else can supply it.
2. **Conflicting sources.** The spec says one thing and the architecture doc
   says another; a prompt that silently picks one loses the conflict, and the
   probe checks which one the implementation followed.
3. **Holdout.** A spec with a manual-only AC, never used while writing a
   candidate.

Until one of these separates the arms, no candidate should be shipped, and the
skill should not be edited to satisfy this experiment.

## Cost

A pair costs about two minutes of agent time (stage 1 ~40 s, stage 2 ~110 s).
Three scenarios plus the holdout, two arms, three repetitions: 24 pairs, roughly
50 minutes.
