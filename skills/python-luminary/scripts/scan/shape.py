"""Architecture shape: module size, coupling, cycles and the layer map.

The line-by-line rules answer "what is wrong here". This module answers "where is
the weight": which module is largest, who depends on whom, whether the project
declares layers and whether the modules respect them. It is the raw material the
Map phase reads before judging, and it states its own blind spot: proportion
describes shape, not correctness.
"""

from __future__ import annotations

import ast
from pathlib import Path

from .model import EFFECT_CALLS, EFFECT_MODULES


def _node_span(node):
    """Line count of a node, reading the tree once rather than per child."""
    end = getattr(node, "end_lineno", None)
    if end is None:
        ends = [
            getattr(n, "end_lineno", None)
            for n in ast.walk(node)
            if getattr(n, "end_lineno", None) is not None
        ]
        end = max(ends) if ends else node.lineno
    return max(end - node.lineno + 1, 1)


def _module_name(path: Path, root: Path) -> str:
    """Import-style name of a file relative to the project root."""
    try:
        rel = path.relative_to(root)
    except ValueError:
        rel = Path(path.name)
    parts = list(rel.with_suffix("").parts)
    if parts and parts[-1] == "__init__":
        parts.pop()
    return ".".join(parts)


def _package_of(name, path):
    """Package a relative import resolves against.

    For `pkg/mod.py` that is `pkg`. For `pkg/__init__.py` the module name is
    already `pkg`, and `from .cli import x` means `pkg.cli`. Treating a package's
    `__init__` like a plain module makes every sibling import climb one level and
    point at the wrong module, which reads as a false cycle.
    """
    if path.name == "__init__.py":
        return name
    return name.rsplit(".", 1)[0] if "." in name else ""


def _dataclasses(tree):
    """(name, frozen) for every dataclass the tree declares."""
    out = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue
        for d in node.decorator_list:
            name = (
                d.func.id
                if isinstance(d, ast.Call) and isinstance(d.func, ast.Name)
                else (d.id if isinstance(d, ast.Name) else None)
            )
            if name != "dataclass":
                continue
            frozen = False
            if isinstance(d, ast.Call):
                for kw in d.keywords:
                    if kw.arg == "frozen" and isinstance(kw.value, ast.Constant):
                        frozen = bool(kw.value.value)
            out.append((node.name, frozen))
    return out


def _effect_sites(tree, imports):
    """Effect calls a module makes, deduplicated by name."""
    effects = set()
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        fn = node.func
        name = getattr(fn, "id", None) or getattr(fn, "attr", None)
        if name in EFFECT_CALLS:
            effects.add(name)
        elif isinstance(fn, ast.Attribute) and isinstance(fn.value, ast.Name):
            if fn.value.id in (imports & EFFECT_MODULES):
                effects.add(f"{fn.value.id}.{fn.attr}")
    return sorted(effects)


def module_shape(path: Path, tree, imports, source_lines=0):
    """Size and effect profile of one module, for the architecture summary.

    Blind spot: line count and effect sites describe proportion, not correctness.
    A long dispatch table is fine; a short module with a hidden decision is not
    visible here.
    """
    functions = [
        n
        for n in ast.walk(tree)
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))
    ]
    classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
    spans = [(_node_span(n), n.name) for n in functions]
    big = sorted([s for s in spans if s[0] > 50], reverse=True)
    return {
        "module": None,
        "file": str(path),
        "lines": source_lines,
        "functions": len(functions),
        "classes": len(classes),
        "largest_functions": big[:3],
        "effects": _effect_sites(tree, imports),
        "dataclasses": _dataclasses(tree),
    }


def _module_layer_map(project_root: Path):
    """Read importlinter layers from the project's pyproject.toml, if declared.

    Returns (root_package, {module: layer_index}) where layer 0 is the top. The
    contract is the project's own statement of its architecture; this only reads
    it so the summary can show which module sits where.
    """
    candidates = [project_root / "pyproject.toml"]
    if project_root.is_dir():
        candidates += sorted(project_root.glob("*/pyproject.toml"))
    for candidate in candidates:
        if not candidate.exists():
            continue
        try:
            text = candidate.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        if "[tool.importlinter]" not in text:
            continue
        try:
            import tomllib  # Python 3.11+
        except ImportError:
            return None, {}
        try:
            data = tomllib.loads(text)
        except (tomllib.TOMLDecodeError, ValueError):
            return None, {}
        section = data.get("tool", {}).get("importlinter", {})
        mapping = {}
        for contract in section.get("contracts", []):
            for layer_index, layer in enumerate(contract.get("layers", [])):
                for module in layer.split("|"):
                    mapping[module.strip()] = layer_index
        if mapping:
            return section.get("root_package"), mapping
    return None, {}


