---
id: SPEC-0095
title: The official contract skill is measured with a neutral prompt and no CLI in the A arm
status: paused
priority: P2
task: TASK-116
created_at: 2026-11-15
updated_at: 2026-11-15
source_docs:
  - backlog/tasks/task-116 - evals-uma-medicao-valida-do-contrato-precisa-de-prompt-neutro-e-A-sem-CLI.md
  - docs/analysis/data-corpus/ab-cases.md
  - docs/analysis/data-corpus/decision.md
related_decisions: []
depends_on:
  - SPEC-0092
blocks: []
files:
  - docs/analysis/data-corpus/ab-cases.md
  - docs/analysis/data-corpus/decision.md
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0095-contract-valid-ab.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0095-contract-valid-ab.md --base main
---

# SPEC-0095: The official contract skill is measured with a neutral prompt and no CLI in the A arm

## Purpose

`SPEC-0085` measured the pinned MIT `datacontract-skills` against a control and
found **no behavioural separation** in four cells, which closed issue #18 as
`reuse external`. The instrument had three declared limits
(`TASK-116`): the semantic cell's prompt handed over the direction ("the schema
passes, yet I am not sure"), `datacontract-cli` was on `PATH` in **both** arms so
the A arm measured "skill card vs CLI" rather than "family vs control", and n=5
could not exclude a small effect.

This spec removes the two instrument limits that can be removed without touching
the frozen runner: a neutral prompt for the semantic cell, and an A arm whose
environment has no `datacontract` on `PATH`. It re-measures the four cells and
publishes the counts; the decision already recorded ("no local contract skill;
the official skills are the recommended process route") is not revisited unless
the numbers overturn it.

## User Outcome

A reader of `docs/analysis/data-corpus/decision.md` §7 sees the four cells
measured under a neutral prompt and a CLI-free control, with the run directories,
the raw counts, the model and detector, and an explicit statement of what the
new measurement can and cannot separate.

## Scope

- **F0 — the neutral prompt.** In `docs/analysis/data-corpus/ab-cases.md`,
  rewrite only the semantic cell's prompt so it states the change without
  announcing that the schema passes or that the change may be unsafe; the
  fixture and assertions stay. The other three prompts are already neutral and
  are not touched.
- **F1 — the CLI-free A arm.** The A arm (no skill staged) is run with a `PATH`
  that does not contain `datacontract`, built from the host `PATH` by removing
  the directory that holds it; `node`/`opencode` stay reachable. The exclusion is
  proved inside the run: the transcript must contain a `command -v datacontract`
  (or equivalent) that fails, and the coverage quotes it. If the runner cannot
  reach a CLI-free environment without a code change, **stop and report** — the
  freeze forbids a new flag, and the spec then needs a human gate for the
  harness change.
- **F2 — measure the four cells.** `run --arm without` with the filtered `PATH`,
  and `run --arm with` normally, five draws each, for the four contract cells
  (`breaking-change-check` 1–3 and `create-data-contract` 1). Both arms run
  sequentially so the filtered `PATH` cannot leak into B.
- **F3 — publish.** `docs/analysis/data-corpus/decision.md` §7 gains a second
  measurement table (neutral prompt, CLI-free A), the coverage row cites the
  dirs, and one `CHANGELOG.md` entry under `[Unreleased]`. The old table stays as
  history, marked with its three limits.

**Blast radius.** One prompt in the durable case definitions, one measurement
section, the coverage inventory and the release entry. No skill, no fixture, no
runner change.

## Non-Goals

- No local contract skill and no change to the `reuse external` decision unless
  the counts overturn it.
- No change to the four fixtures, the pinned `dc06664` copy, or the assertions.
- No new assertion kind, flag, stage or store field; no runner edit.
- No redesign of the corpus or a fifth cell.
- No push and no issue action.

## Flow

1. **F0 — the prompt.** Rewrite the semantic prompt; keep its `why:` and the
   assertions, and record the old prompt as history in `ab-cases.md`.
2. **F1 — the environment.** Prove the filtered `PATH` locally
   (`command -v datacontract` fails, `command -v node` and `command -v opencode`
   succeed) before the first paid draw.
3. **F2 — the runs.** Eight runs (four cells × two arms), five draws each,
   sequentially; record every directory.
4. **F3 — publish.** The decision memo table and the coverage; no number is
   recomputed.

## Data

- `docs/analysis/data-corpus/ab-cases.md` — the semantic prompt.
- `docs/analysis/data-corpus/decision.md` — §7.
- `docs/evals/coverage.md`, `CHANGELOG.md`.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **The prompt is neutral**: it names the files and the question, and neither
   says the schema passes nor hints that the change may be unsafe; the old
   prompt is quoted as history.
2. **The A arm is CLI-free**: the environment proof is recorded, the A-arm
   transcripts show `datacontract` unreachable, and the B arm keeps the CLI.
3. **All four cells are measured**: five draws per arm, model, detector, every
   run directory, raw counts and reds recorded; the old table stays as history.
4. **The verdict is stated with its limits**: what the neutral prompt and the
   CLI-free control can and cannot separate, including n=5.
5. **No decision is overturned without counts**: the `reuse external` decision
   stands unless the numbers say otherwise, and either way the sentence says why.
6. **Publication is complete** and `files:` is honest (`spec-check` clean);
   every `tests:` command passes.

## Open Questions

- **Can the runner produce a CLI-free arm?** Only by launching it with a
  filtered `PATH` from the host, since the runner has no flag for it and the
  freeze forbids one. The proof is in the transcript; if it fails, the spec
  stops and asks for the harness gate.
- **Does the neutral prompt change the semantic cell?** It should: the old prompt
  told the agent the schema passed, which is the direction the cell was supposed
  to infer. The run decides whether the A arm still finds the unit change.

## Prompt Notes

- **Requirements**: one neutral prompt, one CLI-free arm, four cells, one
  verdict, one publication.
- **Entities**: neutral prompt, `PATH` exclusion, A/B, semantic cell, n=5, the
  three declared limits.
- **Approach**: prompt, then environment proof, then sequential runs, then the
  table.
- **Structure**: only the five `files:`; the pinned copy and the fixtures are
  read-only.
- **Operations**: `command -v datacontract` (must fail in A), then
  `run <corpus> <case> --arm without --repeat 5 --root skills` and the `with`
  twin, per cell.
- **Norms**: five draws; sequential arms; the old table stays as history; the
  verdict names its limits.
- **Safeguards**: no runner edit, no flag, no fixture change, no pin update.
- **Tests**: the gates above; `check-evidence` must keep the new citations
  honest.

## Queue note (2026-11-15)

Blocked on a human harness decision: the isolation layer shares `~/.local`, so the CLI is reachable by absolute path and the A arm cannot be made CLI-free without a freeze exception. F0 (neutral prompt) is committed; no paid draw was taken.
