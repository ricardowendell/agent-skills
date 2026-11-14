#!/usr/bin/env python3
"""Oracle for negative-safe-cutover.

Run from the repository root:

    python3 docs/analysis/data-corpus/negative-safe-cutover/check.py

This is a **negative** tree: the mapping key is unique and the cutover backs up
the legacy table before deleting. The check runs the same deterministic sequence
as the defect tree — legacy load, plan load, plan retry, two slices, cutover,
rollback. The expected result is exit 0 with no finding lines; a finding means
the oracle manufactures a defect.

No network and no fixture file is written; the database is in memory.
"""

import sys

# Importing the sibling pipeline must not leave __pycache__ in the fixture tree:
# the tree is a frozen instrument.
sys.dont_write_bytecode = True

import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import pipeline


def migrated_subscription_ids():
    """The legacy subscription ids covered by the two slices."""
    return sorted(
        subscription_id
        for subscription_id, _plan_id, _amount, started_on in pipeline.SUBSCRIPTIONS
        if any(start_on <= started_on <= end_on for start_on, end_on in pipeline.SLICES)
    )


def main():
    findings = []

    con = pipeline.connect()
    try:
        pipeline.load_legacy(con, pipeline.SUBSCRIPTIONS)
        pipeline.load_plans(con, pipeline.PLANS)

        # The plan load is retried with a later mapped_on.
        pipeline.load_plans(con, pipeline.PLAN_RETRY)

        for start_on, end_on in pipeline.SLICES:
            pipeline.migrate_slice(con, start_on, end_on)

        plans = pipeline.plan_snapshot(con)
        subscriptions_v2 = pipeline.subscriptions_v2_snapshot(con)
        before_cutover = pipeline.legacy_snapshot(con)

        pipeline.cutover(con)
        pipeline.rollback(con)
        after_rollback = pipeline.legacy_snapshot(con)
    finally:
        con.close()

    migrated = migrated_subscription_ids()

    if pipeline.duplicated_plan_ids(plans):
        findings.append(
            "plan_map is not unique on legacy_plan_id: "
            + ", ".join(
                f"{plan_id} x{count}"
                for plan_id, count in pipeline.duplicated_plan_ids(plans)
            )
        )
    if len(subscriptions_v2) != len(migrated):
        findings.append(
            "the slice join wrote "
            f"{len(subscriptions_v2)} subscriptions_v2 rows for {len(migrated)}"
            " migrated subscriptions"
        )
    if after_rollback != before_cutover:
        findings.append(
            "rollback did not restore the pre-cutover legacy table:"
            f" {len(after_rollback)} of {len(before_cutover)} subscriptions_legacy"
            " rows restored"
        )

    if findings:
        for finding in findings:
            print(f"FAIL negative-safe-cutover: {finding}")
        return 1

    print(
        "PASS negative-safe-cutover: "
        f"{len(subscriptions_v2)} subscriptions in subscriptions_v2 from"
        f" {len(plans)} plan rows; rollback restored {len(after_rollback)} legacy"
        " rows"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
