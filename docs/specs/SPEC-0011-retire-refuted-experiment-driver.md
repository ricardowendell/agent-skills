---
id: SPEC-0011
title: Retire the driver of the refuted experiment
status: implemented
priority: P2
created_at: 2026-11-05
updated_at: 2026-11-05
source_docs:
  - backlog/tasks/task-14 - evals-congelar-o-driver-do-experimento-já-refutado.md
  - docs/evals/experiments/wip-operations-contract/README.md
  - docs/evals/experiments/wip-operations-contract/run.sh
related_decisions: []
depends_on: []
blocks: []
tests:
  - docs/evals/experiments/wip-operations-contract/README.md
---

# SPEC-0011: Retire the driver of the refuted experiment

## Purpose

`run.sh` reimplements what the runner already does: it builds the stage-1 and
stage-2 roots, copies the fixtures, chooses the skill, runs `run-evals.mjs` and
harvests the transcript from the newest run directory. The hypothesis it served
— per-step observability in `write-implementation-prompt` — was refuted in three
designs and is recorded in the README.

The maintenance cost showed twice in one session: a `local skill=$2` with no
second argument aborted the run, and `newest_run` missed the directory because
the name gains a `--without-skill` suffix. Both were fixed, and both break again
when the runner changes. The README is evidence and stays; the script is
scaffolding of a closed experiment.

## User Outcome

A reader who lands on the experiment finds the record and a short, exact
command sequence that rebuilds either arm. Nothing presents `run.sh` as a live
tool, because it no longer exists.

## Scope

- Delete `docs/evals/experiments/wip-operations-contract/run.sh`.
- Add a **Reproducing an arm** section to the experiment README with the exact
  shell sequence the script performed: build the stage-1 root, run stage 1,
  harvest the produced prompt from the run's scratch directory, build the
  stage-2 root, run stage 2, and the optional bare implementer (`--no-skill`)
  and AC-2 probe.
- Mark the directory as a closed record in its status line: hypothesis refuted,
  no further runs planned, script removed.
- Keep the frozen hashes, the A/B skill copies, the fixtures, the results and
  the cost table unchanged.

The sequence to document, with `$here`, `$work`, `$fixture`, `$spec` and
`$case_n` set per scenario as the current script does:

```sh
# per scenario: s1 -> fixture=$here/fixture, spec=SPEC-0014, case_n=1
#               s2 -> fixture=$here/fixture-s2, spec=SPEC-0015, case_n=2
here=docs/evals/experiments/wip-operations-contract
work=$here/.work/$arm/$scenario

mkdir -p "$work/stage1/write-implementation-prompt/references/evals"
cp "$here/$arm/SKILL.md" "$work/stage1/write-implementation-prompt/SKILL.md"
cp "$here/cases/stage1-write-prompt.md" "$work/stage1/write-implementation-prompt/references/evals.md"
rm -rf "$work/stage1/write-implementation-prompt/references/evals/$case_n"
cp -R "$fixture" "$work/stage1/write-implementation-prompt/references/evals/$case_n"
node scripts/run-evals.mjs --root "$work/stage1" --skill write-implementation-prompt --case "$case_n" --repeat 1 --run

mkdir -p "$work/stage2/implement-from-prompt/references/evals"
cp skills/implement-from-prompt/SKILL.md "$work/stage2/implement-from-prompt/SKILL.md"
cp "$here/cases/stage2-implement.md" "$work/stage2/implement-from-prompt/references/evals.md"
rm -rf "$work/stage2/implement-from-prompt/references/evals/$case_n"
cp -R "$fixture" "$work/stage2/implement-from-prompt/references/evals/$case_n"

out=$(ls -td "$HOME/.local/share/opencode/evals/runs"/*write-implementation-prompt* | head -1)
scratch=$(grep -m1 '^\*\*Scratch:\*\*' "$out/cases/write-implementation-prompt--0$case_n/transcript.md" | sed 's/^\*\*Scratch:\*\* //')
cp "$scratch"/docs/prompts/"$spec"-*.prompt.md "$work/stage2/implement-from-prompt/references/evals/$case_n/docs/prompts/"

node scripts/run-evals.mjs --root "$work/stage2" --skill implement-from-prompt --case "$case_n" --repeat 1 --run
```

**Blast radius.** One experiment directory (one shell script removed, one README
section added). No runner, no skill, no fixture, no spec, no matrix.

## Non-Goals

- **Re-running the 24 pairs.** The hypothesis is refuted; the record is what
  matters.
- **A replacement wrapper or Makefile.** The point is to stop maintaining a
  second driver, not to rename it.
