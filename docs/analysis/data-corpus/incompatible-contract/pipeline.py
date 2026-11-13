"""Builds `orders_export` for a downstream consumer.

The fixture state comes from `FIXTURE_STATE`:

- `staged` (default) ships the defect: the producer renames `customer_id` to
  `customer_ref`, so a consumer that reads the documented column breaks.
- `corrected` keeps the documented required column.

`check.py` reads the contract from `AGENTS.md` and inspects the built schema.
Nothing in this module writes to the fixture tree: the database is in memory.
"""

import os
import sqlite3

SOURCE = [
    (1001, "C-100", 1200, "2026-11-02"),
    (1002, "C-200", 3500, "2026-11-02"),
    (1003, "C-100", 800, "2026-11-03"),
    (1004, "C-300", 9900, "2026-11-04"),
]


def state():
    """The fixture state, never a model decision."""
    return os.environ.get("FIXTURE_STATE", "staged")


def build(con, fixture_state=None):
    """Materialise the export with the state's column names."""
    state_name = fixture_state or state()
    if state_name == "corrected":
        export_column = "customer_id"
    elif state_name == "staged":
        export_column = "customer_ref"
    else:
        raise ValueError(f"unknown FIXTURE_STATE: {state_name!r}")

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
        f"""
        CREATE TABLE orders_export (
          order_id     INTEGER NOT NULL,
          {export_column} TEXT NOT NULL,
          amount_cents INTEGER NOT NULL,
          placed_on    TEXT    NOT NULL
        )
        """
    )
    con.execute(
        f"INSERT INTO orders_export (order_id, {export_column}, amount_cents, placed_on)"
        " SELECT order_id, customer_id, amount_cents, placed_on FROM source_orders"
    )
    con.commit()
