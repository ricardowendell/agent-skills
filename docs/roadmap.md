# Roadmap

The plan behind the releases. It is a working document, not a policy: the
pipeline (`docs/pipeline.md`) governs how work runs; this page says what the work
is and in which order. A change of direction is a human decision, and the
releases themselves are the record of what shipped.

Status: **0.6.2 released** on 2026-11-07. The next release is 0.7.0, but it is
paused: the corpus wave stopped at 30/40 draws on a post-load stall and the
holdout was not drawn. With the corpus parked, the stack review (#12) is the
next planned work.

## Inputs

GitHub issues are a durable input alongside `docs/inbox/` and the backlog. The
AS-ITER program arrived on 2026-11-08 as issues #6–#10; each has a task
(`TASK-56`–`TASK-60`) that carries the release slice, and the issue keeps the full
scope and the external references. A spec is written at groom, from the task.

| issue | task | spec | what it is |
| --- | --- | --- | --- |
| #6 | `TASK-56` | `SPEC-0034` (ready) | the discriminating corpus for iterative work (the gate) |
| #7 | `TASK-57` | `SPEC-0035` (paused) | spike: a localized refinement path without a full spec |
| #8 | `TASK-58` | `SPEC-0036` (paused) | planning a visual change from element and design tokens |
| #9 | `TASK-59` | `SPEC-0037` (paused) | light solution framing before a template is chosen |
| #10 | `TASK-60` | `SPEC-0038` (paused) | read-only experience review with evidence and limits |

All five are `paused` as of 2026-11-08, for two different reasons. `SPEC-0035`
waits on `SPEC-0034`'s classification: a `ready` status would let pdlc dispatch it
straight off the merge, before anyone read the result. `SPEC-0036`, `0037` and
`0038` are demoted on measured demand, not on difficulty — see *Priority is
measured, not asserted* below.

## Priority is measured, not asserted

`docs/analysis/skills-from-sessions-2026-11-07.md` ranks 58 human sessions from a
14-day window by frequency, effort, repeatability and the size of the gap. It is
one sample, and it measures the operator's pain rather than a product thesis — but
it is the only demand data in the repo, and it does not support the queue we had.

- `ui-refactor` — the territory of `TASK-58` and `TASK-60`: 3 sessions, $6.90,
  **one project**, gap `0` (`impeccable` and `simplify` already cover it).
- `bootstrap-harness` — the territory of a template/stack picker: 2 sessions,
  gap `0` (`bootstrap-project-harness` covers it).
- No cluster maps to framing (`TASK-59`).
- The top **uncovered** cluster is `sync-branch` (score 10, gap 2, 2 projects),
  which was not in the backlog at all; it is `TASK-62`, P1, after the corpus.
- The top cluster overall, `report-project-status`, shipped on 2026-11-08; the
  stakeholder recap is a mode of it (`TASK-63`), not a second skill.

So the only P0 is `TASK-56`. The rest keep their place in the queue only if the
evidence above changes, and **priorities are re-decided in the commit that records
`SPEC-0034`'s Results** — not before, because the corpus changes the answer to
every other question.

## Stack review (#12) — the order

Issue #12 reviews the default TypeScript/Node stack (runtime, compiler, lint,
tests, build, supply chain, gates, compatibility). It is maintainer-driven, not
measured demand, and it splits into five specs:

| spec | task | slice | depends on |
| --- | --- | --- | --- |
| `SPEC-0041` | `TASK-65` | decision matrix and `references/typescript.md` (the gate) | — |
| `SPEC-0042` | `TASK-66` | detect and preserve an existing stack in `SKILL.md` | 0041 |
| `SPEC-0043` | `TASK-67` | templates implement the decision | 0041 |
| `SPEC-0044` | `TASK-68` | `harness-state` by capability slots | 0041, 0043 |
| `SPEC-0045` | `TASK-69` | evals, coverage and `CHANGELOG.md` | 0042–0044 |

`SPEC-0041` is `ready` and is the next dispatchable item; the other four start
`paused`. 0042 and 0043 run in parallel after 0041, then 0044, then 0045. The
corpus (`SPEC-0034`) stays parked at `91ee5ff` until a human decision.

## Where the bottleneck is

0.6.2 closed the trust gap in a single run: a provider abort is infrastructure, a
dead run loses no paid draw, a direct `SKILL.md` read is a load, and the store can
be audited for the aborts the old results dropped.

The constraint that remains is the **shape of what the corpus can see**. It has
76 cases, 26 of them `manual`, and its assertion kinds are file, reply, skill and
shell shaped. That is enough to measure a spec-driven change to a file tree. It
cannot yet measure a small iterative change, a visual change, or an experience
review — and `manual` cases are excluded from a run, so they cannot separate two
arms.

So the next capability question is not "should we write another skill". It is
"can the harness tell a good small change from a bad one". Every AS-ITER skill
depends on that answer, which is why `#6` is the gate and the rest are blocked on
it.

## Releases

