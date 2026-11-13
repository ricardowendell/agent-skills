#!/usr/bin/env python3
"""Schema oracle for the semantic-change fixture.

Run from this directory (the tree root):

    python3 check.py

The contract is the ```contract block in this tree's AGENTS.md: the required
columns, their types and their nullability. The two ODCS versions declare the
same schema, so this check passes on both: the break is in the property
descriptions, and a schema oracle cannot see it.

Exit 0 = the schema holds. Exit 1 = at least one finding, one line each.
No network and no fixture file is written; the database is in memory.
"""

import sys

sys.dont_write_bytecode = True

import argparse
import pathlib
import re
import sqlite3

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import pipeline

HERE = pathlib.Path(__file__).resolve().parent
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


def main(argv):
    parser = argparse.ArgumentParser(description="Schema oracle for semantic-change.")
    parser.add_argument(
        "--contract",
        default=str(HERE / "AGENTS.md"),
        help="path to the contract document (default: this tree's AGENTS.md)",
    )
    args = parser.parse_args(argv)

    contract = parse_contract(args.contract)
    con = sqlite3.connect(":memory:")
    try:
        pipeline.build(con)
        findings = check(con, contract)
    finally:
        con.close()

    if findings:
        for finding in findings:
            print(f"FAIL semantic-change: {finding}")
        return 1

    print(
        "PASS semantic-change: "
        f"table {contract['table']} matches {len(contract['required'])} required column(s); "
        "schema unchanged between contract versions"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
