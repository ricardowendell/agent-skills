---
status: processed
processed_at: 2026-11-19 11:02
---

# Bootstrap prepara o projeto para aprender, não para decidir

## 10:40

**The bootstrap should prepare the project to learn and build safely, while allowing product and design decisions to remain provisional.** That would change both the interview and the authority given to the generated docs.

I inspected the current bootstrap and templates. You already have useful safeguards: repository detection, preservation of existing tools, a maximum of seven skippable interview questions, and stubs instead of invented answers. I would keep those. [Current bootstrap](https://github.com/ricardowendell/agent-skills/blob/main/skills/bootstrap-project-harness/SKILL.md)

The main tension is that some templates turn early answers into fairly authoritative commitments: a solution in the vision, code entities in the glossary, a design system, and prescriptive architecture rules.

**I would change the interview from "describe the product" to "establish what we know and what we need to learn."**

Your current interview covers problem, audience, solution, terminology, principles, and—when there is UI—design and voice. My proposed allocation would be:

| Topic | Treatment at bootstrap |
|---|---|
| Problem and audience | Keep. Ask about a concrete situation where the problem occurs. |
| Desired outcome | Capture what should become easier or possible, independently of a proposed feature. |
| Evidence | Ask what has actually been observed: personal experience, user feedback, an existing workaround. |
| Proposed solution | Capture as a candidate unless already decided. |
| Important uncertainty | Identify the assumption most likely to change the direction. |
| Constraints | Separate imposed requirements from preferences: platform, existing integrations, data boundaries, budget. |
| First learning objective and autonomy | Establish the next useful investigation and what the agent may do within the authorized scope. |

These are interview topics, not necessarily seven separate questions. Detection should answer technical questions wherever possible; the human interview should focus on information the repository cannot supply.

For example, **"Which database should we use?"** may be premature. "Must this work offline?" or "Does this need to integrate with an existing database?" provides more useful constraints.

**The documents would keep their purposes, but express different levels of certainty.**

| Document | What I would capture initially | What I would defer |
|---|---|---|
| `product/vision.md` | Problem, audience, desired outcome, supporting evidence. | A definitive solution when it remains a hypothesis. |
| `product/scope.md` | Explicit exclusions, constraints and the boundary of the current investigation. | A detailed feature boundary unsupported by learning. |
| `product/language.md` | Domain terms and their meanings. | Class, component and table mappings until those entities exist. |
| `product-principles.md` | A few decision rules with a reason and a concrete tradeoff. | Preferences elevated into permanent rules. |
| `design.md` | Known interaction constraints and existing conventions. | An entire interaction philosophy before testing a flow. |
| `visual-design.md` | Existing brand requirements and reusable references. | Choosing every token and component before the experience is understood. |
| `voice.md` | Known audience/language requirements and existing examples. | A complete voice system before meaningful user-facing copy exists. |
| `architecture.md` | Confirmed technical boundaries and accepted decisions. | Speculative module structure and universal abstraction rules. |
| ADRs | Decisions actually made, including alternatives and consequences. | Recording a candidate as an accepted decision. |

For an established product, much of this may already be decided. Bootstrap should preserve and reference that material. For a new idea, an honest unknown is useful output.

Two current templates particularly deserve adjustment:

- **The glossary requires product terms to map to code entities.** At inception, that can push the agent to invent implementation structure. Make that column optional until there is something real to map. [Language template](https://github.com/ricardowendell/agent-skills/blob/main/skills/bootstrap-project-harness/templates/product-language.md)
- **The architecture template makes its rules normative and includes DRY and fixed size limits.** I would distinguish accepted architectural constraints from recommendations, and let the actual tool configuration own numeric thresholds. An unvalidated architectural preference should not become a blocking rule merely because bootstrap wrote it down. [Architecture template](https://github.com/ricardowendell/agent-skills/blob/main/skills/bootstrap-project-harness/templates/architecture.md.template)

**The crucial distinction is between recording information and making it an instruction.**

I would use a few plain labels inside existing documents:

- **Confirmed constraint:** must be respected.
- **Accepted decision:** applies until deliberately revised.
- **Hypothesis:** may be challenged through evidence.
- **Open question:** has no answer yet.

You do not need a new metadata framework for that.

This matters because the generated OpenCode configuration automatically loads `architecture.md` and `principles/design.md` as instructions. Provisional ideas should not acquire normative authority through that loading mechanism. [Current configuration template](https://github.com/ricardowendell/agent-skills/blob/main/skills/bootstrap-project-harness/templates/.opencode/opencode.json)

**For your Hermes assistant, the initial docs might say:**

> **Outcome:** Captured ideas become easy to find and act on.
> **Observed problem:** Notes accumulate across several places.
> **Constraint:** Hermes already runs on the VPS.
> **Hypothesis:** Automatic classification will reduce inbox-review effort.
> **Open question:** Do rules, a small local classifier, or a general model provide the best result?
> **First experiment:** Compare them on a labeled sample and measure correction effort.

That is enough to guide useful work without committing to a planner agent, execution graph, model gateway or dashboard.

**I would also separate bootstrap completion from product readiness.**

The current product checklist asks whether vision, terminology, principles, design and voice are populated. I would instead report three independent facts:

| Status | Meaning |
|---|---|
| Technical environment | Which commands and checks actually work. |
| Product understanding | What is confirmed, provisional or unknown. |
| Next action | Implement a known change, investigate an uncertainty, or obtain a human decision. |

A functioning environment with an unresolved product hypothesis can be a successful bootstrap. Required checks still apply before promoting experimental work into the maintained application.

For your first iteration, I would change **the interview guidance and document templates**, keeping the existing tooling and pipeline. Start by making "solution" provisional, code-entity mappings optional, and normative rules explicitly sourced. If later you want the automated completeness detector to recognize different bootstrap profiles, that would be a separate, evidence-backed change to the mechanism.
