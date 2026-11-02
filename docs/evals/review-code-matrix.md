# `review-code` matrix — 2026-11-01, revised 2026-11-02

Measured after `c876d88`, which stopped staging `references/evals.md` and
`references/evals/` into the agent's workspace. **Three cases**, two models, two
arms, **five repetitions per cell**: 60 agent runs. The with-skill cells are the
2026-11-01 run (`2026-11-01T21-50-03--matrix` … `2026-11-01T22-18-10--matrix--…`);
the control cells were re-measured on 2026-11-02 at `b44f0d4`
(`2026-11-02T09-58-38--matrix--without-skill`,
`2026-11-02T10-08-45--matrix--opencode-go-gpt-6-luna--without-skill`) because the
first publication scored them with a broken assertion. The fourth case was
retired on 2026-11-02; the measurement that retired it is below.

## What the arms mean

- **with skill** — the skill is copied into `<scratch>/.opencode/skills/review-code/`
  and shadows any global install; the gate requires that copy to be the one that
  loaded.
- **without skill** — `--no-skill`: nothing is staged and the `skill` tool is
  denied. This measures "not auto-loaded", not "text unreachable".

A cell reads `passed/5`. The aggregate is over the three cases, out of 15.

## Results

**opencode-go/deepseek-v4.1-flash** (config default)

| case | with skill | without skill |
| --- | --- | --- |
| #1 review against SPEC-0007 | 5/5 | 0/5 |
| #3 branch with no spec | 5/5 | 0/5 |
| #4 spec moved after the stamp | 5/5 | 0/5 |
| **aggregate** | **15/15** | **0/15** |

**opencode-go/gpt-6-luna**

| case | with skill | without skill |
| --- | --- | --- |
| #1 review against SPEC-0007 | 5/5 | 0/5 |
| #3 branch with no spec | 5/5 | 0/5 |
| #4 spec moved after the stamp | 5/5 | 0/5 |
| **aggregate** | **15/15** | **0/15** |

With the skill: 30/30. Without it: 0/30.

A perfect separation is exactly the kind of number that should make a reader
suspicious, so read it with the next two sections: the cases that survived are
the ones where the failure is procedural, and the case that was dropped is the
one where the control could read the code well enough on its own.

## Re-measured under home isolation

These cells were produced before the harness isolated the child's home, so the
agent saw every skill installed on the machine. Re-running the same four cells,
same models, same five repetitions, same cases, on `61978f1`:

| case | flash, with | flash, without | luna, with | luna, without |
| --- | --- | --- | --- | --- |
| #1 review against SPEC-0007 | 5/5 | 0/5 | 5/5 | 0/5 |
| #3 branch with no spec | 5/5 | **1/5** | 5/5 | **3/5** |
| #4 spec moved after the stamp | 5/5 | 0/5 | 5/5 | 0/5 |
| **aggregate** | **15/15** | **1/15** | **15/15** | **3/15** |

The skill arm is unchanged at 30/30. The control is not 0/30 any more: it is
**4/30**, and all four sit in case #3.

That is the outcome worth having measured. The control run that passed did not
approve a branch it had no spec for — it stayed silent: described the diff,
mentioned the spec, emitted no verdict. Case #3's assertions ask for exactly
that absence, so a bare agent that never judges satisfies them. The published
`0/5` was a model that confidently approved; the model of today sometimes just
describes, and the assertion cannot tell "refused because there is no spec" from
"did not judge at all".

So the honest reading of the matrix is narrower than the headline: the skill
separates on #1 and #4 (0/5 either model, either way), and on #3 it separates
from *confident approval*, not from silence. Strengthening #3 to require the
refusal — asking for intent, or naming what cannot be verified — is a separate
change with its own measurement, recorded as TASK-16.

## Case #2 left the matrix

`#2` was the fourth matrix case: a branch that misses AC-2 and deletes a test.
On 2026-11-02 its fixture was replaced with a harder one — rounding applied to
the subtotal instead of the total, with the added test asserting the noisy value
`21.639174999999998` — on the theory that a defect visible only against the spec
would separate the arms.

It did not. Both arms scored **5/5** on the new fixture, and the control
transcripts say why: all five found `docs/specs/SPEC-0007-cart-tax.md`, computed
`19.99 × 1.0825`, and cited AC-2 as blocking — without being told a spec existed.
The control reads code and probes edge cases well. What it does not do is run the
gate, withhold when there is no spec, or notice that the spec moved.

