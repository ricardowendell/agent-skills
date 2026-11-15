"""Sliced migration for `orders_legacy` through `customer_map`.

The fixture state comes from `FIXTURE_STATE`:

- `staged` (default) has no unique key on `customer_map.legacy_id`, so a replayed
  mapping chunk leaves `C-200` with two rows and the slice join fans its orders
  into two `orders_v2` rows. The cutover also copies the legacy table *after*
  deleting the migrated rows, so the backup is already incomplete.
- `corrected` creates the mapping unique key, upserts by the latest `mapped_on`
  and takes the backup before any delete.
- `mapping-fixed` and `cutover-fixed` fix one fault only; they exist so the
  oracle can be proved independent (each mixed state must stay red on the other
  fault).

`check.py` is the oracle and owns the migration sequence. Nothing in this module
writes to the fixture tree: the database is in memory.
"""

import os
import sqlite3

# `orders_legacy` rows: order_id, legacy_customer_id, amount_cents, placed_on.
# The last order arrives after the two slices and stays behind for the cutover.
ORDERS = [
    ("ORD-1001", "C-100", 1200, "2026-10-01"),
    ("ORD-1002", "C-200", 3500, "2026-10-02"),
    ("ORD-1003", "C-100", 800, "2026-10-03"),
    ("ORD-1004", "C-300", 9900, "2026-10-04"),
    ("ORD-1005", "C-200", 1500, "2026-10-05"),
    ("ORD-1006", "C-300", 2750, "2026-10-06"),
    ("ORD-1007", "C-300", 4200, "2026-10-08"),
]

# legacy_id, customer_ref, region, mapped_on.
MAPPING = [
    ("C-100", "ref-100", "EU", "2026-10-07"),
    ("C-200", "ref-200", "EU", "2026-10-07"),
    ("C-300", "ref-300", "US", "2026-10-07"),
]

# The mapping load is retried: the chunk holding `C-200` is delivered again with
# a later `mapped_on`. A unique key plus upsert keeps one row; a plain insert
# duplicates `C-200` and fans out its orders.
MAPPING_RETRY = [
    ("C-200", "ref-200", "EU", "2026-10-09"),
]

# Two date slices, both closed before the late order of 2026-10-08.
SLICES = [
    ("2026-10-01", "2026-10-04"),
    ("2026-10-05", "2026-10-06"),
]

SCHEMA = """
CREATE TABLE orders_legacy (
  order_id       TEXT    NOT NULL,
  legacy_customer_id TEXT NOT NULL,
  amount_cents   INTEGER NOT NULL,
  placed_on      TEXT    NOT NULL
);

CREATE TABLE customer_map (
  legacy_id   TEXT NOT NULL,
  customer_ref TEXT NOT NULL,
  region      TEXT NOT NULL,
  mapped_on   TEXT NOT NULL
);

CREATE TABLE orders_v2 (
  order_id     TEXT    NOT NULL,
  customer_ref TEXT    NOT NULL,
  amount_cents INTEGER NOT NULL,
  placed_on    TEXT    NOT NULL
);
"""

LEGACY_COLUMNS = "order_id, legacy_customer_id, amount_cents, placed_on"
MAPPING_COLUMNS = "legacy_id, customer_ref, region, mapped_on"


def state():
    """The fixture state, never a model decision."""
    return os.environ.get("FIXTURE_STATE", "staged")


def fixes(fixture_state=None):
    """(mapping fixed, cutover fixed) for the requested fixture state."""
    state_name = fixture_state or state()
    if state_name == "staged":
        return False, False
    if state_name == "corrected":
        return True, True
    if state_name == "mapping-fixed":
        return True, False
    if state_name == "cutover-fixed":
        return False, True
    raise ValueError(f"unknown FIXTURE_STATE: {state_name!r}")


