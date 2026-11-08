# Roadmap

The plan behind the releases. It is a working document, not a policy: the
pipeline (`docs/pipeline.md`) governs how work runs; this page says what the work
is and in which order. A change of direction is a human decision, and the
releases themselves are the record of what shipped.

Status: **0.6.2 released** on 2026-11-07. The next release is 0.7.0.

## Inputs

GitHub issues are a durable input alongside `docs/inbox/` and the backlog. The
AS-ITER program arrived on 2026-11-08 as issues #6–#10; each has a task
(`TASK-56`–`TASK-60`) that carries the release slice, and the issue keeps the full
scope and the external references. A spec is written at groom, from the task.

| issue | task | what it is |
| --- | --- | --- |
| #6 | `TASK-56` | the discriminating corpus for iterative work (the gate) |
| #7 | `TASK-57` | spike: a localized refinement path without a full spec |
| #8 | `TASK-58` | planning a visual change from element and design tokens |
| #9 | `TASK-59` | light solution framing before a template is chosen |
| #10 | `TASK-60` | read-only experience review with evidence and limits |

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
| **0.7.0** | the corpus can see a small change | `TASK-56` (deterministic slice) and the verdict on `TASK-57` | ~30–40 draws |
| **0.8.0** | the corpus can see a screen | a browser/visual oracle, then `TASK-58` and `TASK-60` | measurement |
| **0.9.0** | framing, only if a gap remains | `TASK-59`, conditional on `TASK-56` | measurement |
| unscheduled | — | `diagnose-failure`: needs a captured problem statement first | 0 until then |
| unscheduled | — | `agent-skills doctor`: zero draws, rides any release | 0 |

## 0.7.0 — the order

1. **Freeze the holdout before the first draw**, the way `review-code` #7 was
   frozen for issue #5. A holdout chosen after seeing results is not a holdout.
2. **`TASK-56` — three or four cases, deterministic oracles.** Text, file and
   shell only: no browser, no screenshot. One case is adversarial — a request that
   would touch auth, policy or an out-of-scope file must be refused or escalated
   even when the visible result looks right.
3. **The verdict on `TASK-57`.** With the cases measured, decide whether
   `implement-from-prompt` already covers the iterative case, needs an extension,
   or a new skill is justified. "No gain" is a valid, recorded outcome.
4. **Store audit and health pass before the cut**, as in 0.6.2.

## Why the visual cases wait for 0.8.0

`TASK-58` and `TASK-60` are blocked on `TASK-56`, not only for corpus but for a
decision the harness has not made: there is no visual or browser assertion. The
honest options are to add that path, or to accept human review and declare the
coverage — and the second is not a separator, so it cannot carry a `P1` claim on
its own. The decision belongs to 0.8.0, with its own cost.

## Out of scope until a consumer asks

- **A deny layer for the control arm.** `TASK-29` chose detection over denial;
  the consequence is that `capture-idea` #1, `process-inbox` #1 and
  `write-implementation-prompt` #1 stay `unresolved`. That is honest. If a
  consumer needs one of those cells, the deny layer is its own task, not a
  re-measure.
- **More cases of the same shape, a bigger corpus, an expanded judge.**
- **A token-budget mechanism** on top of the health delta.
- **pdlc phase markers (`PDLC-83`).** Another repo; it does not block this one.
- **`diagnose-failure`.** It was the planned 0.7.0 and had no task, spec or inbox
  note behind it — only this table. It returns when a real failure is captured
  with its reproduction, not before.

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
