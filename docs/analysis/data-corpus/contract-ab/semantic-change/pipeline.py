"""Builds `orders_export` with the same schema as the previous version.

The pipeline materialises the export under the new semantics. The table shape is
identical to `contract-v1.odcs.yaml`: same columns, names, types, requiredness.
Only the meaning of `amount_cents` moved, and that lives in the contract
descriptions, not in the schema.

`check.py` is a schema oracle: it reads `PRAGMA table_info` and the NULL counts,
so it passes here. A break that the schema cannot see is exactly what this
fixture is for. Nothing in this module writes to the fixture tree: the database
is in memory.
"""

import sqlite3

# The amount column now carries whole dollars, not cents.
SOURCE = [
    (1001, "C-100", 12, "2026-11-02"),
    (1002, "C-200", 35, "2026-11-02"),
    (1003, "C-100", 8, "2026-11-03"),
    (1004, "C-300", 99, "2026-11-04"),
]


def build(con):
    """Materialise the export with the unchanged schema."""
    con.execute(
        """
        CREATE TABLE orders_export (
          order_id     INTEGER NOT NULL,
          customer_id  TEXT    NOT NULL,
          amount_cents INTEGER NOT NULL,
          placed_on    TEXT    NOT NULL
        )
        """
    )
    con.executemany(
        "INSERT INTO orders_export (order_id, customer_id, amount_cents, placed_on)"
        " VALUES (?, ?, ?, ?)",
        SOURCE,
    )
    con.commit()
