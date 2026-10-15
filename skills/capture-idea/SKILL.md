---
name: capture-idea
description: Capture a rough idea as a raw inbox note, preserving the user's own wording. Use when the user asks to capture a thought, jot something down, save an idea, brain dump, or preserve input without organizing it yet. Do not classify or move it into product docs — that is process-inbox.
---

# Capture Raw Idea

## Purpose

Capture the user's idea with minimal interpretation. Preserve their wording, avoid expanding scope, and put the note in the raw inbox so it can be organized later.

## Workflow

1. Identify the workspace root.
2. Prefer `docs/inbox` when it exists; otherwise use `inbox`.
3. Create or append to a Markdown file named `YYYY-MM-DD-short-description.md`.
4. Use a short descriptive filename in lowercase kebab-case, based on the user's own words.
5. Keep the description brief: usually 3-6 words.
6. Preserve the user's wording as much as possible.
7. Add only light cleanup for readability: fix obvious spacing, keep line breaks, and do not rewrite tone.
8. Do not classify, prioritize, or move the idea into product docs unless the user explicitly asks.
9. Mark new or updated raw note files as `status: unprocessed`.
10. After capture, report the file path and the heading or timestamp used.

## File Status

Every inbox note should start with YAML frontmatter:

```markdown
---
status: unprocessed
processed_at:
---
```

If appending to an existing note, keep or set `status: unprocessed` because new raw content needs processing.

## Entry Format

Use this shape:

```markdown
## HH:MM

<raw idea>
```

Use the user's local time when available. If multiple ideas are provided, keep them together under the same timestamp unless the user asks to split them.

## Script

For deterministic appends, run the bundled script from this skill's base directory
(the directory OpenCode reports for the skill):

```bash
python3 scripts/capture_raw_idea.py --workspace <workspace-root> --text "<idea>"
```

Optionally pass a filename title:

```bash
python3 scripts/capture_raw_idea.py --workspace <workspace-root> --title "design principles suficiente" --text "<idea>"
```

The script creates the inbox directory and dated descriptive file if needed, ensures the note is marked `status: unprocessed`, then appends the timestamped entry.

## Pipeline

Entry point of the product-thinking pipeline. Raw notes are organized later by `process-inbox` — do not organize or classify them here.
