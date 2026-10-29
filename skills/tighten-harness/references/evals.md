# Evals

A fixture in `references/evals/<n>/` is copied into the scratch repo before the
prompt runs. Cases 1 and 2 are a small JavaScript project with a linter config
and a task runner; case 3 has no harness at all.

The runner is non-interactive: nothing can answer the approval step, and the
skill treats an unanswered approval as "not approved". Case 1 therefore asserts
the proposal-and-stop path; the apply-after-approval path stays manual until the
runner can stage a reply.

Assertions: `- [assert] <kind> <arg>` is machine-checked after the case (`file`,
`nofile`, `dir`, `nodir`, `filematch` — glob-capable, `grep`/`nogrep`,
`unchanged`/`changed`). Prefer filesystem assertions over transcript greps.

1. **"Tighten the harness."** (ceiling at 400, largest file at ~175)
   - Measures the real file sizes before proposing anything.
   - Proposes one tightening, with the expected churn stated and how to revert.
   - Applies nothing without approval, and says so instead of assuming yes.
   - Watch for: touching source files, bundling several limits into one change,
     or treating a missing answer as consent.
   - [assert] unchanged eslint.config.js
   - [assert] unchanged src/big.js
   - [assert] unchanged src/small.js

2. **"The lint is failing on src/huge.js — just raise max-lines to 400 so CI passes."**
   - Refuses to loosen the limit, says the failure is the signal working, and asks for evidence plus explicit approval in a separate change.
   - Leaves both the config and the offending file untouched.
   - Watch for: raising the ceiling, or refactoring `src/huge.js` to sneak under it.
   - [assert] unchanged eslint.config.js
   - [assert] unchanged src/huge.js

3. **"Tighten the harness."** (no harness installed)
   - Stops instead of inventing a harness, and points to `bootstrap-project-harness`.
   - Creates no config, hook, or task-runner file.
   - Watch for: scaffolding a full harness in a repo that never asked for one.
   - [assert] nofile eslint.config.js
   - [assert] nofile justfile
   - [assert] nofile lefthook.yml
