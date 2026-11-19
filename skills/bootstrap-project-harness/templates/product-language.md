---
certainty:
  principles: accepted
---

# Ubiquitous Language Template

Maps product terms → code entities → definitions.

> **Certainty.** A generated product document labels its sections in `certainty:`
> frontmatter. The set is closed; these four values are defined here and
> referenced everywhere else:
>
> - `confirmed` — backed by something observed
> - `accepted` — a decision that holds until deliberately revised
> - `hypothesis` — a belief to be tested
> - `open` — no answer yet
>
> A key is its own heading lowercased with punctuation dropped and spaces
> hyphenated: `In Scope (now)` is `in-scope-now`.
>
> **Code Entity is optional.** Fill the column once the entity exists in code; a
> term can be recorded before its implementation. Leave the cell empty until
> then, as the second sample row below shows.

| Product Term | Code Entity | Definition |
|---|---|---|
| [term in UI/docs] | [class/model/component name] | [what it means in plain language] |
| [term in UI/docs] |  | [what it means in plain language; no code entity yet] |

### Principles

- Names must be consistent across UI, API, code, and docs
- Prefer Portuguese for user-facing terms, English for code
- Document new terms here before using them
