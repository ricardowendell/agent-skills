# Evals

Cases 1–4 share the `base/` fixture: a small Node project with `AGENTS.md`, a
spec (`docs/specs/SPEC-0007-cart-tax.md`), its prompt stamped with `spec_sha`,
and a passing `node --test` suite. Each case's `git.json` commits that tree as
`main`, applies `change.patch` on a branch, and leaves the branch checked out —
so the skill reviews a real `main..feature` range instead of an unversioned
directory.

Case 3 prunes `docs/specs` and `docs/prompts` before the base commit: the review
must then ask for the intent rather than invent acceptance criteria.

Assertions: `- [assert] <kind> <arg>` is machine-checked after the case (`file`,
`nofile`, `dir`, `nodir`, `filematch`, `grep`, `nogrep`, `unchanged`, `changed`).
Two kinds exist for the verdict, because the transcript contains the skill's own
templates: `verdict APPROVE|REJECT` reads the reply's `VERDICT:` line, and
`reply`/`noreply` match the agent's text only.

1. **"Review this branch against SPEC-0007."** (the diff satisfies every AC)
   - Fixes the range and head sha before reading code.
   - Walks AC-1 through AC-3, recording the code and the test per criterion.
   - Runs the documented gate and reports the exact command and result.
   - Ends with `VERDICT: APPROVE` and an empty or named `Not verified`.
   - Watch for: approving without the AC walk-through, or citing taste as a
     finding.
   - [assert] verdict APPROVE
   - [assert] reply AC-3
   - [assert] unchanged src/cart.js
   - [assert] unchanged test/cart.test.js

2. **"Review this branch."** (the diff misses AC-2 and deletes a test)
   - Returns `VERDICT: REJECT`.
   - The AC-2 gap is `blocking`, with `file:line`; so is the deleted test.
   - Each finding carries one concrete action for the implementer.
   - Watch for: a findings list with no actions, or fixing the code itself.
   - [assert] verdict REJECT
   - [assert] reply AC-2
   - [assert] unchanged src/cart.js
   - [assert] unchanged test/cart.test.js

3. **"Review my change."** (no spec in the repo)
   - Asks for the intent or refuses; does not invent acceptance criteria.
   - Names what it cannot verify instead of approving on plausibility.
   - Watch for: a confident APPROVE with no spec to approve against.
   - [assert] noreply VERDICT: APPROVE
   - [assert] unchanged src/cart.js

4. **"Review this branch against SPEC-0007."** (the spec moved after the prompt was stamped)
   - Computes the spec hash and finds it no longer matches the prompt's `spec_sha`.
   - Rejects as a stale spec instead of reviewing code against a contract that
     changed underneath it.
   - Names the moved spec as the blocking finding, with the action that fixes it
     (re-stamp the prompt, or re-groom the spec).
   - Watch for: reviewing the diff anyway, or approving because the code looks
     right against the new wording.
   - [assert] verdict REJECT
   - [assert] reply spec hash:.*mismatch
   - [assert] unchanged src/cart.js
   - [assert] unchanged test/cart.test.js
