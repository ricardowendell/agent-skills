---
id: SPEC-0047
title: Re-measure the blocked cells under the deny layer
status: ready
priority: P1
task: TASK-72
created_at: 2026-11-09
updated_at: 2026-11-09
source_docs:
  - backlog/tasks/task-72 - evals-re-medir-sob-o-deny-layer-e-reclassificar-as-skills-bloqueadas.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0045-stack-review-evals.md
  - docs/specs/active/SPEC-0046-deny-control-arm-corpus.md
related_decisions: []
depends_on:
  - SPEC-0046-deny-control-arm-corpus
  - SPEC-0048-a-denied-read-is-not-a-leak
blocks: []
files:
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0047-remeasure-under-deny-layer.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0047-remeasure-under-deny-layer.md --base main
---

# SPEC-0047: Re-measure the blocked cells under the deny layer

## Purpose

SPEC-0046 makes the control arm unable to read the installed corpus and makes
`isolated=yes` a claim the manifest has to support. What that unlock is worth is
still unmeasured. Five behavioural cells are published as `unresolved` only
because their control was never isolated:

- `capture-idea` #1 — `2026-11-07T08-27-30--capture-idea--agentworks-deepseek-v4-1-flash--without-skill`
- `process-inbox` #1 — `2026-11-06T17-25-52--process-inbox--without-skill` (dirty: leak + host)
- `groom-backlog` #2 — `2026-11-06T07-47-34--groom-backlog--without-skill`
- `write-implementation-prompt` #1 — `2026-11-07T08-17-29--write-implementation-prompt--agentworks-deepseek-v4-1-flash--without-skill`
- `bootstrap-project-harness` — one of the eight stack cells. #19 (a declared ESLint dependency with no config) is the candidate: it is the only stack cell where the control reached clean draws (2) and both failed its assertion, so it is the one with a real chance of a verdict either way.

This spec spends the draws to turn each one into a real classification.

## User Outcome

A reader of `docs/evals/coverage.md` can tell, for each of those cells, whether
the skill separates from the control, does not separate, or still cannot be
measured — and the run directories behind each verdict are cited. Issue #12's
behavioural criterion and issue #11's measured-run criterion get an answer
instead of "blocked on the deny layer".

## Scope

- **One behavioural cell per blocked skill**, chosen as the cell already
  published as blocked. Both arms, five draws per arm, with the model recorded.
- **Reclassification** of each cell as `separator`, `non-discriminator` or
  `unresolved`, naming the failing assertion for every red cell.
- **Publication** in `docs/evals/coverage.md` with the run directory and the raw
  counts, plus a `CHANGELOG` entry that states what changed and what did not.
- **Consumer update.** Issue #12 and TASK-70 are told the new evidence; a
  separation claim is only written where five clean draws exist in both arms.

**Blast radius.** The coverage inventory and the release entry. No harness code,
no skill behaviour, no fixtures.

## Non-Goals

- No change to the deny layer or to the runner. If the control cannot be
  enforced, this spec stops and reports; it does not fix SPEC-0046's job.
- No new cases and no fixture edits. The fixtures being measured were already
  measured once; changing them would need its own spec.
- No oracle edit after seeing draws. A red cell becomes a follow-up task.
- No lowering of the five-draw rule and no promotion of a cell with fewer than
  five clean draws in the control.
- No re-draw of the two stalled SPEC-0045 cells beyond what five clean draws
  require.

## Flow

1. **F0 — precondition.** Confirm the host reports enforcement available and the
   canary from SPEC-0046 passes. If not, stop: the wave has nothing to measure.
   Then run **one cell first** and read its manifest before committing the rest:
   `bootstrap-project-harness` #19, **control arm only** — its with-skill arm
   (`2026-11-09T07-37-44`) is already valid evidence. If that control run fails
   for an environmental reason, stop and report — do not spend the rest.
