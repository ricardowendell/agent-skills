# Roadmap

The plan behind the releases. It is a working document, not a policy: the
pipeline (`docs/pipeline.md`) governs how work runs; this page says what the work
is and in which order. A change of direction is a human decision, and the
releases themselves are the record of what shipped.

Status: **0.9.1 opened** on 2026-11-13 — companions get a scope and the bootstrap
gets an opt-in step. 0.9.0 shipped: the contract A/B against the pinned MIT
`datacontract-skills` measured four cells and 40 clean draws, with **no
behavioural separation**; no local contract skill is justified, and the official
skills are the recommended process route (pinned `dc06664`). The scope model is
`companion-skills.json` (scope + signal + pin + evidence) and `skills.index.json`
(first-party by domain); the bootstrap suggests the intersection. 0.8.0–0.8.3
released on 2026-11-13 — `sync-branch`; the status report measured (separator 4/5 vs 0/5);
the two over-strict assertions corrected; the data corpus (six trees, ten
deterministic proofs, a frozen holdout). 0.7.7 released on 2026-11-11 — a verdict that opens with a
negation is a rejection, so "not ready" / "not implemented" score instead of
reading as silence; 6 stored verdict lines move, review-code #4's control goes
2/5 → 5/5 replayed, and the class stays a non-discriminator. 0.7.6 released on 2026-11-11 — the review-code corpus
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
real finding is routing (`TASK-101`). The data-product program (#13–#21) is
groomed (`SPEC-0082`) and queued, but deliberately deferred: no release is
assigned and dispatch follows the 0.8.x P1s.

## Inputs

GitHub issues are a durable input alongside `docs/inbox/` and the backlog. The
AS-ITER program arrived on 2026-11-08 as issues #6–#10; each has a task
(`TASK-56`–`TASK-60`) that carries the release slice, and the issue keeps the full
scope and the external references. A spec is written at groom, from the task.

| issue | task | spec | what it is |
| --- | --- | --- | --- |
| #6 | `TASK-56` | `SPEC-0034` (implemented) | the discriminating corpus for iterative work (the gate) |
| #7 | `TASK-57` | `SPEC-0035` (implemented) | spike: a localized refinement path without a full spec |
| #8 | `TASK-58` | `SPEC-0036` (paused) | planning a visual change from element and design tokens |
| #9 | `TASK-59` | `SPEC-0037` (paused) | light solution framing before a template is chosen |
| #10 | `TASK-60` | `SPEC-0038` (paused) | read-only experience review with evidence and limits |

All five were `paused` on 2026-11-08. The re-decision of 2026-11-12 records the
outcome: **#6 and #7 close** (their verdicts shipped in 0.7.0 — the deterministic
corpus slice and `do not add skill` for quick-refine); **`SPEC-0039` becomes
`ready`** as the 0.8.0 claim; **`SPEC-0036`, `0037` and `0038` stay `paused`** on
the measured demand below, not on difficulty; **`SPEC-0040`** (recap mode, P2)
stays `paused` as an increment behind the P1s.

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

So the only P0 was `TASK-56`, which shipped in 0.7.0. The re-decision of
2026-11-12 reads the same evidence again: `sync-branch` is the only P1 the data
supports (top uncovered cluster, score 10, gap 2), so it goes first; the
data-product program is unmeasured as a program and stays behind the P1s,
starting with its corpus gate (`TASK-78`), not with a skill. The visual/UX and
framing specs remain paused: the `ui-refactor` cluster is 3 sessions, $6.90 and
one project, with gap 0 because `impeccable` and `simplify` cover it, and no
cluster maps to framing.

