# Evals

A fixture in `references/evals/1/` is copied into the scratch repo before the
prompt runs.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

1. **Capture this idea: maybe we should add a weekly digest email.**
   - prompt: Capture this idea: maybe we should add a weekly digest email.
   - expect: Writes a new raw note under the inbox folder, preserving the user's wording.
   - expect: Sets `status: unprocessed` frontmatter.
   - expect: Does not classify or move the idea into product docs.
   - expect: Watch for: rewriting the idea, or filing it into `docs/product`.
   - assert: dir docs/inbox
   - assert: filematch docs/inbox/*.md status: unprocessed
   - assert: filematch docs/inbox/*.md digest
   - assert: nofile docs/product/vision.md

2. **Trigger: a thought is handed over to keep.**
   - prompt: Jot this down before I forget: maybe a weekly digest email.
   - tags: trigger
   - why: no skill named; "jot this down" is the trigger the description promises
   - gate: off
   - expect: Loads `capture-idea` rather than filing it straight into product docs.
   - assert: skill capture-idea

3. **Routing: an inbox that already holds notes is processed, not captured.**
   - prompt: Process the inbox.
   - tags: trigger
   - why: capture and process share vocabulary; picking the wrong one leaves the notes unclassified
   - gate: off
   - expect: Routes to `process-inbox`.
   - assert: skill process-inbox
   - assert: notskill capture-idea
