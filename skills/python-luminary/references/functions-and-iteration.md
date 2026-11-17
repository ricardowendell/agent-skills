# Functions and iteration

Read for transformations, callback design, or streaming.

## Prefer the least machinery

Use a named function for meaningful behavior and a callable parameter for a
substitutable operation. Reach for `functools.partial` when it clarifies binding;
preserve metadata with `functools.wraps` in decorators. A closure is appropriate
for small private state, provided ownership and late binding remain clear.

Prefer a comprehension for a simple bounded transformation. Use a normal loop
when branches or effects would make the expression obscure. A generator is a
lifetime and consumption decision, not an automatic optimization.

## State the consumption contract

Distinguish a reusable iterable from a single-pass iterator. A probe such as
`list(rows)` or `any(rows)` consumes input; a second pass may see nothing.
Choose whether to stream, materialize once within a known bound, or require a
sequence. Keep the contract honest in annotations and documentation.

```python
from collections.abc import Iterable

def total_cents(amounts: Iterable[int]) -> int:
    return sum(amounts)
```

Do not close caller-owned resources unexpectedly. A generator reading a file can
keep it open while suspended; make early termination and explicit closure safe.

## Recognize hidden buffering

`sorted` and `list` materialize their input. `itertools.tee` can buffer as one
consumer outruns another. `groupby` groups adjacent keys, not all equal keys;
its groups share the underlying iterator and should be consumed before advancing.
Use it when input ordering is a real contract. Avoid silently sorting an
unbounded stream to make grouping convenient.

For independent streams, use `zip(..., strict=True)` only when unequal lengths
are an error and the Python target supports it. Remember that late failure may
follow earlier side effects.

## Verify

Exercise empty input, a generator input, and the final group. For streaming,
assert that the first output arrives before the entire input is consumed, allowing
the necessary lookahead. Bound input buffering and output accumulation separately.