The data program is the exception the same rule allows: it is **maintainer-driven**
like the stack review (#12), because the 14-day sample predates the data issues
and the operator's own data work is the demand. Within the program the order is
chosen by evidence strength and upstreamness, not by issue number: the contract
(#18) is first because it is the keystone and its B arm — the official MIT
`datacontract-skills` — is verifiable; #17 follows as the strongest
self-contained separation; #16 is re-decided by the screen rather than asserted;
#20/#21 wait for a real consumer.

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

Nine issues arrived on 2026-11-10 (seven P1, two P2). The gate (#13) shipped in
0.8.3: the architecture slice (`SPEC-0054`/`0055`/`0056`, 0.7.6) and the data
corpus (`SPEC-0082`, six trees with deterministic oracles and a frozen holdout).
The gate is a spike, not a mandate to create skills; each issue may end as
`reuse external`, `extend existing`, `build new` or `do not add`.

`TASK-78`–`TASK-86` mirror the issues. The architecture slice shipped: `TASK-89`
built the three architecture fixtures (`SPEC-0054`), and `TASK-79`/`TASK-80`
(`SPEC-0055`/`SPEC-0056`) measured the skills in 0.7.6. The data half (`TASK-78`)
shipped in 0.8.3 (`SPEC-0082`). The issues declare the dependency graph, but not
the order within it; the program starts with **#18 contract**:

```
#18 contract ──► the A/B verdict (reuse external or a documented gap)
#17 migration ─► the strongest self-contained separation, next
#16 quality ───► re-decided by the screen, not asserted
#19 review ────► decided with the control evidence from #16–#18
#20/#21 ───────► deferred until a real post-migration consumer exists
```

## Where the bottleneck is

0.6.2 closed the trust gap in a single run: a provider abort is infrastructure, a
dead run loses no paid draw, a direct `SKILL.md` read is a load, and the store can
be audited for the aborts the old results dropped.

0.7.0 answered the capability question for the deterministic half: the corpus can
see a small change, and `implement-from-prompt` separates on exactly one of the
four iterative cases — in its own favour (4/5 vs 0/5). The real finding was
routing, not behaviour (`TASK-101`). The visual half stays unmeasurable by
design: SPEC-0077 declares human review and no browser oracle.

With the harness frozen (2026-11-11), the constraint is no longer the mechanism.
0.8.0–0.8.3 closed the measured-demand queue and the evidence debt, and the data
program now has its corpus. The remaining question is whether the official skills
already cover the contract capability: the 0.9.0 A/B wave answers it with the
pinned MIT `datacontract-skills` before any local skill is authored.

## Releases

| release | claim | work | cost |
| --- | --- | --- | --- |
| **0.6.2** (released) | an aborted run is never clean | `TASK-52`, `TASK-38`, `TASK-39`, `TASK-40`, `TASK-54`; `TASK-36` documented, `TASK-35` done | 0 draws |
| **0.6.3–0.7.7** (released) | the stack is chosen with numbers; the control arm is enforced; the corpus can see a small change; the instrument is fixed; review-code is measured again; the verdict vocabulary is closed; the harness is frozen | `SPEC-0041`–`SPEC-0081`; `TASK-56`/`TASK-57` and their verdicts; the 0.7.0 defects (`TASK-100`–`TASK-103`) and the re-measurement (`TASK-98`, `TASK-109`, `SPEC-0078`); the freeze (`SPEC-0081`) | see `CHANGELOG.md` |
| **0.8.0** (released) | the branch can be synced safely | `SPEC-0039` (`TASK-62`) | 0 paid draws |
| **0.8.1** (released) | the status report's claim is measured | `SPEC-0083` (`TASK-70`, issue #11) | ~10 draws |
| **0.8.2** (released) | the two over-strict cells are measured honestly | `SPEC-0084` (`TASK-87`) | ~20 draws |
| **0.8.3** (released) | the data corpus can see a duplicated-key join | `SPEC-0082` (`TASK-78`, #13) | 0 paid draws |
| **0.9.0** (released) | the contract capability is measured before it is built (#18) | A/B: control vs the pinned MIT `datacontract-skills`; no local skill justified | ~40 draws |
| **0.9.1** (next) | companions have a scope, and the bootstrap can use it | `SPEC-0086`; manifest + first-party index + the opt-in step | ~3–5 screening draws |
| **0.9.2** | migration is measured before it is built (#17) | `TASK-82`; local corpus, strongest separation | ~20 draws |
| **decision** | data quality is re-decided by the screen (#16) | `TASK-81`; screening by evidence | 0–20 draws |
| **decision** | review/ops is decided with the #16–#18 control evidence (#19) | `TASK-84` | 0 |
| **deferred** | operate/assess wait for a real post-migration consumer (#20/#21) | `TASK-85`/`TASK-86` | — |
| **unscheduled** | a screen can be reviewed by a person; the harness does not separate a visual change | `TASK-58`/`TASK-60` on declared human review; the visual oracle (`TASK-61`) is a future item with its own budget — no consumer today | 0 draws |
| **unscheduled** | — | `TASK-59` framing, conditional on a gap the corpus shows | measurement |
| unscheduled | — | `TASK-63` recap and `TASK-112`–`TASK-115` follow-ups, as riders | 0–30 |
| unscheduled | — | `diagnose-failure`: needs a captured problem statement first | 0 until then |
| unscheduled | — | `agent-skills doctor`: zero draws, rides any release | 0 |

## 0.9.0 — the order

**Opened 2026-11-13.** The earlier 0.8.0 section is history: `sync-branch`
shipped, the status report was measured, the two over-strict cells were corrected,
and the data corpus was built. The data program now starts where the evidence is
strongest and most upstream.

0. **The B arm is pinned.** `datacontract-skills` at `dc06664` (MIT), copied to
   an ignored pinned root under `.lane/pinned/` and staged from there; nothing is
   redistributed, and `datacontract-cli` 1.2.9 is installed for `lint` and
   `breaking`.
1. **F0 — fixtures dual-format.** The contract trees gain a native ODCS v3 YAML
   next to the deterministic oracle, plus a semantic-change tree (same schema,
   changed meaning) and a composition tree (requirements → ODCS).
2. **F1 — the A/B corpus.** Cases for the external `breaking-change-check` and
   `create-data-contract` in the pinned mirror; the same prompts and fixtures
   under `evals/design-data-contract/` for the later C arm.
3. **F2 — A vs B.** Control vs the official skills, five draws per cell; the
   holdout stays the staged-only copy of `incompatible-contract`.
4. **F3 — the verdict.** `reuse external` (the deliverable is the thin routing
   reference the issue's hypothesis predicts) or a documented gap that justifies
   C in its own spec. `do not add` remains a valid outcome.

## Why the visual work has no release

The 0.9.0 wave does **not** start with a browser/visual oracle. `TASK-58`
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
