"""Builds `orders_export` with one additive, nullable column.

The producer adds `channel TEXT` to the export. The contract in `AGENTS.md`
documents that column as an allowed additive change, so it is not drift. The same
column left undocumented is drift, and `check.py --contract` can be pointed at a
contract that omits it to prove the difference.

`check.py` reads the contract and inspects the built schema. Nothing in this
module writes to the fixture tree: the database is in memory.
"""

import sqlite3

SOURCE = [
    (1001, "C-100", 1200, "2026-11-02", "web"),
    (1002, "C-200", 3500, "2026-11-02", "store"),
    (1003, "C-100", 800, "2026-11-03", None),
    (1004, "C-300", 9900, "2026-11-04", "partner"),
]


def build(con):
    """Materialise the export: required columns plus the additive `channel`."""
    con.execute(
        """
        CREATE TABLE orders_export (
          order_id     INTEGER NOT NULL,
          customer_id  TEXT    NOT NULL,
          amount_cents INTEGER NOT NULL,
          placed_on    TEXT    NOT NULL,
          channel      TEXT
        )
        """
    )
    con.executemany(
        "INSERT INTO orders_export (order_id, customer_id, amount_cents, placed_on, channel)"
        " VALUES (?, ?, ?, ?, ?)",
        SOURCE,
    )
    con.commit()
