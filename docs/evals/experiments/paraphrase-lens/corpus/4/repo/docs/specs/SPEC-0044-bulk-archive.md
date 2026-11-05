---
id: SPEC-0044
status: ready
---

# Bulk archive

## User outcome

An operator selects several orders and archives them in one action instead of one at a time.

## Scope

- Add an Archive action to the orders table.
- Archive the selected orders and keep their line items.

## Acceptance criteria

- AC-1 — selecting three orders and choosing Archive marks all three archived.
- AC-2 — an archived order is excluded from the default list and still appears under the Archived filter.
- AC-3 — an order already archived is skipped without an error.

## Non-goals

- Undo, bulk delete and scheduled archiving.
