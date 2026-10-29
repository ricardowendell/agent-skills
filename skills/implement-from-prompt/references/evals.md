# Evals

Representative prompts and the trajectory this skill should produce.

A fixture for case 1 lives in `references/evals/1/` and is copied into the
scratch repo before the prompt runs. `- [assert] <kind> <arg>` lines are
machine-checked after the case (see `run-evals.mjs`).

1. **"Implement docs/prompts/SPEC-0007-demo.prompt.md."** (fixture: a `ready` spec + its prompt)
   - Reads `AGENTS.md`, the prompt, and its source spec first.
   - Implements only the Operations; applies Norms and keeps Safeguards visible.
   - Sets the source spec `status: in_progress`, then `implemented`, and populates `tests:`.
   - Adds/updates the required tests and runs the prompt's verification commands.
   - Reports code changed, checks run, and any spec/prompt updates.
   - Watch for: implementing out-of-scope behavior or skipping the AC walk-through.
   - [assert] filematch src/index.ts double
   - [assert] filematch docs/specs/SPEC-0007-demo.md status: implemented
   - [assert] filematch docs/prompts/SPEC-0007-demo.prompt.md ## Safeguards

2. **Missing prompt file.**
   - Points to `write-implementation-prompt` rather than improvising from a vague request.
   - Watch for: inventing scope.
   - [assert] nodir docs/prompts
   - [assert] nofile AGENTS.md

3. **Code reality forces a scope change.**
   - Updates the prompt (or spec) first, explains why, then changes code.
   - Watch for: letting code become the only record of intent.
   - [assert] changed docs/prompts/SPEC-0010-slugify.prompt.md
   - [assert] filematch src/text.js slugify

4. **Verification cannot run locally.**
   - Says so explicitly and reports what was and was not run.
   - Watch for: claiming tests passed when they were not executed.
   - [assert] file src/echo.js
   - [assert] reply (?:[Nn]ot run|[Cc]ould not run|[Uu]navailable|[Nn]o justfile)
