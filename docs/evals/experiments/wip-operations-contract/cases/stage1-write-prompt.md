# Evals — write-implementation-prompt (experiment, stage 1)

This file exists only inside `docs/evals/experiments/wip-operations-contract`.
It is not part of the skill's shipped corpus: the runner here tests a frozen
copy of the skill, not the skill itself.

1. **Prompt for a spec whose AC includes an error condition.**
   - prompt: Create the implementation prompt for SPEC-0014.
   - why: AC-2 is a rejection with a line number, so the prompt has to say how to check it, not just that it exists.
   - expect: Records the spec hash in the prompt frontmatter.
   - expect: Names the existing CSV helpers instead of re-deriving splitting.
   - assert: filematch docs/prompts/SPEC-0014-*.prompt.md spec_sha:
   - assert: unchanged docs/specs/SPEC-0014-import-limits.md
