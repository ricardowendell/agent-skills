# Discriminating cases

Three cases where the two arms differ on a machine-checkable assertion, measured
with repetition at one detector. This is the set issue #5 asks for: a consumer can
pin the commit, run both arms, and get a consistent difference. One case is a
**holdout**, frozen before the measurement and never used to design the change it
measures.

Measured at `a7cb10e`, detector v2 (`71bfb85a91cd68ab`), five draws per arm, on
`agentworks/deepseek-v4-1-flash` (the default `opencode-go` route was over its
weekly limit). Every run is clean: `check-eval-run` reports `findings=0
warnings=0 skillLeaks=0 hostReads=0 isolated=yes`.

| case | assertion | with skill | control | control fails on | holdout |
| --- | --- | --- | --- | --- | --- |
| `implement-from-prompt` #1 | `filematch docs/specs/SPEC-0007-demo.md status: implemented` | **5/5** | **0/5** | the spec is never marked `implemented` | no |
| `implement-from-prompt` #8 | `nofile src/format.js` | **5/5** | **0/5** | the control invents the missing module | no |
| `review-code` #7 | `verdict REJECT` | **5/5** | **0/5** | 3/5 approve despite the red gate; 2/5 name the red gate but do not emit `VERDICT: REJECT` | **yes** |

The holdout was named in `SPEC-0033` at `5fe56fc` before the first draw. Its
result was read only after the other two were classified. Two more clean
separators from the same re-measure are listed at the end; they are not part of
the held-out three.

The holdout's control is the least clean of the three: it fails the machine
assertion 5/5, but for two different reasons. `r1`/`r2` recognize the red gate
and call the branch not approvable without emitting the `REJECT` token;
`r3`/`r4`/`r5` approve despite the gate. The case separates on the output the
assertion checks, and the `why:` says so instead of claiming a uniform judgment
difference.

## Runs and hashes

| case | arm | run directory | fixture | prompt | skill |
| --- | --- | --- | --- | --- | --- |
| `implement-from-prompt` #1 | with skill | `2026-11-07T08-57-39--implement-from-prompt--agentworks-deepseek-v4-1-flash` | `3fa05dd7cb66ca7a…` | `2ce72f34b04fdfab…` | `0389466e65d1e093…` |
| `implement-from-prompt` #1 | control | `2026-11-07T08-59-39--implement-from-prompt--agentworks-deepseek-v4-1-flash--without-skill` | `3fa05dd7cb66ca7a…` | `2ce72f34b04fdfab…` | — |
| `implement-from-prompt` #8 | with skill | `2026-11-07T09-01-25--implement-from-prompt--agentworks-deepseek-v4-1-flash` | `2d18a74716be6f0d…` | `537d74bbff005722…` | `0389466e65d1e093…` |
| `implement-from-prompt` #8 | control | `2026-11-07T09-04-41--implement-from-prompt--agentworks-deepseek-v4-1-flash--without-skill` | `2d18a74716be6f0d…` | `537d74bbff005722…` | — |
| `review-code` #7 | with skill | `2026-11-07T09-07-52--review-code--agentworks-deepseek-v4-1-flash` | `2c68007ef6148781…` | `4f33a2532b0b331a…` | `e63daed34099e20d…` |
| `review-code` #7 | control | `2026-11-07T09-11-14--review-code--agentworks-deepseek-v4-1-flash--without-skill` | `2c68007ef6148781…` | `4f33a2532b0b331a…` | — |

`fixtureHash` and `promptHash` match across the two arms of each case;
`skillHash` is absent on the control, which stages no skill. Full values:

```text
#1  fixture 3fa05dd7cb66ca7a50ee038ca51279dec620f86d99bd1dc0324fb26287b33f2b
    prompt  2ce72f34b04fdfaba1c67f05f0df0eb114d4b7180566a03a1c1abb8d63604fa8
    skill   0389466e65d1e09327c54d7f392a6293897840c9503296b940b356ad30321076
#8  fixture 2d18a74716be6f0dc56e538d6bc72f211d30841b8c4aaa74af9e7b0e74583779
    prompt  537d74bbff005722c2ec7264fa0691fdb307fe42d98b1187b4bad084b2e89595
    skill   0389466e65d1e09327c54d7f392a6293897840c9503296b940b356ad30321076
#7  fixture 2c68007ef6148781d519908e6108c5fc2ef7463bf72b16a7209688dc3eb7efd2
    prompt  4f33a2532b0b331a6b406f32f2e0402ee5c73802a908ced65acb182b09433b74
    skill   e63daed34099e20de8d7c8962d8ce97ac5a66346a7a6f09c150bf49910411bff
```

The case metadata carries the claim: `why:` says what the case measures and why
the without-arm fails; `tags:` marks `separator`, and `review-code` #7 also
`holdout`.

## What changed, and what did not

The three cases already existed. This set added metadata and the measurement; no
prompt, fixture, assertion or skill text changed. The earlier v1 rows stay where
they are as history. The 0.5.0 numbers for `implement-from-prompt` #1/#8 were
12/12 vs 0/12 on the default model, and on `gpt-6-luna` #1 was 5/5 vs 0/5 while
#8 was 5/5 vs 1/5 (the one pass was the #8 control); this set is a v2 re-measure
on a different model route, so it is not a delta on those numbers.

## Reproduce

```sh
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 \
  --repeat 5 --model agentworks/deepseek-v4-1-flash --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 \
  --repeat 5 --no-skill --model agentworks/deepseek-v4-1-flash --run
# repeat for #8 and review-code #7
```

## Also qualifying — the default-model extras

SPEC-0031's first attempt (default model, v2) already produced two more clean
separators. They are not part of the held-out three, but a consumer can use them:

| case | assertion | with skill | control | run directories |
| --- | --- | --- | --- | --- |
| `process-inbox` #1 | `unchanged docs/inbox/2026-01-01-digest-email.md` + `nodir docs/backlog` | **5/5** | **0/5** | `2026-11-07T02-45-54--process-inbox`, `2026-11-07T03-08-51--process-inbox--without-skill` |
| `write-implementation-prompt` #2 | `nodir docs/prompts` | **5/5** | **0/5** | `2026-11-06T19-28-47--write-implementation-prompt`, `2026-11-07T03-01-29--write-implementation-prompt--without-skill` |

Both pairs are on `opencode-go/deepseek-v4.1-flash`, detector v2, and all four
runs are clean. The `write` skill arm is at `dcf5177` and its control at
`eb9903e`; their `fixtureHash`/`promptHash` match, so the pair is valid.

## Limits

- Five draws show a direction, not a population rate. The issue asks for n≥3;
  this set uses n=5.
- The model route differs from the 0.5.0 matrices. The two arms of each case
  share it, so the separation is internal to this set.
- `review-code` #7 separates on the required verdict token, not on a uniform
  judgment: 3/5 controls approve and 2/5 recognize the red gate without emitting
  `VERDICT: REJECT`. The two `implement-from-prompt` cases fail the same
  assertion in all five controls.
- The run `manifest.json` counts `passed`/`failed` per case, not per draw; the
  per-draw numerator and denominator are in `cases/*/result.json`
  (`passed`/`reps`). Use the latter to audit a five-draw cell.
- A control that reads the install is excluded, not scored. These six runs had
  no such read; the SPEC-0031 cells did, and their unresolved verdict stands.
