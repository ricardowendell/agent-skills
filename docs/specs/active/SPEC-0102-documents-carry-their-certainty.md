---
id: SPEC-0102
title: Generated documents carry their certainty
status: implemented
priority: high
task: TASK-125
created_at: 2026-11-19
updated_at: 2026-11-19
source_docs:
  - backlog/tasks/task-125 - bootstrap-templates-carry-structured-certainty-and-the-glossary-stops-demanding-code-entities.md
  - docs/inbox/2026-11-19-bootstrap-aprender-antes-de-decidir.md
  - docs/specs/SPEC-0100-bootstrap-interview-asks-what-we-know.md
related_decisions: []
depends_on: []
blocks:
  - SPEC-0103
files:
  - skills/bootstrap-project-harness/SKILL.md
  - skills/bootstrap-project-harness/templates/product-vision.md
  - skills/bootstrap-project-harness/templates/product-scope.md
  - skills/bootstrap-project-harness/templates/product-language.md
  - skills/bootstrap-project-harness/templates/product-principles.md
  - skills/bootstrap-project-harness/templates/product-design-principles.md
  - skills/bootstrap-project-harness/templates/product-design-system.md
  - skills/bootstrap-project-harness/templates/product-voice.md
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0102-documents-carry-their-certainty.md
  - docs/prompts/SPEC-0102-documents-carry-their-certainty.prompt.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0102-documents-carry-their-certainty.md
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
---

# SPEC-0102: Generated documents carry their certainty

## Purpose

`SPEC-0100` taught the interview to record a solution as a candidate, and to
report product understanding as confirmed, provisional or unknown. The templates
those answers land in have no way to say so. A generated `vision.md` reads
exactly like a generated `architecture.md`: same declarative voice, same absence
of provenance. So a hypothesis recorded at minute ten of a bootstrap looks, to
every later agent, like a decision the operator made.

This spec gives the generated product documents a place to state what each
section is worth, before anything downstream starts treating them as instructions.

## User Outcome

Someone opening a bootstrapped repo can tell, section by section, what was
confirmed by evidence, what was accepted as a decision, what is still a
hypothesis, and what is an open question — without reading the transcript of the
bootstrap that wrote it. The glossary no longer demands a code entity for a term
that has no code yet.

## Scope

- **F0 — the vocabulary, stated once.** Four values with one meaning each:
  `confirmed` (backed by something observed), `accepted` (a decision that holds
  until deliberately revised), `hypothesis` (a belief to be tested), `open` (no
  answer yet). The set is closed; the words are the ones `SPEC-0100` already uses.
- **F1 — the shape, in frontmatter.** Each generated product document opens with
  a `certainty:` map whose keys are its section names and whose values come from
  the closed set. Frontmatter keeps the labels machine-readable and out of the
  prose. A section that cannot be labelled at that granularity becomes an entry
  under Open Questions rather than getting an inline marker.
- **F2 — the seven templates.** `product-vision`, `product-scope`, `product-language`,
  `product-principles`, `product-design-principles`, `product-design-system` and
  `product-voice` each show the map in their own shape, with every section
  heading they already have appearing as a key. No section is invented to hold a
  label, and no label is invented to cover a section.
- **F3 — the glossary stops demanding code.** `product-language` marks the Code
  Entity column optional until the entity exists, in the header note and the
  example row, so a term can be recorded before its implementation.
- **F4 — the bootstrap writes labels, not adjectives.** `SKILL.md` step 18 says a
  candidate is written with its label and never laundered into declarative prose;
  a preference is written as a preference.
- **F5 — screening.** The template and `SKILL.md` edits move the bootstrap's
  `skillHash`. Screen cases 6 (vision stubs, the `<!-- Q:` shape) and 1 (the full
  product tree) at 1–2 draws each, and record the skillHash, the staleness delta
  and the reason in `docs/evals/coverage.md` with the words "screening, not a
  separation claim".

  **Pass criterion, fixed before the first draw.** Case 6 and case 1 machine
  `assert:` lines must stand at their recorded counts, **and** the generated
  `docs/product/vision.md` in the draw must carry a `certainty:` frontmatter map
  whose keys match its section headings. A draw that creates the tree without the
  map has not exercised this change, whatever its assertions say.

  **Stop after the first draw.** One draw of case 6 answers whether the templates
  survive being written; only if it holds does case 1 run.

  **Fallback, decided now.** If the map is dropped by the model while the
  assertions pass, the answer is a template that makes the map harder to omit —
  not a claim that the label exists.
- **F6 — publish.** One `CHANGELOG.md` `[Unreleased]` line.

**Blast radius.** Seven template bodies and one step of `SKILL.md`, plus the
evidence note and the release entry. No script, no sensor, no fixture, no
`.opencode/opencode.json`. The loaded-instruction boundary is `SPEC-0103`.

## Non-Goals

- **No validation script.** The generated `docs-check` sensor would have to learn
  the vocabulary, and it has parity fixtures on both the JS and Python side.
  Nothing in this spec adds a gate.
- **No inline statement markers.** Doc-level frontmatter only; a finer label is a
  worse label.
- **No normative-authority change.** Whether a labelled document may be loaded as
  an instruction is `SPEC-0103`; this spec only makes the label exist.
