#!/usr/bin/env python3
"""Oracle for negative-safe-retry.

Run from the repository root:

    python3 docs/analysis/data-corpus/negative-safe-retry/check.py

This is a **negative** tree: the retry is already idempotent. The check simulates
an initial load, a retry of the same batch, and a backfill that overlaps the
first two shipments. The expected result is exit 0 with no finding lines; a
finding means the oracle manufactures a defect.

No network and no fixture file is written; the database is in memory.
"""

import sys

# Importing the sibling pipeline must not leave __pycache__ in the fixture tree:
# the tree is a frozen instrument.
sys.dont_write_bytecode = True

import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import pipeline


def latest_rows(batches):
    """One row per shipment, the latest delivery winning."""
    by_id = {}
    for batch in batches:
        for shipment_id, carrier, weight_grams, dispatched_on in batch:
            by_id[shipment_id] = (shipment_id, carrier, weight_grams, dispatched_on)
    return [by_id[shipment_id] for shipment_id in sorted(by_id)]


def main():
    findings = []

    con = pipeline.connect()
    try:
        pipeline.load(con, pipeline.SHIPMENTS)
        after_first = pipeline.snapshot(con)

        # A retry re-delivers exactly the same batch.
        pipeline.load(con, pipeline.SHIPMENTS)
        after_retry = pipeline.snapshot(con)

        # A backfill re-sends the first two shipments and adds two more.
        pipeline.load(con, pipeline.BACKFILL)
        after_backfill = pipeline.snapshot(con)
    finally:
        con.close()

    expected_after_backfill = [
        (shipment_id, carrier, weight_grams)
        for shipment_id, carrier, weight_grams, _ in latest_rows(
            [pipeline.SHIPMENTS, pipeline.BACKFILL]
        )
    ]

    if len(after_retry) != len(after_first):
        findings.append(
            f"retry changed the row count: {len(after_first)} -> {len(after_retry)}"
        )
    if pipeline.content_hash(after_retry) != pipeline.content_hash(after_first):
        findings.append("retry changed the content hash")
    if after_backfill != expected_after_backfill:
        findings.append(
            "backfill did not leave one row per shipment: "
            f"{len(after_backfill)} rows for {len(expected_after_backfill)} shipments"
        )

    if findings:
        for finding in findings:
            print(f"FAIL negative-safe-retry: {finding}")
        return 1

    print(
        "PASS negative-safe-retry: "
        f"{len(after_backfill)} rows, hash {pipeline.content_hash(after_backfill)[:16]}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
