"""The effect rule: a function that returns data and also talks to the world.

This is the hexagonal boundary question in one check. A function that both
decides and touches the filesystem, network or a subprocess cannot be tested
without that dependency, and the decision inside it cannot be reused elsewhere.
"""

from __future__ import annotations

import ast

from .model import EFFECT_CALLS, EFFECT_MODULES, finding


def _effect_hits(node, effect_imports):
    """Calls inside a function that leave the process, with their line."""
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
    return hits


def check_effects_in_pure(tree, path, imports):
    """A function that returns data but also talks to the outside world.

    Blind spot: a deliberate facade is a valid design. The rule cannot tell
    whether the domain decision is reusable without the effect, so it asks.
    """
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
        hits = _effect_hits(node, effect_imports)
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
