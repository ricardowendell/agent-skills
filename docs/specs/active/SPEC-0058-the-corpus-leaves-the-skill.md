---
id: SPEC-0058
title: The corpus leaves the skill
status: ready
priority: P1
task: TASK-94
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-94 - evals-tirar-o-corpus-de-dentro-do-skill-SPEC-0058.md
  - docs/specs/SPEC-0057-the-cost-of-measuring.md
  - docs/evals/coverage.md
  - CONTRIBUTING.md
related_decisions: []
depends_on: []
blocks: []
files:
  - evals/
  - skills/audit-code-quality/references/evals.md
  - skills/audit-docs/references/evals.md
  - skills/bootstrap-project-harness/references/evals.md
  - skills/capture-idea/references/evals.md
  - skills/find-blind-spots/references/evals.md
  - skills/groom-backlog/references/evals.md
  - skills/implement-from-prompt/references/evals.md
  - skills/process-inbox/references/evals.md
  - skills/record-decision/references/evals.md
  - skills/report-project-status/references/evals.md
  - skills/review-code/references/evals.md
  - skills/survey-inflight-work/references/evals.md
  - skills/tighten-harness/references/evals.md
  - skills/write-implementation-prompt/references/evals.md
  - skills/audit-code-quality/references/evals/
  - skills/audit-docs/references/evals/
  - skills/bootstrap-project-harness/references/evals/
  - skills/capture-idea/references/evals/
  - skills/find-blind-spots/references/evals/
  - skills/groom-backlog/references/evals/
  - skills/implement-from-prompt/references/evals/
  - skills/process-inbox/references/evals/
  - skills/record-decision/references/evals/
  - skills/review-code/references/evals/
  - skills/survey-inflight-work/references/evals/
  - skills/tighten-harness/references/evals/
  - skills/write-implementation-prompt/references/evals/
  - scripts/lib/evals/speccheck.mjs
  - scripts/lib/evals/speccheck.test.mjs
  - scripts/lib/evals/parse.mjs
  - scripts/lib/evals/parse.test.mjs
  - scripts/lib/evals/fixture.mjs
  - scripts/lib/evals/fixture.test.mjs
  - scripts/lib/evals/corpus.test.mjs
  - scripts/lib/evals/execute.test.mjs
  - scripts/lib/evals/leak.mjs
  - scripts/lib/evals/leak.test.mjs
  - scripts/run-evals.mjs
  - scripts/replay-evals.mjs
  - scripts/check-staleness.mjs
  - scripts/check-staleness.test.mjs
  - scripts/validate-skills.mjs
  - scripts/emit-promptfoo.mjs
  - scripts/promptfoo/provider.mjs
  - README.md
  - CONTRIBUTING.md
  - docs/README.md
  - docs/prompts/SPEC-0001-remeasure-eval-matrix.prompt.md
  - docs/prompts/SPEC-0003-deterministic-harness-state.prompt.md
  - docs/prompts/SPEC-0004-observable-near-misses.prompt.md
  - docs/prompts/SPEC-0005-approval-given-apply.prompt.md
  - docs/prompts/SPEC-0006-mutation-pilot-review-code.prompt.md
  - docs/prompts/SPEC-0046-deny-control-arm-corpus.prompt.md
  - docs/evals/coverage.md
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/pipeline-bookends-matrix.md
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/specs/active/SPEC-0058-the-corpus-leaves-the-skill.md
  - CHANGELOG.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node --test scripts/check-staleness.test.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0058-the-corpus-leaves-the-skill.md --base main
---

## Purpose

An eval dataset is development material. Today it ships inside the artifact:
14 `skills/<id>/references/evals.md` and 72 fixture directories live under
`skills/<id>/references/`, so every staged skill carries its own answer key and
the control-arm deny list has to name `<skill>/references/evals` explicitly
(SPEC-0046). Moving the corpus out makes the boundary structural instead of a
path list, and it removes ~1.5 MB of test material from what a skill packages.

## User Outcome

- `skills/<id>/references/` contains only material an agent should read at
  runtime. A fixture is never one of those files.
- A reviewer can tell at a glance that `evals/` is not shipped.
- The isolation boundary stops depending on a hard-coded corpus path.

## Scope

### F1 — the layout

```text
skills/<id>/references/          runtime references only
evals/<id>/cases.md              the cases, moved from references/evals.md
evals/<id>/fixtures/<n>/         the fixture trees, moved from references/evals/<n>/
```

`git mv` only; case numbers, prompts, `why:` lines, assertions, `git.json`
contents and fixture bytes are preserved. `references/evals.md` becomes
`evals/<id>/cases.md`; `references/evals/<n>/` becomes
`evals/<id>/fixtures/<n>/`.

### F2 — discovery reads one layout

`parse.mjs` `readEvals` and `fixture.mjs` `stageFixture` resolve the new paths
only. No dual-source support, no compatibility fallback: a case that cannot be
found is an error, not a silent empty corpus.

### F3 — `files:` can name a subtree

