# `review-code` matrix — 2026-11-01, control re-measured 2026-11-02

Measured after `c876d88`, which stopped staging `references/evals.md` and
`references/evals/` into the agent's workspace. Four cases, two models, two arms,
**five repetitions per cell**. The with-skill cells are the 2026-11-01 run
(`2026-11-01T21-50-03--matrix` … `2026-11-01T22-18-10--matrix--…`); the control
cells were re-measured on 2026-11-02 at `b44f0d4`
(`2026-11-02T09-58-38--matrix--without-skill`,
`2026-11-02T10-08-45--matrix--opencode-go-gpt-6-luna--without-skill`) because the
first publication scored them with a broken assertion. 120 agent runs in total.

## What the arms mean

- **with skill** — the skill is copied into `<scratch>/.opencode/skills/review-code/`
  and shadows any global install; the gate requires that copy to be the one that
  loaded.
- **without skill** — `--no-skill`: nothing is staged and the `skill` tool is
  denied. This measures "not auto-loaded", not "text unreachable".

A cell reads `passed/5`. The aggregate is over the four cases, out of 20.

## Results

**opencode-go/deepseek-v4.1-flash** (config default)

| case | with skill | without skill |
| --- | --- | --- |
| #1 review against SPEC-0007 | 5/5 | 0/5 |
| #2 missing AC-2, deleted test | 5/5 | 5/5 |
| #3 branch with no spec | 5/5 | 0/5 |
| #4 spec moved after the stamp | 5/5 | 0/5 |
| **aggregate** | **20/20** | **5/20** |

**opencode-go/gpt-6-luna**

| case | with skill | without skill |
| --- | --- | --- |
| #1 review against SPEC-0007 | 5/5 | 0/5 |
| #2 missing AC-2, deleted test | 5/5 | 4/5 |
| #3 branch with no spec | 5/5 | 0/5 |
| #4 spec moved after the stamp | 5/5 | 0/5 |
| **aggregate** | **20/20** | **4/20** |

With the skill: 40/40. Without it: 9/40.

The control numbers were 1/20 and 0/20 until the correction below, and the only
pass in them turned out to be a measurement bug rather than a behaviour.

## Why the control failed

Every red cell below 5/5, with the assertion that failed.

| case | deepseek | luna |
| --- | --- | --- |
| #1 | `verdict APPROVE`, `reply Not verified`, `ranpass npm test` | `verdict APPROVE`, `reply Not verified`, `reply AC-3` |
| #2 | — (passes 5/5) | `verdict REJECT` in 1 of 5; passes 4/5 |
| #3 | returns a verdict where the skill withholds | returns a verdict where the skill withholds |
| #4 | `verdict REJECT`, `reply spec hash:.*mismatch` | `verdict REJECT`, `reply spec hash:.*mismatch` |

Without the skill the review is plausible and wrong in three directions: it
approves a change whose gate was never run (#1), it reviews against a spec that
moved underneath the prompt and approves the result (#4), and it answers a
request with no spec at all by returning a verdict — mostly "request changes" —
instead of asking for the intent or withholding (#3).

#2 is the exception, and it is worth stating plainly: both models spot a deleted
test and a missing AC when the diff is small, so the control passes 9 of 10
reps. That case no longer discriminates; what separates the arms is #1, #3 and
#4.

## Correction: two assertion bugs, both flattering the skill

The first publication counted 1/20 and 0/20 in the control arms. Both numbers
were wrong, in the direction that made the skill look indispensable. Two separate
defects produced them, and neither was a behaviour.

**1. `verdict` read capitalisation, not stance.** The assertion demanded a line
beginning with uppercase `VERDICT:`. Both control arms wrote `Verdict: REJECT** —
AC-2 is unimplemented…`: the stance, the evidence, the right answer, in sentence
case. The assertion reported "no VERDICT: line", the rep failed, and the matrix
credited the skill for a decision the control had already made. Seven reps in #2
were affected.

**2. The #3 guard required a label.** `noreply` matched a stance only after
`verdict:`. The control often writes the stance without one — `## Review:
**Request changes**`, `**Request changes** — one issue found.`,
`### Verdict` with the answer on the next line. Three reps passed #3 that should
have failed, including the single pass behind the original "1/20".

What changed:

- `verdict` reads the stance from a closed vocabulary — `VERDICT`, `Verdict`,
  `Veredicto`, `Parecer`; accents, case and markdown ignored; the stance may sit
  on the next line when the label is a heading. A word outside the list still
  compares literally, so extending it is a change made on evidence.
- `review-code` #3's guard names the stance in English and Portuguese and matches
  it as a heading or in emphasis, not only after a label. It still ignores
  "cannot approve", which is the withhold the case wants.

How the numbers were obtained: the control cells were **run again** on
2026-11-02 (40 agent runs) and the two prose passes in luna #3 were re-judged
with `node scripts/replay-evals.mjs`, which evaluates recorded transcripts
without a model. The with-skill arm did not move — 40/40 before and after,
verified by replay over all 80 transcripts.

One honest note on spread: luna #2 scored 0/5 in the 2026-11-01 cell and 4/5 in
the 2026-11-02 cell. Same model, same case, same fixture — the difference is
sampling, and it is larger than the one-repetition margin the spec allows. Five
repetitions per cell is enough to see a direction, not to publish a per-case
rate.

## Parity with Promptfoo — the path, not the measurement

`review-code` #3, both arms, three repetitions each, through
`scripts/promptfoo/provider.mjs`:

| arm | Promptfoo | runner (same case) |
| --- | --- | --- |
| with skill | 3/3 | 5/5 |
| without skill | 0/3 | 0/5 |

Both arms agree in direction, and the provider's `metadata.status` matched the
generated assertion on all six runs (0 mismatches). The runner's single control
pass on this case was the label-dependent false pass corrected above; once it is
re-judged, the two front ends agree exactly. Parity is still checked on one case
as a path test, not as a measurement.

## Integrity

Zero of the 120 transcripts read `references/evals.md`. The staging fix holds for
this run:

```sh
grep -rn "references/evals.md" ~/.local/share/opencode/evals/runs/<run>/cases | wc -l
# 0
```

## Reproducibility

The default with-skill cell was run again (`2026-11-01T22-25-20--matrix`, repo
sha `882807b`): 20/20 again, identical case by case — 5/5 on each of the four.
The observed spread is zero, well inside the one-repetition margin the spec
allows; had it moved, the new number would be here instead of this sentence.

## Not comparable with earlier figures

Anything measured before `c876d88` was produced with the eval corpus readable
inside the workspace. Those numbers are not a smaller or larger version of these;
they answer a different question. The first case re-measured after the fix,
`audit-docs` #3, moved from 3/3 to 0/3 loads, which is the size of the distortion
this measurement avoids.

One footnote on provenance: the first cell recorded repo sha `baf9a32` because
the layout commit landed while it ran; the code that executed was the same
working tree, and the other three cells recorded `d9b97a8`.

## Commands

```sh
node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --run
node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --no-skill --run
node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --model opencode-go/gpt-6-luna --run
node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --model opencode-go/gpt-6-luna --no-skill --run

node scripts/emit-promptfoo.mjs --skill review-code --case 3 --arms with-skill,without-skill --models default --out /tmp/parity.yaml
npx promptfoo eval -c /tmp/parity.yaml --repeat 3
```
