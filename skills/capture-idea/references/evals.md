# Evals

A fixture in `references/evals/1/` is copied into the scratch repo before the
prompt runs.

Assertions: `- [assert] <kind> <arg>` is machine-checked after the case (`file`,
`nofile`, `dir`, `nodir`, `filematch` — glob-capable, `grep`/`nogrep`,
`unchanged`/`changed`). Prefer filesystem assertions over transcript greps.

1. **"Capture this idea: maybe we should add a weekly digest email."**
   - Writes a new raw note under the inbox folder, preserving the user's wording.
   - Sets `status: unprocessed` frontmatter.
   - Does not classify or move the idea into product docs.
   - Watch for: rewriting the idea, or filing it into `docs/product`.
   - [assert] dir docs/inbox
   - [assert] filematch docs/inbox/*.md status: unprocessed
   - [assert] filematch docs/inbox/*.md digest
   - [assert] nofile docs/product/vision.md