- **Deleting the experiment record.** The README, skill copies, fixtures and
  results stay; only the driver goes.
- **Changing the frozen hashes or the A/B skill copies.**
- **Fixing the `--without-skill` naming in the runner.** The harvest command in
  the README uses the actual suffix; the runner is not touched.

## Flow

1. Read the script's two stages and its helpers (`build_stage1`, `run_stage1`,
   `build_stage2`, `run_stage2`, harvest, probe) and reduce them to the command
   sequence above.
2. Add the sequence to the README under **Reproducing an arm**, with the variable
   values for each scenario (`s1`/`s2`, `case_n`, `spec`, `fixture`).
3. Document the bare implementer: a placeholder `SKILL.md` in the stage-2 root
   plus `--no-skill`, as the script did.
4. Document the AC-2 probe one-liner and what `AC2-PASS`/`AC2-FAIL` mean.
5. Delete `run.sh`.
6. Update the status line: closed record, script removed, no further runs.
7. Verify: from a clean `.work/`, the documented commands rebuild both roots and
   `--list --check` passes; the copied `A/SKILL.md` hash matches the frozen
   table, and `A`/`B` still differ only in the Operations paragraph.

## Data

No persistence. `.work/` remains gitignored; the README states that the roots are
scratch and can be deleted. The frozen hashes in the README are the only durable
identity of the two skill copies.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — `run.sh` is gone from the working tree and from `git ls-files`.
  Verified by `git ls-files docs/evals/experiments/wip-operations-contract` and a
  directory listing.
- AC-2 — The README contains the full sequence for stage 1, harvest, stage 2,
  the bare implementer and the probe. Verified by reading the section and
  running its commands.
- AC-3 — From a clean `.work/`, the documented commands rebuild both roots,
  `node scripts/run-evals.mjs --root <root> --list --check` exits 0 twice, the
  staged `A/SKILL.md` hash equals the frozen table, and `A/SKILL.md` and
  `B/SKILL.md` differ only in the Operations paragraph. No model run is required
  for this check.
- AC-4 — No document in the repository refers to `run.sh` as the way to
  reproduce the experiment. Verified by a repository search for `run.sh`.
- AC-5 — The negative result stays legible: the README still states the
  hypothesis, the two-stage design, both result tables, the verdict and the
  cost. Verified by reading it.
- AC-6 — The experiment's status line declares it a closed record whose driver
  was removed. Verified by reading the first paragraphs.
- AC-7 — `.work/` stays ignored and no new script replaces `run.sh`. Verified by
  `.gitignore` and by the absence of executable files in the directory.

## Result (2026-11-05)

`run.sh` is deleted; the README carries the *Reproducing an arm* section with the
stage-1, harvest, stage-2, bare-implementer and probe commands, and the status
line declares the directory a closed record.

Verification: rebuilding `A/s1` from the README left both roots green under
`--list --check` (2 runnable cases each), and the staged `A/SKILL.md` hashes to
`5eb1ab0c…`, matching the frozen table. `A` and `B` still differ only in the
Operations paragraph. `.work/` remains ignored.

AC-1 and AC-4–AC-7 are met. AC-2 is met by the documented sequence; AC-3 by the
rebuild check above.

## Open Questions

- The command block is longer than the script it replaces. That is the trade the
  task offers: a copy-pasteable record that does not claim to track the runner.
  If the block proves wrong when someone actually uses it, the fix is to correct
  the README, not to reintroduce a driver.
- `newest_run` used a glob that also matches `--without-skill` runs. The README
  harvest line inherits that shape; the spec keeps it because it is what produced
  the recorded results, and notes the suffix where it matters.

## Prompt Notes

- Requirements: remove the driver, keep the record, document the exact commands,
  declare the closed state.
- Entities: `run.sh`, `README.md`, `A/` and `B/` skill copies, `fixture/`,
  `fixture-s2/`, `cases/`, `.work/`.
- Approach: transcribe the script's stages into a linear sequence; delete the
  script only after the README section is complete.
- Structure: one README section, one status-line edit, one deletion.
- Operations: map helpers to commands, write the section, document the bare arm
  and probe, delete, verify roots.
- Norms: Markdown tables for the frozen values; shell blocks are POSIX `sh`;
  no new tooling.
- Safeguards: do not change the results or hashes; do not delete fixtures; do
  not leave a live reference to the script; do not add a replacement wrapper.
- Tests: a state check (no script, no live reference, `.work` ignored) and a
  reproduction check (both roots validate with `--list --check` and the hashes
  match).
