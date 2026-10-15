# Evals

Representative prompts and the trajectory this skill should produce.

1. **"Poke holes in this plan."**
   - Interviews the user adversarially, branch by branch, until each decision is resolved.
   - Asks focused questions; does not just emit a generic risk list.
   - Watch for: shallow "have you considered…" prompts that the user can answer with one word.

2. **"Stress-test my design before I commit."**
   - Surfaces unstated assumptions, edge cases, and failure modes the user has not decided on.
   - Stops when the decision tree is exhausted, not after a fixed number of questions.
   - Watch for: ending prematurely or drifting into implementation suggestions.
