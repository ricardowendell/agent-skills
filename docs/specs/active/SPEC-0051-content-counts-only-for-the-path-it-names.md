---
id: SPEC-0051
title: Content counts only for the path it names
status: ready
priority: P1
task: TASK-76
created_at: 2026-11-09
updated_at: 2026-11-09
source_docs:
  - backlog/tasks/task-76 - evals-conteudo-so-conta-para-o-caminho-que-ele-nomeia.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt.md
  - docs/specs/active/SPEC-0050-measure-the-four-remaining-cells.md
related_decisions: []
depends_on:
  - SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt
blocks:
  - SPEC-0050-measure-the-four-remaining-cells
files:
  - scripts/lib/evals/leak.mjs
  - scripts/lib/evals/leak.test.mjs
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0051-content-counts-only-for-the-path-it-names.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0051-content-counts-only-for-the-path-it-names.md --base main
---

# SPEC-0051: Content counts only for the path it names

## Purpose

SPEC-0049's rule is stated per path: under enforcement, a corpus hit is a denied
attempt unless the call demonstrably returned **that path's** content. The
implementation tests the call, not the path. SPEC-0050's four-cell wave found two
false positives in the same afternoon:

- `capture-idea` #1 control `r1`: the call ends `… ls "$HOME/.config/opencode/skills"
  2>/dev/null; … cat "$HOME/.config/opencode/SKILL-SOURCES.md"`. The skills listing
  returned nothing; the content came from a different file and from a symlink
  line. The hit was published as a `leak`.
- `groom-backlog` #2 control `r2`: `cat /Users/wendell/.agents/skills/groom/SKILL.md
  2>&1` returned `No such file or directory` — the path does not exist. The hit
  was published as a `leak` because the error line names the path.

Both draws recorded their assertions and passed them (4/4 and 1/1). Reclassified
as clean, `capture-idea` #1 is a separator (5/5 vs 2/5) and `groom-backlog` #2 is
a non-discriminator (5/5 vs 5/5). Publishing them as `unresolved` would record a
detector defect as a result about the skill.

## User Outcome

A corpus hit is a leak only when the call actually produced that path's content.
Content from a sibling command, an error message, or a symlink listing does not
count. Two cells that are clean by the evidence can be published with a verdict
instead of `unresolved`.

## Scope

- **Per-path content evidence.** Replace the call-level "something came back"
  test with a per-path one: a line that names the path (or a child) in a
  non-error context, or a non-shell result carrying content for that path.
- **Error and symlink lines are not content.** `No such file or directory`,
  `EPERM`/`permission denied`, `Is a directory`, `Not a directory`, and an
  `ls` symlink listing (`… -> …`) never count as a successful read.
- **No enforcement, no change.** The v2 rule still applies to a non-enforced run.
- **Replay proof.** Both SPEC-0050 control runs become five clean draws;
  `capture-idea` #1 is a separator and `groom-backlog` #2 a non-discriminator.
  The verdicts themselves are published by SPEC-0050, not here.
- **Publication.** A `the rule in one sentence` update in `docs/evals/coverage.md`
  and a `CHANGELOG` entry.

**Blast radius.** The detector's content test and its classification. No
boundary, no case, no fixture, no skill.

## Non-Goals

- No change to the seatbelt profile or the corpus roots.
- No paid draw and no re-run; the proof is a replay of stored transcripts.
- No coverage-row verdict for the four cells — SPEC-0050 publishes those.
- No change to the five-draw rule, the with-skill artefact, the skill text, the
  templates or Python.
- No new case and no fixture edit.

## Flow

1. **F0 — split the content test.** A helper answers "did this call return
   content for this path?" without looking at other paths.
2. **F1 — classify.** Content evidence for the path → `leak`; otherwise the
   enforced rule applies (`denied` under enforcement, `leak`/`host` without).
3. **F2 — prove.** Re-judge both SPEC-0050 control runs and record the
   before/after.
4. **F3 — publish.** Coverage rule sentence and CHANGELOG.

## Data

- `scripts/lib/evals/leak.mjs` — `findLeaks`, the content override, the
  suppressed-probe and directory-denial rules, `DETECTOR_RULES`.
- Stored runs:
  - `2026-11-09T12-41-57--capture-idea--agentworks-deepseek-v4-1-flash--without-skill`
  - `2026-11-09T12-55-35--groom-backlog--agentworks-deepseek-v4-1-flash--without-skill`
- `docs/evals/coverage.md`, `CHANGELOG.md`.

## Acceptance Criteria

1. **Sibling content does not count.** A call that names corpus path A and
   returns content only from other paths yields `denied` for A under
   enforcement, and `leak` without it. The `capture-idea` shape is a test.
2. **Errors and symlink listings are not content.** A line naming the path with
   `No such file or directory`, a permission marker, or `… -> …` yields
   `denied` under enforcement. The `groom-backlog` shape is a test.
3. **Real content still loses.** A line naming the path in a non-error context,
   and a non-shell result carrying content, still yield `leak` under
   enforcement.
4. **No enforcement, no change.** The same calls with `enforced: false` keep the
   v2 result.
5. **The replay proves it.** Both SPEC-0050 control runs go from contaminated to
   five clean draws with `isolated=yes`; `capture-idea` then reads 2/5 passed and
   `groom-backlog` 5/5. Recorded in `## Results`, with no verdict published here.
6. **The detector version moved** if the classification changed, and
   `check-evidence` still exits 0 without rewriting a citation.
7. **Nothing else moves.** No boundary, case, fixture, skill text, template or
   Python change; every `tests:` command passes.

## Open Questions

- **What counts as a non-error name?** A line that contains the path and does not
  match the error/symlink markers. For a `glob`/`grep` result the listed paths are
  the content; for `read` the returned body is.
- **Could this hide a leak?** Only if a successful read produced output that
  names the path, contains no error marker, and is not recognised as content.
  The override keeps `read` and path-naming lines as leaks, so the failure
  direction is unchanged; the tests pin each shape.

## Prompt Notes

- **Requirements:** decide content per path, exclude error and symlink lines,
  keep the non-enforced and non-shell paths, prove by replay.
- **Entities:** corpus hit (`tool`, `path`, `kind`), content evidence, error
  marker, symlink listing.
- **Approach:** extract a pure `contentFor(call, path)` used by the classifier;
  keep the existing denial rules ahead of it; do not touch `events.mjs`.
- **Structure:** the detector stays in `leak.mjs`.
- **Operations:** add the helper and its tests for the two measured shapes plus a
  real-content red case; wire it into `findLeaks`; re-judge the two runs; update
  coverage and CHANGELOG; run the eight gates.
- **Norms:** `node`, not bun. Tests next to the module. A rule change bumps
  `DETECTOR_VERSION` and the golden digest is updated consciously.
- **Safeguards:** never mark real content `denied`; never infer content from the
  path alone; do not touch the boundary; no paid draw; publish no verdict here.
- **Tests:** capture-idea shape (sibling content), groom-backlog shape (ENOENT),
  symlink listing, real content naming the path, non-shell content, no-enforcement
  parity, and the replay of both runs.
