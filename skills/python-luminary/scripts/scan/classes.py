"""Rules about a class contract: equality, hashing and shared defaults.

A dataclass is a domain record, and its generated methods are the contract. The
two shapes here break that contract quietly: equality without a stable hash, and
a default container that every instance shares.
"""

from __future__ import annotations

import ast

from .model import finding


def _decorator_name(node):
    """Name of a decorator whether it is bare or called."""
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
        return node.func.id
    if isinstance(node, ast.Name):
        return node.id
    return None


def _dataclass_kwargs(deco):
    """Literal keyword arguments of a dataclass decorator."""
    kwargs = {}
    if isinstance(deco, ast.Call):
        for kw in deco.keywords:
            if isinstance(kw.value, ast.Constant):
                kwargs[kw.arg] = kw.value.value
    return kwargs


def _dataclass_flags(tree):
    """(class node, kwargs) for every dataclass with annotated fields."""
    out = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue
        deco = None
        for d in node.decorator_list:
            if _decorator_name(d) == "dataclass":
                deco = d
        if deco is None:
            continue
        if not any(isinstance(b, ast.AnnAssign) for b in node.body):
            continue
        out.append((node, _dataclass_kwargs(deco)))
    return out


def check_dataclass_hash(tree, path):
    """A dataclass used as a mapping key must be hashable and stable.

    Blind spot: this reads syntax, not types, so it cannot tell whether the
    class is ever used as a key. It reports the dataclass whose generated
    equality (eq=True, the default) makes the class unhashable, because that
    combination is the one that bites when a key is added later.
    """
    out = []
    for node, kwargs in _dataclass_flags(tree):
        eq = kwargs.get("eq", True)
        frozen = kwargs.get("frozen", False)
        unsafe = kwargs.get("unsafe_hash", False)
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
    """A dataclass field defaulting to a literal mutable value is shared.

    Blind spot: a function default is checked by ruff's B006; this rule covers the
    class-body form, which the same rule reports differently, so both can fire.
    """
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


def check_class_contract(tree, path):
    """Every class-shaped rule in one call, so the runner names one surface."""
    return check_dataclass_hash(tree, path) + check_mutable_default(tree, path)
