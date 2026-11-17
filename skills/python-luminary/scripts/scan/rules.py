"""Run the syntax rules over a file and collect what each one proves.

The rules are grouped by the surface they describe (class contract, failure
handling, effects), and this module is the only place that knows the order. A
file that cannot be read or parsed reports that fact as a finding rather than
disappearing, so a scan never returns silence for a file it failed on.
"""

from __future__ import annotations

import ast
from pathlib import Path

from .classes import check_class_contract
from .effects import check_effects_in_pure
from .errors import check_failure_handling
from .model import finding, module_imports


def analyze_file(path: Path):
    """Every own rule, over one file, with parse failures reported as findings."""
    try:
        source = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        return [
            finding(
                path, 0, "unreadable", str(exc), "Read the file before scanning it."
            )
        ]
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        return [
            finding(
                path,
                exc.lineno or 0,
                "syntax-error",
                str(exc),
                "Fix the parse error first.",
            )
        ]
    imports = module_imports(tree)
    return [
        *check_class_contract(tree, path),
        *check_failure_handling(tree, path),
        *check_effects_in_pure(tree, path, imports),
    ]
