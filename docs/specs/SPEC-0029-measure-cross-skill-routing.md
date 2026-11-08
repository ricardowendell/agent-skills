---
id: SPEC-0029
title: Measure cross-skill routing with a declared stage
status: implemented
priority: P2
task: TASK-44
created_at: 2026-11-06
updated_at: 2026-11-08
source_docs:
  - docs/evals/pipeline-bookends-matrix.md
  - docs/evals/coverage.md
related_decisions: []
depends_on:
  - SPEC-0028-detector-host-corpus
blocks: []
files:
  - scripts/lib/evals/parse.mjs
  - scripts/lib/evals/execute.mjs
  - scripts/lib/evals/runs.mjs
  - scripts/run-evals.mjs
  - scripts/lib/evals/fixture.test.mjs
  - scripts/lib/evals/execute.test.mjs
  - skills/capture-idea/references/evals.md
  - skills/process-inbox/references/evals.md
  - CONTRIBUTING.md
  - docs/evals/pipeline-bookends-matrix.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0029-measure-cross-skill-routing.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0029: Measure cross-skill routing with a declared stage

## Purpose

Two cases cannot pass in this harness, by construction:

- `capture-idea` #3 — "Process the inbox." — asserts `skill process-inbox` and
  `notskill capture-idea`.
- `process-inbox` #3 — "Add this to the inbox: …" — asserts the reverse.

`stageSkill` copies only the skill under review. When `process-inbox` is under
review, `capture-idea` is not in the scratch, so the assertion can never pass —
even when the routing is perfect. Measured in 0.5.0: 0/4 and 0/5. They were
published as "not routed (staging)", which is honest but not evidence about the
routing.

These are the only cases in the corpus that name a sibling skill. They are also
the pair that proves the catalog routes between capture and process, which is the
pipeline's first hand-off.

## User Outcome

A case can declare the sibling skill it expects to be available. The runner
stages it, records that it did, and the two routing cases either pass or fail on
behaviour — not on the harness.

## Scope

- **A declared stage per case.** The case block gains `- stage: <skill-id>`
  (repeatable). `--list --check` rejects an unknown id and a self-reference.
  Cases without the key behave exactly as today.
- **The runner stages it.** `stageSkill` is called for the declared ids in
  addition to the skill under review; each copy is hashed and recorded in
  `stagedSkills: [{ id, hash }]` in the case result and the run manifest. The
  existing `skillHash` stays the arm's skill, so `skillGate` keeps its meaning.
- **`--no-skill` still stages nothing** and denies the `skill` tool for every
  id. A declared stage does not leak into the control arm.
- **The two cases declare their pair**, are re-run five times in the skill arm,
  and the matrix and inventory are updated with the real result.
- **A test with two fixture skills** proves the sibling is staged, hashed and
  reported, and that `--no-skill` ignores the declaration.

**Blast radius.** One case-block key, the staging call, the result shape and two
case files. No skill prose, no assertion, no detector and no gate changes.

**Budget.** ~10 draws (two trigger cases × five).

## Non-Goals

- No general multi-skill runtime. One declared sibling per case, staged the same
  way the reviewed skill is; no dependency resolution, no transitive staging.
- No change to `skillGate`: it still answers "did the arm's skill load".
- No new case and no re-measure of the other bookend cases (SPEC-0031 owns the
  re-measurement under detector v2).
- No judge.

## Flow

1. **F0 — repro**: the two cases can never satisfy their cross-skill assertion.
2. **F1 — parser and check**: read `stage:`, validate the id, refuse self.
3. **F2 — staging and record**: stage, hash, report in result and manifest.
4. **F3 — control arm**: declared stages are ignored under `--no-skill`.
5. **F4 — measure**: five draws each, skill arm only, both cases.
6. **F5 — publish**: matrix and coverage row with the result.

## Data

- `skills/<id>/references/evals.md` — the `stage:` declaration.
- `<run>/cases/<case>/result.json` — `stagedSkills`, `skillGate`, `leak`.
- `<run>/manifest.json` — the staged set for the whole run.
- `docs/evals/pipeline-bookends-matrix.md` — the routing rows.

## Acceptance Criteria

1. **The declaration is validated.** `--check` accepts a known id, rejects an
   unknown id and a self-reference, and cases without `stage:` are unchanged.
2. **The sibling is staged and recorded.** A run with `stage: X` has X in the
   scratch, hashes it, and names it in `stagedSkills`; the arm's `skillHash` and
   `skillGate` are unchanged in meaning.
3. **The control arm ignores it.** Under `--no-skill` neither the reviewed skill
   nor the declared sibling is staged, and the `skill` tool is denied for both.
4. **The two cases are measured.** Five draws each in the skill arm, with run
   directories cited; each either passes on behaviour or names the failed
   assertion.
5. **The docs say what was staged.** The matrix row for the two cases and the
   coverage row name the staged set, so a reader can tell what was on the menu.
6. **No drift.** No assertion weakened, `git diff main...HEAD -- skills/` limited
   to the two `evals.md` declarations, five gates pass.

## Results

- **Declaration.** `- stage:` is parsed as a repeatable case field; `--check`
  rejects a self-reference (`names the skill under review`) and an unknown id
  (`unknown stage '<id>'`). Cases without the key keep `stage: []` and behave as
  before.
- **Staging.** The declared sibling is copied by `stageSkill` beside the arm's
  skill, hashed, and reported as `stagedSkills: [{ id, hash }]` in the case
  result and the run manifest. `skillHash` and `skillGate` still describe the
  arm's skill. `--no-skill` stages neither and denies the `skill` tool.
- **Tests.** Two synthetic skills stage side by side with distinct hashes; the
  result reports the sibling; the control arm stages nothing; the CLI accepts a
  known sibling and refuses a self-reference and an unknown id.
- **Measurement.** Five draws per case, skill arm only, detector v2:
  `capture-idea` #3 5/5 (`2026-11-06T19-06-50--capture-idea`, staged
  `process-inbox`) and `process-inbox` #3 5/5
  (`2026-11-06T19-09-27--process-inbox`, staged `capture-idea`). Both runs print
  `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes`.
- **Published.** `docs/evals/pipeline-bookends-matrix.md` (declared-stage section
  and the routing classification note) and the two `coverage.md` rows name the
  staged set and the pre-fix record.

## Open Questions

- **Is one sibling enough?** For the current corpus, yes. If a future case needs
  two, the key already repeats; the limit is the implementation's, not the
  format's.
- **Does staging a sibling change the trigger measurement?** It adds a skill to
  the menu, which is the point: the case is asking whether the agent picks the
  right one when both are available. The matrix must say so.

## Prompt Notes

- **Requirements**: declare, stage, hash, report; ignore in the control arm.
- **Entities**: case, staged skill id, staged set, arm skill.
- **Approach**: extend the parser first, then staging, then the record, then the
  two cases. Keep `--no-skill` untouched structurally, not by special-casing.
- **Structure**: `fixture.mjs` stages; `execute.mjs` records; `run-evals.mjs`
  parses and validates.
- **Norms**: the result shape is additive; old runs without `stagedSkills` stay
  readable.
- **Safeguards**: never stage the answer key (`references/evals.md` is already
  excluded); never let the control arm see a declared stage.
- **Tests**: two synthetic skills, one declared stage, one self-reference
  rejected, one control arm.