2. **F1 — run.** For each skill, both arms, five draws, one cell. Record every
   run directory and its raw counts.
3. **F2 — classify.** `separator` only with five clean draws in both arms;
   otherwise `non-discriminator` or `unresolved`, with the reason named.
4. **F3 — publish.** Coverage row per skill, CHANGELOG entry, and the consumer
   update on #12 and TASK-70.

## Data

- Run directories under `~/.local/share/opencode/evals/runs/`.
- `docs/evals/coverage.md` — the inventory and the per-skill rows.
- `CHANGELOG.md` — the release entry.
- The five published block records quoted in Purpose.

## Acceptance Criteria

1. **Every cell runs under an enforced control.** Each run reports the control
   as isolated (enforced, zero `leak`/`host` findings), or the spec records the
   enforcement failure and stops instead of publishing a verdict.
2. **The five-draw rule holds.** Each cell has five clean draws per arm, or is
   published `unresolved` with the exact reason (contamination, stall, missing
   draw) named.
3. **Every verdict is published with its evidence.** The coverage row cites the
   run directory and the raw counts; a `separator` states both arms, a
   `non-discriminator` states both rates, an `unresolved` names the blocker.
4. **No oracle moved after the draws.** Any red cell is recorded and becomes a
   follow-up task; no assertion, fixture or `why:` line is edited to fit.
5. **Consumers reflect the evidence.** Issue #12's behavioural criterion and
   TASK-70 say what the new runs show, and neither is marked done on fewer than
   five clean draws in both arms.
6. **The release entry is honest.** `CHANGELOG.md` states which cells became
   separators, which did not, and which remain unresolved — without recomputing
   a published number.
7. **Nothing else moves.** No harness code, skill text, template, fixture or
   detector change; every `tests:` command passes.

## Results

**The wave halted at F0.1. No verdict was published.**

**F0 — enforcement available.** `probeIsolation()` reports
`enforced: true`, `mechanism: "seatbelt"`, and
`node --test scripts/lib/evals/isolation.test.mjs` passes 18/18, including the
denied/allowed canary pair. The precondition holds.

**F0.1 — one cell first.** `bootstrap-project-harness` #19, both arms, five
draws, `agentworks/deepseek-v4-1-flash`, concurrency 4:

| arm | run directory | `enforced` | `skillLeaks` | `hostReads` | draws |
| --- | --- | --- | --- | --- | --- |
| with-skill | `2026-11-09T07-37-44--bootstrap-project-harness--agentworks-deepseek-v4-1-flash` | `true` (seatbelt) | 0 | 0 | 5 passed (5/5) |
| control | `2026-11-09T07-52-50--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill` | `true` (seatbelt) | 3 | 1 | r1 failed, r2 failed, r3–r5 contaminated |

`node scripts/check-eval-run.mjs` prints `isolated=yes` for the with-skill run
and `isolated=no` for the control. The control draws had no infrastructure
failure, no stall and no sandbox crash: every draw started, resolved its config
and completed.

