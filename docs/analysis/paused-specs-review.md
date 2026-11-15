# Paused specs — review (2026-11-15)

Independent audit of the four paused specs (`SPEC-0036`, `0037`, `0038`, `0040`)
against the repo as it stands after 0.9.2–0.9.6. Read-only: this memo records
findings and recommendations; it changes no spec and spends no draw.

## Summary

| spec | proposal | cost | premise after 0.9.x | un-pause condition | recommendation |
| --- | --- | --- | --- | --- | --- |
| `SPEC-0036` visual change planning | element → component by evidence, or `unresolved` | runner-sized oracle + 20–40 draws + fixture + human review | **weakened towards paused**: `TASK-61` closed (b), the visual oracle is now frozen, demand unchanged | a named consumer that accepts declared human review | **keep paused**; three amendments |
| `SPEC-0037` solution framing | a short frame before choosing a template | none stated; ~10–30 draws | **falsified**: `SPEC-0034` measured the exact case (#12) and the incumbent separates 4/5 vs 0/5 in its own favour | a new transcript where the neighbours mishandle the request | **kill** |
| `SPEC-0038` experience review | read-only surface review with four certainty labels | frozen oracle + preview contract + fixture | **half fallen**: the oracle blocker is satisfied by the (b) path the spec itself predicted; preview still missing | a consumer with an authorized preview | **keep paused**; natural kill candidate next cycle |
| `SPEC-0040` stakeholder recap | a `recap` mode inside `report-project-status` | 0–12 draws, no oracle | **base validated** (0.9.2: 5/5 vs 0/5), **gap unmeasured**: the audience claim has no session | two stakeholder openings in the next window | **keep paused** until 2026-11-20; five amendments |

## Findings that apply to all four

- **The `tests:` gate does not run.** All four list
  `node scripts/run-evals.mjs --root skills --list --check`; that script does not
  exist. The CLI was consolidated in `SPEC-0060`; the live command is
  `node scripts/eval.mjs check --root skills`. Any of the four would fail its own
  "every command in `tests:` passes" criterion before implementation.
- **`files:` points at a retired path.** All four declare
  `skills/<id>/references/evals.md`; the corpus moved to `evals/<id>/cases.md`
  in `SPEC-0058` and `CONTRIBUTING.md` forbids keeping cases inside the skill.
- **`check-staleness` is missing** from every `tests:`, though each adds cases to
  a corpus the tool audits.
- **`docs/evals/visual-corpus.md` is declared by both `SPEC-0036` and
  `SPEC-0038`** with no dependency between them — the same collision
  `SPEC-0040` cites as its pause reason, unapplied to the other two.

## `SPEC-0036` — keep paused, three amendments

The blocker (`:79-81`) still treats the visual oracle as an open decision, but
`TASK-61` is `Done` and `SPEC-0077` decided **(b) no visual oracle**, with visual
cases in declared human review. The option the spec leaves open ("screenshot
comparison, DOM query, computed style, axe", `:83-84`) is now inside the freeze
and can only reopen with evidence that the current mechanism blocks a valid
measurement — evidence a non-existent skill cannot produce. The allowed path is
already in its own AC5 ("published as human review, not as a pass").

Amendments: (i) delete the frozen option from the Blocker and record `TASK-61`'s
outcome; (ii) restate the un-pause condition as a **named consumer** only;
(iii) fix the harness facts at `:80-82` (there are 16 kinds, there is no `shell`
kind, and no `dangerous` status exists in the corpus) and rewrite AC5 as declared
human review.

## `SPEC-0037` — kill

Its own trigger (`:50-52`) was "when `SPEC-0034` shows the incumbent mishandling
an underspecified request". `SPEC-0034` measured that case (#12): the incumbent
separates **4/5 vs 0/5 in its own favour**, and the corpus summary says "no loss
for the incumbent on #9–#11". The demand sample has no framing cluster
(`skills-from-sessions-2026-11-07.md:76`), and the "template" half depends on a
versioned catalogue that the roadmap's AS-ITER decision explicitly excludes.
Keeping it paused under the current wording says "waiting for the corpus" when
the corpus already answered.

If the maintainer prefers not to kill it, the spec must be rewritten around a new
measured trigger (a real transcript where `groom-backlog` produces a bad frame)
and given a draw ceiling — it cannot keep claiming to wait for a gate that ran.

## `SPEC-0038` — keep paused, kill candidate next cycle

The oracle blocker is satisfied by the route the spec itself named ("or the
release explicitly accepts human review as its evidence", `:81-83`), which
`SPEC-0077` + the roadmap now state; the spec does not record it. The preview
contract blocker remains whole, and AC4 ("the evaluation separates a provable
violation from a preference") is a separation claim the (b) decision forbids —
it must become "records provable vs preference in a declared human review".

Its overlap with `review-code` + `impeccable` is larger than `SPEC-0036`'s, so if
no consumer with a preview appears next cycle, this is the one to kill.

## `SPEC-0040` — keep paused until 2026-11-20, five amendments

The base is the strongest of the four (the status cell is a 5/5 vs 0/5 separator
as of 0.9.2), but the gap is an **audience** claim with no audience in the
sample: all fifteen cited sessions open as the operator. The pilot harvest of
2026-11-20 measures operator efficiency (turns to first action), not audience; it
can at most supply an anecdote.

Amendments: (i) delete F5 ("at the commit that records `SPEC-0034`'s Results,
flip to `ready`") — that commit happened and the 2026-11-12 re-decision kept it
paused; (ii) replace the justification with an audience condition (two
stakeholder openings, or a named consumer); (iii) drop the README clause — the
row exists at `README.md:87`; (iv) reconcile `PENDING`/`NEXT STEP`/`NOT MEASURED`
with the report's existing `BACKLOG`/`NEXT STEPS`/`NOT CHECKED`; (v) say where
`WHAT CHANGED` is observed, and admit that adding history to the observation
changes the operator path.

## Not verified

- Whether `spec-check` passes on the four today: not run; the three mechanical
  breaks above suggest not.
- Whether `impeccable` and `simplify` actually cover the visual territory: no
  measurement exists; neither is in `companion-skills.json`, which requires
  measured entries.
- The maintainer's intent on killing `SPEC-0037`: the recommendation derives from
  the spec's own trigger, not from a stated decision.
