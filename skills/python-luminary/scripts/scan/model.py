"""Shared vocabulary: findings, constants and file discovery.

Every rule in this scan produces the same record through `finding`, so the CLI
can sort and render them without knowing which rule made one. The constants here
are the scan's declared limits: which modules own an effect, which imports carry
one, and which directories are never source.
"""

from __future__ import annotations

import ast
from pathlib import Path

RUFF_SELECT = "B,F,SIM,RET,PIE,PERF,C4,PLW,PLR"
TOOL_TIMEOUT = 120

EFFECT_MODULES = {
    "requests",
    "httpx",
    "urllib",
    "socket",
    "aiohttp",
    "boto3",
    "psycopg2",
    "sqlite3",
    "subprocess",
    "shutil",
    "tempfile",
}

EFFECT_CALLS = {"open", "print", "input"}

SKIP_DIRS = {
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    "node_modules",
    "build",
    "dist",
    ".tox",
}


def finding(path, line, rule, evidence, suggestion, confidence="medium", blind_spot=""):
    """One reported shape, with the rule that made it and what it could not see."""
    return {
        "file": str(path),
        "line": line,
        "rule": rule,
        "evidence": evidence,
        "suggestion": suggestion,
        "confidence": confidence,
        "blind_spot": blind_spot,
    }


def iter_py_files(root: Path):
    """Yield the Python files under a path, skipping environments and build output."""
    if root.is_file():
        if root.suffix == ".py":
            yield root
        return
    for path in sorted(root.rglob("*.py")):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        yield path


def module_imports(tree):
    """Top-level module names a tree imports, for the effect and graph rules."""
    names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                names.add(alias.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom) and node.module:
            names.add(node.module.split(".")[0])
    return names
