#!/usr/bin/env python3
"""Deterministic Python quality scan for python-luminary.

This is a hint generator, not a linter and not a verdict. Each finding is a
place worth a human look, with the rule that made it interesting. A linter with
real type information (ruff, mypy, pyright) outranks it whenever the project
already has one; run that first and read this second.

Every check is deliberately conservative: it reports the shape it can prove from
the syntax tree and says what it could not see. False positives are expected and
cheap; a silent miss is not, which is why each rule states its own blind spot.

Usage:
    python3 analyze.py PATH [PATH...] [--json] [--quiet] [--tools|--no-tools]

With --tools (the default when the flag is absent), the scan also shells out to
the tools the project already trusts, preferring the project's own environment:

    ruff check  --select B,F,SIM,RET,PIE,PERF,C4,PLW,PLR  (syntax, bugs, idiom)
    ty check / mypy --strict                              (types)
    vulture --min-confidence 80                           (dead code)

A tool that is not installed is tried through `uvx` before being reported
unavailable, so an ephemeral run costs a download rather than an install. Every
tool runs with the target's project root as its working directory, so it reads
that project's `pyproject.toml` and resolves imports against that project's
environment instead of this script's.

The scan also summarizes the shape the line-by-line rules cannot see: per-module
size and effect sites, the internal import graph with its fan-in and fan-out, any
import cycle, and the module-to-layer mapping when the project declares one with
importlinter. That is the raw material for the Map phase, not a verdict on it.

The rules and the shape summary live in the `scan` package beside this file; this
module is the CLI over them.

Exit status is always 0: this is analysis, not a gate.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Running `python3 analyze.py` puts this file's directory on sys.path, so the
# package beside it resolves. Importing this file as a module instead does not,
# and the scan would die on an ImportError rather than on a finding.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from scan import (  # noqa: E402 - after the path fix above
    analyze_file,
    architecture_summary,
    external_findings,
    finding,
    iter_py_files,
    print_architecture,
    project_root_for,
)

USAGE = "usage: analyze.py PATH [PATH...] [--json] [--quiet] [--tools|--no-tools]"


def collect(args):
    """Files to scan and the findings raised before any file is opened."""
    findings, files = [], []
    for raw in args:
        root = Path(raw)
        if not root.exists():
            findings.append(
                finding(
                    root,
                    0,
                    "missing-path",
                    "path does not exist",
                    "Point the scan at a file or directory.",
                )
            )
            continue
        for f in iter_py_files(root):
            files.append(f)
            findings.extend(analyze_file(f))
    findings.sort(key=lambda f: (f["file"], f["line"]))
    return findings, files


def render_tools(tools):
    """Print one line per tool, always saying what ran and what it found.

    A tool that ran and was clean is stated, not omitted: a silent section reads
    as "not run" and hides that dead code, types or idiom were actually checked.
    """
    for t in tools:
        if t["status"] == "unavailable":
            print(f"[{t['tool']}] unavailable: {t['reason']}")
        elif t["status"] == "clean":
            print(f"[{t['tool']}] clean: {t.get('command', '')}")
        else:
            print(f"[{t['tool']}] {t['status']}: {t.get('command', '')}")
            if t.get("output"):
                print(t["output"])
            print()


def render_findings(findings, scanned):
    for f in findings:
        print(f"{f['file']}:{f['line']}: [{f['rule']}] {f['evidence']}")
        print(f"    -> {f['suggestion']}")
        if f["blind_spot"]:
            print(f"    (not seen: {f['blind_spot']})")
    print(f"\n{len(findings)} own finding(s) across {scanned} file(s).")
    if not findings:
        print(
            "Nothing to report from the syntax scan. Absence here is not proof of "
            "health: read the tool output above, and remember this scan sees neither "
            "types, tests nor intent."
        )


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    as_json = "--json" in argv
    quiet = "--quiet" in argv
    use_tools = "--no-tools" not in argv
    if not args:
        print(__doc__.strip().splitlines()[0])
        print(USAGE, file=sys.stderr)
        return 0
    findings, files = collect(args)
    tools = external_findings(args) if use_tools else []
    shape = architecture_summary(files, project_root_for(args)) if files else None
    if as_json:
        print(
            json.dumps(
                {
                    "scanned": len(files),
                    "findings": findings,
                    "tools": tools,
                    "architecture": shape,
                },
                indent=2,
            )
        )
        return 0
    render_tools(tools)
    if shape and not quiet:
        print_architecture(shape)
    if not quiet:
        render_findings(findings, len(files))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
