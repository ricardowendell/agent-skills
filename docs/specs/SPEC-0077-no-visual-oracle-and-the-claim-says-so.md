---
id: SPEC-0077
title: No visual oracle, and the claim says so
status: implemented
priority: P2
task: TASK-61
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-61 - evals-oraculo-visual-para-casos-de-UI-screenshot-DOM-contraste.md
  - docs/roadmap.md
  - docs/evals/coverage.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/roadmap.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0077-no-visual-oracle-and-the-claim-says-so.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/SPEC-0077-no-visual-oracle-and-the-claim-says-so.md --base main
---

## Purpose

The roadmap says the 0.8.0 wave starts with "a browser/visual oracle, then
`TASK-58` and `TASK-60`", but no task or spec delivers that oracle: two skills
cite it as their blocker. `TASK-61` makes the gap explicit and asks for a
decision with a cost:

- **(a)** add a visual assertion path to the runner — screenshot, DOM query,
  computed style, or axe;
- **(b)** accept declared human review and stop claiming measured separation.

The blocker is real and the cost is asymmetric. A visual oracle is a runner
subsystem: a browser, a screenshot diff with a tolerance, a DOM query language,
and an isolation story for the browser process — the same class of work as the
deny layer, and it would be measured against fixtures nobody has written yet. The
two cases that need it (`TASK-58` visual change planning, `TASK-60` experience
review) can still be checked by a human reading the diff, which is what "manual"
means in this corpus today.

**Decision: (b).** This spec spends no draw and builds no oracle. It removes the
false implication that the visual cases are measured, names the human review as
the evidence, and leaves the oracle as an explicit future item with its own
budget.

## User Outcome

- A reader of the roadmap knows the visual cases are reviewed by a person, not
  separated by a harness, and why.
- `coverage.md` does not count the two visual skills as measured coverage.
- The oracle is a named future item with a stated cost, not a sentence that
  blocks two P1s by accident.

## Scope

### F1 — the roadmap claim

`docs/roadmap.md`: replace the sentence that turns the oracle into the first item
of the 0.8.0 wave with one that says:

- the 0.8.0 wave does **not** start with a visual oracle;
- the visual cases (`TASK-58`, `TASK-60`) are accepted on declared human review;
- a visual oracle is a future item with a runner-sized cost (browser,
  screenshot tolerance, DOM/axe queries, process isolation) and its own budget;
- no release claim of measured separation covers a visual case.

Keep the rest of the roadmap intact, including the 0.7.x status line.

### F2 — the coverage claim

`docs/evals/coverage.md`: for any row whose cases are visual or manual, state
that the evidence is a declared human review. At minimum, the
`report-project-status` row (declared, not measured) and any visual row must not
read as if a harness separated them. If no visual skill is in the table yet, add
one line under the totals naming the two pending skills and their review status.

### F3 — record the decision

The spec's `## Results` states the decision, its cost comparison (oracle ≈ a
runner subsystem vs. one declared human review per change), and what would
reopen it: a third visual case, or a claim that needs machine-checked pixels.

## Non-Goals

- **No browser, screenshot, DOM or axe code.** Not in this release, not in a
  follow-up spec opened here.
- **No new case, fixture or assertion kind.**
- **No paid draw.**
- **No change to the two skills** (`TASK-58`, `TASK-60`): their specs cite the
  blocker; this spec changes the claim around them, not their scope.

## Flow

1. **F1** — the roadmap paragraph.
2. **F2** — the coverage rows/line.
3. **F3** — the decision recorded.

## Data

- `docs/roadmap.md` — the 0.8.0 sentence.
- `docs/evals/coverage.md` — the totals and the `report-project-status` row.
- `backlog/tasks/task-61 …md`, `task-58 …md`, `task-60 …md` — the three tasks.

## Acceptance Criteria

1. The roadmap no longer presents the visual oracle as the first item of the 0.8.0
   wave, and says the visual cases rest on declared human review.
