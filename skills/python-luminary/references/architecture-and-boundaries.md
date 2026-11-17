# Architecture and boundaries

Read for responsibilities, coupling, import direction, or refactoring scope.

## Assign ownership to decisions

Name the rule that must change together: pricing, authorization, retry policy,
storage mapping, or presentation. Keep that rule with the data and operations
that preserve it. Split a module when it hides a separate decision, isolates an
external effect, or creates useful independent reuse.

Keep stable business policy independent of framework request objects, ORM sessions,
and environment lookups where the domain can reasonably stand alone. Perform
composition at an explicit entry point. A small module may contain both pure
functions and orchestration; separate directories are not a prerequisite.

## Make a boundary earn its interface

Before extracting, answer:
- What decision or invariant will the new boundary own?
- What will callers stop knowing?
- What real change or independent use becomes easier?
- What lifecycle, errors, and ordering will callers still need to understand?

Passing a callable, a clock value, or a concrete collaborator can isolate an
effect without introducing an interface hierarchy. Add a Protocol when its typed
consumer contract helps. A wrapper that delegates one call may still earn its
place through error translation, compatibility, or resource ownership; inspect the
contract before deleting it.

For example, expose pure `quote(lines)` when offline reports need pricing, and
let `checkout(lines, charge)` own the charge. Do not create a repository,
service, factory and container when two functions solve the requirement.

## Keep domain guarantees cohesive

Move validation, transaction ownership, and idempotency to the boundary responsible
for them; do not scatter the same rule across HTTP and job callers. Preserve
atomicity when extracting pure computations. Moving effects outward does not mean
moving every transaction decision into the presentation layer.

Avoid a generic `utils.py` dumping ground or a public barrel that imports the
whole application. Make imports cheap and side-effect-free; defer client creation
and configuration reads to composition. Break cycles by correcting responsibility,
not by hiding all imports inside functions.

## Refactor under a compatibility contract

Inventory callers, positional/keyword arguments, errors, return values and effect
ordering. Characterize consequential behavior first, then make a bounded change.
Keep intentional duplication when the rules evolve independently; consolidate
copies of the same invariant when drift is already costly.

During a review, distinguish a declared import rule from judgment about future
change cost. A large cohesive module can be healthy; several tiny forwarding
modules can be harder to change. Permit zero architecture findings.