`speccheck` compares `files:` against `git diff --name-only` by exact equality,
so this move would need 368 entries. Add one rule: an entry ending in `/` covers
every path under that prefix. An undeclared file under a declared subtree stays
caught; a subtree that matches nothing is a warning, like a declared file the
diff did not touch.

### F4 — nothing eval-shaped stays in a skill

`validate-skills.mjs` fails when any `skills/*/references/evals*` path exists
after the move. This is the guard that keeps the boundary from drifting back.

### F5 — the two dead corpus consumers go

`scripts/emit-promptfoo.mjs` and `scripts/promptfoo/provider.mjs` hard-code the
old corpus path and have no consumer. They are deleted here rather than updated;
SPEC-0059's deletion list loses exactly these two entries.

## Non-Goals

- No DSL change: prompts, assertions, `why:` and `git.json` keep their shape.
- No rewrite of `docs/specs/**` or `backlog/**`. They cite the old paths as
  history; that history is not edited. `check-staleness` reports the affected
  cells instead of hiding them.
- No change to `docs/evals/experiments/**` (SPEC-0059 archives it) or to
  `docs/evals/review-code-matrix.md` (SPEC-0063 rewrites it).
- No paid draw. Every acceptance criterion is deterministic.
- No change to skill behaviour: `SKILL.md` files are untouched.

## Flow

1. **F0 — the checker first.** Teach `speccheck` the subtree rule with tests, so
   the spec's own `files:` is reviewable.
2. **F1 — the move.** `git mv` the 14 case files and 13 fixture trees.
3. **F2 — the reader.** Point discovery at the new layout; delete the old
   resolution.
4. **F3 — the guard.** Add the stray-eval check and the negative test for it.
5. **F4 — the citations.** Update the documents that name the old paths, except
   the historical record.
6. **F5 — the proof.** Compare the corpus before and after: same case ids, same
   prompts, same assertions, same fixture tree hashes.

## Data

- `evals/` (new) and the 14 `skills/*/references/evals.md` + 13 fixture trees
  (removed).
- `scripts/lib/evals/{parse,fixture,speccheck,leak}.mjs` and their tests.
- `scripts/{run-evals,replay-evals,check-staleness,validate-skills}.mjs`.
- `README.md`, `CONTRIBUTING.md`, `docs/README.md`, six `docs/prompts/*.md`,
  four `docs/evals/*.md`.

## Acceptance Criteria

1. Every case is discovered under the same skill id and case number after the
   move. A before/after comparison of parsed cases — number, title, prompt,
   `why:`, assertions — is identical, and the comparison itself is committed as
   a test or a scripted check.
2. Fixture bytes are preserved: each `evals/<id>/fixtures/<n>/` tree hash equals
   the tree hash of the old `skills/<id>/references/evals/<n>/`.
3. `parse.mjs` and `fixture.mjs` read the new layout only; no fallback to the old
   path exists anywhere in `scripts/`.
4. `node scripts/run-evals.mjs --root skills --list --check` parses 97 cases
   (94 runnable, 3 manual), the same set as before the move.
5. `speccheck` accepts a trailing-slash subtree entry: an undeclared file under a
   declared subtree is still an error, a declared subtree that matches nothing is
   a warning, and an entry without the slash keeps exact-equality behaviour.
6. `validate-skills.mjs` fails on a stray `skills/*/references/evals*` path, with
   a test that proves the failure.
7. A staged with-skill run no longer contains any fixture path. Prove it at
   `--level smoke` by staging one case and asserting the staged tree has no
   `references/evals` entry.
8. No file under `docs/specs/**` or `backlog/**` is modified.
9. `scripts/emit-promptfoo.mjs` and `scripts/promptfoo/provider.mjs` are gone and
   nothing references them.
10. All gates in `tests:` pass, including `check-evidence` (0 errors) and
    `check-staleness` (exit 0; the report's numbers may change because citations
    now resolve to the same runs, and any change is explained in Results).
11. Zero paid draws.

## Decisions

- **No dual-source window.** A read-only migration check is allowed inside the
  test suite, but discovery never reads `references/evals*` again. Supporting two
  layouts indefinitely would leave the boundary half-moved.
- **`files:` gains exactly one construct.** A trailing slash means subtree. No
  globs, no negation, no new syntax — `speccheck` exists to be boring.
- **History is not rewritten.** 38 specs and several backlog tasks cite the old
  paths. They are the record of what was true then; editing them would make the
  record agree with the present, which is the one thing a record must not do.

## Open Questions

None.

## Prompt Notes

- Do the `speccheck` subtree rule first and prove it with the 368-path diff; that
  is the only way this spec can pass its own `spec-check`.
- Use `git mv` for every case file and fixture directory so history follows the
  move. Do not `rm` and re-add.
- `git.json` `base` values are relative to the case directory; after the move they
  point at `fixtures/`. Re-resolve and prove with the before/after tree hashes.
- The bootstrap skill's own `references/evals*` moves like every other skill.
  SPEC-0061 is editing that skill's template in parallel and must not touch
  `references/evals*`; if a merge conflict appears there, this spec wins.

_Filled during implementation._
