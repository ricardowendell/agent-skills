# Agent conventions

## Contract

`orders_export` is the producer/consumer boundary. Consumers read `customer_id`;
the producer's staged export ships `customer_ref` instead. The block below is the
consumer contract (v1) the oracle parses.

```contract
table: orders_export
required: order_id INTEGER NOT NULL
required: customer_id TEXT NOT NULL
required: amount_cents INTEGER NOT NULL
required: placed_on TEXT NOT NULL
```

- `contract-v1.odcs.yaml` is the consumer contract (`customer_id`).
  `contract-v2.odcs.yaml` is the producer's new contract (`customer_ref`,
  version `2.0.0`). The change between them is what the official
  `breaking-change-check` reads.
- The check reads `PRAGMA table_info` and the NULL counts of the built export,
  not the generated text or the SQL that produced it.
- `--producer-contract` points the same oracle at an ODCS file instead of the
  block above, so the v2 contract can be proved to match the staged schema.

## Staged-only holdout

This tree is the **staged-only copy** of `../incompatible-contract/`: the
pipeline implements only the producer that renames `customer_id` to
`customer_ref`. There is no `corrected` branch to read. The original tree stays
frozen with the `b96b88d3…` hash; this copy's `treeHash` is recorded in
[`../decision.md`](../decision.md).

## Check

Run from this directory (the tree root):

    python3 check.py

Exit 1 means the consumer contract is broken by the staged export. The producer
contract v2 matches the same schema:

    python3 check.py --producer-contract contract-v2.odcs.yaml

The CLI classification of the contract change:

    datacontract breaking contract-v1.odcs.yaml contract-v2.odcs.yaml

Requirements: `python3` (standard library only) and `datacontract` 1.2.9. No
network, no fixture file written, no bytecode cache left in the tree.
