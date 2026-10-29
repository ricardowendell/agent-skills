# Evals

A fixture in `references/evals/1/` is copied into the scratch repo before the
prompt runs.

Assertions: `- [assert] <kind> <arg>` is machine-checked after the case (`file`,
`nofile`, `dir`, `nodir`, `filematch` — glob-capable, `grep`/`nogrep`,
`unchanged`/`changed`). Prefer filesystem assertions over transcript greps.

1. **"Process the inbox."**
   - Presents a processing plan and waits for confirmation before writing.
   - Preserves the note's content (the `status` frontmatter flips to `processed` after processing; the body must not change).
   - Watch for: classifying into product docs without confirmation, or inventing
     product direction.
   - [assert] dir docs/inbox
   - [assert] filematch docs/inbox/2026-01-01-digest-email.md digest email
   - [assert] unchanged docs/inbox/2026-01-01-digest-email.md
   - [assert] nodir docs/backlog
   - [assert] unchanged docs/product/vision.md
