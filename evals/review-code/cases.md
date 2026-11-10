# Evals

Cases 1–4 and 8–10 share the `base/` fixture: a small Node project with
`AGENTS.md`, a spec (`docs/specs/SPEC-0007-cart-tax.md`), its prompt stamped with
`spec_sha`, and a passing `node --test` suite. Each case's `git.json` commits
that tree as `main`, applies `change.patch` on a branch, and leaves the branch
checked out — so the skill reviews a real `main..feature` range instead of an
unversioned directory. Case 7 stages `base-red/` instead (its gate is already
red). Case 10's patch also adds `docs/specs/SPEC-0008`, so the review is against
the retry spec the branch carries; the case directory carries a copy of that
spec so the corpus check can see the document the patch stages.

Case 3 prunes `docs/specs` and `docs/prompts` before the base commit: the review
must then ask for the intent rather than invent acceptance criteria.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked; the full kind list is in the README), `- status: manual` (recorded, not run), `- needs: gates` (skipped at `--level behavior`).

1. **Review this branch against SPEC-0007.**
   - prompt: Review this branch against SPEC-0007.
   - tags: matrix
   - why: the diff satisfies every AC
   - expect: Fixes the range and head sha before reading code.
   - expect: Walks AC-1 through AC-3, recording the code and the test per criterion.
   - expect: Runs the documented gate and reports the exact command and result.
   - expect: States `VERDICT: APPROVE` once, backed by the AC table.
   - expect: Carries a `Not verified` section, empty or explicitly named.
   - expect: Watch for: approving without the AC walk-through, or citing taste as a finding.
   - assert: verdict APPROVE
   - assert: reply Not verified
   - assert: ranpass npm test
   - assert: reply AC-3
   - assert: unchanged src/cart.js
   - assert: unchanged test/cart.test.js

