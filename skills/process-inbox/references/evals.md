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

2. **Trigger: a pile of notes that has to land in the product docs.**
   - prompt: docs/inbox has five notes piled up — sort them into the right product docs.
   - tags: trigger
   - why: "inbox" names the fixture, not the skill; the signal is unprocessed notes plus a classification ask
   - gate: off
   - expect: Loads `process-inbox` and plans the classification before writing.
   - assert: skill process-inbox

3. **Near-miss: a new note for the inbox, not the inbox to process.**
   - prompt: Add this to the inbox: we should send users a weekly digest.
   - tags: trigger
   - why: the word "inbox" appears, but a note is arriving and nothing is being classified
   - gate: off
   - expect: Routes to `capture-idea` and writes one raw note.
   - assert: notskill process-inbox
   - assert: skill capture-idea
