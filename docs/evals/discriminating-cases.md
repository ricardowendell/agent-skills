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
| `review-code` #7 | `verdict REJECT` | **5/5** | **0/5** | the control approves with a "pre-existing failure" note | **yes** |

The holdout was named in `SPEC-0033` at `a7cb10e` before the first draw. Its
result was read only after the other two were classified.

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
`skillHash` is absent on the control, which stages no skill. The case metadata
carries the claim: `why:` says what the case measures and why the without-arm
fails; `tags:` marks `separator`, and `review-code` #7 also `holdout`.

## What changed, and what did not

The three cases already existed. This set added metadata and the measurement; no
prompt, fixture, assertion or skill text changed. The earlier v1 rows stay where
they are as history. The 0.5.0 numbers for `implement-from-prompt` #1/#8 were
12/12 vs 0/12 on the default model and 5/5 vs 0/5 and 1/5 on `gpt-6-luna`; this
set is a v2 re-measure on a different model route, so it is not a delta on those
numbers.

## Reproduce

```sh
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 \
  --repeat 5 --model agentworks/deepseek-v4-1-flash --run
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 \
  --repeat 5 --no-skill --model agentworks/deepseek-v4-1-flash --run
# repeat for #8 and review-code #7
```

## Limits

- Five draws show a direction, not a population rate. The issue asks for n≥3;
  this set uses n=5.
- The model route differs from the 0.5.0 matrices. The two arms of each case
  share it, so the separation is internal to this set.
- A control that reads the install is excluded, not scored. These six runs had
  no such read; the SPEC-0031 cells did, and their unresolved verdict stands.
