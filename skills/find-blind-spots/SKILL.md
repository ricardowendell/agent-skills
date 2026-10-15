---
name: find-blind-spots
description: Interview the user adversarially about a plan or design until every branch of the decision tree is resolved. Use when the user asks to find blind spots, stress-test this, challenge my design, poke holes, pressure-test an idea, or wants adversarial feedback before committing to an approach.
stack-agnostic: true
---

# Find Blind Spots

Interview the user relentlessly about a plan or design until reaching shared understanding, resolving every branch of the decision tree.

## When to use
- User says "find blind spots", "stress-test this", "challenge my design", or similar
- User presents a plan and wants adversarial feedback before committing

## How to run

1. **Ask for the plan** if none was given: "What's the plan or design you want to stress-test?"

2. **Map the decision tree** mentally before asking anything. Identify:
   - Core assumption the plan depends on
   - Branches that fork on unknowns (scale, failure modes, user behavior, cost, timeline)
   - Edges where the plan is silent (what happens when X fails? who owns Y?)

3. **Interview relentlessly** — one sharp question at a time, never a list. Each answer either closes a branch or opens sub-branches. Keep going until every branch is resolved or explicitly deferred with a reason.

   Good question types:
   - **Assumption challenge**: "You said X — what breaks if that's wrong?"
   - **Failure mode**: "What's the failure mode if [dependency] is unavailable?"
   - **Edge case**: "What happens to [user/data/state] when [boundary condition]?"
   - **Alternative**: "Why not [simpler/cheaper/faster approach]? What does this give you that it doesn't?"
   - **Cost of being wrong**: "If this decision turns out to be wrong in 6 months, how painful is the reversal?"
   - **Ownership gap**: "Who is responsible for [X] when it goes wrong at 2am?"

4. **Track open branches** internally. After each answer, either close the branch ("got it, that's resolved") or surface the next open one.

5. **Stop when the tree is closed**: every significant branch is either resolved, explicitly out of scope, or a known accepted risk. Then give a crisp summary:
   - Decisions that look solid
   - Risks that are accepted vs. unresolved
   - The one thing that would cause you to rethink the whole plan
