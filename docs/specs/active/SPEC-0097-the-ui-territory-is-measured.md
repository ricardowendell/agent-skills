---
id: SPEC-0097
title: The UI territory is measured, not assumed
status: ready
priority: P0
task: TASK-120
created_at: 2026-11-15
updated_at: 2026-11-15
source_docs:
  - backlog/tasks/task-120 - ui-medir-o-impeccable-antes-de-criar-skill-de-UI-UX.md
  - docs/roadmap.md
  - docs/analysis/paused-specs-review.md
  - docs/analysis/data-corpus/README.md
  - docs/specs/SPEC-0085-contract-ab-measurement.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/analysis/ui-corpus/README.md
  - docs/analysis/ui-corpus/ui-cases.md
  - docs/analysis/ui-corpus/decision.md
  - docs/analysis/ui-corpus/critique/AGENTS.md
  - docs/analysis/ui-corpus/critique/index.html
  - docs/analysis/ui-corpus/critique/styles.css
  - docs/analysis/ui-corpus/audit/AGENTS.md
  - docs/analysis/ui-corpus/audit/form.html
  - docs/analysis/ui-corpus/audit/styles.css
  - docs/analysis/ui-corpus/empty-state/AGENTS.md
  - docs/analysis/ui-corpus/empty-state/orders.html
  - docs/analysis/ui-corpus/empty-state/styles.css
  - docs/analysis/ui-corpus/document/AGENTS.md
  - docs/analysis/ui-corpus/document/index.html
  - docs/analysis/ui-corpus/document/styles.css
  - companion-skills.json
  - docs/specs/active/SPEC-0097-the-ui-territory-is-measured.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0097-the-ui-territory-is-measured.md --base main
---

## Purpose

The roadmap says the `ui-refactor` cluster has gap `0` because "`impeccable` and
`simplify` already cover it" — and the 2026-11-15 paused-specs audit answers
that with the only honest reading: *"Whether `impeccable` and `simplify` actually
cover the visual territory: no measurement exists."* `companion-skills.json`
exists for exactly this and says an entry needs a measurement; `impeccable` has
none.

The skill is installed at `skills/impeccable` (`pbakaus/impeccable`, skill
`4.8.1`, engine `0.1.19`) and that directory is **gitignored**, so a corpus at
the repo root under `evals/impeccable/` would break CI: `node scripts/eval.mjs
check --root skills` stages every case, and the skill is not in a clean checkout.

The data program already solved this shape (`SPEC-0085`): the durable corpus
lives in `docs/analysis/`, the runnable staging lives in a **gitignored mirror**,
and the decision is published. This spec reuses that instrument for UI/UX:
measure the installed skill against the control before any new skill is
considered.

## User Outcome

- A reader of `docs/analysis/ui-corpus/decision.md` sees, per cell, whether
  `impeccable` separates from the control, with the pin, the run directories and
  the raw counts.
- `companion-skills.json` carries `impeccable` only if a measurement exists;
  otherwise the decision says why not.
- CI stays green: nothing about the installed skill or the mirror is committed.

## Scope

### F1 — the durable corpus

`docs/analysis/ui-corpus/` with `README.md`, `ui-cases.md`, `decision.md` and
four case trees, each carrying `AGENTS.md` (the task contract and the declared
human review) and the page files:

| tree | capability | read-only? |
| --- | --- | --- |
| `critique/` | hierarchy critique of a landing page with three competing CTAs | yes — `unchanged` |
| `audit/` | accessibility audit of a form with unlabeled inputs and low-contrast helper text | yes — `unchanged` |
| `empty-state/` | design the empty state of an orders table that renders `No data` | no — `changed` |
| `document/` | document the existing CSS token system into `DESIGN.md` | partially — `unchanged` on the CSS |

The corpus is an instrument, not a product: it exists so a later spec can decide
whether a skill is missing, not to justify one.

### F2 — the cases use the existing vocabulary

`ui-cases.md` defines the four cases in the eval format (`prompt`, `why`,
`expect`, `assert:`), using only the closed set of assertion kinds in
`README.md` (`reply`, `noreply`, `file`, `filematch`, `unchanged`, `changed`,
`dir`, `nofile`, `verdict`). **No visual oracle**: the `(b)` decision of
`SPEC-0077` stands, so the visual judgment is a declared human-review item per
case, never a claimed deterministic pass. Freeze-compatible by construction.

### F3 — the gitignored mirror

`.lane/pinned/impeccable/` (gitignored) carries `skills/impeccable` copied
verbatim from the install and `evals/impeccable/cases.md` plus the staged
fixtures built from the durable trees. `node scripts/eval.mjs check --root
.lane/pinned/impeccable` must stage all four cells with no finding; the same
command on `--root skills` is unchanged (CI path). Nothing from the mirror is
committed.

