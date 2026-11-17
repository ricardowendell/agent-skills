"""External tools: run what the project already trusts, in the project's own env.

The scan's own rules cover shapes no linter sees; the linters cover what this
scan cannot prove. Both are reported, and the tools outrank the scan wherever
they overlap. Two details matter for a truthful report:

- A tool that is not installed is tried through `uvx` before being called
  unavailable, so an ephemeral run costs a download, not an install.
- Every tool runs with the target project's root as its working directory. A
  type checker started from this script's directory resolves imports against the
  wrong environment and reports every first-party import as missing.
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from .model import RUFF_SELECT, TOOL_TIMEOUT


def run_tool(cmd, cwd=None):
    """Run an external analyser and return (exit_ok, output, reason)."""
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=TOOL_TIMEOUT,
            check=False,
            cwd=str(cwd) if cwd else None,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        return False, "", f"{cmd[0]}: {type(exc).__name__}"
    out = ((proc.stdout or "") + (proc.stderr or "")).strip()
    return proc.returncode == 0, out, None


def project_root_for(targets):
    """Find the project root a target belongs to, so tools read its config."""
    for raw in targets:
        path = Path(raw)
        directory = path if path.is_dir() else path.parent
        for candidate in (directory, *directory.parents):
            if (candidate / "pyproject.toml").exists():
                return candidate
        return directory
    return Path.cwd()


def _record(tool, cmd, project_root, ok, out, reason, note=None):
    record = {
        "tool": tool,
        "command": " ".join(cmd),
        "cwd": str(project_root),
        "status": "clean" if ok else ("findings" if out else "error"),
        "output": out,
        "reason": reason,
    }
    if note:
        record["note"] = note
    return record


def _unavailable(tool, reason):
    return {"tool": tool, "status": "unavailable", "reason": reason}


def _ruff(targets, project_root):
    if not shutil.which("ruff"):
        return _unavailable("ruff", "not on PATH; install with 'uv tool install ruff'")
    cmd = [
        "ruff",
        "check",
        "--select",
        RUFF_SELECT,
        "--output-format",
        "concise",
        *targets,
    ]
    ok, out, reason = run_tool(cmd, cwd=project_root)
    return _record("ruff", cmd, project_root, ok, out, reason)


def _type_checker(targets, project_root):
    if shutil.which("ty"):
        cmd = ["ty", "check", *targets]
    elif shutil.which("uvx"):
        cmd = ["uvx", "ty", "check", *targets]
    elif shutil.which("mypy"):
        cmd = ["mypy", "--strict", *targets]
    else:
        return _unavailable(
            "type-check", "no ty, uvx or mypy on PATH: types are unread this run"
        )
    ok, out, reason = run_tool(cmd, cwd=project_root)
    name = cmd[1] if cmd[0] == "uvx" else cmd[0]
    return _record(name, cmd, project_root, ok, out, reason)


def _vulture(targets, project_root):
    if shutil.which("vulture"):
        cmd = ["vulture", "--min-confidence", "80", *targets]
    elif shutil.which("uvx"):
        cmd = ["uvx", "vulture", "--min-confidence", "80", *targets]
    else:
        return _unavailable(
            "vulture",
            "not on PATH and no uvx; dead code is unread this run "
            "(uv tool install vulture)",
        )
    ok, out, reason = run_tool(cmd, cwd=project_root)
    return _record(
        "vulture",
        cmd,
        project_root,
        ok,
        out,
        reason,
        note="unused-name candidates; verify before deleting (framework hooks and "
        "dynamic use look dead to it)",
    )


def external_findings(paths):
    """Run ruff, a type checker and vulture; report each one's own output."""
    targets = [str(p) for p in paths if Path(p).exists()]
    project_root = project_root_for(targets)
    return [
        _ruff(targets, project_root),
        _type_checker(targets, project_root),
        _vulture(targets, project_root),
    ]