def _resolve_layer(module, layers, root_package):
    """Match a module to a declared layer, tolerating a `src.` or root prefix.

    The declared contract names modules by their import path (`pkg.module`); the
    scan names them relative to the project root, which may carry a `src.`
    prefix. Try the full name, then each suffix, so the two agree.
    """
    if not layers:
        return None
    parts = module.split(".")
    for start in range(len(parts)):
        candidate = ".".join(parts[start:])
        if root_package and f"{root_package}.{candidate}" in layers:
            return layers[f"{root_package}.{candidate}"]
        if candidate in layers:
            return layers[candidate]
    return None


def _module_edges(name, path, resolve, modules):
    """Outgoing edges of one module, tolerating an unparseable file."""
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, SyntaxError):
        return set()
    found = set()
    for node in ast.walk(tree):
        for target in _import_targets(node, _package_of(name, path)):
            resolved = resolve(target)
            if resolved and resolved != name:
                found.add(resolved)
    return found


def internal_graph(files, project_root: Path):
    """Build the intra-project import graph from relative and package imports.

    Blind spot: only edges inside the scanned tree are counted, and a re-export
    is indistinguishable from a real dependency. The graph says where coupling
    is, not whether that coupling is wrong.

    A project imported as `pkg.module` may live under `src/pkg/module.py`, so the
    graph keeps a second index keyed without the leading source directory. That
    is how an absolute import names a module, and matching on it is what stops a
    same-named module elsewhere from absorbing the edge.
    """
    modules = {_module_name(p, project_root): p for p in files}
    modules = {n: p for n, p in modules.items() if n}
    aliases = {}
    source_dirs = {"src", "lib", "python"}
    for name in modules:
        parts = name.split(".")
        # Only strip a leading source directory (`src.pkg.x` -> `pkg.x`). Stripping
        # any prefix would make `pkg.census.cli` answer to `cli` and swallow the
        # edge meant for the top-level `cli` module.
        if parts[0] in source_dirs:
            alias = ".".join(parts[1:])
            if alias and alias not in modules:
                aliases.setdefault(alias, name)

    def resolve(target):
        return target if target in modules else aliases.get(target)

    edges = {
        name: _module_edges(name, path, resolve, modules)
        for name, path in modules.items()
    }
    facades = {name for name, path in modules.items() if path.name == "__init__.py"}
    return modules, edges, facades


def contract_facades(edges, facades):
    """Remove package `__init__` nodes from the graph by inlining their edges.

    A package `__init__` that re-exports its submodules is a facade, not a module
    with logic: `pkg.__init__ -> pkg.mod` plus `pkg.sibling -> pkg.__init__` is
    one dependency `pkg.sibling -> pkg.mod`, not a cycle. Counting the facade as a
    node reports every re-exporting package as circular, which is noise.
    """
    contracted = {
        name: {t for t in targets if t not in facades}
        for name, targets in edges.items()
        if name not in facades
    }
    for name, targets in contracted.items():
        expanded = set(targets)
        stack = list(targets)
        while stack:
            current = stack.pop()
            for nxt in edges.get(current, ()):
                if nxt in facades and nxt not in expanded:
                    expanded.add(nxt)
                    stack.append(nxt)
        contracted[name] = {t for t in expanded if t not in facades and t != name}
    return contracted


def _import_targets(node, package):
    """Candidate module names an import statement could resolve to."""
    targets = []
    if isinstance(node, ast.ImportFrom) and node.level:
        base = package.split(".") if package else []
        if node.level > 1:
            base = base[: len(base) - (node.level - 1)] if base else []
        stem = ".".join([*base, *([node.module] if node.module else [])])
        if stem:
            targets.append(stem)
            targets.extend(f"{stem}.{alias.name}" for alias in node.names)
    elif isinstance(node, ast.ImportFrom) and node.module:
        targets.append(node.module)
        targets.extend(f"{node.module}.{alias.name}" for alias in node.names)
    return targets


def find_cycles(edges):
    """Record a back edge to the current DFS stack; that is a cycle."""
    seen, stack, cycles = set(), [], []
    on_stack = set()

    def walk(node):
        seen.add(node)
        stack.append(node)
        on_stack.add(node)
        for nxt in sorted(edges.get(node, ())):
            if nxt not in seen:
                walk(nxt)
            elif nxt in on_stack:
                cycle = stack[stack.index(nxt) :] + [nxt]
                if cycle not in cycles:
                    cycles.append(cycle)
        stack.pop()
        on_stack.discard(node)

    for node in sorted(edges):
        if node not in seen:
            walk(node)
    return cycles
