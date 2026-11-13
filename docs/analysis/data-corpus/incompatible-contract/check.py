#!/usr/bin/env python3
"""Oracle for incompatible-contract.

Run from the repository root:

    python3 docs/analysis/data-corpus/incompatible-contract/check.py
    FIXTURE_STATE=corrected \
      python3 docs/analysis/data-corpus/incompatible-contract/check.py

The contract is the ```contract block in this tree's AGENTS.md: the required
columns, their types and their nullability. The check reads the built schema, not
the sample rows, so a producer that renames or drops a required column fails even
when its SQL runs.

Exit 0 = the contract holds. Exit 1 = at least one finding, one line each.
No network and no fixture file is written; the database is in memory.
"""

import sys

sys.dont_write_bytecode = True

import pathlib
import re
import sqlite3

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import pipeline

HERE = pathlib.Path(__file__).resolve().parent
CONTRACT_FILE = HERE / "AGENTS.md"
CONTRACT_BLOCK = re.compile(
    r"^```contract[ \t]*\r?\n(.*?)^```[ \t]*$", re.MULTILINE | re.DOTALL
)


def parse_contract(path):
    """Read the machine-readable contract block: table, required, additive."""
    text = pathlib.Path(path).read_text(encoding="utf-8")
    match = CONTRACT_BLOCK.search(text)
    if not match:
        raise ValueError(f"no ```contract block in {path}")

    contract = {"table": None, "required": [], "allowed_additive": []}
    for raw in match.group(1).splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        if key == "table":
            contract["table"] = value
            continue
        if key not in ("required", "allowed_additive"):
            continue
        parts = value.split()
        if len(parts) < 2:
            raise ValueError(f"contract line has no type: {line!r}")
        contract[key].append(
            {
                "name": parts[0],
                "type": parts[1].upper(),
                "notnull": "NOT NULL" in value.upper(),
            }
        )

    if not contract["table"]:
        raise ValueError(f"contract block in {path} has no table")
    return contract


def schema(con, table):
    rows = con.execute(f"PRAGMA table_info({table})").fetchall()
    return {
        row[1]: {"type": (row[2] or "").upper(), "notnull": bool(row[3])}
        for row in rows
    }


def check(con, contract):
    table = contract["table"]
    findings = []
    columns = schema(con, table)
    if not columns:
        return [f"table {table} does not exist; the producer removed the export"]

    required = {column["name"]: column for column in contract["required"]}
    allowed = {column["name"] for column in contract["allowed_additive"]}

    for name, expected in required.items():
        actual = columns.get(name)
        if actual is None:
            findings.append(
                f"required column {name} is missing; the producer renamed or dropped it"
            )
            continue
        if actual["type"] != expected["type"]:
            findings.append(
                f"required column {name} changed type: {expected['type']} -> {actual['type']}"
            )
        if expected["notnull"] and not actual["notnull"]:
            findings.append(f"required column {name} became nullable")

    for name in columns:
        if name not in required and name not in allowed:
            findings.append(f"column {name} is not declared by the contract")

    for name, expected in required.items():
        if not expected["notnull"] or name not in columns:
            continue
        nulls = con.execute(
            f"SELECT count(*) FROM {table} WHERE {name} IS NULL"
        ).fetchone()[0]
        if nulls:
            findings.append(f"required column {name} has {nulls} NULL value(s)")

    return findings


def main():
    fixture_state = pipeline.state()
    contract = parse_contract(CONTRACT_FILE)
    con = sqlite3.connect(":memory:")
    try:
        pipeline.build(con, fixture_state=fixture_state)
        findings = check(con, contract)
    finally:
        con.close()

    if findings:
        for finding in findings:
            print(f"FAIL incompatible-contract: {finding}")
        return 1

    print(
        "PASS incompatible-contract: "
        f"table {contract['table']} matches {len(contract['required'])} required column(s)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
