---
id: SPEC-0035
title: Decide whether the incumbent covers a localized refinement
status: ready
priority: P1
task: TASK-57
created_at: 2026-11-08
updated_at: 2026-11-08
source_docs:
  - https://github.com/ricardowendell/agent-skills/issues/7
  - backlog/tasks/task-57 - spike-refinamento-localizado-sem-spec-completa-quick-refine.md
  - docs/specs/SPEC-0034-iterative-corpus.md
  - docs/roadmap.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/evals/iterative-corpus.md
  - docs/specs/active/SPEC-0035-quick-refine-spike.md
  - CHANGELOG.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0035-quick-refine-spike.md --base main

---

# SPEC-0035: Decide whether the incumbent covers a localized refinement

## Purpose

Issue #7 asks whether a lightweight refinement path — small, sequential changes
without a full spec cycle — beats running the whole
`groom → prompt → implement-from-prompt` chain for a spacing fix.

The issue is explicit that a new skill must earn its place. So this is a spike
with three possible exits, and two of them cost no draw: the incumbent already
covers the cases, the incumbent needs one extension, or a separate skill is
justified.

**Paused on 2026-11-08, returned to `ready` on 2026-11-11.** The dependency on
`SPEC-0034` was an ordering edge, and this spec's first step is to *read* that
classification, not to run draws. `SPEC-0034` is now published: `#12` is the only
separator and it separates in the incumbent's favour, `#9` and `#11` are
non-discriminators, `#10` is `unresolved` on a routing defect plus a literal
matcher artifact. The files this spec may touch are therefore documents only —
the corpus and its fixtures are on `main` (`SPEC-0065`) and a verdict of `do not
add skill` changes no skill.

## User Outcome

A reader can tell, from evidence, whether `implement-from-prompt` is already the
tool for a small change. If it is not, the spec names the exact clause that is
missing and the smallest change that supplies it.

## Scope

- **Stop condition, first.** Read `SPEC-0034`'s classification. If
  `implement-from-prompt` passes all four cases with the control failing at least
  one, this spec closes as **`do not add skill`** with zero draws, and records
  that outcome in `docs/evals/iterative-corpus.md`.
- **Otherwise, name the gap in one clause.** Which case and which assertion the
  incumbent loses, and what behaviour would fix it (a rule, a stop condition, a
  check it does not run).
- **Prefer extension.** Change `implement-from-prompt` in place, pinned at the
  commit under test. A separate skill directory is allowed only if the extension
  would contradict the skill's purpose; the reason is written down either way.
- **Measure the candidate on the same corpus and hashes.** Same four fixtures,
  same prompts, same detector, five draws, one model. The A arm is
  `SPEC-0034`'s with-skill runs **only if** `fixtureHash`, `promptHash` and
  `detectorVersion` match; otherwise the baseline is re-run and the cost is
  stated. The C arm is the changed skill. 20 draws for the C arm.
- **The B arm is optional and never replaces C.** An external skill (for
  example a pinned `prototype` or `test-driven-development`) is staged from a
  vendored commit under a pinned root, as the mutation experiments do. If it
  cannot be made comparable — different fixtures, a rule the fixture repeats — it
  is not measured, and the spec says why.
- **Publish the verdict** in `iterative-corpus.md`: `do not add`, `extend`, or
  `new skill`, with the runs behind it.

**Blast radius.** At most one skill's text, one evidence doc, the coverage row,
this spec, and 0–40 draws. No runner, detector or fixture change; the corpus
stays the one `SPEC-0034` froze.

## Non-Goals

- No new state machine, no executor, no preview, no bypass of review or merge.
- No fabricated spec status: a refinement change does not pretend a spec exists.
- No weakening of `implement-from-prompt`'s current rules or its tests.
- No TDD ceremony for a colour or spacing change; the check must be proportional.
- No visual oracle: the cases are the ones `SPEC-0034` froze.

## Flow

1. **F0 — read the verdict.** Stop here if the incumbent already covers the
   corpus; publish `do not add skill`.
2. **F1 — name the gap and the smallest fix.**
3. **F2 — pin the candidate** (skill commit + hash) and confirm the baseline
   hashes match, or re-run the baseline and say so.
4. **F3 — measure the C arm**, five draws per case, and the optional B arm.
5. **F4 — classify and publish**; state the decision and its limits.

## Data

- `~/.local/share/opencode/evals/runs/` — baseline and candidate runs.
- `skills/implement-from-prompt/` — the extension, if any.
- `docs/evals/iterative-corpus.md` — the decision and its evidence.

## Acceptance Criteria

1. **The stop condition is checked first.** If the incumbent covers the corpus,
   the spec records `do not add skill` and spends no draw.
2. **The gap is named as a case plus an assertion**, not as a general impression.
3. **Baseline and candidate are comparable**: same fixtures, prompts, detector
   and model; a mismatched hash forces a re-run and is stated.
4. **The unsafe case still refuses or escalates.** Whatever the extension, the
   auth file stays byte-identical and no success is claimed without a run.
5. **The change is proportional**: a localized change does not require a full
   spec, and a functional change does not claim success without an executed test.
6. **`implement-from-prompt`'s existing behaviour and tests are preserved**; a
   weakened rule is a rejection, not a trade-off.
7. **A verdict is published** — `do not add`, `extend`, or `new skill` — with its
   run directories and the cost.
8. **No drift.** Every command in `tests:` passes.

## Open Questions

- **Is 20 draws enough for a C arm?** It matches the incumbent's five per case.
  If the arm cannot reach five clean draws per case, the shortfall is published
  and the verdict is `unresolved`, not a win.
- **Does the B arm answer a question the user asked?** Only when the external
  procedure is comparable with the same fixtures. Otherwise it is a citation, not
  a measurement.

## Prompt Notes

- **Requirements**: stop condition first; gap named; comparable arms; a verdict.
- **Entities**: candidate, baseline, arm, fixture hash, detector, decision.
- **Approach**: extension first, separate skill only with a written reason.
- **Structure**: skill text and evidence; no runner change.
- **Operations**: `--repeat 5`, `--root skills` for both arms; the external root
  is a vendored, pinned copy.
- **Norms**: no oracle edit to force a win; a failed candidate is published.
- **Safeguards**: the unsafe case keeps its byte-identical assertion; review and
  merge are untouched.
- **Tests**: the corpus from `SPEC-0034` is the test; the gates are model-free.
