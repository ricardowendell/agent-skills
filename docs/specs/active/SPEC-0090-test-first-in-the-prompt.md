---
id: SPEC-0090
title: The generated prompt asks for the test first, and the run shows it red
status: ready
priority: P1
task: TASK-118
created_at: 2026-11-14
updated_at: 2026-11-14
source_docs:
  - backlog/tasks/task-118 - evals-o-prompt-gerado-pede-o-teste-primeiro-e-o-run-mostra-o-vermelho.md
  - skills/write-implementation-prompt/SKILL.md
  - skills/implement-from-prompt/SKILL.md
  - evals/write-implementation-prompt/cases.md
  - evals/implement-from-prompt/cases.md
  - docs/evals/coverage.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills/write-implementation-prompt/SKILL.md
  - evals/write-implementation-prompt/cases.md
  - evals/corpus-baseline.json
  - evals/implement-from-prompt/cases.md
  - evals/implement-from-prompt/fixtures/13/AGENTS.md
  - evals/implement-from-prompt/fixtures/13/package.json
  - evals/implement-from-prompt/fixtures/13/src/index.js
  - evals/implement-from-prompt/fixtures/13/docs/specs/SPEC-0001-slug.md
  - evals/implement-from-prompt/fixtures/13/docs/prompts/SPEC-0001-slug.prompt.md
  - scripts/lib/tdd-signature.mjs
  - scripts/lib/tdd-signature.test.mjs
  - scripts/check-tdd-signature.mjs
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0090-test-first-in-the-prompt.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0090-test-first-in-the-prompt.md --base main
---

# SPEC-0090: The generated prompt asks for the test first, and the run shows it red

## Purpose

A baseline over **307 already-paid draws** of `implement-from-prompt` (cells 1, 4
and 8, both arms, 2026-11-02 to 2026-11-07) found:

- a test file written before the implementation in **43/307 (14%)** draws;
- a test command that failed **before** the implementation in **0/307** draws —
  the red step has never happened, in any draw, on any cell;
- in cell 8, whose prompt artifact never mentions tests, the skill arm writes a
  test in **3/120 (2%)**: the executor does not invent tests the contract does
  not ask for, by design.

The cause is upstream. `write-implementation-prompt`'s section guidance
(`SKILL.md:73`) prescribes the default Operations order:

> migration → domain types → repository → server helpers → UI → **tests** →
> spec status update

Tests are second to last, and nothing asks the coder to see a test fail. The
existing artifacts confirm it: case 1's fixture prompt orders "1. add `double`,
2. add a test", and cell 1's transcripts show the test and the implementation
written in the *same* batch, the first test run already green.

This spec moves the default order in the generator to test-first, adds the
red step to the artifact, and measures whether the executor honours it **without
any change to `implement-from-prompt`**.

## User Outcome

A reader of `docs/evals/coverage.md` sees that the generated prompt names the
failing test before the implementation, that one cell was re-measured under the
new shape (with the old 5/5 kept as history), and that the executor's transcripts
were scored for the red→green signature by a reproducible command — with the
per-draw numbers, not an impression.

## Scope

