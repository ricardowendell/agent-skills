"""The scan package behind `analyze.py`: rules, architecture shape and tools.

`analyze.py` stays the entry point (the documented and asserted path); this
package holds the parts. Import from here so callers do not depend on the
internal split.
"""

from __future__ import annotations

from .model import (
    EFFECT_CALLS,
    EFFECT_MODULES,
    RUFF_SELECT,
    SKIP_DIRS,
    TOOL_TIMEOUT,
    finding,
    iter_py_files,
    module_imports,
)
from .rules import analyze_file
from .summary import architecture_summary, print_architecture
from .tools import external_findings, project_root_for

__all__ = [
    "EFFECT_CALLS",
    "EFFECT_MODULES",
    "RUFF_SELECT",
    "SKIP_DIRS",
    "TOOL_TIMEOUT",
    "analyze_file",
    "architecture_summary",
    "external_findings",
    "finding",
    "iter_py_files",
    "module_imports",
    "print_architecture",
    "project_root_for",
]
