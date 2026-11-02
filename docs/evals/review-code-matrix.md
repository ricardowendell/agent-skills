# `review-code` matrix — 2026-11-01

Measured after `c876d88`, which stopped staging `references/evals.md` and
`references/evals/` into the agent's workspace. Four cases, two models, two arms,
**five repetitions per cell**: 80 agent runs. Run directories:
`2026-11-01T21-50-03--matrix` … `2026-11-01T22-18-10--matrix--…`.

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
| #2 missing AC-2, deleted test | 5/5 | 0/5 |
| #3 branch with no spec | 5/5 | 1/5 |
| #4 spec moved after the stamp | 5/5 | 0/5 |
| **aggregate** | **20/20** | **1/20** |

**opencode-go/gpt-6-luna**

| case | with skill | without skill |
| --- | --- | --- |
| #1 review against SPEC-0007 | 5/5 | 0/5 |
| #2 missing AC-2, deleted test | 5/5 | 0/5 |
| #3 branch with no spec | 5/5 | 0/5 |
| #4 spec moved after the stamp | 5/5 | 0/5 |
| **aggregate** | **20/20** | **0/20** |

With the skill: 40/40. Without it: 1/40.

## Why the control failed

Every red cell below 5/5, with the assertion that failed.

| case | deepseek | luna |
| --- | --- | --- |
| #1 | `verdict APPROVE`, `reply Not verified`, `ranpass npm test` | `verdict APPROVE`, `reply Not verified`, `reply AC-3` |
| #2 | `verdict REJECT` | `verdict REJECT` |
| #3 | approves or rejects in prose | approves or rejects in prose |
| #4 | `verdict REJECT`, `reply spec hash:.*mismatch` | `verdict REJECT`, `reply spec hash:.*mismatch` |

The pattern is the same in both models: without the skill the review is
plausible and wrong in all three directions — it approves a change whose gate was
never run (#1), approves a diff that misses an AC and deletes a test (#2), and
reviews code against a spec that moved underneath the prompt (#4). #3 is the only
case the control ever passes, and it does so by lacking a verdict, which is close
to what the skill requires for a different reason.

## Parity with Promptfoo — the path, not the measurement

`review-code` #3, both arms, three repetitions each, through
`scripts/promptfoo/provider.mjs`:

| arm | Promptfoo | runner (same case) |
| --- | --- | --- |
| with skill | 3/3 | 5/5 |
| without skill | 0/3 | 1/5 |

Both arms agree in direction, and the provider's `metadata.status` matched the
generated assertion on all six runs (0 mismatches). The single control pass in
the runner against none in Promptfoo is the flake this case has shown all along,
not an adapter difference — which is why parity is checked on one case and the
arms' counts are not treated as a measurement of anything.

## Integrity

Zero of the 80 transcripts read `references/evals.md`. The staging fix holds for
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
