"""Incremental load for `daily_events`.

The fixture state comes from `FIXTURE_STATE`:

- `staged` (default) inserts every delivered row and the table has no natural
  key, so a retry or a backfill re-runs the batch and appends it again.
- `corrected` creates the natural-key unique index and upserts, so a re-run is
  idempotent.

`check.py` is the oracle and owns the retry/backfill simulation. Nothing in this
module writes to the fixture tree: the database is in memory.
"""

import hashlib
import os
import sqlite3

BATCH = [
    ("evt-1001", "C-100", 1200),
    ("evt-1002", "C-200", 3500),
    ("evt-1003", "C-100", 800),
    ("evt-1004", "C-300", 9900),
]

# A backfill two days later re-sends the first two events and adds two; the
# overlap is what makes a plain INSERT duplicate data.
BACKFILL = BATCH[:2] + [
    ("evt-1005", "C-200", 1500),
    ("evt-1006", "C-300", 2750),
]

SCHEMA = """
CREATE TABLE daily_events (
  event_id     TEXT    NOT NULL,
  customer_id  TEXT    NOT NULL,
  amount_cents INTEGER NOT NULL,
  loaded_on    TEXT    NOT NULL
)
"""

COLUMNS = "event_id, customer_id, amount_cents, loaded_on"


def state():
    """The fixture state, never a model decision."""
    return os.environ.get("FIXTURE_STATE", "staged")


def connect(fixture_state=None):
    """Open an empty in-memory database with the fixture schema."""
    state_name = fixture_state or state()
    con = sqlite3.connect(":memory:")
    con.executescript(SCHEMA)
    if state_name == "corrected":
        con.execute(
            "CREATE UNIQUE INDEX daily_events_natural_key ON daily_events (event_id)"
        )
    elif state_name != "staged":
        raise ValueError(f"unknown FIXTURE_STATE: {state_name!r}")
    return con


def load(con, rows, loaded_on, fixture_state=None):
    """Deliver one batch. Callers may call this again: that is the retry."""
    state_name = fixture_state or state()
    values = [
        (event_id, customer_id, amount, loaded_on)
        for event_id, customer_id, amount in rows
    ]

    if state_name == "corrected":
        con.executemany(
            f"INSERT INTO daily_events ({COLUMNS}) VALUES (?, ?, ?, ?)"
            " ON CONFLICT (event_id) DO UPDATE SET"
            " customer_id = excluded.customer_id,"
            " amount_cents = excluded.amount_cents,"
            " loaded_on = excluded.loaded_on",
            values,
        )
    else:
        con.executemany(
            f"INSERT INTO daily_events ({COLUMNS}) VALUES (?, ?, ?, ?)",
            values,
        )
    con.commit()


def snapshot(con):
    """The business columns in a stable order; load metadata is excluded."""
    return con.execute(
        "SELECT event_id, customer_id, amount_cents FROM daily_events ORDER BY event_id"
    ).fetchall()


def content_hash(rows):
    """Deterministic hash of the business content, not of the load timestamp."""
    payload = "\n".join(
        f"{event_id}|{customer_id}|{amount}" for event_id, customer_id, amount in rows
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
