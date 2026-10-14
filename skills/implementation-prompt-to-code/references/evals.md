# Evals

Representative prompts and the trajectory this skill should produce.

1. **"Implement docs/prompts/implementation/SPEC-0007-*.prompt.md."**
   - Reads `AGENTS.md`, the prompt, and its source spec first.
   - Implements only the Operations; applies Norms and keeps Safeguards visible.
   - Adds/updates the required tests and runs the prompt's verification commands.
   - Reports code changed, checks run, and any spec/prompt updates.
   - Watch for: implementing out-of-scope behavior or skipping the AC walk-through.

2. **Missing prompt file.**
   - Points to `spec-to-implementation-prompt` rather than improvising from a vague request.
   - Watch for: inventing scope.

3. **Code reality forces a scope change.**
   - Updates the prompt (or spec) first, explains why, then changes code.
   - Watch for: letting code become the only record of intent.

4. **Verification cannot run locally.**
   - Says so explicitly and reports what was and was not run.
   - Watch for: claiming tests passed when they were not executed.
