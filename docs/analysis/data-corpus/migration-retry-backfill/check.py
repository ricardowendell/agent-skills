#!/usr/bin/env python3
"""Oracle for migration-retry-backfill.

Run from the repository root:

    python3 docs/analysis/data-corpus/migration-retry-backfill/check.py
    FIXTURE_STATE=corrected \
      python3 docs/analysis/data-corpus/migration-retry-backfill/check.py

Exit 0 = the contract holds. Exit 1 = at least one finding, one line each.
The simulation is deterministic: an initial load, a retry of the same batch, and
a backfill that overlaps the first two events. No network and no fixture file is
written; the database is in memory.
"""

import sys

# Importing the sibling pipeline must not leave __pycache__ in the fixture tree:
# the tree is a frozen instrument and its hash is public evidence.
sys.dont_write_bytecode = True

import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import pipeline


def latest_rows(batches):
    """The contract asks for one row per event, latest delivery winning."""
    by_id = {}
    for batch in batches:
        for event_id, customer_id, amount_cents in batch:
            by_id[event_id] = (event_id, customer_id, amount_cents)
    return [by_id[event_id] for event_id in sorted(by_id)]


def main():
    fixture_state = pipeline.state()
    findings = []

    con = pipeline.connect(fixture_state=fixture_state)
    try:
        pipeline.load(con, pipeline.BATCH, "2026-11-02", fixture_state=fixture_state)
        after_first = pipeline.snapshot(con)

        # A retry re-delivers exactly the same batch.
        pipeline.load(con, pipeline.BATCH, "2026-11-03", fixture_state=fixture_state)
        after_retry = pipeline.snapshot(con)

        # A backfill re-sends the first two events and adds two more.
        pipeline.load(con, pipeline.BACKFILL, "2026-11-04", fixture_state=fixture_state)
        after_backfill = pipeline.snapshot(con)
    finally:
        con.close()

    expected_after_backfill = latest_rows([pipeline.BATCH, pipeline.BACKFILL])

    # 1. The retry is idempotent in row count.
    if len(after_retry) != len(after_first):
        findings.append(
            "retry must be idempotent: row count moved from "
            f"{len(after_first)} to {len(after_retry)} after re-delivering the same batch"
        )

    # 2. The retry is idempotent in content.
    if pipeline.content_hash(after_retry) != pipeline.content_hash(after_first):
        findings.append(
            "retry changed the content hash: "
            f"{pipeline.content_hash(after_first)} -> {pipeline.content_hash(after_retry)}"
        )

    # 3. The overlapping backfill leaves one row per natural key.
    if after_backfill != expected_after_backfill:
        findings.append(
            "backfill is not idempotent: "
            f"{len(after_backfill)} rows for {len(expected_after_backfill)} distinct event_id"
        )

    # 4. The natural key is unique in the final table.
    event_ids = [row[0] for row in after_backfill]
    if len(event_ids) != len(set(event_ids)):
        duplicated = sorted(
            {event_id for event_id in event_ids if event_ids.count(event_id) > 1}
        )
        findings.append(
            f"event_id is not unique after the backfill: {', '.join(duplicated)}"
        )

    if findings:
        for finding in findings:
            print(f"FAIL migration-retry-backfill: {finding}")
        return 1

    print(
        "PASS migration-retry-backfill: "
        f"{len(after_backfill)} rows, hash {pipeline.content_hash(after_backfill)[:16]}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
