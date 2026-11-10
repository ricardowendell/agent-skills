---
spec: SPEC-0049
spec_sha: 9790e0423d8b1f2e68110d8461ac17ca35780bdd68d2a6720fb0289771bc06cb
---

# Implementation Prompt: SPEC-0049 A corpus hit under enforcement is a denied attempt

## Source Spec

- `docs/specs/SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt.md` (pin `9790e042…`)
- Prerequisites: `SPEC-0046` (boundary, implemented), `SPEC-0048` (denied split, implemented)
- Unblocks: `SPEC-0047` (paused at its second F0.1)

## Requirements

**User outcome.** An enforced run that only *tried* to read the corpus is clean,
the attempt is still counted as `denied`, and a pre-v3 run that already looked
for host reads is judged by that capability, not by its hash.

**Two measured defects.**

1. SPEC-0047's resumed control ran `ls /Users/wendell/.agents/skills 2>/dev/null`
   and the detector published a `leak`: no line names that path with
   `Operation not permitted`, only the parent `/Users/wendell/.agents/` and
   `/Users/wendell/.agents/commands` do. The profile denies the whole checkout,
   and the canary proves it covers every corpus root — asking the transcript to
   re-prove each refusal is redundant and unreliable.
2. `runcheck.mjs:233` decides `isolated` by digest equality while
   `evidence.mjs` already accepts a run by the `host-reads` capability. A v2 run
   is `isolated=unknown` to one reader and acceptable to the other, which
   invalidated SPEC-0047's reused with-skill arm for no evidential reason.

**Scope (from the spec):**

- `findLeaks`/`leaksIn` receive the run's enforcement state.
- Under `enforced: true`, a corpus hit is `denied` unless the call demonstrably
  returned that path's content.
- Without enforcement, the v2 rule is unchanged (attempt = `leak`/`host`).
- `runcheck` decides `isolated` by `hasCapability(version, "host-reads")`.
- The replay proves both: #19 control `10-59-41` clean 5/5 with `deniedDraws ≥ 1`,
  with-skill `07-37-44` `isolated=yes`.
- Coverage rule and `CHANGELOG` entry.

**Acceptance criteria** (copied from the spec):

- AC-1 — under `enforced: true`, a corpus path named in a call that returned no
  content for it (including `… 2>/dev/null`) is `denied`, not `leak`/`host`.
- AC-2 — the same transcript with `enforced: false` still produces a leak/host.
- AC-3 — a call that demonstrably returned the path's content still produces a
  `leak`, even under enforcement.
- AC-4 — `runcheck` decides `isolated` by `host-reads`: v2 clean → `yes`, v1 →
  `unknown`, and it matches `check-evidence` for the same run.
- AC-5 — the replay: control `10-59-41` five clean, `deniedDraws ≥ 1`,
  `isolated=yes`; with-skill `07-37-44` `isolated=yes`. Recorded in `## Results`.
- AC-6 — the detector version moved if the classification changed;
  `check-evidence` exits 0 without rewriting a citation.
- AC-7 — no boundary, case, fixture, skill text, template or Python change; every
  `tests:` command passes.

**Non-goals.** No boundary change, no paid draw, no re-run, no cell verdict, no
five-draw change, no fixture edit.

## Entities

| Term | Meaning |
| --- | --- |
| **enforced** | `params.isolation.enforced === true` on the run manifest |
| **demonstrable content** | a non-shell tool result carrying content, or a shell output line naming the path outside a denial line |
| **corpus hit** | `{ tool, path, kind }`, `kind` ∈ `leak`/`host`/`denied` |
| **capability** | `host-reads`; the property an `isolated=yes` claim needs |

## Approach

Thread the state, do not re-derive it. `run-evals.mjs:667` has
`ISOLATION_RECORD`; `replay-evals.mjs:270` has the manifest. Pass
`{ enforced }` into `leaksIn`/`findLeaks` and make the default `false` so every
existing caller keeps the v2 meaning.

Under enforcement, keep SPEC-0048's per-path rules first (exact denial, directory
denial with no content, non-shell success override). Only the residual case — a
corpus hit with no denial proof and no demonstrable content — flips from
`leak`/`host` to `denied`. That is the suppressed-probe case.

