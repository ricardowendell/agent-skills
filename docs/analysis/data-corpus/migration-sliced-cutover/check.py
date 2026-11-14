#!/usr/bin/env python3
"""Oracle for migration-sliced-cutover.

Run from the repository root:

    python3 docs/analysis/data-corpus/migration-sliced-cutover/check.py
    FIXTURE_STATE=corrected \
      python3 docs/analysis/data-corpus/migration-sliced-cutover/check.py

Exit 0 = the contract holds. Exit 1 = at least one finding, one line each. The
sequence is deterministic: load the legacy table, load the mapping, replay the
mapping chunk, migrate two date slices, cut over, roll back. No network and no
fixture file is written; the database is in memory.
"""

import sys

# Importing the sibling pipeline must not leave __pycache__ in the fixture tree:
# the tree is a frozen instrument and its hash is public evidence.
sys.dont_write_bytecode = True

import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import pipeline


def migrated_order_ids():
    """The legacy order ids covered by the two slices."""
    return sorted(
        order_id
        for order_id, _customer_id, _amount, placed_on in pipeline.ORDERS
        if any(start_on <= placed_on <= end_on for start_on, end_on in pipeline.SLICES)
    )


def main():
    fixture_state = pipeline.state()
    findings = []

    con = pipeline.connect(fixture_state=fixture_state)
    try:
        pipeline.load_legacy(con, pipeline.ORDERS)
        pipeline.load_mapping(con, pipeline.MAPPING, fixture_state=fixture_state)

        # The mapping load is retried; the retried chunk re-delivers C-200.
        pipeline.load_mapping(con, pipeline.MAPPING_RETRY, fixture_state=fixture_state)

        for start_on, end_on in pipeline.SLICES:
            pipeline.migrate_slice(con, start_on, end_on, fixture_state=fixture_state)

        mapping = pipeline.mapping_snapshot(con)
        orders_v2 = pipeline.orders_v2_snapshot(con)
        before_cutover = pipeline.legacy_snapshot(con)

        pipeline.cutover(con, fixture_state=fixture_state)
        pipeline.rollback(con)
        after_rollback = pipeline.legacy_snapshot(con)
    finally:
        con.close()

    migrated = migrated_order_ids()

    # 1. The mapping key is unique and the slice join does not fan out.
    duplicated = pipeline.duplicated_legacy_ids(mapping)
    if duplicated or len(orders_v2) != len(migrated):
        detail = (
            ", ".join(f"{legacy_id} x{count}" for legacy_id, count in duplicated)
            or "no duplicate legacy_id"
        )
        findings.append(
            f"customer_map is not unique on legacy_id: {detail}; the slice join"
            f" wrote {len(orders_v2)} orders_v2 rows for {len(migrated)} migrated"
            f" orders ({len(orders_v2) - len(migrated)} extra)"
        )

    # 2. The cutover is reversible: rollback restores the pre-cutover table.
    if after_rollback != before_cutover:
        findings.append(
            "rollback did not restore the pre-cutover legacy table:"
            f" {len(after_rollback)} of {len(before_cutover)} orders_legacy rows"
            " restored; the cutover copied the legacy table after deleting the"
            " migrated rows"
        )

    if findings:
        for finding in findings:
            print(f"FAIL migration-sliced-cutover: {finding}")
        return 1

    print(
        "PASS migration-sliced-cutover: "
        f"{len(orders_v2)} orders in orders_v2 from {len(mapping)} mapping rows;"
        f" rollback restored {len(after_rollback)} legacy rows"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
