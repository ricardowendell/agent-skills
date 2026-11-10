---
spec: SPEC-0004
spec_sha: edd3df2e494a675c8be2a2f8456db2a30b0181fc00443e69971642d2a15fe57f
---

# Implementation Prompt: SPEC-0004 Observable outcomes for the near-misses

## Source Spec

- docs/specs/SPEC-0004-observable-near-misses.md

## Requirements

**User outcome.** A reader of the trigger coverage sees, for each near-miss, what
the agent must *not do* — leave the plan alone, leave the lint threshold alone,
leave the doc set alone — instead of which internal skill it happened to open.

**Scope.**

- Give three cases a fixture each: `find-blind-spots` #4, `tighten-harness` #5,
  `audit-docs` #3.
- Replace `notskill <id>` with assertions on file state.
- Run each case three times; the rate decides `manual` or runnable.

**Acceptance criteria** (copied from the spec): AC-1 each case has a fixture and
at least one file-state assertion, and `notskill` appears in none of them; AC-2
the assertions pass or fail on the outcome alone — a run that loads the skill and
leaves the files alone passes, a run that never loads it but edits the config
fails; AC-3 each case runs three times; 3/3 loses `status: manual`, below 3/3
keeps it with the measured rate and the failing assertion named, and no case is
left red for a load; AC-4 `--list --check` passes and its totals match the cases'
`status:`.

**Non-goals.** Do not change skill text or descriptions. Do not ban a load. Do
not add a judge. Do not add trigger cases.

## Entities

| Term | Meaning |
| --- | --- |
| near-miss | a prompt adjacent to a skill's territory whose correct handling is to leave it alone |
| outcome assertion | `unchanged`, `nofile`, `file` on a path the behaviour would move |
| load | which skill opened; recorded in the transcript, never asserted here |

## Approach

Translate each case's existing `expect:` line into file state, and keep anything
that cannot be expressed that way in `expect:` only. The cases already carry
`gate: off`; keep it — they measure routing-adjacent behaviour, not the skill's
own contract.

Fixtures are per-case and small. The three cases currently have no fixture
directory for the case number, so the agent was reasoning about files that did
not exist. Build them.

## Structure

- `evals/find-blind-spots/fixtures/4/` — `plan.md`, `AGENTS.md`.
- `evals/tighten-harness/fixtures/5/` — `src/huge.js`,
  `eslint.config.js`, `justfile`, `package.json`, `AGENTS.md`.
- `evals/audit-docs/fixtures/3/` — `git.json`, `change.patch`, and the
  `docs/` tree the branch starts from.
- The three case blocks in `evals/<id>/cases.md`.

## Operations

1. **`find-blind-spots` #4.** Fixture: `plan.md` holding a short product plan
   with three headings, and an `AGENTS.md` naming `docs/specs`. Assertions:
   `unchanged plan.md`, `nofile docs/specs/*`, `nofile docs/prompts/*`,
   `reply task`. Drop `notskill find-blind-spots`.
2. **`tighten-harness` #5.** Fixture: `src/huge.js` of about 120 lines,
   `eslint.config.js` with a `max-lines` rule, a `justfile` with `check`, a
   `package.json` with a `lint` script, and an `AGENTS.md`. Assertions:
   `unchanged eslint.config.js`, `unchanged justfile`, `unchanged AGENTS.md`,
   `reply (?:split|refactor|module)`. Splitting `src/huge.js` is allowed, so do
   not assert `unchanged` on it. Drop `notskill tighten-harness`.
3. **`audit-docs` #3.** Fixture with `git.json` like the `review-code` ones:
   base tree with `docs/architecture.md`, `docs/product/vision.md`,
   `docs/system/README.md` and `docs/decisions/README.md`; `change.patch`
   rewrites only `docs/architecture.md` on a branch. Assertions:
   `unchanged docs/product/vision.md`, `unchanged docs/system/README.md`,
   `unchanged docs/decisions/README.md`, `nofile docs/decisions/ADR-*`,
   `nofile docs/specs/*`, `reply architecture`. Drop `notskill audit-docs`.
4. **Measure.** For each case:
   `node scripts/run-evals.mjs --root skills --skill <id> --case <n> --repeat 3 --run`.
   At 3/3 remove `status: manual` and put the measured rate in `why:`; below 3/3
   keep `manual`, add the rate and the assertion that failed to `why:`.
5. **Counts.** Run `--list --check` and confirm its runnable/manual totals match
   the three `status:` values you just set; nothing else records the counts.
6. **Update the spec** to `implemented` with the three rates, and regenerate this
   prompt's `spec_sha`.

## Norms

- Fixtures stay small and self-contained; no install step.
- A case states what it checks; `why:` may record a rate, `expect:` stays a
  behaviour.
- Conventional commits, imperative subject ≤72 chars.
- `git.json` follows the shape already used in
  `evals/review-code/fixtures/2/git.json`: `base`, `branch`, `message`,
  `patch`.

## Safeguards

- Do not assert "no skill loaded" as a proxy for correctness.
- Do not weaken an existing case to make it pass.
- Do not change a skill's `description` to influence the outcome; that work is
  done and out of scope.
- If an outcome assertion is unstable across the three runs, keep the case
  `manual` and say why — a green that depends on the draw is worse than a
  documented manual case.
- Do not touch the matrix, the runner, or `review-code`'s cases.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | `ls` each new fixture dir; `grep -c notskill` in the three case blocks returns 0 |
| AC-2 | The three 3-repetition runs, plus reading the assertions: none references a skill load |
| AC-3 | `status:` and `why:` match the measured rates for all three |
| AC-4 | `node scripts/run-evals.mjs --root skills --list --check` passes; the coverage counts match the case files |

Done when every AC passes and the spec status is updated.
