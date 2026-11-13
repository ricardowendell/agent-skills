"""Builds the staged `orders_export` for a downstream consumer.

This is the **staged-only** half of `../incompatible-contract/`: the producer
renames `customer_id` to `customer_ref`, so a consumer that reads the documented
column breaks. There is deliberately no `corrected` branch: the frozen original
keeps it, this copy does not, so a read-only measurement cannot read the answer.

`check.py` reads the consumer contract from `AGENTS.md` (or the producer contract
from an ODCS file) and inspects the built schema. Nothing in this module writes to
the fixture tree: the database is in memory.
"""

import sqlite3

SOURCE = [
    (1001, "C-100", 1200, "2026-11-02"),
    (1002, "C-200", 3500, "2026-11-02"),
    (1003, "C-100", 800, "2026-11-03"),
    (1004, "C-300", 9900, "2026-11-04"),
]


def build(con):
    """Materialise the staged export: `customer_id` is exported as `customer_ref`."""
    con.execute(
        """
        CREATE TABLE source_orders (
          order_id     INTEGER NOT NULL,
          customer_id  TEXT    NOT NULL,
          amount_cents INTEGER NOT NULL,
          placed_on    TEXT    NOT NULL
        )
        """
    )
    con.executemany(
        "INSERT INTO source_orders (order_id, customer_id, amount_cents, placed_on)"
        " VALUES (?, ?, ?, ?)",
        SOURCE,
    )
    con.execute(
        """
        CREATE TABLE orders_export (
          order_id     INTEGER NOT NULL,
          customer_ref TEXT    NOT NULL,
          amount_cents INTEGER NOT NULL,
          placed_on    TEXT    NOT NULL
        )
        """
    )
    con.execute(
        "INSERT INTO orders_export (order_id, customer_ref, amount_cents, placed_on)"
        " SELECT order_id, customer_id, amount_cents, placed_on FROM source_orders"
    )
    con.commit()