- **No new template file.** The seven existing ones are edited in place; adding a
  file would move `harness-state`'s `REQUIRED`/`OPTIONAL` lists and their parity
  test.
- **No measured claim.** Screening is a direction.

## Flow

1. Read the seven templates and list the section headings each already has.
2. Write the vocabulary once — in `product-language.md`, the document that owns
   definitions — and reference it from the others rather than redefining it.
3. Add the `certainty:` frontmatter to each template, keys matching its headings.
4. Make the Code Entity column optional in `product-language.md`, in the header
   note and the sample rows.
5. Edit `SKILL.md` step 18 so a candidate is written as a candidate.
6. Run the validator and the bootstrap's own tests; the template parity tests must
   stay green, which is the check that no template gained or lost a required file.
7. Screen cases 6 and 1; record the hash move and the delta.
8. Add the changelog line.

## Data

Per document:

```yaml
---
certainty:
  problem: confirmed
  audience: confirmed
  solution: hypothesis
  success: open
---
```

- Keys are the document's own section names, lowercased and hyphenated where the
  heading has spaces.
- Values come from `{confirmed, accepted, hypothesis, open}` and nothing else.
- A document with no unverified content still carries the map: `accepted` on
  every section is a statement, not a default.

## Acceptance Criteria

1. Seven templates carry a `certainty:` frontmatter map, and for each template the
   keys match its section headings — no heading unlabelled, no key without a
   heading (verifiable by reading the template beside its own body).
2. The four values appear with one meaning each, defined once and referenced
   elsewhere; `grep` finds no second definition of the set.
3. `product-language.md` states that the Code Entity column is optional until the
   entity exists, and its sample row shows a term with the column empty.
4. `SKILL.md` step 18 requires a candidate to be written with its label, and a
   preference to be written as a preference.
5. No file outside `files:` changes: no script, no sensor, no fixture, no
   `.opencode/opencode.json`, no new template.
6. `node scripts/validate-skills.mjs --root skills` prints `All clear`,
   `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` passes
   (template parity included), and `spec-check` reports no errors.
7. Screening on cases 6 and 1 is recorded with the skillHash move, the staleness
   delta and the words "screening, not a separation claim"; the first draw of case
   6 runs alone, the pass criterion in Scope > F5 holds in both halves, and no
   rate is written.

## Results

Implemented in the `pdlc/SPEC-0102-documents-carry-their-certainty` worktree.

- `node scripts/validate-skills.mjs --root skills` → `All clear` before and after.
- `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` → 42 pass, 0 fail; the template parity tests were not edited and stayed green, which is the evidence that no template file was added or removed.
- Full `selftest` chain in the worktree: `eval check` 121 cases, 574 + 24 tests passing, sensor parity 2/2, `check-evidence` 6 documents 0 errors.
- Heading-to-key parity checked mechanically per template: `missing=[] extra=[]` on all seven.
- Tree hash `d4b5ea4e5309…` → `d2ea68796767…`; `check-staleness` 86 cited / 60 stale at the implementation commit, 87 cited / 59 stale once the draws are cited, because case 1's new run is at the current tree.
- **Screening, case 6, one draw:** `2026-11-19T15-39-05--bootstrap-project-harness`, `passed [1/1]`, and the draw wrote `docs/product/vision.md` with the five `certainty:` keys, every value `open`, stubs intact.
- **Screening, case 1, one draw:** `2026-11-19T15-51-44--bootstrap-project-harness`, `passed [1/1]`, writing the design-system document with its five keys, all `open`.

Two draws are a direction, not a rate; this is screening, not a separation claim.

## Open Questions

- **Does a `certainty:` map survive the operator's own edits?** A person filling
  the template by hand may drop the frontmatter. No check enforces it here, by
  design; if it rots, that is evidence for a later sensor change, not a reason to
  add one now.
- **Portuguese or English section keys?** The templates are English and the
  consumer's docs may be Portuguese. This spec keeps keys in English, matching the
  headings it labels; a repo that renames its headings renames its keys.
- **First observed drift, 2026-11-19.** In the case-1 draw the model wrote
  `docs/product/language.md` with a key `terms` that has no matching heading — the
  glossary table in that document is headless. The template-level criterion held,
  and that document was not the one the pass criterion named, but it is the exact
  failure this design fears. SPEC-0103 and any later sensor work should read it as
  evidence, not as an accident.

## Prompt Notes

- Requirements: seven templates labelled, one vocabulary, optional code entity,
  step 18 writes labels, no new file.
- Entities: certainty value (four, closed), section key, frontmatter map,
  candidate, preference.
- Approach: edit in place; write the vocabulary once and reference it.
- Structure: templates plus one step of `SKILL.md`.
- Operations: read each template's headings first, then label; run the parity
  tests because they are the guard against a required file appearing or vanishing.
- Norms: the templates are the only product-doc shape a consumer gets; keep their
  voice and their existing headings.
- Safeguards: no inline markers, no new file, no script, no gate, no claim of
  measurement, and no change to what `opencode.json` loads.
- Tests: (1) heading-to-key parity per template; (2) single definition of the
  vocabulary; (3) code-entity column optional by inspection; (4) template parity
  suite green.
