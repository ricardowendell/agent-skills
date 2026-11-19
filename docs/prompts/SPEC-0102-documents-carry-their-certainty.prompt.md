---
spec: SPEC-0102
spec_sha: 51d431d198ff2f82de2894f233ed8838b4527a112383da639cf3faf1c78b76e7
---

# Implementation Prompt: SPEC-0102 Generated documents carry their certainty

## Source Spec

- `docs/specs/active/SPEC-0102-documents-carry-their-certainty.md` (pin `51d431d1…`)
- Blocks: SPEC-0103 (the loading boundary), which needs this vocabulary to exist.
- Sibling: SPEC-0100 (implemented) already made the interview record a candidate
  and report three facts; this spec gives those answers a place to land.

## Requirements

**User outcome.** Each generated product document says, section by section, what
it is worth — confirmed, accepted, hypothesis or open — so a later agent cannot
mistake a bootstrap guess for a decision. The glossary stops demanding a code
entity for a term that has no code yet.

Copied from the spec's Acceptance Criteria:

1. Seven templates carry a `certainty:` frontmatter map whose keys match their
   section headings — no heading unlabelled, no key without a heading.
2. The four values appear with one meaning each, defined once and referenced
   elsewhere.
3. `product-language.md` states the Code Entity column is optional until the
   entity exists, and its sample row shows a term with the column empty.
4. `SKILL.md` step 18 requires a candidate to be written with its label, and a
   preference to be written as a preference.
5. No file outside `files:` changes.
6. Validator `All clear`, bootstrap script tests pass (template parity included),
   `spec-check` reports no errors.
7. Screening on cases 6 and 1 recorded with the skillHash move, the staleness
   delta and "screening, not a separation claim"; case 6 first, alone; the pass
   criterion in F5 holds in both halves.

**Non-goals.** No validation script, no inline statement markers, no change to
what `opencode.json` loads, no new template file, no measured claim.

## Entities

| Term | Meaning here |
|---|---|
| certainty value | one of `confirmed`, `accepted`, `hypothesis`, `open` — closed set |
| confirmed | backed by something observed |
| accepted | a decision that holds until deliberately revised |
| hypothesis | a belief to be tested |
| open | no answer yet |
| section key | the document's own section name, lowercased, hyphenated on spaces |
| candidate | a proposed solution the operator has not decided on |

## Approach

Edit seven templates in place and one step of `SKILL.md`. Define the vocabulary
once, in `product-language.md`, because that document already owns definitions;
every other template references it instead of restating it. The `certainty:` map
goes in frontmatter so it is machine-readable and invisible in the rendered page.
No new file: adding one moves `harness-state`'s `REQUIRED`/`OPTIONAL` lists and
their parity test, which is out of scope.

## Structure

- `skills/bootstrap-project-harness/templates/product-vision.md`
- `skills/bootstrap-project-harness/templates/product-scope.md`
- `skills/bootstrap-project-harness/templates/product-language.md` (owns the vocabulary)
- `skills/bootstrap-project-harness/templates/product-principles.md`
- `skills/bootstrap-project-harness/templates/product-design-principles.md`
- `skills/bootstrap-project-harness/templates/product-design-system.md`
- `skills/bootstrap-project-harness/templates/product-voice.md`
- `skills/bootstrap-project-harness/SKILL.md` (step 18)
- `docs/evals/coverage.md`, `CHANGELOG.md`

## Operations

1. Run `node scripts/validate-skills.mjs --root skills` and
   `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` for a green
   baseline; a later failure must be attributable to this change.
2. For each of the seven templates, list its section headings before editing. The
   map's keys come from that list, not from the spec's imagination.
3. Write the vocabulary once in `product-language.md`: the four values, one
   definition each, and a sentence that the set is closed.
4. Add the `certainty:` frontmatter to each template. Inside the body, point at
   `product-language.md` for the vocabulary rather than redefining it.
5. In `product-language.md`, make the Code Entity column optional until the entity
   exists — state it in the header note and show it in a sample row with the
   column empty.
6. Edit `SKILL.md` step 18: a candidate is written with its label, a preference is
   written as a preference, neither is laundered into declarative prose.
7. Re-run the validator and the bootstrap tests. The template parity tests are the
   guard that no required template appeared or vanished — if they fail, the edit
   changed the file set and must be reconsidered, not "fixed" by editing a test.
8. Record the skillHash move and the staleness delta in `docs/evals/coverage.md`,
   with the words "screening, not a separation claim". **Do not write draw counts
   or rates**: the screening runs after your commit.
9. Add the `CHANGELOG.md` `[Unreleased]` line.

## Norms

- Conventional Commits, subject ≤ 72 characters:
  `feat(SPEC-0102-documents-carry-their-certainty): <summary>`.
- The templates are the only product-doc shape a consumer receives: keep their
  voice, their headings and their brevity.
- English section keys, matching the English headings they label. A consumer that
  renames its headings renames its keys.
- No unit test is added for frontmatter content: parity tests plus the screening
  draw are the verification the spec names. Do not manufacture a test for prose.

## Safeguards

- Do not add a template file, a sensor change or a validation script.
- Do not add inline `<!-- certainty -->` markers; frontmatter only.
- Do not touch `.opencode/opencode.json`, `architecture.md.template` or
  `AGENTS.md.template`: the loaded-instruction boundary is SPEC-0103.
- Do not rename or remove an existing template heading to make a key fit.
- Do not write a draw count, rate or run directory for a screening that has not
  run.
- Do not push. The branch lives locally until fan-in.

## Verification

| AC | Check |
|---|---|
| 1 | Per template: read the body headings and the `certainty:` keys side by side; they must be the same set |
| 2 | `grep` the vocabulary definition; it appears once, in `product-language.md`, and other templates reference it |
| 3 | Read `product-language.md`: the optional-column note and an empty-cell sample row exist |
| 4 | Read `SKILL.md` step 18: candidate-with-label and preference-as-preference sentences exist |
| 5 | `git diff --name-only` against the base equals the spec's `files:` |
| 6 | `node scripts/validate-skills.mjs --root skills` → `All clear`; `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` → pass; `spec-check` → no errors |
| 7 | After the worker commit: one draw of case 6, read the transcript against the F5 pass criterion (assertions standing **and** the map present), then case 1 |

The work is done when every AC passes, the screening is recorded honestly, and the
spec moves to `implemented` in the bookkeeping commit — not before.
