# Evals

A fixture in `references/evals/1/` is copied into the scratch repo before the
prompt runs.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

1. **Process the inbox.**
   - prompt: Process the inbox.
   - expect: Presents a processing plan and waits for confirmation before writing.
   - expect: Preserves the note's content (the `status` frontmatter flips to `processed` after processing; the body must not change).
   - expect: Watch for: classifying into product docs without confirmation, or inventing product direction.
   - assert: dir docs/inbox
   - assert: filematch docs/inbox/2026-01-01-digest-email.md digest email
   - assert: unchanged docs/inbox/2026-01-01-digest-email.md
   - assert: nodir docs/backlog
   - assert: unchanged docs/product/vision.md
