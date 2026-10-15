# Evals

A fixture in `references/evals/1/` is copied into the scratch repo before the
prompt runs.

Assertions: `- [assert] <kind> <arg>` is machine-checked after the case (`file`,
`nofile`, `dir`, `nodir`, `filematch` — glob-capable, `grep`/`nogrep`,
`unchanged`/`changed`). Prefer filesystem assertions over transcript greps.

1. **"Check the product docs for consistency."**
   - Surfaces the tension between the vision ("never make the user wait") and the
     design principle ("show progress early").
   - Proposes scoped edits without applying them unless asked.
   - Watch for: rewriting docs, or inventing new scope.
   - [assert] unchanged docs/product/vision.md
   - [assert] unchanged docs/principles/design.md
