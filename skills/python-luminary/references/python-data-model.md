# Python data model

Read for custom objects that participate in language operations.

## Select a protocol before a special method

Ask what callers need to do: iterate, index, compare, call, or manage a resource.
Use an existing container or dataclass first. Add custom behavior only when it
expresses domain semantics; a domain entity need not emulate a collection.

Return `NotImplemented` from binary/comparison methods for unsupported operands
when Python's reflected-operation dispatch should get a chance. Return an iterator
from `__iter__`; returning the same exhausted iterator changes repeatability.

## Protect equality and hashing

Equal values must have equal hashes; a key's hash must remain stable during its
lifetime. Fields used in value equality and hashing cannot change in a hashed key.
For a mutable value-equal object, leave it unhashable. Identity-based objects may
remain mutable and hashable: immutability is not the universal definition of
hashability. Do not use `unsafe_hash=True` to bypass a design mismatch.

For a simple immutable key:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class ProductKey:
    tenant: str
    sku: str
```

A frozen dataclass is shallow: a mutable field does not become immutable.
Check nested values before relying on generated hashing.

## Represent and extend deliberately

Make `repr` useful for diagnosis and omit secrets. Reconstructable output is
desirable when practical, not a universal requirement. Add `str` only when a
distinct user-facing representation helps.

Prefer ordinary attributes, then properties, before descriptors or attribute
interception. Use descriptors for a repeated attribute-management contract;
justify metaclasses against class decorators or `__init_subclass__`.
Consider slots only for a measured memory/layout requirement and verify effects
on inheritance, weak references, serialization, and dynamic attributes.

## Verify

Check equality with unrelated operands, equal-key dictionary lookup, and mutation
policy. For collection behavior, check empty input, repeatability and indexing or
slicing only when the public contract supports them.
