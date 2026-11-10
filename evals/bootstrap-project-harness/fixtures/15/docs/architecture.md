# Architecture Rules

> **Prescriptive only.** Descriptions of the system live in `docs/system/`, which
> links here instead of restating these rules. These rules are normative — a
> violation is a bug, not a tradeoff.

## Layering

[Dependency direction, e.g. UI → domain → data. Nothing points back up.]

## Responsibilities

[What belongs in each layer or module. Separation of concerns.]

## DRY

[Shared logic lives once, in the lowest layer that owns it. No duplicated
business rules.]

## Size Limits

| Metric | Limit |
|---|---|
| Function length | warn 60 lines |
| File length | warn 200 lines |
| Max params per function | error 4 |
| Cyclomatic complexity | error 10 |

## Naming

[Naming conventions for modules, types, files, and exported functions.]

## Anti-Patterns

- [Forbidden: god functions, cross-layer imports, business logic in UI, etc.]
