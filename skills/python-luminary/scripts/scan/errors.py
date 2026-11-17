"""Rules about failure handling and ceremony that hides no decision.

Both shapes share a consequence: a caller cannot tell what actually happened. A
swallowed exception turns a failure into a plausible success, and a wrapper that
only forwards leaves the reader a hop to trace with nothing gained.
"""

from __future__ import annotations

import ast

from .model import finding


def check_bare_except(tree, path):
    """A handler that names no exception, or names Exception and never raises."""
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
            reraises = any(isinstance(s, ast.Raise) for s in node.body)
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
                        blind_spot="A fail-closed handler that logs and refuses the operation "
                        "is a valid design; check what the caller receives.",
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


def check_failure_handling(tree, path):
    """Every failure-and-ceremony rule in one call."""
    return check_bare_except(tree, path) + check_forwarding_wrapper(tree, path)
