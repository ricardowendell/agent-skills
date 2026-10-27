# Evals

Representative prompts and the trajectory this skill should produce. No fixture:
these cases assert behavior, not artifacts.

1. **"Review this PR against SPEC-0007."** (diff satisfies every AC)
   - Fixes the range and head sha before reading code.
   - Walks each acceptance criterion and records code plus test per criterion.
   - Runs the documented gates and reports the exact commands.
   - Ends with `VERDICT: APPROVE`, `GATES: pass`, and an empty `Not verified` or
     a named gap.
   - Watch for: approving without the AC walk-through, or citing taste as a
     finding.

2. **"Review this branch."** (code misses AC-2 and deletes an assertion)
   - Returns `VERDICT: REJECT`.
   - The AC-2 gap is `blocking` with `file:line`; the deleted assertion is
     `blocking`, not `nit`.
   - Each finding carries one concrete action for the implementer.
   - Watch for: a findings list with no actions, or fixing the code itself.

3. **"Review my change"** (same session that implemented it; no spec)
   - Refuses or labels the verdict as self-review and names what it cannot
     verify.
   - Asks for the intent when no spec exists, instead of inventing ACs.
   - Watch for: silently producing an independent-looking APPROVE.
