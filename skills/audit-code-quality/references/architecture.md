# Architecture: deep modules and the cost of change

Read this only when the audit reaches architecture: a module boundary, a public
interface, or a dependency that points against the declared direction. It is a
vocabulary for judging what a structural scan cannot decide, not a second audit
engine.

## A module is its interface

A module is not a file or a directory. It is a boundary that hides a decision.
The **interface** is everything a caller must know to use it correctly:

- the inputs and outputs, including the error shapes;
- invariants the caller must preserve (ordering, idempotency, units);
- lifecycle and ordering (open before write, commit after validate);
- configuration and defaults the caller can change;
- failure modes and what happens on retry.

A **deep module** has a small interface over a large amount of behaviour. The
caller says what it wants; the module owns how. A deep module can contain many
files; file count is not the measure.

A **shallow module** has an interface roughly as complex as its implementation,
or the caller still has to know the implementation to use it correctly. The
common shape is a forwarding function that adds no policy:

```js
// shallow: the caller must still validate, open the transaction and retry
create(input) {
  return repository.insert(input)
}
```

The finding is not "this function is short". It is "the caller must know the
invariants the module was supposed to own". Name the interface line and the
caller-side orchestration with `file:line`.

## Shallow forwarding, leaked invariants, distributed responsibility

These three shapes usually travel as a set. Look for them together.

1. **Forwarding layer.** A service, adapter or wrapper whose body is a single
   delegation while its name promises policy.
2. **Leaked invariant.** Validation, transaction boundaries, retry, rounding,
   permission checks or ordering live in a caller (or in every caller).
3. **Distributed responsibility.** Two or more callers implement the same rule
   differently, so the rule has no single owner and drifts.

Evidence is the interface line, the caller-side orchestration and the written
rule the split violates. A finding with only one side is a style note, not an
architecture finding.

## The deletion test

Ask: if this module disappeared and its callers inlined it, what would get
worse? If the answer is "nothing" or "a few lines", the module earns its place
only through a second consumer or a named boundary. If the answer is "every
caller would have to re-learn the invariants", the module is deep and the
deletion test passes.

The test is a thought experiment, not a refactor. Never delete code during an
audit to prove the point.

## Seams, boundaries and direction

- **Seam** — a place where behaviour can be substituted without editing the
  caller: a port, an injected clock, a storage interface. A seam that exists
  only for tests and has one real implementation is `judgement`, not a defect.
- **Boundary** — a rule about what may cross and in which direction. It lives
  in the architecture document, an ADR, or the dependency tool's configuration.
- **Direction** — dependencies point toward the stable policy, away from
  delivery and storage. A cycle is the strongest signal that the direction is
  gone; the dependency tool or a reproducible import scan is the evidence, not a
  hunch.

A boundary violation needs the edge (`a -> b`), the declared direction and the
file that states it. Without the rule it is `judgement`.

## Change cost

The cost of a module is what a future change must touch:

- how many callers know the invariant;
- how many files change together for one reason;
- how hard the module is to test without its collaborators;
- how reversible the change is (can one caller migrate first?).

Rank architecture findings by that cost, never by file size or an abstract
"complexity" number.

## `rule` vs `judgement`

A finding is `rule` only when it cites a written source:

- the architecture document or an ADR (`docs/architecture.md:12`);
- a harness or lint limit (`.eslintrc:4`, `pyproject.toml:22`);
- the dependency tool's configured rule (`.dependency-cruiser.js:8`).

Otherwise it is `judgement`. State the cost, the change it enables and what
would make the judgement wrong — for example a second consumer already exists,
or an external API mandates the boundary. Never upgrade taste to a rule because
the code "feels" wrong.

## Zero findings is a result

A healthy decomposition is not a finding. When the interface is deep, the
invariants have one owner, dependencies point the right way and the deletion
test passes, report zero architecture findings and say what you checked. Do not
invent a finding to look thorough, and do not call a cohesive set of small
modules "too many modules" when each has a consumer and a reason.