2. No document claims measured separation for a visual case.
3. The oracle appears as a future item with a stated cost and no owner in this
   release.
4. `coverage.md` does not count the visual skills as measured coverage.
5. The spec's Results records the decision and the reopening condition.
6. Zero paid draws; every command in `tests:` exits 0.

## Decisions

- **Human review, declared, is the honest option.** A harness that cannot see
  pixels must not be quoted as if it had. "Manual" is a real status in this corpus
  and the release claim has to say it out loud.
- **The oracle is not scoped here.** It is a subsystem with a browser, a tolerance
  and an isolation story; scoping it inside a documentation spec would repeat the
  mistake `TASK-61` exists to fix — a blocker with no owner and no estimate.
- **The claim changes, the skills do not.** `TASK-58`/`TASK-60` keep their scope;
  what changes is what the release says about their evidence.

## Open Questions

- Should `TASK-58`/`TASK-60` declare their review in their own specs, or is this
  roadmap line enough? Recorded, not answered: it is their specs' business and
  both are paused.

## Prompt Notes

- Do not invent a visual row: if no visual skill is in `coverage.md`, add the
  sentence under the totals, not a fake row.
- Keep the roadmap's release history intact; edit only the forward-looking
  sentence that names the oracle as the first step.

## Results

**Decision: (b) — no visual oracle is built, and the claim says so.** `TASK-58`
(visual change planning) and `TASK-60` (experience review) are accepted on
**declared human review**: a person reads the diff or the preview and says
whether it holds, and that review is the evidence. No release claim of measured
separation covers a visual case.

**Cost comparison.** An oracle is a runner subsystem, not a case: a browser to
launch and keep alive, a screenshot pipeline with a tolerance model (what counts
as "the same" across a font-hinting or antialiasing change), a DOM/axe query
language with its own answer keys, and a process-isolation story for the browser
— the same class of work as the deny layer (`SPEC-0046`–`SPEC-0052`), measured
against fixtures nobody has written yet. Declared human review is one review per
change: the reader already exists, the artefact is the diff or preview, and the
cost is bounded by the change rather than by a subsystem. Two paused cases do not
pay for the subsystem.

What landed:

- **F1 (roadmap).** The forward-looking claim is rewritten in two places: the
  `unscheduled` releases row that read "`TASK-61` (oracle) and then
  `TASK-58`/`TASK-60`", and *Why the visual work has no release*, which now says
  the 0.8.0 wave does not start with a visual oracle, that the two cases rest on
  declared human review, that the oracle is a future item with a runner-sized
  cost and its own budget (browser, screenshot tolerance, DOM/axe queries,
  process isolation), and that no release claim of measured separation covers a
  visual case. The release history and the 0.7.x status line are untouched.
- **F2 (coverage).** The `report-project-status` row now names the evidence as a
  declared human review, not merely "declared, not measured", and the
  `status: manual` evidence rule says a manual case's evidence is a declared
  human review, never a measured separation. No visual skill has a row, so the
  two pending skills are named in one line under the totals with their review
  status: `TASK-58`/`TASK-60` have no case, fixture or run dir and are not
  counted in the 101.
- **F3 (this section).** The decision, its cost and the reopening condition.

**Reopening condition.** A **third visual case**, or a release claim that needs
**machine-checked pixels**. Either one is a decision to scope the oracle as its
own runner spec with its own budget; it is not reopened by a documentation edit.

**Note on the premise.** At implementation time `docs/roadmap.md` did not carry
the literal sentence "a browser/visual oracle, then `TASK-58` and `TASK-60`"; that
wording lives in `TASK-61`'s task note. The forward-looking claim the roadmap did
carry was the releases-table row and *Why the visual work has no release*, so F1
landed there. The release history needed no correction.

**Gates.** Every command in `tests:` exited 0; no paid draw was spent (0).
