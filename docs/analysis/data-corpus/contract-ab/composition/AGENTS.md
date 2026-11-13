# Agent conventions

## Context

`orders_export` is a Postgres table that a new reporting consumer needs under
contract. There is **no data contract yet**: `schema.sql` is the DDL the platform
team will deploy, and `requirements.md` records what the owner told us. The
deliverable is an ODCS v3 contract at `contracts/orders_export.odcs.yaml`.

## Rules

- Do not invent business facts. `requirements.md` is the record; where it says
  `TODO`, the contract says `TODO` and the summary names it for the owner.
- The contract must pass `datacontract lint --all-errors`.
- Keep `schema.sql` and `requirements.md` unchanged; they are the input.

## Check

Run from this directory (the tree root):

    python3 check.py

Exit 0 means the tree is still uncommoditised (no contract staged), which is the
case's starting state. After a contract exists, point the same check at it:

    python3 check.py contracts/orders_export.odcs.yaml

The check runs `datacontract lint --all-errors` and exits with its status, so a
valid contract passes and an invalid one fails with the CLI's errors.

Requirements: `python3` (standard library only) and `datacontract` 1.2.9. No
network, no live database, no credential.
