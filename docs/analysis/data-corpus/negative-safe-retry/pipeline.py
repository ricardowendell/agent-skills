"""Incremental load for `shipments`: an already-idempotent retry.

This tree is a **negative**. The loader has a natural key and upserts, so the
retry and the overlapping backfill that `check.py` simulates leave one row per
shipment. The oracle must report zero findings; anything else is a manufactured
defect.

Nothing here writes to the fixture tree: the database is in memory.
"""

import hashlib
import sqlite3

SHIPMENTS = [
    ("shp-1001", "dhl", 1800, "2026-11-02"),
    ("shp-1002", "ups", 3200, "2026-11-02"),
    ("shp-1003", "dhl", 950, "2026-11-03"),
    ("shp-1004", "fedex", 4100, "2026-11-04"),
]

# The backfill re-sends the first two shipments and adds two more.
BACKFILL = SHIPMENTS[:2] + [
    ("shp-1005", "ups", 2700, "2026-11-04"),
    ("shp-1006", "dhl", 1500, "2026-11-05"),
]

SCHEMA = """
CREATE TABLE shipments (
  shipment_id  TEXT    NOT NULL PRIMARY KEY,
  carrier      TEXT    NOT NULL,
  weight_grams INTEGER NOT NULL,
  dispatched_on TEXT   NOT NULL
)
"""

COLUMNS = "shipment_id, carrier, weight_grams, dispatched_on"


def connect():
    """Open an empty in-memory database with the natural-key schema."""
    con = sqlite3.connect(":memory:")
    con.executescript(SCHEMA)
    return con


def load(con, rows):
    """Deliver one batch; a retry simply calls this again."""
    con.executemany(
        f"INSERT INTO shipments ({COLUMNS}) VALUES (?, ?, ?, ?)"
        " ON CONFLICT (shipment_id) DO UPDATE SET"
        " carrier = excluded.carrier,"
        " weight_grams = excluded.weight_grams,"
        " dispatched_on = excluded.dispatched_on",
        rows,
    )
    con.commit()


def snapshot(con):
    """The business columns in a stable order; dispatch metadata is excluded."""
    return con.execute(
        "SELECT shipment_id, carrier, weight_grams FROM shipments ORDER BY shipment_id"
    ).fetchall()


def content_hash(rows):
    """Deterministic hash of the business content, not of the dispatch date."""
    payload = "\n".join(
        f"{shipment_id}|{carrier}|{weight}" for shipment_id, carrier, weight in rows
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
