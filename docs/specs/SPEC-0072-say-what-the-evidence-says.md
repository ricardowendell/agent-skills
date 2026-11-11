---
id: SPEC-0072
title: Say what the evidence says, in seven places
status: implemented
priority: P3
task: TASK-104
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-104 - docs-tres-ajustes-de-redacao-da-spec-0067.md
  - docs/specs/SPEC-0067-each-draw-records-its-boundary.md
  - docs/specs/SPEC-0070-the-body-already-matches-what-the-skill-does.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/evals/coverage.md
  - docs/evals/iterative-corpus.md
  - scripts/lib/evals/isolation.mjs
  - docs/specs/SPEC-0070-the-body-already-matches-what-the-skill-does.md
  - docs/specs/SPEC-0072-say-what-the-evidence-says.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/SPEC-0072-say-what-the-evidence-says.md --base main
---

## Purpose

Seven sentences across four documents and one comment claim slightly more than
the artefact can support. None changes a verdict, a count or a class; all of them
are the kind of drift that later reads as evidence.

They were found by the reviews of `SPEC-0067` and `SPEC-0070` and deferred so the
fixes could land. This spec pays that debt in one pass.

## User Outcome

- A reader can tell which run proves a mechanism and which one merely proves a
  re-run happened.
- A quoted command line matches the command that printed it, character for
  character.
- The reopening conditions say what the finding actually covers.

## Scope

### F1 — the mechanism belongs to the invocation, not the artefact

`docs/evals/coverage.md`'s `#12` control caveat puts the provenance parenthetical
(`cf2e2e31…`, `8aab5bd`) next to "re-run under seatbelt", where it reads as
evidence *for the mechanism*. It evidences only that the draw was re-run at that
build under that detector. Attribute the seatbelt to the invocation (the host
recorded `enforced: true` for the same build at 06:41 and 06:43 that morning) and
repeat that the draw itself carries no mechanism record — the other documents
already say that somewhere; put it in the same sentence.

### F2 — quote the tool's own label

`docs/evals/iterative-corpus.md:217` quotes a `check-eval-run` line with the cell
abbreviated to `#12`; the command prints `implement-from-prompt#12`. Make the
quote match the output.

### F3 — do not document a capability that does not exist

`scripts/lib/evals/isolation.mjs:197-202`'s comment sanctions a
`(built before the enforcement probe)` parenthetical that no caller can produce:
no parameter threads build order into the fold. Either implement it or delete
the sentence. **Delete it** — the spec that introduced the rule deliberately did
not implement it, and a comment that describes a hypothetical is how the next
reader gets misled.

### F4 — the two `SPEC-0070` wording nits

- `docs/evals/iterative-corpus.md:205` — the five-reply aggregation must say that
  **all five** asked through the `question` tool, which the non-interactive
  harness cancelled, and that four restated the question in the final text, while
  `#12 r2`'s carries no `?` and it is the one stored red. Keep the derailment
  verdict (r2 edited nothing).
- `docs/evals/iterative-corpus.md:213` — the reopening condition "a future loaded
  draw that stops or redirects on a bare request" is broader than the finding: a
  `#12`-shaped draw legitimately stops. Narrow it to a draw that stops or
  redirects **where the case measures that the work be done**.
- `docs/specs/SPEC-0070-…md` — the same "all five stop with one clarifying
  question" aggregation, corrected the same way.
- `docs/evals/iterative-corpus.md:196` — the `#10 r4` quote is cut mid-sentence
  without an ellipsis; restore the full clause or mark the cut.

## Non-Goals

- **No measured number, class, run directory or hash changes.** This is prose.
- **No new document.** Seven edits in place.
- **No paid draw.** Nothing here is re-derived; each sentence is checked against
  the artefact it cites.
- **No edit to `isolation.mjs` behaviour** — the comment only.

## Flow

1. **F1–F4** — edit each site, verifying the claim against the stored run or the
   command output as you go.
2. **F5** — re-run the gates and confirm no `check-evidence` warning appears.

## Data

- `docs/evals/coverage.md` (the `#12` control caveat, near the dated readings).
- `docs/evals/iterative-corpus.md` (`:196`, `:205`, `:213`, `:217`).
- `scripts/lib/evals/isolation.mjs:197-202`.
- Stored runs: `2026-11-08T06-44-22--implement-from-prompt--…--without-skill`
  (`r3`), `2026-11-11T06-41-39` and `06-43-38` (the same build, `enforced: true`),
  `2026-11-08T06-35-22--…` (`#10 r4`), `2026-11-08T06-39-39--…` (`#12 r2`).

## Acceptance Criteria

1. No sentence attributes a mechanism to a draw whose record lacks it; the
   parenthetical is framed as invocation evidence.
2. The quoted `check-eval-run` line matches the tool's output label exactly.
3. The comment in `isolation.mjs` describes only what the code can do, and the
   file's behaviour is unchanged (`git diff` limited to comment lines).
4. The `#12 r2` sentence says it asked through the cancelled `question` tool and
   names it as the stored red, without changing the derailment verdict.
5. The reopening condition names "where the case measures that the work be done".
6. The `#10 r4` quote is complete or marked as cut.
7. No measured number, class, run dir or hash changes; `check-evidence` stays
   0 errors / 0 warnings; every command in `tests:` exits 0.

## Decisions

- **The comment is deleted, not implemented.** Threading build order into the
  fold would add a parameter to answer a question nobody asked; the rule the
  comment described was deliberately left unimplemented.
- **Prose debt is paid in one pass.** Seven separate reviews of the same
  sentences cost more than one spec that fixes them together.

## Open Questions

None.

## Prompt Notes

- Check each sentence against the artefact, not against the other document: the
  three caveats currently disagree in small ways, and one of them is wrong.
- Do not "improve" neighbouring prose. If a sentence is outside this list, leave
  it.

## Results

Seven prose edits, zero draws spent:

- **F1** — `docs/evals/coverage.md`: the `#12` control caveat now names the
  re-run's build at `8aab5bd` under detector `cf2e2e319d975a5b` and attributes
  the seatbelt to the invocation — the same pair recorded `enforced: true` in the
  `2026-11-11T06-41-39` and `06-43-38` runs — while stating in the same sentence
  that the re-run's own draw carries no mechanism record. The stored `r3` has no
  `isolation` field.
- **F2** — `docs/evals/iterative-corpus.md`: the quoted `check-eval-run` warning
  now reads `warn isolation-unproven implement-from-prompt#12 …`, matching the
  command's output.
- **F3** — `scripts/lib/evals/isolation.mjs`: deleted the comment sentence that
  sanctioned a "(built before the enforcement probe)" parenthetical no caller can
  produce. Comment-only diff; behaviour unchanged.
- **F4** — `docs/evals/iterative-corpus.md`: the `#10 r4` quote is restored to
  end "so there was no spec to move to `in_progress`/`implemented`"; the `#12`
  aggregation says all five asked through the `question` tool the non-interactive
  harness cancelled and four restated the question in the final text, while
  `#12 r2`'s text has no `?` and it is the one stored red; the reopening
  condition now adds "where the case measures that the work be done".
  `docs/specs/SPEC-0070-the-body-already-matches-what-the-skill-does.md` carries
  the same corrected aggregation.

Gates: every command in `tests:` exits 0; `check-evidence` reports `0 errors, 0
warnings`. No measured number, class, run directory or hash changed.
