# Review examples

Read when deciding whether a pattern improves the current problem.

| Situation | Prefer | Avoid | Check |
| --- | --- | --- | --- |
| One formatting algorithm parameter | A callable | Strategy base class plus registry without a second need | Existing output and failure behavior |
| Immutable business key | Stable value equality and hash | Mutable hash fields or unsafe_hash as a shortcut | Equal-key lookup and mutation policy |
| Large ordered export | Incremental iteration with bounded state | list/sorted to hide a streaming problem | Early output and final group |
| Offline pricing reuse | Pure quote plus explicit charge orchestration | HTTP/ORM dependency in pricing | Quote works with no client |
| Validation repeated in several entry points | One owner of the shared invariant | Similar checks that drift independently | Both callers obey the same rule |
| Healthy cohesive module | Preserve it | Splitting solely to meet an invented line limit | Interface and change cost |
| Tiny bug in a Poetry/Black project | Local fix with existing tools | New uv/Ruff/ty migration | Configuration stays unchanged |
| One I/O request | Existing synchronous path | Async infrastructure with no workload benefit | Required latency and behavior |

## Example: extract policy, preserve effect order

Before adding `PricingService`, `PricingRepository`, `PricingFactory` and a
container, ask whether two functions express the actual contract:
`quote(lines)` owns price validation/calculation; `checkout(lines, charge)`
quotes first and invokes the existing charge operation once. Invalid input must
not charge. A transport adapter may translate provider failures without making
pricing import that provider.

The gain is independent offline reuse and one owner of pricing rules. If the
existing module already provides both, leave it alone.

## Example: replace ceremony with Python's protocol

A custom `Batch` with `get_items()` and hand-written indexing might simply be a
list. Keep a custom type if it owns a real invariant or domain behavior; implement
the needed iteration contract instead of making callers learn a parallel API.
Do not add every sequence method when callers only need iteration.

## Frame review findings

State the observed code and consequence, then the smallest remedy. Cite a written
source for a rule violation; label a recommendation as judgment when no rule
exists. Explain what evidence would change it. Do not reject code for failing to
use advanced language features or for differing from a favorite architecture.

These examples teach judgment; they are not acceptance criteria or an answer key
for the evaluation corpus.
