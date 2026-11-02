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