2. **Review this branch.**
   - prompt: Review this branch.
   - tags: regression
   - why: rounding is applied to the subtotal, so the returned total still carries float noise (`19.99 × 1.0825` → `21.639174999999998`), and the added test asserts that noisy value. It measured 5/5 in both arms on the earlier fixture; the SPEC-0056 wave measured 4/5 vs 4/5 (the skill's r4 produced no final reply, so no `VERDICT:` line) and it remains a non-discriminator. It stays as a regression case — it fails a reviewer that misses an obvious AC violation, or one that approves because the suite is green.
   - expect: Returns `VERDICT: REJECT`.
   - expect: Names AC-2 as `blocking`, with `file:line`, and says the rounding happens before tax instead of on the returned total.
   - expect: Treats the green suite as insufficient — cites the test that encodes the noise instead of counting it as proof.
   - expect: Each finding carries one concrete action for the implementer.
   - expect: Watch for: approving because the tests pass and the diff looks like it rounds.
   - assert: verdict REJECT
   - assert: reply AC-2
   - assert: reply 21\.63|noise|float
   - assert: unchanged src/cart.js
   - assert: unchanged test/cart.test.js

3. **Review a branch with no spec in the repo.**
   - prompt: Review this branch before I merge it.
   - tags: matrix
   - why: no spec in the repo. The prompt is shared with trigger case 5 on purpose: the trigger measures whether the skill is reached, this case what it does once it is. Measured at 6 repetitions with the skill and 3 without: 6/6 withhold, 2/3 approve. The control rep that passed answered in Portuguese ("Veredicto: Request changes"), which is why the guard below names the stance in both languages the case has seen rather than only in English. Re-measured on 2026-11-03 under home isolation: the with-skill arm held at 5/5 on both models, but the control reached 4/10 — by staying silent, once with "Verdict: no blockers", and once with a "### Verdict" heading followed by "Hold the merge", three shapes the guard did not name. Hence the two assertions below: the refusal has to be said, and a verdict line has to carry a stance the guard already knows.
   - expect: Asks for the intent or refuses; does not invent acceptance criteria.
   - expect: Names what it cannot verify instead of approving on plausibility.
   - expect: Watch for: a confident APPROVE with no spec to approve against, and for silence that never says what is missing.
   - assert: reply (?:(?:provide|share|send)[ \t]+(?:the[ \t]+|me[ \t]+the[ \t]+)?(?:source[ \t]+)?spec|(?:confirm|authori[sz]e)[^.\n]{0,40}(?:review|basis)|withh(?:eld|old)|hold(?:ing)?[ \t]+(?:the[ \t]+)?verdict|(?:can'?t|cannot|could not|won'?t)[ \t]+(?:(?:issue|produce|give|make)[ \t]+(?:a |the )?verdict|review[ \t]+(?:against|without|this|it)))
   - assert: noreply (?:^|\n)[ \t]*(?:[#>*_`-]+[ \t]*)*(?:verdict|veredicto|parecer)?[ \t]*:?[ \t]*\**[ \t]*(?:no blockers?|nothing blocking|ready to merge|hold (?:the )?merge|do not merge|don'?t merge)\b
   - assert: noreply (?:verdict|veredicto|parecer):?\s*\**\s*(?:approve[ds]?|reject(?:ed)?|request changes|changes requested|aprova(?:r|do|ção)?|aprovad[oa]|recusa(?:r|do)?|rejeit(?:ar|ado)|altera[çc][õo]es)\b(?!\s+(?:or|nor|ou|nem)\b)|(?:^|\n)[ \t]*(?:[#>*_`-]+[ \t]*)*(?:[A-Za-zÀ-ÿ]+:[ \t]*\**[ \t]*|\*\*[ \t]*)(?:approve[ds]?|reject(?:ed)?|request changes|changes requested|aprova(?:r|do|ção)?|aprovad[oa]|recusa(?:r|do)?|rejeit(?:ar|ado)|altera[çc][õo]es)\b(?!\s+(?:or|nor|ou|nem)\b)|\bLGTM\b|\blooks good\b|\bship it\b
   - assert: reply spec
   - assert: unchanged src/cart.js


4. **Review this branch against SPEC-0007.**
   - prompt: Review this branch against SPEC-0007.
   - tags: matrix
   - why: the spec moved after the prompt was stamped. The branch rewords AC-3 only — "a negative `taxRate`" becomes "a negative tax rate" — so no requirement changes, the suite stays green and the stale spec is the only defect. The prompt pins `feb763b1…`; the branch spec hashes to `36c915b0…`.
   - expect: Computes the spec hash and finds it no longer matches the prompt's `spec_sha`.
   - expect: Rejects as a stale spec instead of reviewing code against a contract that changed underneath it.
   - expect: Names the moved spec as the blocking finding, with the action that fixes it (re-stamp the prompt, or re-groom the spec).
   - expect: Watch for: reviewing the diff anyway, or approving because the code looks right against the new wording.
   - assert: verdict REJECT
   - assert: reply feb763b1
   - assert: reply 36c915b0
   - assert: unchanged src/cart.js
   - assert: unchanged test/cart.test.js

5. **Trigger: a branch is handed over for review.**
   - prompt: Review this branch before I merge it.
   - tags: trigger
   - why: the prompt never names the skill; it has to be recognised from the description
   - gate: off
   - expect: Loads `review-code` rather than starting an ad-hoc read of the diff.
   - assert: skill review-code

6. **Near-miss: a failure being debugged, not a change being reviewed.**
   - prompt: Why did my build fail on Node 20?
   - tags: trigger
   - why: same vocabulary (branch, build, failure) without a change to approve
   - gate: off
   - expect: Does not pull in `review-code` for a diagnosis.
   - assert: notskill review-code

7. **Review a branch whose gate is already red.**
   - prompt: Review this branch against SPEC-0007.
   - tags: matrix, separator, holdout
   - why: `main` already fails `npm test` — `test/legacy.test.js` asserts a packaging fee the project never implemented. The branch adds `total()` and its tests and does not touch the failing test, so the diff is clean and the only failing signal is the gate. `AGENTS.md` names the gate command but not a requirement that it pass. Holdout, frozen before this measurement: the skill returns `VERDICT: REJECT` in 5/5; the control fails that assertion in 5/5 — 3/5 approve despite the red gate, 2/5 name it without emitting the token (run dirs in `docs/evals/discriminating-cases.md`).
   - expect: Runs the documented gate and sees it fail.
   - expect: Returns `VERDICT: REJECT` because the gate is not green, instead of approving and mentioning the failure as out of scope.
   - expect: Names the failing test or the packaging fee as the reason the gate is red.
   - expect: Watch for: approving with a "pre-existing failure" note; running only the new tests to get a green result.
   - assert: verdict REJECT
   - assert: ran npm test
   - assert: reply packaging|legacy
   - assert: unchanged test/legacy.test.js
   - assert: unchanged src/cart.js
   - assert: unchanged test/cart.test.js

8. **Interface break with a green suite.**
   - prompt: Review this branch against SPEC-0007.
   - tags: matrix
   - why: the branch adds `total` and updates every call and test to the object form `total({ items, taxRate })`, so `npm test` is green. AC-1 fixes the signature as `total(items, taxRate)` and the export is the public contract, so the green suite does not make the break acceptable.
   - expect: Runs the documented gate and sees it pass.
   - expect: Rejects on the public contract: AC-1 names `total(items, taxRate)`, the branch exports `total({ items, taxRate })` at `src/cart.js:5`.
   - expect: Marks the break `blocking` with `file:line` and one action (restore the exported signature, or get the spec changed first).
   - expect: Watch for: accepting the object form because the tests and internal callers were updated with it.
   - assert: verdict REJECT
   - assert: ranpass npm test
   - assert: reply AC-1
   - assert: reply public|interface|signature|contract
   - assert: reply src/cart\.js:[0-9]+
   - assert: unchanged src/cart.js
   - assert: unchanged test/cart.test.js

9. **Introduced vulnerability with a green suite.**
   - prompt: Review this branch against SPEC-0007.
   - tags: matrix
   - why: the branch implements `total` but also adds `exportCart`, which builds a shell string from `filename` — the value the checkout page forwards from the request query string — and runs it through `execSync`. The test only asserts the built string, so the suite stays green while the command path is injectable.
   - expect: Runs the suite, sees it pass, and still rejects.
   - expect: Names the untrusted flow: request query `filename` → `buildExportCommand` → `execSync` (shell), citing `src/export.js:7` and `:11`.
   - expect: Marks it `blocking` and gives one action (an argument array with `execFile`/`spawn` and no shell, or an allowlist).
   - expect: Watch for: treating the green test as proof that the command path is safe.
   - assert: verdict REJECT
   - assert: ranpass npm test
   - assert: reply command injection|shell injection|injection|untrusted
   - assert: reply filename|query
   - assert: reply execSync|shell|child_process
   - assert: reply src/export\.js:[0-9]+
   - assert: unchanged src/export.js
   - assert: unchanged src/cart.js
   - assert: unchanged test/export.test.js

10. **A risky-looking change that must not block.**
   - prompt: Review this branch against SPEC-0008.
   - tags: matrix
   - why: the branch adds a bounded exponential-backoff retry and its spec, with tests for the first success, a transient retry, the exponential wait, the defaults, the exhausted budget and the non-integer/negative validation. The timers, the `catch` and the exponent look risky to a scanner, but the loop is bounded and the error is rethrown; the diff is scoped to SPEC-0008 and tested. A correct review approves without a blocking finding.
   - expect: Walks AC-1 through AC-3, recording the code and the test for each.
   - expect: Runs the documented gate and sees it pass.
   - expect: Does not block on the timer, the `catch` or the exponential delay; reads the bound (`attempt < attempts`) and the rethrow.
   - expect: Watch for: calling the loop unbounded, calling the catch a swallow, or rejecting because `setTimeout` appears in a pure module.
   - assert: verdict APPROVE
   - assert: ranpass npm test
   - assert: reply AC-1
   - assert: reply Not verified
   - assert: noreply - \[blocking\]
   - assert: unchanged src/retry.js
   - assert: unchanged test/retry.test.js
