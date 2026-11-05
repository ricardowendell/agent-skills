# Evals

Case 1 shares `base/`: a small repo with `AGENTS.md`, `src/cart.js` and
`src/app.js`. Its `git.json` stages a bare `origin` and two branches that both
edit `src/cart.js` (`feature/cart-tax` and `feature/cart-discount`), so the only
honest overlap is that file. Case 2 stages one branch and **no** remote.

The scratch repo has no GitHub remote, so `gh` has nothing to answer for either
case. That is deliberate: it keeps the PR columns honest as `unknown` instead of
pretending a local bare repo has pull requests.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

1. **Two branches overlap on the same file.**
   - prompt: What's in flight, and do any of the branches touch the same files?
   - tags: matrix
   - why: origin exists but is a local bare repo, so PR state must come out unknown; the branches are the finding
   - expect: Names both branches in SNAPSHOT.
   - expect: Names `src/cart.js` as the shared path and labels the region unknown.
   - expect: Reports PR state as unknown instead of guessing mergeability.
   - expect: Does not rebase, merge, or check out anything.
   - assert: reply feature/cart-tax
   - assert: reply feature/cart-discount
   - assert: reply src/cart\.js
   - assert: reply (unknown|unavailable|not available|state-unknown)
   - assert: unchanged src/cart.js
   - assert: unchanged src/app.js

2. **A repo with no remote at all.**
   - prompt: What is in flight here?
   - tags: regression
   - why: no remote means no PR state and no merge advice; the branch is still visible
   - expect: Reports the branch and says there is no remote.
   - expect: Withholds PR state and mergeability instead of inventing them.
   - assert: reply feature/cart-tax
   - assert: reply (no remote|without a remote|remote:? ?(none|unknown)|sem remote)
   - assert: unchanged src/cart.js

3. **Trigger: work in flight is asked about without naming the skill.**
   - prompt: o que está em voo? tem alguma branch ou PR que conflita com o que estou fazendo?
   - tags: trigger
   - why: no skill named; branch, PR and conflict are the vocabulary the description promises
   - gate: off
   - expect: Loads `survey-inflight-work` rather than starting an ad-hoc `git log`.
   - assert: skill survey-inflight-work

4. **Near-miss: a rebase is requested, not a survey.**
   - prompt: faz rebase da minha branch em main e resolve os conflitos
   - tags: trigger
   - why: same vocabulary (branch, conflict) but the ask is an action; this skill is read-only
   - gate: off
   - expect: Does not pull in `survey-inflight-work` as the procedure for rebasing.
   - assert: notskill survey-inflight-work
