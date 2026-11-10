# Evals

A fixture in `references/evals/<n>/` is copied into the scratch repo before the
prompt runs. Case 3 is a git repo whose branch rewrites one doc.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

1. **Check the product docs for consistency.**
   - prompt: Check the product docs for consistency.
   - expect: Surfaces the tension between the vision ("never make the user wait") and the design principle ("show progress early").
   - expect: Proposes scoped edits without applying them unless asked.
   - expect: Watch for: rewriting docs, or inventing new scope.
   - assert: unchanged docs/product/vision.md
   - assert: unchanged docs/principles/design.md

2. **Trigger: two docs disagree, and the skill is not named.**
   - prompt: Does anything in our product docs contradict the principles we wrote down? I think they drifted apart.
   - tags: trigger
   - why: no skill named; "contradict" plus "drifted apart" is the consistency signal the description promises
   - gate: off
   - expect: Loads `audit-docs` rather than reading the docs and offering an opinion off the cuff.
   - assert: skill audit-docs

3. **Near-miss: a doc change to review, not a doc set to audit.**
   - prompt: I rewrote docs/architecture.md — review my changes before I open the PR.
   - tags: trigger
   - why: same object and the word "review", but the question is about one diff, which is `review-code` territory. Measured 3/3, with `audit-docs` loaded in all three runs (`review-code` once as well): the run checks the skill, declines the whole-set audit, and leaves the other docs and the decision log alone. The old `notskill` assertion failed for that check; the outcome is what is asserted now.
   - gate: off
   - expect: Does not audit the whole doc set for a single change under review.
   - expect: Leaves the other docs and the decision log alone.
   - assert: unchanged docs/product/vision.md
   - assert: unchanged docs/system/README.md
   - assert: unchanged docs/decisions/README.md
   - assert: nofile docs/decisions/ADR-*
   - assert: nofile docs/specs/*
   - assert: reply architecture

4. **Check the docs against the code.**
   - prompt: Do the docs still match the code? Tell me what drifted.
   - why: four claims, one per outcome — `docs/system/gates.md` matches `package.json` (true); `docs/system/rate.md` promises a `RangeError` the code never throws (defect); `docs/system/limits.md` states a cap an accepted ADR removed (intentional evolution); `docs/specs/SPEC-0002-refunds.md` is `ready` and unimplemented (future, not drift).
   - expect: Reports the rate doc as a defect with `file:line` on both sides.
   - expect: Classifies the cap as intentional evolution, citing ADR-0001, not as a defect.
   - expect: Does not list the refunds spec as a finding.
   - expect: Proposes edits and changes nothing.
   - assert: reply negative|RangeError
   - assert: reply ADR-0001|intentional|superseded
   - assert: noreply - \[(?:blocking|should-fix|nit)\][^\n]*(?:SPEC-0002|refunds)
   - assert: unchanged docs/**/*.md
   - assert: unchanged src/rate.js
   - assert: unchanged test/rate.test.js
   - assert: unchanged package.json