A diff-reading case is therefore non-discriminating by construction: whatever a
reviewer can see in the code, the control sees too. `#2` dropped the `matrix` tag
and stays as a regression case — it fails a reviewer that misses an obvious AC
violation, or one that approves because the suite is green. New-fixture runs:
`2026-11-02T10-27-26--review-code` (5/5) and
`2026-11-02T10-31-40--review-code--without-skill` (5/5).

## Why the control failed

Every red cell below 5/5, with the assertion that failed.

| case | deepseek | luna |
| --- | --- | --- |
| #1 | `verdict APPROVE`, `reply Not verified`, `ranpass npm test` | `verdict APPROVE`, `reply Not verified`, `reply AC-3` |
| #3 | returns a verdict where the skill withholds | returns a verdict where the skill withholds |
| #4 | `verdict REJECT`, `reply spec hash:.*mismatch` | `verdict REJECT`, `reply spec hash:.*mismatch` |

Without the skill the review is plausible and wrong in three directions: it
approves a change whose gate was never run (#1), it reviews against a spec that
moved underneath the prompt and approves the result (#4), and it answers a
request with no spec at all by returning a verdict — mostly "request changes" —
instead of asking for the intent or withholding (#3).

## Correction: two assertion bugs, both flattering the skill

The four-case publication counted 1/20 and 0/20 in the control arms. Both numbers
were wrong, in the direction that made the skill look indispensable. Two separate
defects produced them, and neither was a behaviour.

**1. `verdict` read capitalisation, not stance.** The assertion demanded a line
beginning with uppercase `VERDICT:`. Both control arms wrote `Verdict: REJECT** —
AC-2 is unimplemented…`: the stance, the evidence, the right answer, in sentence
case. The assertion reported "no VERDICT: line", the rep failed, and the matrix
credited the skill for a decision the control had already made. Seven reps were
affected.

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
2026-11-02 (40 agent runs) and the prose passes in luna #3 were re-judged with
`node scripts/replay-evals.mjs`, which evaluates recorded transcripts without a
model. The with-skill arm did not move for #1, #3 and #4 — verified by replay
over all 80 transcripts.

One honest note on spread: on the retired fixture, luna #2 scored 0/5 in the
2026-11-01 cell and 4/5 in the 2026-11-02 cell. Same model, same case — the
difference is sampling, and it is larger than the one-repetition margin the spec
allows. Five repetitions per cell is enough to see a direction, not to publish a
per-case rate.

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

Zero transcripts from the matrix runs read `references/evals.md`. The staging fix
holds:

```sh
grep -rn "references/evals.md" ~/.local/share/opencode/evals/runs/<run>/cases | wc -l
# 0
```

## Reproducibility

The with-skill cell was run again on 2026-11-01 (`2026-11-01T22-25-20--matrix`,
repo sha `882807b`): identical case by case at the time, 5/5 on each of the four
cases including the then-current #2. With #2 retired the claim is 15/15, which
those runs already contain. The observed spread on the with-skill arm is zero,
well inside the one-repetition margin the spec allows.

## Not comparable with earlier figures

Anything measured before `c876d88` was produced with the eval corpus readable
inside the workspace. Those numbers are not a smaller or larger version of these;
they answer a different question. The first case re-measured after the fix,
`audit-docs` #3, moved from 3/3 to 0/3 loads, which is the size of the distortion
this measurement avoids.

One footnote on provenance: the first cell recorded repo sha `baf9a32` because
the layout commit landed while it ran; the code that executed was the same
working tree, and the other three cells recorded `d9b97a8`.

These runs also predate home isolation (`lib/evals/isolation.mjs`): the child saw
every skill installed on the machine, not just the one under test. All thirty
loaded `review-code`, so no miss landed here, but the environment was the one
that later produced a 23% miss rate on other cases. The cells were re-run under
isolation anyway — see *Re-measured under home isolation* — and the control moved
from 0/30 to 4/30.

## Commands

```sh
node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --run
node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --no-skill --run
node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --model opencode-go/gpt-6-luna --run
node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --model opencode-go/gpt-6-luna --no-skill --run

node scripts/emit-promptfoo.mjs --skill review-code --case 3 --arms with-skill,without-skill --models default --out /tmp/parity.yaml
npx promptfoo eval -c /tmp/parity.yaml --repeat 3
```
