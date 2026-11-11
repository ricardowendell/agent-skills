# Roadmap

The plan behind the releases. It is a working document, not a policy: the
pipeline (`docs/pipeline.md`) governs how work runs; this page says what the work
is and in which order. A change of direction is a human decision, and the
releases themselves are the record of what shipped.

Status: **0.7.6 released** on 2026-11-11 — the review-code corpus
re-measured at the current tree: #3 separates 5/5 vs 0/5, #4 is a
non-discriminator whose control never approved, the triggers load/refuse 5/5, and
the four cells that were history are now evidence (30 scored draws, 32 paid
attempts, ≥ $0.349). 0.7.5 released on 2026-11-11 — four backlog decisions closed
without a draw: the vocabulary contract matches the matcher, the pipeline's
slug-vs-task link is documented with its workaround, the post-load stall is
diagnosed as a byte-based watchdog killing a working child, and the visual cases
are declared human review rather than a promised oracle. 0.7.4 released on 2026-11-11 — the verdict matcher reads the last
clause and a comma is a clause (zero stored verdicts move), and seven sentences in
the evidence docs were corrected to state only what their artefacts support.
0.7.3 released on 2026-11-11 — the tree hash ignores an empty
directory (staleness no longer depends on the checkout) and the prompt-artifacts
rule was checked against the loaded draws and left in place (0 derailed of 11).
0.7.2 tested and reverted the description hypothesis. Three paid draws on `#11` (0/3 loaded, $0.0189), the fix reverted to
the 0.7.0 wording, and no class or count moved. 0.7.1 fixed the instrument without
a paid draw: `ranpass` scores the effect, isolation is recorded per draw, and the
routing misses are diagnosed (8 of 15, all offered-not-chosen). The iterative corpus is measured:
`#12` is the only separator and it separates in the incumbent's favour, and the
real finding is routing (`TASK-101`). The data-product program (#13–#21) is a
deliberately deferred delivery, not a queue item; it has no release assigned.

## Inputs

GitHub issues are a durable input alongside `docs/inbox/` and the backlog. The
AS-ITER program arrived on 2026-11-08 as issues #6–#10; each has a task
(`TASK-56`–`TASK-60`) that carries the release slice, and the issue keeps the full
scope and the external references. A spec is written at groom, from the task.

| issue | task | spec | what it is |
| --- | --- | --- | --- |
| #6 | `TASK-56` | `SPEC-0034` (paused) | the discriminating corpus for iterative work (the gate) |
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

All five are `implemented` and merged on 2026-11-09 (`cd1fb1d`); they ship
together in **0.6.3**. The corpus (`SPEC-0034`) stays parked at `91ee5ff` until a
human decision.

## Data product engineering (#13–#21)

Nine issues arrived on 2026-11-10 (seven P1, two P2). None is in 0.7.0: the gate
is #13, the discrimination corpus for architecture and data, and #13 itself
depends on #6. The gate is a spike, not a mandate to create skills; each issue
may end as `reuse external`, `extend existing`, `build new` or `do not add`.

`TASK-78`–`TASK-86` mirror the issues; no spec is written before the task is
groomed. The architecture slice is pulled forward: `TASK-89` builds the three
architecture fixtures so `TASK-79` (`audit-code-quality`) can start without
waiting for the data half. `TASK-78` keeps the data fixtures and stays behind
0.7.0. The order is otherwise the one the issues declare:

```
13 ──► 14, 15, 16, 17
16 ──► 18
15, 16, 18 ──► 19
17 ──► 20
18, 20 ──► 21
```

#20 also needs a real post-migration consumer. Nothing here changes the 0.7.0
slice or authorises paid draws before the corpus is decided.

## Where the bottleneck is

0.6.2 closed the trust gap in a single run: a provider abort is infrastructure, a
dead run loses no paid draw, a direct `SKILL.md` read is a load, and the store can
be audited for the aborts the old results dropped.

The constraint that remains is the **shape of what the corpus can see**. It has
89 cases, 3 of them `manual`, and its assertion kinds are file, reply, skill and
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
| **0.6.3** (next) | the stack is chosen with numbers; the control arm is enforced | `SPEC-0041`–`SPEC-0045` (#12) and `SPEC-0046`–`SPEC-0052` | measurement, no new draws |
| **0.7.0** | the corpus can see a small change | `TASK-56` (deterministic slice) and the verdict on `TASK-57`, resuming `SPEC-0034` from the parked tag | ~10 draws to finish, plus the holdout |
| **unscheduled** | review and audit read architecture, with deterministic slots | `TASK-88` + `TASK-89` + `TASK-79` + `TASK-80` | ~50 draws |
| **unscheduled** | data products are measured before any skill is built | `TASK-78`–`TASK-86` (#13–#21) | measurement |
| **unscheduled** | the branch can be synced safely | `TASK-62` (`sync-branch`), after the corpus | ~10–20 draws, mostly deterministic |
| **unscheduled** | a screen can be reviewed by a person; the harness does not separate a visual change | `TASK-58`/`TASK-60` on declared human review; the visual oracle (`TASK-61`) is a future item with its own budget — no consumer today | 0 draws |
| **unscheduled** | — | `TASK-59` framing, conditional on a gap the corpus shows | measurement |
| unscheduled | — | `TASK-63`: a stakeholder recap as a mode of the status report | 0–20 |
| unscheduled | — | `diagnose-failure`: needs a captured problem statement first | 0 until then |
| unscheduled | — | `agent-skills doctor`: zero draws, rides any release | 0 |

## 0.7.0 — the order

**Paused 2026-11-08.** The first wave spent 30 of 40 draws; the #12 control
draw stalled post-load, so the frozen holdout #11 was never drawn. The branch is
parked and `TASK-50` is reopened. The deny layer and the detector work were
delivered in 0.6.3 (`SPEC-0046`–`SPEC-0052`); what remains is the corpus slice
itself. The steps below resume only on an explicit decision.

0. **The harness precondition is met.** The control arm is denied the corpus and
   the eval store, and the detector separates a denied attempt from a leak
   (`SPEC-0046`–`SPEC-0052`, detector v6). The control no longer reads the
   install.
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

The 0.8.0 wave does **not** start with a browser/visual oracle. `TASK-58`
(visual change planning) and `TASK-60` (experience review) are accepted on
**declared human review**: a person reads the diff or the preview and says
whether it holds, and that review is the evidence. No release claim of measured
separation covers a visual case — the harness has no browser, no screenshot and
no DOM, so it cannot quote a visual pass rate.

A visual oracle is a **future item with its own budget**, not a prerequisite of
this wave. It is a runner subsystem, not a case: a browser to launch and keep
alive, screenshot diffing with a tolerance model, DOM/axe queries with their own
answer keys, and process isolation for the browser — the same class of work as
the deny layer, measured against fixtures nobody has written yet. `TASK-61`
records the decision and owns none of that work.

Both skills are paused and also depend on `TASK-56` for the corpus, so the oracle
has no consumer today and no owner in this release. The measured demand for it is
a single-project, one-off refactor that two installed skills already cover. The
oracle reopens on one of two events: a **third visual case**, or a release claim
that needs **machine-checked pixels**. Until then the chain runs from the corpus,
not from the browser: consumer first, then the oracle, then the skills.

## Out of scope until a consumer asks

The deny layer left this list on 2026-11-09, when `SPEC-0045` showed every
behavioural control reading the install (33 of 35 draws). It ships in 0.6.3 as
`SPEC-0046`–`SPEC-0052`, closed by detector v6.

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
- **A pass rate is counted over clean draws.** A pass whose draw read the answer
  key (the eval store) is not a pass; the draw leaves the clean base
  (`SPEC-0052`, bootstrap #19 r1).
- A release is a claim. 0.6.3 is not "almost there" if the store re-scan is red.
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
