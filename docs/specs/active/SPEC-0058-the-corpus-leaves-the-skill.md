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
  - .gitignore
  - .githooks/pre-commit
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
  - skills/bootstrap-project-harness/scripts/harness-state.test.mjs
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

## Results

**F3 first — `speccheck` learned the subtree rule.** In
`scripts/lib/evals/speccheck.mjs`, a `files:` entry ending in `/` now covers every
path under that prefix: a covered path is clean, an undeclared file under the
subtree is still an error, a declared subtree the diff never touches is a
warning, and an entry without the slash keeps exact equality. Four tests in
`speccheck.test.mjs` pin those four cases;
`node --test scripts/lib/evals/speccheck.test.mjs` → 25/25 pass. That is what lets
this spec declare `evals/` and the 27 old `references/evals*` prefixes instead of
368 individual paths.

**F1/F2 — the move and the reader.** `git mv` moved 368 files: 14
`skills/<id>/references/evals.md` → `evals/<id>/cases.md` and 13 fixture trees
(72 top-level fixture directories, including the shared `base`/`base-red` trees)
to `evals/<id>/fixtures/<n>/`. Nothing was removed and re-added; `git status`
reports all 368 as renames. `parse.mjs` now resolves the corpus through
`corpusDir(skillDir)` / `skillDirForCorpus(casesFile)` and `readEvals` reads
`evals/<id>/cases.md`; `fixture.mjs` stages `evals/<id>/fixtures/<n>/`.
`run-evals`, `replay-evals`, `check-staleness` and `validate-skills` use the same
layout. There is no fallback: the remaining `references/evals` strings in
`scripts/` are the leak detector's stale-copy rule, the validator's stray guard,
comments that name it as the old shape, and the tests that assert the old path is
absent (`fixture.test.mjs`, `corpus.test.mjs`, `leak.test.mjs`).

**AC-1 — case parity.** Before the move, `evals/corpus-baseline.json` recorded,
per skill, the `cases.md` sha256, every case's `{n, title, prompt, why, assert}`
digest, and every fixture tree hash. The committed test
`every case and fixture survived the move byte-for-byte`
(`scripts/lib/evals/corpus.test.mjs`) re-parses the moved corpus and compares
against it. All 14 skills and 97 cases (94 runnable, 3 manual) match: identical
per-case digests and identical `cases.md` bytes. Aggregate over the sorted
`id#n:title:fieldsSha256` lines: **before `a2c571ceccf78e3d`, after
`a2c571ceccf78e3d`**. `node scripts/run-evals.mjs --root skills --list --check`
→ `Parsed 97 case(s): 94 runnable, 3 manual`, exit 0.

**AC-2 — fixture parity.** All **72/72** fixture tree hashes match the pre-move
baseline; aggregate over the sorted `id/name:treeHash` lines: **before
`febd93a742b917ca`, after `febd93a742b917ca`**. `git.json` bases are relative to
the case directory, so they moved with it: `review-code`'s `../base` now resolves
to `evals/review-code/fixtures/base`, `audit-code-quality` #9's `../6` to
`evals/audit-code-quality/fixtures/6`, and `survey-inflight-work`'s `../base` to
`evals/survey-inflight-work/fixtures/base`. `--list --check` re-resolves every
manifest (the `git.json` base check in `parse.mjs`) and exits 0.

**AC-5/AC-6 — the guards.** `validate-skills.mjs` fails on any
`skills/*/references/evals*` path, and the negative test
`validate-skills fails on a stray references/evals path` (in `corpus.test.mjs`)
builds a synthetic skill with one and asserts exit 1 and the error text. The real
checkout is clean: `node scripts/validate-skills.mjs --root skills` → `All clear`,
exit 0; the committed test `no skill checkout carries the eval corpus after the
move` also scans every skill.

**AC-7 — staging proof, no model.** `node scripts/run-evals.mjs --root skills
--level smoke --skill review-code --case 1 --run` staged the case in
`2026-11-10T19-06-29--review-code` (scratch
`/var/folders/4y/djb3lgn91gl9t5hxytq19y600000gn/T/eval-review-code-1-fauliC`).
`find <scratch> -path '*references/evals*'` printed nothing; the staged skill
contains only `SKILL.md` and `references/deterministic-checks.md`. No provider was
called.

**AC-9 — the dead consumers.** `scripts/emit-promptfoo.mjs` and
`scripts/promptfoo/provider.mjs` are deleted, the generated-YAML entry is gone
from `.gitignore`, and the README's Promptfoo section is replaced by a pointer to
the published matrix. No script imports or invokes them. The remaining prose
mentions are history this spec must not rewrite: `docs/specs/SPEC-0001…`,
`docs/evals/review-code-matrix.md` (SPEC-0063 owns that file), and this spec's
CHANGELOG entry naming the deletion.

**AC-10 — gates.**

| command | exit |
| --- | --- |
| `node scripts/validate-skills.mjs --root skills` | 0 (`All clear`) |
| `node scripts/run-evals.mjs --root skills --list --check` | 0 (`Parsed 97`) |
| `node --test scripts/lib/evals/*.test.mjs` | 0 (472 tests) |
| `node --test scripts/lib/*.test.mjs` | 0 (13 tests) |
| `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` | 0 (34 tests) |
| `node scripts/check-sensor-parity.mjs` | 0 (`2/2 fixtures in parity`) |
| `node scripts/check-evidence.mjs` | 0 (8 documents, 0 errors, 100 warnings) |
| `node --test scripts/check-staleness.test.mjs` | 0 (7 tests) |
| `node scripts/check-staleness.mjs` | 0 (report form) |
| `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0058-the-corpus-leaves-the-skill.md --base main` | 0 |

`spec-check` exits 0 with 27 `files-declared-untouched` warnings: git's rename
detection reports only the new path for each of the 368 renames, so the 27
declared old paths (14 `evals.md` files and 13 `evals/` subtrees) appear
untouched. They are declarations of what moved, not missing edits; no
`files-touched-undeclared` finding exists.

`check-staleness` now reports **62 cited, 27 stale, 3 uncited**; before this change
the same tree reported 62 cited, 17 stale, 3 uncited. The same 62 cells resolve
and the cited runs are unchanged. The 10 new stale cells are
`bootstrap-project-harness` #14–#23: `harness-state.test.mjs` lives inside that
skill checkout and had to change its fixture-root constant, so the recorded skill
tree hash (`dd55fd88d57d`) no longer matches the current checkout
(`285348f7f19b`). That is the report correctly saying those draws described a
different tree; it is not a broken citation. `check-evidence`'s 100 warnings are
the same pre-existing dirty-run markers as before.

**Not preserved, and why.**

- The preambles inside the moved `cases.md` files still say
  `references/evals/<n>/`. F1 requires `git mv` with byte-identical content, and
  AC-1/AC-2 compare those bytes; editing the prose would break the parity proof.
  The runner now uses the new path; the prose is a stale authoring note.
- `docs/specs/**`, `backlog/**`, `docs/inbox/` and `docs/analysis/` keep the old
  paths as history, per the Non-Goals. No file under `docs/specs/**` or
  `backlog/**` changed except this spec's own Results.
- The spec's `files:` gained three necessary entries: `harness-state.test.mjs`
  (the fixture-root constant), `.gitignore` (the retired exporter's artifact) and
  `.githooks/pre-commit` (a one-line comment naming the corpus file). They are
  consequences of F1 and AC-9, not extra scope.
- No behavioural eval was run; zero paid draws.
