"""Aggregate the shape summary and render it for the Map phase.

`architecture_summary` folds per-module shapes, the import graph and the declared
layers into one record; `print_architecture` renders it as the short block the
reader scans before opening any file. Rendering is separate so `--json` can carry
the same record without the text.
"""

from __future__ import annotations

import ast
from pathlib import Path

from .model import module_imports
from .shape import (
    _module_layer_map,
    _module_name,
    _resolve_layer,
    contract_facades,
    find_cycles,
    internal_graph,
    module_shape,
)


def _shapes(files, project_root):
    """Per-module shape for every file that parses."""
    shapes = []
    for path in files:
        try:
            source = path.read_text(encoding="utf-8")
            tree = ast.parse(source)
        except (OSError, UnicodeDecodeError, SyntaxError):
            continue
        shape = module_shape(
            path, tree, module_imports(tree), source_lines=source.count("\n") + 1
        )
        shape["module"] = _module_name(path, project_root)
        shapes.append(shape)
    return shapes


def _couple(shapes, files, project_root):
    """Attach fan-in, fan-out and declared layer to each module shape."""
    modules, edges, facades = internal_graph(files, project_root)
    contracted = contract_facades(edges, facades)
    fan_in = {name: 0 for name in modules}
    for targets in contracted.values():
        for target in targets:
            fan_in[target] = fan_in.get(target, 0) + 1
    root_package, layers = _module_layer_map(project_root)
    for shape in shapes:
        shape["fan_in"] = fan_in.get(shape["module"], 0)
        shape["fan_out"] = len(contracted.get(shape["module"], ()))
        shape["layer"] = _resolve_layer(shape["module"], layers, root_package)
    return contracted, root_package


def architecture_summary(files, project_root: Path):
    """Fold per-module shape, coupling and layering into one summary record."""
    shapes = _shapes(files, project_root)
    contracted, root_package = _couple(shapes, files, project_root)
    biggest = sorted(shapes, key=lambda s: s["lines"], reverse=True)
    biggest_functions = sorted(
        (
            (size, name, shape["module"], shape["file"])
            for shape in shapes
            for size, name in shape["largest_functions"]
        ),
        reverse=True,
    )
    return {
        "modules": len(shapes),
        "lines": sum(shape["lines"] for shape in shapes),
        "cycles": find_cycles(contracted),
        "layer_root": root_package,
        "layered_modules": sum(1 for s in shapes if s["layer"] is not None),
        "largest_modules": biggest[:10],
        "largest_functions": biggest_functions[:10],
        "hubs": sorted(shapes, key=lambda s: s["fan_in"], reverse=True)[:5],
        "effectful": sorted(
            (s for s in shapes if s["effects"]),
            key=lambda s: len(s["effects"]),
            reverse=True,
        )[:10],
        "dataclasses": sum(len(s["dataclasses"]) for s in shapes),
        "dataclasses_frozen": sum(
            1 for s in shapes for _, frozen in s["dataclasses"] if frozen
        ),
    }


def print_architecture(shape):
    """Print the shape summary that the Map phase reads before judging."""
    print("[shape] module and coupling summary for the Map phase")
    print(
        f"  {shape['modules']} module(s), {shape['lines']} lines, "
        f"{shape['dataclasses']} dataclass(es) ({shape['dataclasses_frozen']} frozen)"
    )
    if shape["layer_root"]:
        print(
            f"  layers: {shape['layered_modules']}/{shape['modules']} module(s) mapped to a "
            f"declared importlinter layer of '{shape['layer_root']}'"
        )
    else:
        print("  layers: none declared (no [tool.importlinter] found)")
    if shape["cycles"]:
        print(f"  cycles: {len(shape['cycles'])}")
        for cycle in shape["cycles"][:5]:
            print(f"    {' -> '.join(cycle)}")
    else:
        print("  cycles: none")
    _print_modules(shape["largest_modules"])
    if shape["largest_functions"]:
        print("  largest functions:")
        for size, name, module, _ in shape["largest_functions"][:5]:
            print(f"    {size:5d}L {module}.{name}")
    _print_effects(shape["effectful"])
    print(
        "  (not seen: proportion, not correctness. A long dispatch table is fine, a short"
    )
    print("   module with a hidden decision is not visible here.)")
    print()


def _print_modules(largest):
    print("  largest modules:")
    for m in largest:
        layer = "" if m["layer"] is None else f" L{m['layer']}"
        print(
            f"    {m['lines']:5d}L {m['functions']:3d}fn {m['module'] or m['file']}"
            f"  (fan-in {m['fan_in']}, fan-out {m['fan_out']}{layer})"
        )


def _print_effects(effectful):
    if not effectful:
        return
    print("  effect sites (a boundary is a valid design; check which ones own it):")
    for m in effectful[:6]:
        print(f"    {m['module']}: {', '.join(m['effects'][:4])}")
