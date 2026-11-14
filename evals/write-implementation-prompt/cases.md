# Evals

Representative prompts and the trajectory this skill should produce.

A fixture for case 1 lives in `references/evals/1/` and is copied into the
scratch repo before the prompt runs. `- [assert] <kind> <arg>` lines are
machine-checked after the case (see `eval.mjs`).

1. **Create the implementation prompt for SPEC-0007.**
   - prompt: Create the implementation prompt for SPEC-0007.
   - why: fixture: a `ready` spec + architecture doc. The shape assertions prove the test is mentioned before the implementation inside a bounded window (600 characters after `## Operations` for the test, 300 more for the implementation) — a textual-order proxy, not a machine-checkable step order: an implementation-first prompt that mentions a test later in the same window would pass. The false-pass case is recorded, not hidden; case 13's transcript signature is the behavioural check.
   - expect: Reads the spec and its source docs/ADRs.
   - expect: Writes `docs/prompts/SPEC-0007-<short-name>.prompt.md` with Requirements/Entities/Approach/Structure/Operations/Norms/Safeguards/Verification.
   - expect: Records `spec_sha` in the prompt frontmatter (via `spec-sha.mjs`).
   - expect: Restates the project's own architecture rules; invents no stack-specific rules.
   - expect: Puts the test step before the implementation in Operations and names the failing run.
   - expect: Watch for: reinterpreting the spec instead of copying it, or a prompt too large to review.
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md ## Verification
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md ## Operations
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md ## Operations[\s\S]{0,600}?(test|spec file)[\s\S]{0,300}?(implement|add and export)
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md [Ss]ee (it )?fail
   - assert: unchanged docs/specs/SPEC-0007-demo.md

2. **Make a prompt for SPEC-0008.**
   - prompt: Make a prompt for SPEC-0008.
   - why: status `draft`
   - expect: Stops and lists what blocks readiness instead of generating a prompt.
   - expect: Watch for: generating from an incomplete spec.
   - assert: nodir docs/prompts
   - assert: unchanged docs/specs/SPEC-0008-export.md

3. **Open questions that block implementation.**
   - prompt: Create the implementation prompt for SPEC-0009.
   - why: five draws split 4/5: `2026-11-06T14-01-54--write-implementation-prompt` r3 failed `nodir docs/prompts` by treating both open questions as non-blocking and writing the prompt
   - status: manual
   - expect: Lists the questions instead of inventing answers.
   - expect: Watch for: fabricating decisions to fill gaps.
   - assert: nodir docs/prompts
   - assert: unchanged docs/specs/SPEC-0009-audit-log.md

4. **A spec overlapping an existing prompt's domain.**
   - prompt: Create the implementation prompt for SPEC-0011.
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