### F4 — the A/B measurement

- A 3-draw smoke on the first case before the wave; stop and fix the case if the
  skill does not load or an assertion misclassifies what the transcript did.
- 5 draws with the skill and 5 without, per case, on
  `agentworks/deepseek-v4-1-flash`.
- Ceiling: **US$ 0.50 total, discarded draws included**; the total is published
  with the run directories, per-draw status and cost.
- A cell is `separator`, `non-discriminator` or `unresolved`, with the reason;
  a non-discriminator is a valid result and is published as such.

### F5 — the registry, only with evidence

Add `impeccable` to `companion-skills.json` (source `pbakaus/impeccable`, the
declared licence, pin `4.8.1` / engine `0.1.19`, the staged tree hash recorded
at measurement) **only if** the measurement exists. If the source or licence
cannot be confirmed, `decision.md` records the gap and the entry waits.

### F6 — the pointer

`docs/analysis/ui-corpus/README.md` is the discoverable entry point for the UI
evidence; no `docs/evals/coverage.md` edit is made here, because `SPEC-0096`
already publishes there and the queue forbids the collision.

## Non-Goals

- No new skill. `SPEC-0036` and `SPEC-0038` stay paused; their fate is decided by
  the evidence this spec publishes, not here.
- No edit to `skills/impeccable` — it is upstream; the mirror copies it.
- No new assertion kind, matcher, oracle or harness change (the freeze stands).
- No screenshot comparison, DOM query, computed style or `axe`; those were the
  frozen visual-oracle options.
- No release cut; `CHANGELOG.md`/version is a separate gate.
- No measurement of `simplify` — it lives outside this repo.

## Flow

1. **F1/F2** — the trees, the AGENTS.md contracts and the four case definitions.
2. **F3** — the mirror and the model-free check staging all four cells.
3. **F4** — smoke, then the 5+5 wave, then `decision.md`.
4. **F5** — the registry entry (or the recorded gap); F6 is the corpus README
   pointing at `decision.md`.

## Data

- `skills/impeccable/` — the installed skill (gitignored); copied verbatim.
- `docs/analysis/data-corpus/` — the template: README, `ab-cases.md`,
  `decision.md`, the gitignored mirror.
- `evals/review-code/cases.md` — the case-format reference, including the
  `expect:`/human-review discipline.
- `companion-skills.json` — the registry schema (`source`, `sourceUrl`, `pin`,
  `path`, `license`, `signals`, `evidence`).

## Acceptance Criteria

1. The four trees exist with `AGENTS.md` and pages; `ui-cases.md` defines each
   case in the eval format, with assertions only from the existing kind list and
   the visual judgment declared as human review.
2. `node scripts/eval.mjs check --root .lane/pinned/impeccable` stages all four
   cells with no finding; `node scripts/eval.mjs check --root skills` is
   unchanged (CI green).
3. The smoke and the 5+5 wave ran on the pinned model; every draw's run
   directory, status and cost is published in `decision.md`, with the total at
   or below US$ 0.50 including discarded draws.
4. Each cell has a verdict (`separator`/`non-discriminator`/`unresolved`) with
   the reason and the declared human-review items listed.
5. `companion-skills.json` has the entry only if the source, licence and pin are
   named; otherwise `decision.md` records why the entry waits.
6. No skill file, harness file or assertion kind changed; every command in
   `tests:` exits 0.

## Decisions

- **Measure the installed skill before writing one.** The gap-0 claim is an
  assumption; the audit says unverified, and the registry requires evidence.
- **The corpus is an instrument.** It follows the corpus-first rule the data
  program already paid for.
- **The mirror keeps CI green and the upstream unredistributed.** The same
  pattern as `SPEC-0085`, including the gitignored staging.
- **The visual half is declared human review.** A deterministic visual oracle is
  frozen; the cases must not smuggle one in through an assertion.

## Open Questions

- Whether the upstream publication allows the mirror copy and the registry entry
  (licence confirmed at measurement time).
- Whether `simplify`, outside this repo, needs the same treatment later.

## Prompt Notes

- Follow `docs/analysis/data-corpus/` as the template: `README.md`,
  `*-cases.md`, `decision.md`, and a gitignored mirror.
- Grep `evals/review-code/cases.md` for the case grammar before writing; every
  `assert:` must be a kind the parser knows.
- Calibrate with the smoke first; a changed assertion is re-judged and published,
  never silently edited.
- Publish the total cost **with** the discarded draws; that was an explicit
  finding of the 2026-11-11 review.
- Copy the skill verbatim into the mirror; never edit it, and never commit the
  mirror.
