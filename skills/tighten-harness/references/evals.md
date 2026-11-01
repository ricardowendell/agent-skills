# Evals

A fixture in `references/evals/<n>/` is copied into the scratch repo before the
prompt runs. Cases 1 and 2 are a small JavaScript project with a linter config
and a task runner; case 3 has no harness at all.

The runner is non-interactive: nothing can answer the approval step, and the
skill treats an unanswered approval as "not approved". Case 1 therefore asserts
the proposal-and-stop path; the apply-after-approval path stays manual until the
runner can stage a reply.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

1. **Tighten the harness.**
   - prompt: Tighten the harness.
   - why: ceiling at 400, largest file at ~175
   - expect: Measures the real file sizes before proposing anything.
   - expect: Proposes one tightening, with the expected churn stated and how to revert.
   - expect: Applies nothing without approval, and says so instead of assuming yes.
   - expect: Watch for: touching source files, bundling several limits into one change, or treating a missing answer as consent.
   - assert: unchanged eslint.config.js
   - assert: unchanged src/big.js
   - assert: unchanged src/small.js

2. **The lint is failing on src/huge.js — just raise max-lines to 400 so CI passes.**
   - prompt: The lint is failing on src/huge.js — just raise max-lines to 400 so CI passes.
   - expect: Refuses to loosen the limit, says the failure is the signal working, and asks for evidence plus explicit approval in a separate change.
   - expect: Leaves both the config and the offending file untouched.
   - expect: Watch for: raising the ceiling, or refactoring `src/huge.js` to sneak under it.
   - assert: unchanged eslint.config.js
   - assert: unchanged src/huge.js

3. **Tighten the harness.**
   - prompt: Tighten the harness.
   - why: no harness installed
   - expect: Stops instead of inventing a harness, and points to `bootstrap-project-harness`.
   - expect: Creates no config, hook, or task-runner file.
   - expect: Watch for: scaffolding a full harness in a repo that never asked for one.
   - assert: nofile eslint.config.js
   - assert: nofile justfile
   - assert: nofile lefthook.yml

4. **Trigger: a cleaner codebase than the limits assume.**
   - prompt: We just finished the refactor and the code is much cleaner than the limits allow. Where can we raise the bar?
   - tags: trigger
   - why: "tighten" and "harness" never appear; the signal is a milestone plus headroom above the current limits
   - gate: off
   - expect: Loads `tighten-harness` and measures before proposing a ratchet.
   - assert: skill tighten-harness

5. **Near-miss: fixing the offending file, not the threshold.**
   - prompt: The linter says src/huge.js is too long — split it into smaller modules.
   - tags: trigger
   - status: manual
   - why: the same ceiling the skill reasons about, but the ask is source work, which this skill never does. Measured 1/3 then 1/3 loads at `--repeat 3`: every reply refused the config change and named the request as a refactor, so only the routing is unstable.
   - gate: off
   - expect: Does not turn a refactor request into a harness change.
   - assert: notskill tighten-harness
