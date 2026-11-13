#!/usr/bin/env python3
"""Deterministic oracle for the composition fixture.

Run from this directory (the tree root) with no argument to prove the starting state:

    python3 check.py

Exit 0 means no contract is staged yet — the case asks the candidate to create
one. That is the only state this fixture ships.

After a draw, point the same check at the contract it created:

    python3 check.py contracts/orders_export.odcs.yaml

The check runs `datacontract lint --all-errors` and exits with its status, so a
valid contract passes and an invalid one fails with the CLI's own errors. No
network, no credential, no live database.
"""

import sys

sys.dont_write_bytecode = True

import argparse
import pathlib
import shutil
import subprocess

HERE = pathlib.Path(__file__).resolve().parent


def find_contracts(root):
    return sorted(
        path
        for path in root.rglob("*")
        if path.is_file()
        and (path.name.endswith(".odcs.yaml") or path.name == "datacontract.yaml")
    )


def main(argv):
    parser = argparse.ArgumentParser(description="Oracle for the composition fixture.")
    parser.add_argument(
        "contract",
        nargs="?",
        default=None,
        help="contract file to lint (default: prove none is staged)",
    )
    args = parser.parse_args(argv)

    cli = shutil.which("datacontract")
    if cli is None:
        print("FAIL composition: datacontract is not on PATH", file=sys.stderr)
        return 2

    if args.contract is None:
        found = find_contracts(HERE)
        if found:
            for path in found:
                print(
                    f"FAIL composition: contract already staged at "
                    f"{path.relative_to(HERE)}; this fixture ships none"
                )
            return 1
        print(
            "PASS composition: no contract staged; schema.sql and requirements.md "
            "are the input and the case asks for the ODCS"
        )
        return 0

    contract = pathlib.Path(args.contract)
    if not contract.is_file():
        print(f"FAIL composition: no such contract {contract}", file=sys.stderr)
        return 2

    result = subprocess.run([cli, "lint", "--all-errors", str(contract)])
    if result.returncode != 0:
        print(f"FAIL composition: {contract} does not pass datacontract lint")
        return result.returncode
    print(f"PASS composition: {contract} passes datacontract lint")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
