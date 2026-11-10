---
id: SPEC-0052
title: The eval store is an answer key
status: implemented
priority: P1
task: TASK-77
created_at: 2026-11-09
updated_at: 2026-11-09
source_docs:
  - backlog/tasks/task-77 - evals-o-eval-store-e-oraculo-e-nao-esta-negado-nem-detectado.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0046-deny-control-arm-corpus.md
  - docs/specs/SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt.md
  - docs/specs/SPEC-0051-content-counts-only-for-the-path-it-names.md
  - docs/specs/SPEC-0050-measure-the-four-remaining-cells.md
related_decisions: []
depends_on:
  - SPEC-0046-deny-control-arm-corpus
  - SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt
  - SPEC-0051-content-counts-only-for-the-path-it-names
blocks: []
files:
  - scripts/lib/evals/isolation.mjs
  - scripts/lib/evals/isolation.test.mjs
  - scripts/lib/evals/leak.mjs
  - scripts/lib/evals/leak.test.mjs
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/SPEC-0052-the-eval-store-is-an-answer-key.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/SPEC-0052-the-eval-store-is-an-answer-key.md --base main
---

# SPEC-0052: The eval store is an answer key

## Purpose

The eval store under `~/.local/share/opencode/evals` holds the answer keys
(`<skill>/<n>.md`), every previous transcript and every previous result. It is
the most direct oracle in the repository, and neither the boundary nor the
detector covers it.

SPEC-0050 measured the consequence. The `groom-backlog` #2 control draw `r2`
read, through the symlink the isolated home inherits for `.local`:

- `evals/groom-backlog/2.md` — the answer key (44.9 KB);
- `evals/groom-backlog--agentworks-deepseek-v4-1-flash/2.r*.md` — prior
  transcripts, including the **with-skill** arm;
- the previous `2.json` and `last-run.json`.

The reply mirrors the prior answer. The draw was published as clean because
`corpusRoots` does not include the store and `RULES` has no rule for it. The
classification survived only because the other four control draws also pass; the
hole itself stands for every future wave.

## User Outcome

A control draw cannot learn the answer from a previous run. The store is denied
under enforcement like the installed skill roots, and a read of it is a named
answer-key finding even when enforcement is off. A cell that previously relied on
store-reading evidence is re-judged to the count it actually supports.

## Scope

- **The whole store is corpus.** `corpusRoots` gains
  `<home>/.local/share/opencode/evals` — every answer key, transcript, result
  and the `baseline.json`/`last-run.json` files. Paths are resolved through
  `realpath`, because the vector measured was the inherited `.local` symlink.
- **Denied under enforcement, for both arms.** The boundary is shared by both
  arms (SPEC-0046), and the with-skill arm can also read a previous answer.
- **A detector rule of its own.** A path inside the store is a `leak`
  (answer key), not `host`. Without enforcement the attempt is a leak (the v2
  rule); under enforcement it is `denied` unless the call demonstrably returned
  that path's content (the SPEC-0051 rule).
- **Re-judge the measured case.** Replay `groom-backlog` #2's control: `r2`
  becomes a store `leak`, the control is 4/5 clean with 4/4 passed, and the
  published row (`4/4 evidentiary`, non-discriminator) is confirmed rather than
  contradicted.
- **Store-wide re-judge.** Re-judge every stored draw and list any that change;
  nothing previously clean may become dirty except a store read.
- **Publication.** `docs/evals/coverage.md` names the store as corpus and removes
  the TASK-77 residual note; `CHANGELOG` entry.

**Blast radius.** The boundary's corpus list and the detector — the two layers
that decide what a control may see and what counts as clean. No skill behaviour,
no case, no fixture.

## Non-Goals

- No re-measurement and no paid draw. The proof is a replay of stored
  transcripts.
- No change to any cell's verdict. `groom-backlog` #2 stays a
  non-discriminator; the published counts must merely agree with the new rule.
- No container, and no change to the seatbelt mechanism (SPEC-0046).
- No new case, no fixture edit, no five-draw change.
- No change to the installed-skill roots or the host roots.

## Flow

1. **F0 — deny.** Add the store to `corpusRoots`; confirm a wrapped read of an
   answer key and of a prior transcript fails.
2. **F1 — detect.** Add the `evalStore` rule and its classification; bump the
   detector version.
3. **F2 — re-judge.** Replay `groom-backlog` #2's control and the whole store;
   list any changed draw.
4. **F3 — publish.** Coverage rule, Known holes, CHANGELOG.

## Data

- `scripts/lib/evals/isolation.mjs` — `corpusRoots`, `installedSkillRoots`,
  `wrapCommand`.
- `scripts/lib/evals/leak.mjs` — `RULES`, `classifies`, `findLeaks`,
  `DETECTOR_VERSION`, `LEGACY_CAPABILITIES`.
- `scripts/lib/evals/isolation.test.mjs`, `leak.test.mjs`.
- Stored runs under `~/.local/share/opencode/evals/`; the measured control
  `2026-11-09T12-55-35--groom-backlog--agentworks-deepseek-v4-1-flash--without-skill`.
- `docs/evals/coverage.md`, `CHANGELOG.md`.

## Acceptance Criteria

1. **The store is denied.** `corpusRoots` includes
   `<home>/.local/share/opencode/evals`, and a wrapped read of
   `<store>/<skill>/<n>.md` and of `runs/<…>/cases/<skill>--<n>/transcript.r1.md`
   fails under the real profile. A test pins both paths.
2. **The read is a named leak.** Without enforcement, a store path hit is a
   `leak` (answer key), not `host` and not silence. Under enforcement it is
   `denied` unless the call demonstrably returned that path's content.
