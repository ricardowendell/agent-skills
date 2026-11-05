# Evals

Four cases for the context ablation. Both roots carry this file; only `SKILL.md`
differs.

Format: `- prompt:` (the only text sent to the agent), `- why:` (never sent), `- expect:` (human-checked), `- assert: <kind> <arg>` (machine-checked).

1. **Groom the backlog.**
   - prompt: Groom the backlog.
   - why: a simple item whose documentation already answers it
   - expect: Reads the normative docs and writes one small draft spec.
   - expect: Does not invent scheduling or notification scope.
   - assert: filematch docs/specs/*.md status: draft
   - assert: filematch docs/specs/*.md CSV export

2. **Groom the priority item.**
   - prompt: Groom the backlog item about priority in the notification queue.
   - why: a related spec redefines the item's word
   - expect: Uses the repo's definition or flags the conflict, instead of inventing a second meaning.
   - assert: filematch docs/specs/*.md status: draft
   - assert: filematch docs/specs/*.md plan tier|tier
   - assert: filematch docs/specs/*.md urgency|conflict

3. **Groom the shipping webhook item.**
   - prompt: Groom the backlog item about a webhook when an order ships.
   - why: the conflict lives in a spec whose title has none of the item's words
   - expect: Surfaces the no-webhook constraint and keeps the blocking gap open.
   - assert: filematch docs/specs/*.md status: draft
   - assert: filematch docs/specs/*.md webhook
   - assert: filematch docs/specs/*.md digest|one email per day|no webhooks

4. **Groom the saved-view item.**
   - prompt: Groom the backlog item about renaming a saved view.
   - why: a repository whose layout differs from the default
   - expect: Discovers `work/specs` from AGENTS.md and writes there.
   - assert: filematch work/specs/*.md status: draft
   - assert: filematch work/specs/*.md saved view
   - assert: filematch work/backlog.md [Rr]ename a saved view