| release | claim | work | cost |
| --- | --- | --- | --- |
| **0.6.2** (released) | an aborted run is never clean | `TASK-52`, `TASK-38`, `TASK-39`, `TASK-40`, `TASK-54`; `TASK-36` documented, `TASK-35` done | 0 draws |
| **0.7.0** | the corpus can see a small change | `SPEC-0046` (deny layer) as a prerequisite, then `TASK-56` (deterministic slice) and the verdict on `TASK-57` | ~30–40 draws for the corpus plus ~40 for `SPEC-0047` |
| **unscheduled** | the stack is chosen with numbers | `SPEC-0041`–`SPEC-0045` (#12) | measurement, few or no draws |
| **unscheduled** | the branch can be synced safely | `TASK-62` (`sync-branch`), after the corpus | ~10–20 draws, mostly deterministic |
| **unscheduled** | a screen can be reviewed | `TASK-61` (oracle) and then `TASK-58`/`TASK-60` — no consumer today | measurement |
| **unscheduled** | — | `TASK-59` framing, conditional on a gap the corpus shows | measurement |
| unscheduled | — | `TASK-63`: a stakeholder recap as a mode of the status report | 0–20 |
| unscheduled | — | `diagnose-failure`: needs a captured problem statement first | 0 until then |
| unscheduled | — | `agent-skills doctor`: zero draws, rides any release | 0 |

## 0.7.0 — the order

**Paused 2026-11-08.** The first wave spent 30 of 40 draws; the #12 control
draw stalled post-load, so the frozen holdout #11 was never drawn. The branch is
parked and `TASK-50` is reopened. The steps below resume only on an explicit
decision.

0. **`SPEC-0046` — deny the control arm the corpus.** Promoted on 2026-11-09
   when a consumer asked: every behavioural control cell in the repo is
   `unresolved` because `--no-skill` still reads the installed skill
   (`SPEC-0045`: 33 of 35 draws). Until the control is enforced, a corpus
   verdict about the skill is really a verdict about the harness. `SPEC-0047`
   then re-measures the four blocked cells; it is blocked by `SPEC-0046`.
1. **Freeze the holdout before the first draw**, the way `review-code` #7 was
   frozen for issue #5. A holdout chosen after seeing results is not a holdout.
2. **`TASK-56` — three or four cases, deterministic oracles.** Text, file and
   shell only: no browser, no screenshot. One case is adversarial — a request that
   would touch auth, policy or an out-of-scope file must be refused or escalated
   even when the visible result looks right.
3. **The verdict on `TASK-57`.** `SPEC-0035` is `paused` until the Results are
   in; reading them is the first step, and if the incumbent covers the four cases
   the verdict is `do not add skill` with zero draws. Otherwise decide whether an
   extension or a new skill is justified. "No gain" is a valid, recorded outcome.
4. **Store audit and health pass before the cut**, as in 0.6.2.

## Why the visual work has no release

`TASK-58` and `TASK-60` depend on `TASK-56` for the corpus and on `TASK-61` for
the oracle, and `TASK-61` now depends on them having a consumer. With both paused,
the oracle loses its justification too — a browser path is the most expensive item
in this backlog and the measured demand for it is a single-project, one-off
refactor that two installed skills already cover. The chain reopens at the top: a
consumer first, then the oracle, then the skills. Not the other way around.

## Out of scope until a consumer asks

- **A deny layer for the control arm.** `TASK-29` chose detection over denial;
  the consequence was that `capture-idea` #1, `process-inbox` #1 and
  `write-implementation-prompt` #1 stayed `unresolved`. That was honest, and the
  rule was that the deny layer becomes its own task when a consumer needs one of
  those cells. A consumer asked on 2026-11-09 (`SPEC-0045`: 33 of 35 control
  draws read the install), so it moved to 0.7.0 as `SPEC-0046`, with
  `SPEC-0047` re-measuring the blocked cells.
- **More cases of the same shape, a bigger corpus, an expanded judge.**
- **A token-budget mechanism** on top of the health delta.
- **pdlc phase markers (`PDLC-83`).** Another repo; it does not block this one.
- **`diagnose-failure`.** It was the planned 0.7.0 and had no task, spec or inbox
  note behind it — only this table. It returns when a real failure is captured
  with its reproduction, not before.
- **An `app-blueprint-selection` skill.** It would select templates, stack and
  components, but it needs a catalogue to select from, and the AS-ITER scope
  explicitly excludes building one (`#9`: no registry, no taxonomy). Stack
  detection, additive template install and refusal on competing toolchains
  already live in `bootstrap-project-harness`. The selection rule belongs in
  `SPEC-0037`'s open questions, not in a skill.
- **A `delivery-recap` skill.** The cluster it would serve shipped as
  `report-project-status`; a second skill in the same trigger space is the
  collision we just removed. It becomes `TASK-63`, a mode of that report, with one
  hard rule: cite the evidence, never recompute a published number.

## Rules that do not change

- A holdout is frozen before the first draw.
- F0 starts with an **inventory of the store**, not only the replay table.
- A control supplies a rate only with five valid draws; an abort is not a draw.
- A release is a claim. 0.6.2 is not "almost there" if the store re-scan is red.
- Never rewrite a published number; name the correction and keep the old value as
  history.
- **No skill is created before the corpus shows a gap.** Extending an existing
  skill beats a new one when the evidence is equal.
- **The B arm is a pinned root**, never a global install: an external skill is
  copied at a commit and staged from there.

## How this page is maintained

Update it when a release is cut or when the order changes. The evidence stays in
[`evals/coverage.md`](evals/coverage.md) and the release entries in
[`../CHANGELOG.md`](../CHANGELOG.md); this page does not duplicate their numbers.