**Why it halts.** The OS boundary is doing its job. In r3–r5 each corpus read
was denied — the transcript shows `ls: /Users/wendell/.agents/skills: Operation
not permitted` and the same for `/Users/wendell/.config/opencode/skills`,
`/Users/wendell/.agents/` and `/Users/wendell/.agents/commands`. The finding is
recorded anyway because SPEC-0046 deliberately left `leak.mjs` unchanged
("No change to `leak.mjs` detector rules"): the detector classifies a **path in
a tool-call input** as a leak, whether or not the OS denied the read, and the
published rule in `docs/evals/coverage.md` says the same ("A denied read still
counts"). So a control draw that probes the installed corpus can never be a
clean draw, and a control that probes is exactly what the bare agent does: it
hunts for a skill it does not have.

That is AC-1 failing, not a behavioural result: `isolated=no` on the control
means the spec must record the failure and stop instead of publishing a
verdict. Spending the other eight arms would produce the same
`isolated=no` accounting on any control that probes, i.e. `unresolved`
(contamination) for every cell — without measuring whether the skill separates.
The source task is explicit about this: TASK-72 AC-1 requires the wave to run
"com o deny layer efetivo e o resumo nao diz isolated=no em nenhuma celula".

**What was not spent.** F1's four remaining cells (`capture-idea` #1,
`process-inbox` #1, `groom-backlog` #2, `write-implementation-prompt` #1) were
not run: 40 draws saved. F2, F3 and F4 did not run either — no coverage row, no
`CHANGELOG` entry, no comment on issue #12 or TASK-70. No file outside this spec
was touched.

**What would unblock the wave.** A decision on the accounting rule for a denied
read: either the detector learns to separate a denied attempt from a successful
read (a harness change, which this spec's non-goals forbid and SPEC-0046 owns),
or the five-clean-draw rule is restated for an enforced host (a human decision
on the published evidence rules). Neither is invented here.

**Paused 2026-11-09, then resumed the same day.** The detector change was the
chosen route and it is its own spec: `SPEC-0048-a-denied-read-is-not-a-leak.md`
(implemented). It splits a denied corpus hit from a leak, so the control's
contamination is no longer structural. The branch was preserved as tag
`parked/SPEC-0047-remeasure-wave` and a new dispatch starts from
`SPEC-0048`'s result.

**What the halt bought.** Replaying the F0.1 runs under detector
`d8478beab04a4e3e` turns the control into five clean draws
(`deniedDraws=3`), so the contamination objection is gone. It does not,
however, score `r3`–`r5`: contamination short-circuited them and their
`assertions` are empty, and `file`/`unchanged` assertions are not replayable
because the scratch is gone. The **with-skill** run at
`2026-11-09T07-37-44` is valid (5/5, `isolated=yes`) and is reused; only the
#19 **control** is re-run (5 draws). The remaining four cells cost 40, so the
resume is **45 draws**, not 50.

## Open Questions

- **Which cell per skill?** The five named above are the published blocks. If
  one of them turns out to be the wrong cell to spend draws on, the spec says
  why before spending.
- **What is the ceiling?** Forty-five draws: the four remaining cells at both
  arms (40) plus the #19 control (5), because its with-skill arm is reused. The
  bootstrap cell is #19, not the whole stack matrix; a second stack cell would be
  a separate decision. If a post-load stall hits, the TASK-50 protocol applies:
  stop the wave, record the events, reopen the task — do not retry blindly.
- **What if a cell still cannot reach five clean draws?** It stays `unresolved`
  and the reason is published. That is a legitimate outcome, not a failure of
  the spec.
- **Does a separation change the release claim?** Only the wave decides; the
  CHANGELOG is written from what the runs show.

## Prompt Notes

- **Requirements:** prove the enforcement first; spend only the draws the five
  cells need; publish every verdict with its run directory; never promote a
  partially clean cell.
- **Entities:** cell (skill + case number), arm, draw, clean/contaminated,
  verdict (`separator` / `non-discriminator` / `unresolved`), run directory.
- **Approach:** reuse the existing runner unchanged; one cell per skill; both
  arms at five draws; classify with the published rules.
- **Structure:** only `docs/evals/coverage.md`, `CHANGELOG.md` and this spec
  change. Run artifacts stay in the eval store.
- **Operations:** check enforcement; run the eight cells; read counts; classify;
  publish; update the two issues; run the gates.
- **Norms:** `node`, not bun. Five draws, never three. Prose in English. A red
  cell is named, not argued away.
- **Safeguards:** stop on a stall or a non-enforced control; no `--resume` without
  a human decision; no oracle edit; no fixture edit; no claim from a manual case.
- **Tests:** the enforcement precondition is verified before any draw; the
  published counts are re-read from the stored run dirs; `check-evidence` and
  `spec-check` run clean.