3. **The measured case agrees.** Replaying `groom-backlog` #2's control turns
   `r2` into a store `leak`: the control is 4/5 clean with 4/4 passed, and the
   published `4/4 evidentiary` / non-discriminator row holds.
4. **No silent regression.** A store-wide re-judge lists every draw whose
   verdict changes; every one is a store read. Nothing else becomes dirty.
5. **Version and citations.** `DETECTOR_VERSION` moves; `DETECTOR_CAPABILITIES`
   is unchanged (`host-reads`, `denied-split`); `check-evidence` exits 0 without
   rewriting a published citation.
6. **Nothing else moves.** No case, fixture, skill text, template or Python
   change; every `tests:` command passes.

## Results

Replay-only: no draw was run and no run directory was written. Detector v6 is
`9149d6ab1ca57343` (v5 was `def64b2d6a1baa6e`). `DETECTOR_CAPABILITIES` is
unchanged (`host-reads`, `denied-split`), and `check-evidence` exits 0 with the
published citations untouched.

**The measured case (AC-3).**

```
# before (v5), replay --leaks
groom-backlog#2 → clean  [5 draw(s)]  isolated=yes  deniedDraws=2
Detector def64b2d6a1baa6e: 1 cell(s), 0 dirty. No model, no write.

# after (v6), replay --leaks
groom-backlog#2 → dirty(leak)  [5 draw(s)]  isolated=no  deniedDraws=2
Detector 9149d6ab1ca57343: 1 cell(s), 1 dirty. No model, no write.
```

`r2` is a store leak (`evals/groom-backlog/2.md`, the previous `result.json` and
prior `2.r*.md` transcripts); the other four draws are the evidentiary base and
all four pass. The control is 4/5 clean with 4/4 passed, and the published
`4/4 evidentiary` / non-discriminator row holds.

**The store-wide re-judge (AC-4).** `node scripts/replay-evals.mjs --leaks --all`
over the 321 stored run directories found eight draws that touch the store. Five
moved clean → `leak`, every one a store read:

| run dir | cell | draw | before → after |
| --- | --- | --- | --- |
| `2026-11-02T01-25-09--bootstrap-project-harness` | `#14` | r2 | clean → `leak` |
| `2026-11-06T15-33-16--write-implementation-prompt` | `#5` | r3, r5 | clean → `leak` |
| `2026-11-09T10-59-41--bootstrap-project-harness--…--without-skill` | `#19` | r1 | clean → `leak` |
| `2026-11-09T12-55-35--groom-backlog--…--without-skill` | `#2` | r2 | clean → `leak` |

Three already-dirty draws gained store hits without a verdict change:
`2026-11-04T21-49-16--survey-inflight-work` #3,
`2026-11-06T15-49-43--write-implementation-prompt` #5 r3 and
`2026-11-06T16-02-56--write-implementation-prompt` #5 r4 (already dirty from a
host read of `/Users/wendell/.agents`). Nothing else became dirty: every verdict
change is a store read and no draw gained a non-store hit. The only published
cell counts that move are the two controls: `bootstrap-project-harness` #19 is
4/5 clean with 0/4 passed over the clean base (still a separator, 5/5 vs 0/4)
and `groom-backlog` #2 is 4/5 clean with 4/4 passed (still a
non-discriminator). The details are in `docs/evals/coverage.md`.

**The boundary (AC-1).** The canary test
(`node --test scripts/lib/evals/isolation.test.mjs`) reads a store answer key and
a prior transcript, confirms both are readable without the boundary, and
confirms both fail with `Operation not permitted` under the real profile; it also
confirms `auth.json` beside the store stays readable. It ran on this host
(seatbelt available, no skip).

**Gates (AC-6).** All eight `tests:` commands pass; no case, fixture, skill text,
template or Python file changed.

## Open Questions

- **Whole store or only the answer keys?** Whole store, decided: prior
  transcripts and results are oracles too, and no case needs to read the store.
- **Does the store path vary?** Not today: `OUT_ROOT` is fixed at
  `<home>/.local/share/opencode/evals`. If a future flag moves it, the rule and
  `corpusRoots` must take the same value.
- **Does denying the store break the runner?** No: the parent writes the store;
  only the child is sandboxed.
- **What about `--no-isolate` replays?** They are not measurements; the detector
  still flags a store attempt as a leak, which is the correct reading.

## Prompt Notes

- **Requirements:** add the store to the corpus roots; add and classify the
  detector rule; bump the version; re-judge the case and the store; publish.
- **Entities:** eval store root, answer key (`<skill>/<n>.md`), prior transcript,
  `leak`/`denied`, detector version, capability set.
- **Approach:** derive the store path from `home` in `corpusRoots` (one function,
  one source of truth); add one regex rule; keep the per-path content rule from
  SPEC-0051 ahead of it.
- **Structure:** the boundary stays in `isolation.mjs`; the rule in `leak.mjs`;
  no change expected in `run-evals.mjs` or `replay-evals.mjs`.
- **Operations:** add the root and its tests; add the rule and its tests;
  bump the version and the golden; replay the case and the store; update
  coverage/CHANGELOG; run the eight gates.
- **Norms:** `node`, not bun. A rule change bumps the version; the golden digest
  moves consciously.
- **Safeguards:** never deny `~/.local/share/opencode/auth.json` or the rest of
  `.local` — only the `evals` subtree; never mark a demonstrable content read
  `denied`; no paid draw; no verdict change.
- **Tests:** store root in `corpusRoots`; wrapped read of an answer key and of a
  prior transcript fails; store hit is `leak` without enforcement and `denied`
  under it; content override; the groom `r2` replay.
