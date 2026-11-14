"""Sliced migration for `subscriptions_legacy` through `plan_map`.

This tree is a **negative**: the mapping key is unique and the cutover takes the
backup before any delete, so the sequence that `check.py` runs leaves one
`subscriptions_v2` row per migrated subscription and the rollback restores the
full legacy table. The oracle must report zero findings; anything else is a
manufactured defect.

`check.py` is the oracle and owns the migration sequence. Nothing in this module
writes to the fixture tree: the database is in memory.
"""

import sqlite3

# subscription_id, legacy_plan_id, amount_cents, started_on. The last
# subscription arrives after the two slices and stays behind for the cutover.
SUBSCRIPTIONS = [
    ("SUB-2001", "P-10", 2900, "2026-10-01"),
    ("SUB-2002", "P-20", 4900, "2026-10-02"),
    ("SUB-2003", "P-10", 1900, "2026-10-03"),
    ("SUB-2004", "P-30", 9900, "2026-10-04"),
    ("SUB-2005", "P-20", 3900, "2026-10-05"),
    ("SUB-2006", "P-30", 7900, "2026-10-06"),
    ("SUB-2007", "P-30", 8900, "2026-10-08"),
]

# legacy_plan_id, plan_ref, tier, mapped_on.
PLANS = [
    ("P-10", "plan-core", "basic", "2026-09-30"),
    ("P-20", "plan-pro", "pro", "2026-09-30"),
    ("P-30", "plan-scale", "scale", "2026-09-30"),
]

# The mapping load is retried with a later `mapped_on`; the unique key plus
# upsert keeps one row per legacy plan.
PLAN_RETRY = [
    ("P-20", "plan-pro", "pro", "2026-10-02"),
]

# Two date slices, both closed before the late subscription of 2026-10-08.
SLICES = [
    ("2026-10-01", "2026-10-04"),
    ("2026-10-05", "2026-10-06"),
]

SCHEMA = """
CREATE TABLE subscriptions_legacy (
  subscription_id  TEXT    NOT NULL,
  legacy_plan_id   TEXT    NOT NULL,
  amount_cents     INTEGER NOT NULL,
  started_on       TEXT    NOT NULL
);

CREATE TABLE plan_map (
  legacy_plan_id TEXT    NOT NULL PRIMARY KEY,
  plan_ref       TEXT    NOT NULL,
  tier           TEXT    NOT NULL,
  mapped_on      TEXT    NOT NULL
);

CREATE TABLE subscriptions_v2 (
  subscription_id TEXT    NOT NULL,
  plan_ref        TEXT    NOT NULL,
  tier            TEXT    NOT NULL,
  amount_cents    INTEGER NOT NULL,
  started_on      TEXT    NOT NULL
);
"""

LEGACY_COLUMNS = "subscription_id, legacy_plan_id, amount_cents, started_on"
PLAN_COLUMNS = "legacy_plan_id, plan_ref, tier, mapped_on"


def connect():
    """Open an empty in-memory database with the natural-key schema."""
    con = sqlite3.connect(":memory:")
    con.executescript(SCHEMA)
    return con


def load_legacy(con, rows):
    """Load the legacy table once."""
    con.executemany(
        f"INSERT INTO subscriptions_legacy ({LEGACY_COLUMNS}) VALUES (?, ?, ?, ?)",
        rows,
    )
    con.commit()


def load_plans(con, rows):
    """Deliver one plan chunk; a retry simply calls this again."""
    con.executemany(
        f"INSERT INTO plan_map ({PLAN_COLUMNS}) VALUES (?, ?, ?, ?)"
        " ON CONFLICT (legacy_plan_id) DO UPDATE SET"
        " plan_ref = excluded.plan_ref,"
        " tier = excluded.tier,"
        " mapped_on = excluded.mapped_on"
        " WHERE excluded.mapped_on >= plan_map.mapped_on",
        rows,
    )
    con.commit()


def migrate_slice(con, start_on, end_on):
    """Migrate the subscriptions started inside one date slice."""
    con.execute(
        "INSERT INTO subscriptions_v2"
        " (subscription_id, plan_ref, tier, amount_cents, started_on)"
        " SELECT s.subscription_id, m.plan_ref, m.tier, s.amount_cents, s.started_on"
        " FROM subscriptions_legacy AS s"
        " JOIN plan_map AS m ON m.legacy_plan_id = s.legacy_plan_id"
        " WHERE s.started_on BETWEEN ? AND ?"
        " ORDER BY s.subscription_id",
        (start_on, end_on),
    )
    con.commit()


def cutover(con):
    """Freeze the slice migration: back up the legacy table before any delete."""
    con.execute(
        "CREATE TABLE subscriptions_legacy_backup AS SELECT * FROM subscriptions_legacy"
    )
    con.execute(
        "DELETE FROM subscriptions_legacy"
        " WHERE subscription_id IN (SELECT subscription_id FROM subscriptions_v2)"
    )
    con.commit()


def rollback(con):
    """Restore the legacy table from the cutover backup."""
    con.execute("DELETE FROM subscriptions_legacy")
    con.execute(
        "INSERT INTO subscriptions_legacy SELECT * FROM subscriptions_legacy_backup"
    )
    con.commit()


def legacy_snapshot(con):
    """The legacy rows in a stable order."""
    return con.execute(
        "SELECT subscription_id, legacy_plan_id, amount_cents, started_on"
        " FROM subscriptions_legacy ORDER BY subscription_id"
    ).fetchall()


def plan_snapshot(con):
    """The mapping rows in a stable order."""
    return con.execute(
        "SELECT legacy_plan_id, plan_ref, tier, mapped_on"
        " FROM plan_map ORDER BY legacy_plan_id"
    ).fetchall()


def subscriptions_v2_snapshot(con):
    """The migrated rows in a stable order."""
    return con.execute(
        "SELECT subscription_id, plan_ref, tier, amount_cents, started_on"
        " FROM subscriptions_v2 ORDER BY subscription_id, plan_ref"
    ).fetchall()


def duplicated_plan_ids(rows):
    """legacy_plan_id values with more than one mapping row, with their counts."""
    counts = {}
    for legacy_plan_id, _plan_ref, _tier, _mapped_on in rows:
        counts[legacy_plan_id] = counts.get(legacy_plan_id, 0) + 1
    return sorted(
        (legacy_plan_id, count) for legacy_plan_id, count in counts.items() if count > 1
    )
