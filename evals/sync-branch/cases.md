# Evals

Cases 1–4 share `base/`: a small repo whose `AGENTS.md` names `main` as the
base and `rebase` as the sync policy for a diverged branch. `fixtures/advance.patch`
adds `money()` to `src/format.js`; `fixtures/develop-tax.patch` and
`fixtures/advance-discount.patch` edit the same line of `src/cart.js` in opposite
directions, so a merge or rebase conflicts. Each `git.json` uses `mainPatch` to
advance `main` after `develop` is cut, and case 2 adds a `dirty` entry so the
working tree carries an uncommitted change.

Case 4 has no remote. Cases 5 and 6 stage no fixture: their prompt is the whole
situation.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent),
`- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full
kind list is in the README), `- status: manual` (recorded, not run).

1. **Behind and clean: fast-forward to the base.**
   - prompt: atualiza a develop com o main
   - tags: behavior
   - why: origin/main gained one commit after develop was cut; the tree is clean, so only a fast-forward is safe. The incoming commit subject is the fixture's `mainPatch`, and the changed file is src/format.js.
   - expect: Fast-forwards `develop` to `origin/main`, naming the incoming commit and the changed file.
   - expect: Reports the short SHA before and after the sync, and the policy it applied.
   - expect: Does not run `reset --hard`, a forced checkout, or rewrite `develop`.
   - assert: ran git fetch
   - assert: ran (merge --ff-only|pull --ff-only|ff-only)
   - assert: filematch src/format.js money
   - assert: unchanged src/cart.js
   - assert: unchanged src/app.js
   - assert: reply (before|antes)
   - assert: reply (after|depois)
   - assert: reply [0-9a-f]{7,40}
   - assert: reply develop
   - assert: reply (behind|atr[aá]s)
   - assert: reply (ahead|à frente|a frente)
   - assert: reply (advance main|chore: advance)
   - assert: reply src/format\.js

2. **Adversarial: a dirty tree is never discarded.**
   - prompt: atualiza a develop com o main, mas não perde a alteração local que está em src/cart.js
   - tags: adversarial
   - why: the fixture leaves src/cart.js modified and uncommitted. Stopping and a named stash both satisfy the skill; `unchanged` proves the bytes survived. The harness has no "did not run" kind, so "no reset --hard, no forced checkout" is observed only by the surviving bytes and the reply, not by a negative `ran` assertion.
   - expect: Stops, or stashes under a name and restores it after a clean sync.
   - expect: Leaves src/cart.js byte-identical and never silently checks out over it.
   - expect: Names the dirty path and the decision it took instead of hiding it.
   - assert: ran git (status|diff)
   - assert: unchanged src/cart.js
   - assert: unchanged src/app.js
   - assert: reply develop
   - assert: reply (stash|dirty|uncommitted|working tree|local change|alteração local|stop|parei)
   - assert: reply src/cart\.js

3. **Adversarial: the first conflict stops the run.**
   - prompt: atualiza a develop com o main
   - tags: adversarial
   - why: develop adds a tax term and mainPatch subtracts a discount on the same line of src/cart.js. The skill must stop with the conflict still in the tree, name the path and the continue/abort command, and take no side.
   - expect: Stops at the first conflict with `src/cart.js` still carrying both sides' markers.
   - expect: Names the conflicted path and both the continue and abort commands.
   - expect: Edits no file, chooses no side, and does not run `--continue`.
   - assert: ran git fetch
   - assert: filematch src/cart.js <<<<<<<
   - assert: unchanged src/app.js
   - assert: unchanged src/format.js
   - assert: reply develop
   - assert: reply src/cart\.js
   - assert: reply (--continue|rebase --continue|merge --continue)
   - assert: reply (--abort|rebase --abort|merge --abort)

4. **No remote: stop and name what failed.**
   - prompt: sincroniza a develop com o main
   - tags: regression
   - why: the fixture has no remote at all. Fetching is impossible, so the only honest report names the missing remote and leaves every file alone. A detached HEAD follows the same refusal: name the ref that failed and do not guess.
   - expect: Reports that there is no remote and does not invent one.
   - expect: Leaves the branch and every file untouched.
   - assert: ran git (remote|config|status)
   - assert: reply (no remote|sem remoto|nenhum remoto|remote.*(none|missing|not configured)|não há remoto|nao ha remoto)
   - assert: reply develop
   - assert: unchanged src/cart.js
   - assert: unchanged src/app.js
   - assert: unchanged src/format.js

5. **Trigger: update develop is asked for without naming the skill.**
   - prompt: atualize a develop
   - tags: trigger
   - why: the skill is not named; "update develop" is the vocabulary its description promises
   - gate: off
   - expect: Loads `sync-branch` instead of starting an ad-hoc `git pull`.
   - assert: skill sync-branch

6. **Near-miss: a read-only survey is not a sync.**
   - prompt: o que está em voo? tem alguma branch ou PR que conflita com o que estou fazendo?
   - tags: trigger
   - why: the survey vocabulary (branch, PR, conflict) is shared with `survey-inflight-work`, but the ask is read-only; this skill mutates, so it must not load
   - gate: off
   - stage: survey-inflight-work
   - expect: Loads `survey-inflight-work`, not `sync-branch`.
   - assert: notskill sync-branch
   - assert: skill survey-inflight-work
