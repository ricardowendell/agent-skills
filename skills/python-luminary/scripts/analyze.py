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
the tools the project already trusts, when they are on PATH:

    ruff check  --select B,F,SIM,RET,PIE,PERF,C4,PLW,PLR  (syntax, bugs, idiom)
    ty check / mypy --strict                              (types)

Those tools know more than this scan does and outrank it wherever they overlap.
The scan's own rules cover what none of them see: a dataclass whose equality
makes it unusable as a key, an effect inside a function that returns a value, a
wrapper that hides no decision.

Exit status is always 0: this is analysis, not a gate.
"""

from __future__ import annotations

import ast
import json
import shutil
import subprocess
import sys
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
    if root.is_file():
        if root.suffix == ".py":
            yield root
        return
    for path in sorted(root.rglob("*.py")):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        yield path


def module_imports(tree):
    names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                names.add(alias.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom) and node.module:
            names.add(node.module.split(".")[0])
    return names


def check_dataclass_hash(tree, path):
    """A dataclass used as a mapping key must be hashable and stable.

    Blind spot: this reads syntax, not types, so it cannot tell whether the
    class is ever used as a key. It reports the dataclass whose generated
    equality (eq=True, the default) makes the class unhashable, because that
    combination is the one that bites when a key is added later.
    """
    out = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue
        deco = None
        for d in node.decorator_list:
            name = (
                d.func.id
                if isinstance(d, ast.Call) and isinstance(d.func, ast.Name)
                else (d.id if isinstance(d, ast.Name) else None)
            )
            if name == "dataclass":
                deco = d
        if deco is None:
            continue
        kwargs = {}
        if isinstance(deco, ast.Call):
            for kw in deco.keywords:
                if isinstance(kw.value, ast.Constant):
                    kwargs[kw.arg] = kw.value.value
        eq = kwargs.get("eq", True)
        frozen = kwargs.get("frozen", False)
        unsafe = kwargs.get("unsafe_hash", False)
        has_fields = any(isinstance(b, ast.AnnAssign) for b in node.body)
        if not has_fields:
            continue
        if eq and not frozen and not unsafe:
            out.append(
                finding(
                    path,
                    node.lineno,
                    "dataclass-unhashable",
                    f"@dataclass {node.name} uses generated equality without frozen=True",
                    "If this value is ever a dict key or set member, generated __eq__ sets "
                    "__hash__ to None. Pass frozen=True for a value record, or eq=False when "
                    "identity is the contract, and say which one it is.",
                    confidence="high",
                    blind_spot="Does not know whether the class is used as a key.",
                )
            )
        if unsafe:
            out.append(
                finding(
                    path,
                    node.lineno,
                    "unsafe-hash",
                    f"@dataclass {node.name} sets unsafe_hash=True",
                    "unsafe_hash papers over a mutability/equality mismatch: equal values can "
                    "hash differently after a field changes. Prefer frozen=True for value "
                    "records; keep identity semantics with eq=False.",
                    confidence="high",
                )
            )
    return out


def check_mutable_default(tree, path):
    """A dataclass field defaulting to a literal mutable value is shared."""
    out = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue
        for stmt in node.body:
            if not isinstance(stmt, ast.AnnAssign) or stmt.value is None:
                continue
            v = stmt.value
            if isinstance(v, (ast.List, ast.Dict, ast.Set)):
                name = getattr(stmt.target, "id", "?")
                out.append(
                    finding(
                        path,
                        stmt.lineno,
                        "mutable-default",
                        f"{node.name}.{name} defaults to a literal {type(v).__name__.lower()}",
                        "Use field(default_factory=list/dict/set) so each instance owns its "
                        "own container.",
                        confidence="high",
                    )
                )
    return out


def check_bare_except(tree, path):
    out = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.ExceptHandler):
            continue
        if node.type is None:
            out.append(
                finding(
                    path,
                    node.lineno,
                    "bare-except",
                    "except without a type",
                    "Name the exception you can handle. A bare except swallows "
                    "KeyboardInterrupt and SystemExit, and hides the bug you were about to fix.",
                    confidence="high",
                )
            )
        elif isinstance(node.type, ast.Name) and node.type.id == "Exception":
            body = node.body
            reraises = any(isinstance(s, ast.Raise) for s in body)
            if not reraises:
                out.append(
                    finding(
                        path,
                        node.lineno,
                        "broad-except",
                        "except Exception without a raise",
                        "Catch the specific exception and translate it, or re-raise with "
                        "context (raise ... from err). Swallowing it turns a failure into a "
                        "plausible success value.",
                        confidence="medium",
                    )
                )
    return out


def check_forwarding_wrapper(tree, path):
    """A function whose whole body forwards its arguments adds no contract."""
    out = []
    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        if node.decorator_list:
            continue
        body = [
            s
            for s in node.body
            if not isinstance(s, ast.Expr) or not isinstance(s.value, ast.Constant)
        ]
        if len(body) != 1:
            continue
        stmt = body[0]
        if not isinstance(stmt, ast.Return) or not isinstance(stmt.value, ast.Call):
            continue
        params = [a.arg for a in node.args.args if a.arg not in ("self", "cls")]
        call = stmt.value
        args = [a.id for a in call.args if isinstance(a, ast.Name)]
        if params and args == params:
            target = getattr(call.func, "id", None) or getattr(call.func, "attr", "?")
            out.append(
                finding(
                    path,
                    node.lineno,
                    "forwarding-wrapper",
                    f"{node.name}({', '.join(params)}) only calls {target} with the same arguments",
                    "A wrapper earns its place by hiding a decision. If the caller learns "
                    "nothing from it, call the target directly; if it will grow validation or "
                    "policy, say which.",
                    confidence="medium",
                    blind_spot="Does not see docstring intent or planned extension.",
                )
            )
    return out


def check_effects_in_pure(tree, path, imports):
    """A function that returns data but also talks to the outside world."""
    effect_imports = imports & EFFECT_MODULES
    if not effect_imports:
        return []
    out = []
    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        returns_value = any(
            isinstance(s, ast.Return) and s.value is not None for s in ast.walk(node)
        )
        if not returns_value:
            continue
        hits = []
        for sub in ast.walk(node):
            if not isinstance(sub, ast.Call):
                continue
            fn = sub.func
            name = getattr(fn, "id", None) or getattr(fn, "attr", None)
            if name in EFFECT_CALLS:
                hits.append((sub.lineno, name))
            elif isinstance(fn, ast.Attribute) and isinstance(fn.value, ast.Name):
                if fn.value.id in effect_imports:
                    hits.append((sub.lineno, f"{fn.value.id}.{fn.attr}"))
        if hits:
            where, what = hits[0]
            out.append(
                finding(
                    path,
                    where,
                    "effect-in-returning-function",
                    f"{node.name} performs {what} and returns a value",
                    "Keep the decision pure and pass the effect in as a callable or a client, "
                    "so the rule can be tested without the network or the filesystem.",
                    confidence="medium",
                    blind_spot="A deliberate facade is a valid design; check whether the domain "
                    "decision is reusable without the effect.",
                )
            )
    return out


def analyze_file(path: Path):
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
    found = []
    found += check_dataclass_hash(tree, path)
    found += check_mutable_default(tree, path)
    found += check_bare_except(tree, path)
    found += check_forwarding_wrapper(tree, path)
    found += check_effects_in_pure(tree, path, imports)
    return found


def run_tool(cmd):
    """Run an external analyser and return (exit_ok, output, reason)."""
    try:
        proc = subprocess.run(
            cmd, capture_output=True, text=True, timeout=TOOL_TIMEOUT, check=False
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        return False, "", f"{cmd[0]}: {type(exc).__name__}"
    out = ((proc.stdout or "") + (proc.stderr or "")).strip()
    return proc.returncode == 0, out, None


def external_findings(paths):
    """Run ruff and a type checker when present; report their own output.

    These tools know more than the syntax scan and outrank it wherever they
    overlap. Their message is kept verbatim because it names the rule and the
    exact node, which a paraphrase would lose.
    """
    results = []
    targets = [str(p) for p in paths if Path(p).exists()]

    if shutil.which("ruff"):
        cmd = [
            "ruff",
            "check",
            "--select",
            RUFF_SELECT,
            "--output-format",
            "concise",
            *targets,
        ]
        ok, out, reason = run_tool(cmd)
        results.append(
            {
                "tool": "ruff",
                "command": " ".join(cmd),
                "status": "clean" if ok else ("findings" if out else "error"),
                "output": out,
                "reason": reason,
            }
        )
    else:
        results.append(
            {
                "tool": "ruff",
                "status": "unavailable",
                "reason": "not on PATH; install with 'uv tool install ruff'",
            }
        )

    if shutil.which("ty"):
        cmd = ["ty", "check", *targets]
    elif shutil.which("uvx"):
        cmd = ["uvx", "ty", "check", *targets]
    elif shutil.which("mypy"):
        cmd = ["mypy", "--strict", *targets]
    else:
        cmd = None
    if cmd:
        ok, out, reason = run_tool(cmd)
        results.append(
            {
                "tool": cmd[1] if cmd[0] == "uvx" else cmd[0],
                "command": " ".join(cmd),
                "status": "clean" if ok else ("findings" if out else "error"),
                "output": out,
                "reason": reason,
            }
        )
    else:
        results.append(
            {
                "tool": "type-check",
                "status": "unavailable",
                "reason": "no ty, uvx or mypy on PATH: types are unread this run",
            }
        )

    if shutil.which("vulture"):
        cmd = ["vulture", "--min-confidence", "80", *targets]
        ok, out, reason = run_tool(cmd)
        results.append(
            {
                "tool": "vulture",
                "command": " ".join(cmd),
                "status": "clean" if ok else ("findings" if out else "error"),
                "output": out,
                "reason": reason,
                "note": "unused-name candidates; verify before deleting (framework hooks and "
                "dynamic use look dead to it)",
            }
        )
    else:
        results.append(
            {
                "tool": "vulture",
                "status": "unavailable",
                "reason": "not on PATH; dead code is unread this run "
                "(uv tool install vulture)",
            }
        )
    return results


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    as_json = "--json" in argv
    quiet = "--quiet" in argv
    use_tools = "--no-tools" not in argv
    if not args:
        print(__doc__.strip().splitlines()[0])
        print(
            "usage: analyze.py PATH [PATH...] [--json] [--quiet] [--tools|--no-tools]",
            file=sys.stderr,
        )
        return 0
    findings = []
    scanned = 0
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
            scanned += 1
            findings.extend(analyze_file(f))
    findings.sort(key=lambda f: (f["file"], f["line"]))
    tools = external_findings(args) if use_tools else []
    if as_json:
        print(
            json.dumps(
                {"scanned": scanned, "findings": findings, "tools": tools}, indent=2
            )
        )
        return 0
    for t in tools:
        if t["status"] in ("findings", "error"):
            print(f"[{t['tool']}] {t['status']}: {t.get('command', '')}")
            if t.get("output"):
                print(t["output"])
            print()
        elif t["status"] == "unavailable":
            print(f"[{t['tool']}] unavailable: {t['reason']}")
    if not quiet:
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
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
