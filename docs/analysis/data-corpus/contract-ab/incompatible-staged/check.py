#!/usr/bin/env python3
"""Oracle for the staged-only incompatible-contract copy.

Run from this directory (the tree root):

    python3 check.py
    python3 check.py --producer-contract contract-v2.odcs.yaml

The consumer contract is the ```contract block in this tree's AGENTS.md: the
required columns, their types and their nullability. `--producer-contract` reads
the same shape from an ODCS v3 YAML file instead, which is how the producer's new
contract is proved to match the staged schema.

The check reads the built schema, not the sample rows, so a producer that renames
or drops a required column fails even when its SQL runs.

Exit 0 = the contract holds. Exit 1 = at least one finding, one line each.
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
CONTRACT_FILE = HERE / "AGENTS.md"
CONTRACT_BLOCK = re.compile(
    r"^```contract[ \t]*\r?\n(.*?)^```[ \t]*$", re.MULTILINE | re.DOTALL
)

# ODCS logicalType -> the SQLite affinity the staged export uses.
SQL_TYPES = {
    "integer": "INTEGER",
    "number": "REAL",
    "string": "TEXT",
    "date": "TEXT",
    "timestamp": "TEXT",
    "time": "TEXT",
    "boolean": "INTEGER",
}


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


def parse_odcs(path):
    """Read the first schema of an ODCS v3 file into the same contract shape.

    Only the attributes this fixture needs are read: the schema `name`, each
    property's `name`, `logicalType` and `required`. Anything else is ignored;
    `datacontract lint` is the validator for the rest.
    """
    contract = {"table": None, "required": [], "allowed_additive": []}
    current = None
    in_properties = False
    properties_indent = None
    for raw in pathlib.Path(path).read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = len(line) - len(line.lstrip())
        if stripped.startswith("properties:"):
            in_properties = True
            properties_indent = indent
            continue
        if not in_properties:
            if stripped.startswith("- name:") and contract["table"] is None:
                contract["table"] = stripped.split(":", 1)[1].strip()
            continue
        if indent <= properties_indent and not stripped.startswith("- name:"):
            in_properties = False
            continue
        if stripped.startswith("- name:"):
            current = {
                "name": stripped.split(":", 1)[1].strip(),
                "type": None,
                "notnull": False,
            }
            contract["required"].append(current)
            continue
        if current is None:
            continue
        if stripped.startswith("logicalType:"):
            logical = stripped.split(":", 1)[1].strip()
            current["type"] = SQL_TYPES.get(logical, logical.upper())
        elif stripped.startswith("required:"):
            current["notnull"] = stripped.split(":", 1)[1].strip().lower() == "true"

    if not contract["table"]:
        raise ValueError(f"no schema table in {path}")
    if not contract["required"]:
        raise ValueError(f"no properties in the first schema of {path}")
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
    parser = argparse.ArgumentParser(
        description="Oracle for the staged-only incompatible-contract copy."
    )
    parser.add_argument(
        "--contract",
        default=str(CONTRACT_FILE),
        help="markdown file with the consumer ```contract block (default: AGENTS.md)",
    )
    parser.add_argument(
        "--producer-contract",
        default=None,
        help="ODCS v3 YAML file to read the contract from instead",
    )
    args = parser.parse_args(argv)

    if args.producer_contract:
        contract = parse_odcs(args.producer_contract)
    else:
        contract = parse_contract(args.contract)

    con = sqlite3.connect(":memory:")
    try:
        pipeline.build(con)
        findings = check(con, contract)
    finally:
        con.close()

    if findings:
        for finding in findings:
            print(f"FAIL incompatible-staged: {finding}")
        return 1

    print(
        "PASS incompatible-staged: "
        f"table {contract['table']} matches {len(contract['required'])} required column(s)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
