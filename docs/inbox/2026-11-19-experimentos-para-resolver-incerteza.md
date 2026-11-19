---
status: processed
processed_at: 2026-11-19 11:02
---

# Experimentos para resolver incerteza antes da prontidão

## 09:50

**Your `agent-skills` workflow already has most of the foundations. The main gap is a productive way to handle uncertainty before an item becomes implementation-ready.**

I checked the current repository. Today, the main path is capture → process → groom → prompt → implement → review → docs audit. Exploratory ideas remain unresolved, while implementation requires a sufficiently complete contract. That protects intent, but leaves limited guidance for **using experiments to discover the missing answers**. [Current workflow](https://github.com/ricardowendell/agent-skills/blob/main/README.md)

I would preserve that delivery path and improve how work reaches it.

**Several existing behaviors already fit Joe's perspective**

- `process-inbox` distinguishes firm decisions from exploratory thinking.
- `groom-backlog` preserves open questions and prevents premature readiness.
- `review-code` scales review depth according to the changed surface.
- Your evaluations already compare skills against a **without-skill baseline**.
- Your harness freeze explicitly redirects investment toward useful skill capabilities.

Those are strong foundations for testing whether a process helps, rather than assuming more process is better.

**Here is where I would adjust the skills**

| Existing skill | Current tension | Proposed adjustment |
|---|---|---|
| `process-inbox` | An exploratory idea becomes an open question. | Also identify whether a small experiment could answer it. Preserve the distinction between an idea, evidence and a decision. |
| `find-blind-spots` | Resolves uncertainty primarily through interviewing you. | Distinguish questions requiring your judgment from questions answerable by inspection or experiment. |
| `groom-backlog` | Produces an implementation-ready spec from established direction. | Keep that role. When readiness is blocked, suggest the smallest investigation that would unblock it. |
| `write-implementation-prompt` | Prescribes detailed operations before coding. | Separate mandatory constraints from suggested implementation steps, allowing bounded implementation choices. |
| `implement-from-prompt` | Requires reuse and says to "never duplicate." | Make reuse a reasoned default. Allow a scoped comparison when an abstraction's value is uncertain, while preserving existing project rules. |
| `tighten-harness` | Deliberately makes existing checks stricter. | Keep its narrow purpose; separately review whether existing process and checks still justify their cost. |

These are proposed changes to the instructions, not capabilities I found already implemented.

**The most important change is to `find-blind-spots`.**

Today it interviews until significant branches are resolved or explicitly deferred. I would make its output distinguish:

| Unknown | Appropriate response |
|---|---|
| "Which user outcome matters?" | Ask you or the stakeholder. |
| "Does this API support the required operation?" | Inspect documentation or run a bounded probe. |
| "Which implementation is easier to change?" | Compare prototypes against a concrete follow-up change. |
| "Will users understand this interaction?" | Test the interaction with representative users. |

A question can end with an experiment assignment. Your answer should not have to substitute for evidence.

**I would also reconsider one assumption in prompt generation.**

`write-implementation-prompt` currently describes the prompt as the cheapest place to catch a wrong assumption because discovering it after coding requires a rewrite. With inexpensive prototypes, **writing disposable code can itself be the cheapest investigation**.

That does not make detailed prompts useless. It means their detail should reflect what you have learned. [Current prompt-generation instructions](https://github.com/ricardowendell/agent-skills/blob/main/skills/write-implementation-prompt/SKILL.md)

For example, an implementation prompt could distinguish:

- **Required:** observable behavior, compatibility, data boundaries and verification.
- **Suggested:** likely files, implementation sequence and reusable helpers.
- **Unresolved:** questions requiring evidence before proceeding.

Existing architectural rules remain binding until deliberately changed.

**A concrete example in your workflow**

Suppose you capture:

> "Hermes should automatically organize incoming notes."

I would route it this way:

1. **Capture/process:** preserve the idea and identify uncertainty about the categories and routing mechanism.
2. **Investigate:** compare keyword rules, a local classifier and your current general model on the same labeled examples.
3. **Record evidence:** include routing errors, abstentions, latency and correction effort.
4. **Decide:** choose a mechanism—or decide automatic organization is premature.
5. **Groom:** write the implementation spec around the selected behavior and failure handling.
6. **Prompt/implement/review:** use your existing delivery workflow.

The experiment's success criterion is **making a better decision**. Its code does not automatically become production code.

**Keep the spec hash and review boundary**

Your hash checks remain useful: each implementation should be reviewed against a known contract. When an experiment or implementation invalidates an assumption, return it to grooming, revise the contract and regenerate the corresponding prompt. The change becomes explicit and traceable. Your reviewer already sends incorrect specifications back to grooming. [Review instructions](https://github.com/ricardowendell/agent-skills/blob/main/skills/review-code/SKILL.md)

**For your repo, I would start with content changes only**

Your [current policy](https://github.com/ricardowendell/agent-skills/blob/main/docs/pipeline.md) freezes new harness mechanisms while allowing skill-content and evaluation improvements. This direction fits that boundary:

1. Teach `find-blind-spots` to recommend evidence-gathering experiments.
2. Teach `groom-backlog` to distinguish unresolved assumptions from implementation blockers.
3. Add evaluation cases comparing those changes with the current skills and the without-skill baseline.
4. Measure whether they reduce unnecessary questions, premature specifications and your intervention time.

Only introduce a dedicated exploration skill if those experiments show that it needs a reusable home. Your existing pipeline can remain the reliable path for delivering changes, while the skills become better at discovering which changes deserve to enter it.
