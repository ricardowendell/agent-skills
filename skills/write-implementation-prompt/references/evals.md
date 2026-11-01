# Evals

Representative prompts and the trajectory this skill should produce.

A fixture for case 1 lives in `references/evals/1/` and is copied into the
scratch repo before the prompt runs. `- [assert] <kind> <arg>` lines are
machine-checked after the case (see `run-evals.mjs`).

1. **Create the implementation prompt for SPEC-0007.**
   - prompt: Create the implementation prompt for SPEC-0007.
   - why: fixture: a `ready` spec + architecture doc
   - expect: Reads the spec and its source docs/ADRs.
   - expect: Writes `docs/prompts/SPEC-0007-<short-name>.prompt.md` with Requirements/Entities/Approach/Structure/Operations/Norms/Safeguards/Verification.
   - expect: Records `spec_sha` in the prompt frontmatter (via `spec-sha.mjs`).
   - expect: Restates the project's own architecture rules; invents no stack-specific rules.
   - expect: Watch for: reinterpreting the spec instead of copying it, or a prompt too large to review.
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md ## Verification
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:
   - assert: unchanged docs/specs/SPEC-0007-demo.md

2. **Make a prompt for SPEC-0008.**
   - prompt: Make a prompt for SPEC-0008.
   - why: status `draft`
   - expect: Stops and lists what blocks readiness instead of generating a prompt.
   - expect: Watch for: generating from an incomplete spec.
   - assert: nodir docs/prompts
   - assert: unchanged docs/specs/SPEC-0008-export.md

3. **Open questions that block implementation.**
   - status: manual
   - expect: Lists the questions instead of inventing answers.
   - expect: Watch for: fabricating decisions to fill gaps.
   - assert: nodir docs/prompts
   - assert: unchanged docs/specs/SPEC-0009-audit-log.md

4. **A spec overlapping an existing prompt's domain.**
   - prompt: Create the implementation prompt for SPEC-0012.
   - expect: Mirrors the existing prompt structure and notes reusable functions in Operations.
   - expect: Watch for: duplicating helpers already present.
   - assert: filematch docs/prompts/SPEC-0011-*.prompt.md spec_sha:
   - assert: unchanged docs/specs/SPEC-0011-bulk-import.md

5. **Trigger: a ready spec that has to become executable.**
   - prompt: SPEC-0012 is ready. Turn it into something a coding agent can execute without asking me questions.
   - tags: trigger
   - why: "prompt" would be the output, not the skill name; the signal is a ready spec plus an agent that must not need to ask
   - gate: off
   - expect: Loads `write-implementation-prompt` and pins the spec by hash.
   - assert: skill write-implementation-prompt

6. **Near-miss: the same spec, but to be summarised.**
   - prompt: Summarise SPEC-0012 into three bullets for the standup.
   - tags: trigger
   - why: same document and the same reader; a summary is not an executable prompt, so pinning the spec would be wasted work
   - gate: off
   - expect: Answers with a summary and starts no prompt file.
   - assert: notskill write-implementation-prompt