- **F0 — the generator's default order.** In `skills/write-implementation-prompt/SKILL.md`
  §Section Guidance, `Operations` becomes test-first: the step that writes the
  test for an acceptance criterion comes **before** the step that implements it,
  each test step names the command and states that the run must fail until the
  implementation lands — the guidance names the phrase ("run it and see it
  fail") so the artifact and the assertion cannot drift — and a change the spec
  marks as not testable is the explicit exception (the prompt then says so
  instead of inventing a test).
  `Verification` gains the same ordering: every AC maps to a check, and a new
  unit's test is named with the run that showed it red. `Norms` states the
  pyramid at this scale: one test per AC or per unit, integration only where the
  spec names one. No section is added and the artifact's structure is unchanged.
- **F1 — case 1 asserts the shape.** `evals/write-implementation-prompt/cases.md`
  case 1 gains three assertions on the generated prompt:
  `filematch docs/prompts/SPEC-0007-*.prompt.md ## Operations`,
  `filematch docs/prompts/SPEC-0007-*.prompt.md ## Operations[\s\S]{0,600}?(test|spec file)[\s\S]{0,300}?(implement|add and export)`
  and `filematch docs/prompts/SPEC-0007-*.prompt.md [Ss]ee (it )?fail`. The
  `why:` records the limit: the regex proves the test is mentioned before the
  implementation inside a bounded window, not a machine-checkable step order;
  the false-pass case is recorded, not hidden.
- **F2 — the executor case.** A new case 13 in `evals/implement-from-prompt/`
  with a fixture whose prompt artifact is already in the new shape
  (`docs/prompts/SPEC-0001-slug.prompt.md`: Requirements → Operations with
  "write the test, run it and see it fail" before the implementation → Norms →
  Safeguards → Verification). Assertions mirror case 1: the function lands, the
  source spec reaches `status: implemented`, the artifact's Safeguards section is
  untouched. The red→green signature is **not** an assertion — it is measured
  from the transcript (F4), because the freeze allows no new assertion kind.
- **F3 — the baseline moves once.** Case 1's `fieldsSha256` changes with its
  assertions (SPEC-0065); every other baseline entry is untouched. The two new
  cases are additions and need no baseline entry.
- **F4 — the signature reader.** `scripts/lib/tdd-signature.mjs` (pure) plus
  `scripts/check-tdd-signature.mjs` (CLI over a run directory) read a transcript
  and report, per draw: whether a test file was written before the first source
  write, whether a test command exited non-zero before that write, and the lines
  added to source and to tests (from the `edit` patches and the `write`
  contents). It is a **reader**, in the family of `check-staleness.mjs` and
  `check-eval-run.mjs`: no assertion kind, flag, stage or store field is added.
  Its tests prove both patterns — the batch draw (test written, never red) and a
  TDD draw (red, then green) — and the log lines added per class, from a
  transcript **string** rather than a run directory, so the suite stays runnable
  without any eval store.
- **F5 — measure.** `compare write-implementation-prompt 1 --repeat 5 --root
  skills` and `compare implement-from-prompt 13 --repeat 5 --root skills`, model
  and detector recorded, both run dirs cited per cell, raw counts, and the
  signature table for the executor cell's ten draws. The old case-1 5/5 stays as
  history. No draw is bought for the other generator cells.
- **F6 — publish.** Coverage rows/notes for both cells (new counts, old history,
  the staleness delta of the skill edit, the signature table) and one
  `CHANGELOG.md` entry under `[Unreleased]`.

**Blast radius.** One skill's guidance, one existing case's assertions (its
digest moves), one new executor case with a five-file fixture, one reader with
tests, the coverage inventory and the release entry. `implement-from-prompt`'s
skill, its published fixtures and its **eight** baseline cases are untouched.

## Non-Goals

- No change to `skills/implement-from-prompt/SKILL.md`: the question is whether
  the artifact alone changes the behaviour. If the transcripts show it does not,
  that is a finding and the executor edit is a follow-up spec.
- No change to the published separators `#1`/`#8` or their fixtures, and no
  re-baseline of `implement-from-prompt`.
- No new assertion kind, runner flag, pdlc stage, isolation layer or store
  field. The reader reads run directories; it changes nothing they contain.
- No mutation testing, no coverage tool install and no network: coverage stays a
  fixture-declared command for a later spec.
- No push and no issue action.

## Flow

1. **F0/F1 — the generator and its oracle.** Rewrite the ordering guidance, then
   the three assertions, then the case-1 digest.
2. **F2 — the fixture.** Write the five-file tree and the artifact; the artifact
   is the *input*, so it must read like a prompt the generator would produce
   after F0 — test step first, red step named, one test for the AC.
3. **F4 — the reader.** Pure function first with its two patterns, then the CLI
   over a run directory.
4. **F5 — the runs.** Both cells, five draws per arm; then the signature table
   from the two executor run directories.
5. **F6 — publish.** Coverage and CHANGELOG; no oracle edit after the first draw.

## Data

- `skills/write-implementation-prompt/SKILL.md` — Operations, Norms, Verification
  guidance.
- `evals/write-implementation-prompt/cases.md` — case 1.
- `evals/implement-from-prompt/cases.md` and `fixtures/13/` — case 13.
- `scripts/lib/tdd-signature.mjs`, `scripts/lib/tdd-signature.test.mjs`,
  `scripts/check-tdd-signature.mjs`.
- `docs/evals/coverage.md`, `CHANGELOG.md`.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **The generator is test-first**: the default Operations order puts the failing
   test before the implementation, names the red run, and states the exception
   for a non-testable change; Norms states one test per AC or unit; Verification
   requires the red evidence. No new section, no new artifact field.
2. **Case 1 proves the shape**: the three assertions fail on an
   implementation-first artifact and pass on a test-first one, and the `why:`
   records the bounded-window limit.
3. **The executor case exists and is fair**: fixture, artifact and assertions as
   scoped; the prompt is input, the skill is unchanged, and the case uses only
   existing assertion kinds.
4. **The reader is reproducible**: the pure function's tests prove the batch
   pattern (test written, never red), the TDD pattern (red then green), and the
   lines added per class; the CLI prints the same numbers for a stored run.
5. **Both cells are measured**: five draws per arm, model, detector, both run
   dirs, raw counts and the ten-draw signature table recorded; the old case-1
   5/5 stays as history.
6. **Staleness is owned**: the generator edit's effect is recounted, case 1 is
   re-measured at the new hash, the other generator cells are declared stale
   with the reason, and no `implement-from-prompt` cell is stale.
7. **Publication is complete** and `files:` is honest (`spec-check` clean); every
   `tests:` command passes.

## Open Questions

- **Does the artifact alone produce red?** The executor reads the Operations in
  order (`SKILL.md` step 7) and runs the prompt's verification; a test step that
  says "run it and see it fail" should be followed. If the ten draws show 0/5
  red in the with-skill arm, the artifact is necessary but not sufficient, and
  the executor edit becomes its own measured spec. Reported either way.
- **Is one test per AC a pyramid?** At this corpus's size, unit-first with one
  test per AC *is* the base; a second layer would be invented for the fixture,
  not observed. The limit is recorded in the coverage note.
- **Can the bounded-window regex be gamed?** A prompt that mentions a test and
  later an implementation passes even if the order is cosmetic. The `why:`
  records it; the executor cell's signature is the behavioural check that the
  wording alone cannot fake.

## Prompt Notes

- **Requirements**: one generator guidance change, one case strengthened, one
  executor case added, one reader with tests, two cells measured, one honest
  publication. No executor skill edit.
- **Entities**: default order, red step, pyramid, bounded-window assertion,
  signature, lines added per class, stale cell.
- **Approach**: guidance first, then the oracle, then the fixture, then the
  reader, then the runs.
- **Structure**: only the fifteen `files:`; the `implement-from-prompt` skill and
  its existing fixtures are read-only inputs.
- **Operations**: `node scripts/eval.mjs check --root skills`; then
  `compare write-implementation-prompt 1 --repeat 5 --root skills` and
  `compare implement-from-prompt 13 --repeat 5 --root skills`; then
  `node scripts/check-tdd-signature.mjs <dir>` on both executor run dirs.
- **Norms**: five draws per arm; no oracle edit after the first draw; a red is
  named; the old rate stays visible; the analyzer's numbers come from its own
  output, not from reading transcripts by hand.
- **Safeguards**: no executor skill change, no re-baseline, no new assertion
  kind or flag, no coverage install, no push.
- **Tests**: the gates above; `tdd-signature.test.mjs` proves both patterns;
  `corpus.test.mjs` proves the one-digest move.
