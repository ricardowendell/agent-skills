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
