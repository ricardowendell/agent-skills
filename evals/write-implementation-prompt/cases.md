# Evals

Representative prompts and the trajectory this skill should produce.

A fixture for case 1 lives in `references/evals/1/` and is copied into the
scratch repo before the prompt runs. `- [assert] <kind> <arg>` lines are
machine-checked after the case (see `eval.mjs`).

1. **Create the implementation prompt for SPEC-0007.**
   - prompt: Create the implementation prompt for SPEC-0007.
   - why: fixture: a `ready` spec + architecture doc. The shape assertion is step-anchored: a numbered or bulleted step inside `## Operations` (bounded — a line starting `## ` ends the section) must name a test and its red state in the same step, and the fail phrase reads `see` or `watch`. It proves the artifact **names** a failing-test step, not that the steps execute in order — the ordering is carried by the guidance, and the executor cell 13's arrangement signature is the behavioural check. SPEC-0091 replaced the 600/300-character window, which false-failed two test-first prompts (`2026-11-14T09-20-09--write-implementation-prompt` r2/r3), and broadened `[Ss]ee (it )?fail` to `([Ss]ee|[Ww]atch) (it )?[Ff]ail` (r1 says "watch it fail"). Validated before the draws: all five artifacts of that run pass and the implementation-first fixture `evals/write-implementation-prompt/fixtures/4/docs/prompts/SPEC-0007-import-csv.prompt.md` fails both.
   - expect: Reads the spec and its source docs/ADRs.
   - expect: Writes `docs/prompts/SPEC-0007-<short-name>.prompt.md` with Requirements/Entities/Approach/Structure/Operations/Norms/Safeguards/Verification.
   - expect: Records `spec_sha` in the prompt frontmatter (via `spec-sha.mjs`).
   - expect: Restates the project's own architecture rules; invents no stack-specific rules.
   - expect: Puts the test step before the implementation in Operations and names the failing run.
   - expect: Watch for: reinterpreting the spec instead of copying it, or a prompt too large to review.
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md ## Verification
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md ## Operations
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md ## Operations(?:[^\n]|\n(?!## ))*?\n\s*(?:\d+\.|[-*])\s*[^\n]{0,160}?[Tt]est[^\n]{0,80}?(red|fail|failing)
   - assert: filematch docs/prompts/SPEC-0007-*.prompt.md ([Ss]ee|[Ww]atch) (it )?[Ff]ail
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
