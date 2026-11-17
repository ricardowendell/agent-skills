# Types and domain models

Read for choosing records, interfaces, or validation boundaries.

## Choose a representation by its contract

| Need | Starting point | Escalation signal |
| --- | --- | --- |
| Local grouping of values | Tuple or mapping | Fields have domain meaning or invariants |
| In-process named record | Dataclass | A boundary needs parsing/serialization |
| Immutable value record | Frozen dataclass with suitable fields | Nested mutation or equality needs explicit treatment |
| Existing dictionary wire shape | TypedDict | Runtime validation is needed |
| One injected operation | Callable | Several operations share a real lifecycle |
| Structural collaborator | Protocol | Consumers benefit from a named typed contract |
| Shared implementation hierarchy | Concrete composition first | Substitutability and shared behavior justify inheritance |

Type hints and `TypedDict` do not validate runtime inputs. A dataclass does not
automatically validate annotated values. Validate untrusted payloads at ingress
using the existing project mechanism; keep parsed domain values explicit afterward.
Use `__post_init__` for construction invariants when appropriate, and account for
later mutation if the record is mutable.

## Make interfaces smaller than implementations

```python
from typing import Protocol

class PriceLookup(Protocol):
    def unit_price_cents(self, sku: str) -> int: ...

def line_total(sku: str, quantity: int, prices: PriceLookup) -> int:
    if quantity <= 0:
        raise ValueError("quantity must be positive")
    return quantity * prices.unit_price_cents(sku)
```

Use the protocol when it clarifies consumers; a single concrete implementation
does not automatically require one. Avoid inheriting from a Protocol merely to
satisfy structural typing. Runtime-checkable protocols are not full signature or
business validation.

## Express uncertainty and units

Use `object` plus narrowing for unknown values when operations must be checked;
reserve `Any` for deliberately dynamic boundaries. Use `None` for meaningful
absence and an explicit result or exception when failure needs distinct context.
Do not hide money units or timezone assumptions in a generic `float` or `str`.

Choose the target's supported syntax: built-in generic containers require 3.9+,
union syntax normally 3.10+, and type-parameter syntax 3.12+. Keep runtime
annotation evaluation and tooling support in view before modernizing syntax.

## Verify

Run the existing checker. Test runtime invariants independently of annotations,
including invalid boundary input and any supported mutation. Do not introduce a
validation framework merely to make a small internal record look formal.
