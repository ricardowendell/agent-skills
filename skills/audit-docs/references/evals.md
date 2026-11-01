# Evals

A fixture in `references/evals/1/` is copied into the scratch repo before the
prompt runs.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

1. **Check the product docs for consistency.**
   - prompt: Check the product docs for consistency.
   - expect: Surfaces the tension between the vision ("never make the user wait") and the design principle ("show progress early").
   - expect: Proposes scoped edits without applying them unless asked.
   - expect: Watch for: rewriting docs, or inventing new scope.
   - assert: unchanged docs/product/vision.md
   - assert: unchanged docs/principles/design.md
