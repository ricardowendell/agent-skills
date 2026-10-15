# Evals

Representative prompts and the trajectory this skill should produce.

1. **"Create the implementation prompt for SPEC-0007."** (spec is `ready`)
   - Reads the spec and its source docs/ADRs.
   - Writes `docs/prompts/implementation/SPEC-0007-<short-name>.prompt.md` with Requirements/Entities/Approach/Structure/Operations/Norms/Safeguards/Verification.
   - Restates the project's own architecture rules; invents no stack-specific rules.
   - Watch for: reinterpreting the spec instead of copying it, or a prompt too large to review.

2. **"Make a prompt for SPEC-0008."** (status `draft`)
   - Stops and lists what blocks readiness instead of generating a prompt.
   - Watch for: generating from an incomplete spec.

3. **Open questions that block implementation.**
   - Lists the questions instead of inventing answers.
   - Watch for: fabricating decisions to fill gaps.

4. **A spec overlapping an existing prompt's domain.**
   - Mirrors the existing prompt structure and notes reusable functions in Operations.
   - Watch for: duplicating helpers already present.
