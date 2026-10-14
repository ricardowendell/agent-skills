---
name: process-inbox-notes
description: Process unprocessed inbox notes in a structured product-thinking repository. Use when the user asks to process inbox notes, organize raw notes, turn raw ideas into product docs, extract stable ideas, classify notes into vision/principles/experience/system/constraints/decisions/backlog, or clean up docs/inbox while preserving raw notes.
---

# Process Inbox Notes

## Purpose

Turn raw inbox notes into stable product-thinking documents without losing the original notes or inventing product direction.

## Workflow

1. Read `AGENTS.md` first for repository rules, product name, language, and file routing.
2. Find unprocessed notes in `docs/inbox`; if that folder does not exist, check `inbox`.
   - Treat `status: unprocessed` as unprocessed.
   - Treat notes without status frontmatter as unprocessed legacy notes.
   - Skip notes marked `status: processed` unless the user explicitly asks to reprocess them.
3. Read relevant existing docs before extracting ideas — especially `docs/product/` and `docs/principles/` — so you can detect conflicts and avoid duplicating what is already stable.
4. **Classify each note's register** before extracting anything:
   - `firm` — the note commits explicitly to something ("we will", "decided", concrete implementation detail).
   - `exploratory` — the note thinks through options without settling ("what if", "maybe", "or could we", comparing alternatives).
   - `rumination` — the note reflects or expresses feeling without a clear product direction.
   - A note can be mixed; classify by section if needed.
5. Extract ideas from each note according to its register:
   - From `firm` notes: extract as stable ideas ready to be placed in docs.
   - From `exploratory` notes: extract as candidate ideas or open questions — do not treat them as settled. Surface the alternatives the note raises.
   - From `rumination` notes: extract as open questions only; do not update stable docs from rumination alone.
6. Deduplicate ideas that already exist in stable docs.
7. **Check extracted ideas against vision and principles**: for each idea that would touch `docs/product/` or `docs/principles/`, explicitly state which existing statement it aligns with, extends, or modifies. Flag any tension or contradiction.
8. **Present a processing plan before writing anything.** Show:
   - Each extracted idea, its register, and the document it would update or create.
   - Any detected conflicts with existing vision, principles, or decisions.
   - Cases where multiple destinations are plausible — list the options.
   - Open questions that need user input before proceeding.
   Ask the user to confirm, redirect, or resolve ambiguities before making any changes. Do not proceed to writing until confirmed.
9. After confirmation, classify confirmed ideas into the right destination:
   - Product direction, philosophy, and constraints: `docs/product`
   - Design and AI rules: `docs/principles`
   - User journeys and flows: `docs/experience`
   - System structure and technical constraints: `docs/system`
   - Product or architecture decisions: `docs/decisions`
   - Future implementation work: `docs/backlog`
10. Update existing documents before creating new documents.
11. Create new documents only when an idea is stable, distinct, and does not fit an existing file.
12. **Changes to `docs/product/` or `docs/principles/` require explicit user confirmation** — even if the user asked to process all notes. State the exact change and wait for approval.
13. Preserve raw inbox notes. Do not delete or move them unless the user explicitly asks.
14. Add backlog items only when the note clearly implies future implementation work.
15. Add open questions when an idea is unclear, when the note's register is exploratory or rumination, or when multiple valid approaches exist and the user did not resolve them.
16. After processing a note, update only its YAML frontmatter:
    - Set `status: processed`.
    - Set `processed_at: YYYY-MM-DD HH:MM`.
    - Leave the raw note body unchanged.

## Writing Rules

- Preserve the user's intent and terminology.
- Keep docs concise and useful for product, design, and engineering decisions.
- Prefer Brazilian Portuguese for product-facing interface language.
- Avoid speculative features and feature bloat.
- Do not turn every idea into a feature.
- Do not treat exploratory thinking as a decision.
- Use backlinks to raw notes when useful.

## Output

End with:

- A concise summary of changed Markdown files.
- A list of unresolved questions, or `None`.
- A note that raw inbox files were preserved and marked processed when applicable.

## Pipeline

Previous stage: `capture-raw-idea`. Next stage: `groom-backlog-to-specs` — turn stable backlog items into specs. Offer this as the next step when processing finishes.
