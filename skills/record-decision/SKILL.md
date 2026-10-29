---
name: record-decision
description: Record an architecture decision as a short ADR in docs/decisions. Use when the user makes or asks to document a decision, chooses between alternatives, or accepts a trade-off worth remembering. Writes ADR-NNNN-short-name.md with status, context, decision, and consequences; supersedes the previous ADR instead of editing it. Never invents rationale or restates docs/architecture.md — asks instead.
stack-agnostic: true
---

# Record Decision As ADR

## Purpose

Capture a decision that was actually made, including what was traded away, so the reasoning survives the conversation. An ADR is a record, not a design document: keep it short enough that someone reads it before changing the decision.

## Workflow

1. Read `AGENTS.md` first.
2. Resolve from `AGENTS.md`: the decisions folder (illustratively `docs/decisions`) and the architecture doc. If the repo has no decisions folder, ask before creating one.
3. Read the decisions `README.md`, because it defines the local format, and the existing ADRs. The next number is the highest existing `ADR-NNNN` plus one.
4. **Confirm the decision is made.** It is made when the user states what will be done and something was traded away. If the options are still being weighed, stop and say so — an option under discussion is not a decision. Write nothing in that case: no ADR file, and no row in the index.
5. Collect the minimum:
   - **Context** — the forces that make this a real choice.
   - **Decision** — what was chosen, in one or two sentences.
   - **Alternatives considered** — only those the user actually mentioned, with the reason they lost.
   - **Consequences** — what this makes easy, and what it makes hard.
6. **Ask for anything missing. Never invent rationale, constraints, or alternatives.** A plausible-sounding reason the user never gave is worse than an open question. An unanswered question is not an answer: if the missing half never arrives, leave the decision unrecorded.
7. If the decision replaces an existing ADR: write the new ADR first, then set the old one's status to `superseded by ADR-NNNN`. Do not rewrite the old decision.
8. Write `ADR-NNNN-short-name.md` in the decisions folder, following the fields the local `README.md` defines. When it defines none, use Status, Context, Decision, Consequences, and Alternatives considered (when given).
9. Update the decisions index only if one already exists, and only additively: append the new row, link the new ADR, never renumber existing entries.
10. Report the path, the ADR number, and the status used.

## Guardrails

- **One decision per ADR.** If the user bundles several, split them and ask which to record first.
- **Do not duplicate the architecture doc.** Link to it; record only the trade-off.
- **Do not mine the inbox.** Decisions found in raw notes belong to `process-inbox`.
- **Do not restate vision or principles.** Reference them; they are not the decision.
- **Supersede, never edit, an accepted ADR.** History is the point.
- **All or nothing.** The ADR file and its index row land together. Never add an
  index entry for a decision that was not recorded.
- **Do not open a decision record for reversible, local choices** (naming, formatting). Say why it does not need one.

## Output

End with:

- The ADR file written, with its number and status.
- One line on what was traded away.
- Any question that blocked the record, or `None`.

## Pipeline

Side stage of the product-thinking pipeline. It usually follows a `find-blind-spots` session or a discussion inside `groom-backlog`, and `write-implementation-prompt` can cite the ADR it produces.