def connect(fixture_state=None):
    """Open an empty in-memory database with the fixture schema."""
    mapping_fixed, _ = fixes(fixture_state)
    con = sqlite3.connect(":memory:")
    con.executescript(SCHEMA)
    if mapping_fixed:
        con.execute(
            "CREATE UNIQUE INDEX customer_map_natural_key ON customer_map (legacy_id)"
        )
    return con


def load_legacy(con, rows):
    """Load the legacy table once."""
    con.executemany(
        f"INSERT INTO orders_legacy ({LEGACY_COLUMNS}) VALUES (?, ?, ?, ?)",
        rows,
    )
    con.commit()


def load_mapping(con, rows, fixture_state=None):
    """Deliver one mapping chunk. Callers may call this again: that is the retry."""
    mapping_fixed, _ = fixes(fixture_state)
    if mapping_fixed:
        con.executemany(
            f"INSERT INTO customer_map ({MAPPING_COLUMNS}) VALUES (?, ?, ?, ?)"
            " ON CONFLICT (legacy_id) DO UPDATE SET"
            " customer_ref = excluded.customer_ref,"
            " region = excluded.region,"
            " mapped_on = excluded.mapped_on"
            " WHERE excluded.mapped_on >= customer_map.mapped_on",
            rows,
        )
    else:
        con.executemany(
            f"INSERT INTO customer_map ({MAPPING_COLUMNS}) VALUES (?, ?, ?, ?)",
            rows,
        )
    con.commit()


def migrate_slice(con, start_on, end_on, fixture_state=None):
    """Migrate the orders placed inside one date slice through the mapping."""
    fixes(fixture_state)  # reject an unknown state before touching the database
    con.execute(
        "INSERT INTO orders_v2 (order_id, customer_ref, amount_cents, placed_on)"
        " SELECT o.order_id, m.customer_ref, o.amount_cents, o.placed_on"
        " FROM orders_legacy AS o"
        " JOIN customer_map AS m ON m.legacy_id = o.legacy_customer_id"
        " WHERE o.placed_on BETWEEN ? AND ?"
        " ORDER BY o.order_id",
        (start_on, end_on),
    )
    con.commit()


def cutover(con, fixture_state=None):
    """Freeze the slice migration: keep the legacy table for rollback."""
    _, cutover_fixed = fixes(fixture_state)
    if cutover_fixed:
        con.execute("CREATE TABLE orders_legacy_backup AS SELECT * FROM orders_legacy")
    con.execute(
        "DELETE FROM orders_legacy WHERE order_id IN (SELECT order_id FROM orders_v2)"
    )
    if not cutover_fixed:
        con.execute("CREATE TABLE orders_legacy_backup AS SELECT * FROM orders_legacy")
    con.commit()


def rollback(con):
    """Restore the legacy table from the cutover backup."""
    con.execute("DELETE FROM orders_legacy")
    con.execute("INSERT INTO orders_legacy SELECT * FROM orders_legacy_backup")
    con.commit()


def legacy_snapshot(con):
    """The legacy rows in a stable order."""
    return con.execute(
        "SELECT order_id, legacy_customer_id, amount_cents, placed_on"
        " FROM orders_legacy ORDER BY order_id"
    ).fetchall()


def mapping_snapshot(con):
    """The mapping rows in a stable order; the key is what the contract fixes."""
    return con.execute(
        "SELECT legacy_id, customer_ref, region, mapped_on"
        " FROM customer_map ORDER BY legacy_id, mapped_on"
    ).fetchall()


def orders_v2_snapshot(con):
    """The migrated rows in a stable order."""
    return con.execute(
        "SELECT order_id, customer_ref, amount_cents, placed_on"
        " FROM orders_v2 ORDER BY order_id, customer_ref"
    ).fetchall()


def duplicated_legacy_ids(rows):
    """legacy_id values with more than one mapping row, with their counts."""
    counts = {}
    for legacy_id, _customer_ref, _region, _mapped_on in rows:
        counts[legacy_id] = counts.get(legacy_id, 0) + 1
    return sorted(
        (legacy_id, count) for legacy_id, count in counts.items() if count > 1
    )
