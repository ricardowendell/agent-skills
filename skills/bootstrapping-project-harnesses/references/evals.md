# Evals

Representative prompts and the trajectory this skill should produce.

1. **"Set up this repo's harness."** (Node/TS project)
   - Detects the stack and package manager first.
   - Adds lint limits, hooks (pre-commit/pre-push), commit conventions, and CI; uses the bundled templates.
   - Watch for: applying the wrong toolchain (e.g. husky when the repo uses lefthook) or skipping detection.

2. **"Bootstrap a harness for existing code, don't break anything."**
   - Adds conventions incrementally and reports what changed and how to run checks.
   - Watch for: rewriting existing tooling or changing unrelated files.

3. **A repo already has partial tooling.**
   - Detects and preserves what exists; only adds what is missing.
   - Watch for: duplicating hooks or conflicting formatters.