`runcheck` already imports from `leak.mjs`; replace the digest comparison with
`hasCapability(v, "host-reads")` for every version in the run. An empty version
list stays `unknown`.

Bump `DETECTOR_VERSION` if the rule set changes; update the golden digest
consciously and keep `evidence.test.mjs` agreeing.

## Structure

- `scripts/lib/evals/leak.mjs` — `findLeaks`, `leaksIn`, `classifies`,
  `DETECTOR_RULES`, `DETECTOR_VERSION`, `hasCapability`.
- `scripts/lib/evals/runcheck.mjs:233,253` — the `isolated` derivation.
- `scripts/lib/evals/evidence.mjs` — already capability-based; confirm agreement.
- `scripts/run-evals.mjs:667`, `scripts/replay-evals.mjs:270` — the two callers.
- `scripts/check-eval-run.mjs` — prints the verdict (no logic change expected).
- `docs/evals/coverage.md`, `CHANGELOG.md`.

## Operations

1. **Thread the flag.** Add `{ enforced = false }` to `findLeaks`/`leaksIn`; pass
   `ISOLATION_RECORD.enforced` in `run-evals.mjs` and the manifest's
   `params.isolation.enforced` in `replay-evals.mjs`. Keep the default `false`.
2. **Enforced branch.** In `findLeaks`, after the existing rules, a corpus hit
   with no demonstrable content under enforcement becomes `kind: "denied"`.
   Unit tests: the exact suppressed-probe shape (command with `2>/dev/null`,
   empty output, parent denied elsewhere) → `denied` under enforcement and
   `leak` without it.
3. **Content override.** Keep and test: a `read` returning content, and a shell
   output line naming the path outside a denial, stay `leak` under enforcement.
4. **Capability verdict.** In `runcheck`, use `hasCapability`; tests: v2 digest
   with a clean run → `isolated=yes`; v1 → `unknown`; unknown digest →
   `unknown`; and the same run judged by `check-evidence` agrees.
5. **Version.** Bump if the rules change; update the golden.
6. **Replay proof.** Re-judge both stored runs read-only and record before/after
   in `## Results`. Control `10-59-41` must go from
   `skillLeaks=1 hostReads=0 isolated=no` to `skillLeaks=0 hostReads=0
   isolated=yes deniedDraws=1` with five clean draws; with-skill `07-37-44` must
   go from `isolated=unknown` to `isolated=yes` with zero findings. Do not
   publish a cell verdict.
7. **Publication.** In `docs/evals/coverage.md`, state that under enforcement a
   corpus hit is a denied attempt unless content is demonstrable, and that the
   isolation verdict is capability-based. `CHANGELOG` entry.
8. **Gates.** Run the eight `tests:` commands with `node`.

## Norms

- `node`, not bun. Tests next to the module.
- A rule change bumps `DETECTOR_VERSION`; never edit the golden without changing
  the rule that produced it.
- Comments explain *why*, citing the 10-59-41 measurement.
- Commit: `feat(SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt): <summary>`.

## Safeguards

- Do not apply the enforced rule when the manifest does not say
  `enforced === true`.
- Never mark a demonstrable content read `denied`.
- Do not touch the seatbelt boundary, the corpus roots, any case, fixture, skill
  text, template or Python.
- Do not run a paid draw. The replay reads stored transcripts only.
- Do not publish a cell verdict and do not change the five-draw rule.
- Do not touch issue #12 or TASK-70.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | Unit: suppressed probe → `denied` under `enforced: true` |
| AC-2 | Unit: the same call with `enforced: false` → `leak` |
| AC-3 | Unit: a `read` with content and a shell output naming the path → `leak` under enforcement |
| AC-4 | Unit: v2 clean run `isolated=yes`, v1 `unknown`, and agreement with `check-evidence` |
| AC-5 | The replay output recorded in the spec matches the two before/after lines |
| AC-6 | `DETECTOR_VERSION` differs; `check-evidence` exits 0 |
| AC-7 | The eight `tests:` commands exit 0; `git diff --name-only` ⊆ `files:` |

Done when the replay shows both runs clean under the new rule and the eight
gates are green.
