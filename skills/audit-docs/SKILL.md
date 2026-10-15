---
name: audit-docs
description: Audit product-thinking docs for contradictions, duplicates, unclear principles, misplaced ideas, and scope creep. Use when the user asks for a docs consistency check, documentation review, product-doc audit, or an architecture/constraints alignment check. Proposes scoped edits without expanding scope.
---

# Check Doc Consistency

## Purpose

Review product-thinking Markdown files for drift, contradiction, duplication, and scope creep. Recommend precise edits that make the existing product direction clearer without adding new ambitions.

## Workflow

1. Read `AGENTS.md` first.
2. Read all Markdown files under the repository, prioritizing `docs/**/*.md`.
3. Include inbox notes only as source context:
   - Use processed inbox notes to understand source material.
   - Do not treat raw inbox wording as stable product direction if it conflicts with stable docs.
   - Flag unprocessed inbox notes separately if they contain ideas not reflected elsewhere.
4. Compare stable docs across:
   - Product vision and philosophy.
   - Design and AI principles.
   - Experience flows.
   - System architecture.
   - Product and technical constraints.
   - Backlog and decisions.
5. Identify only meaningful issues.

## Review Checklist

Look for:

- Contradictions between docs.
- Duplicated ideas that should be consolidated or cross-referenced.
- Principles that are vague, overloaded, or not actionable.
- Ideas that belong in another file.
- Features that violate the simplicity philosophy.
- Architecture decisions or components not reflected in constraints.
- Backlog items that imply product scope expansion without support from vision or constraints.
- Product-facing language that conflicts with the project's interface language direction (per `AGENTS.md`).

## Edit Policy

- Propose edits first unless the user explicitly asks to apply them.
- Keep edits scoped to consistency, clarity, routing, and deduplication.
- Do not add features, modules, or architecture components to solve inconsistencies.
- Prefer removing, moving, merging, or clarifying over expanding.
- Preserve the user's intent and terminology.
- If the right fix requires a product decision, write it as an open question.

## Output Format

Start with findings, ordered by severity:

```markdown
## Findings

- [High/Medium/Low] File/path: issue and why it matters.
  Proposed edit: ...
```

Then include:

```markdown
## Suggested Edits

- ...

## Open Questions

- ...
```

If no meaningful issues are found, say that clearly and mention any residual risk.
