# Agent conventions

## Contract

`orders_export` is the producer/consumer boundary. The block below is the contract
the oracle parses; it declares the schema the two ODCS versions share.

```contract
table: orders_export
required: order_id INTEGER NOT NULL
required: customer_id TEXT NOT NULL
required: amount_cents INTEGER NOT NULL
required: placed_on TEXT NOT NULL
```

- `contract-v1.odcs.yaml` and `contract-v2.odcs.yaml` declare the **same
  columns, names, types and requiredness**. What changed between them is in the
  property descriptions, not in the schema.
- The check reads `PRAGMA table_info` and the NULL counts only. It passes on both
  versions by construction; that is the point of this fixture.

## Check

Run from this directory (the tree root):

    python3 check.py

Exit 0 means the schema holds. The CLI classification of the v1 -> v2 change:

    datacontract breaking contract-v1.odcs.yaml contract-v2.odcs.yaml

Requirements: `python3` (standard library only) and `datacontract` 1.2.9. No
network, no fixture file written, no bytecode cache left in the tree.
