# Tooling and verification

Read for compatibility, project setup choices, or selecting checks.

## Run what the project already trusts

The project's configured tools outrank anything this skill recommends. Existing
`pyproject.toml` settings, a `justfile`/`Makefile` target, or a CI job is the
contract; run that command before reaching for a new tool.

```bash
python3 scripts/analyze.py PATH      # bundled scan; also runs ruff and ty when present
```

`scripts/analyze.py` shells out to `ruff` and to `ty` (via `uvx` when `ty` is not
installed), then adds its own syntax-level findings. Use `--no-tools` when only
the local scan is wanted, `--json` for machine output. Every finding carries the
blind spot of the rule that produced it.

## The layers, and what each one actually proves

| Layer | Tool | Proves | Blind spot |
| --- | --- | --- | --- |
| Syntax, bugs, idiom | `ruff check --select B,F,SIM,RET,PIE,PERF,C4,PLW,PLR` | unreachable code, mutable defaults in some shapes, needless assignment, dead branches | not types, not semantics, not intent |
| Types | `ty check` (or `mypy --strict`, or `pyright` if the project uses it) | a declared contract that the code violates | says nothing about whether a value used as a key is *stable* |
| Local rules | `scripts/analyze.py` | dataclass equality that makes a key unusable, `unsafe_hash` as design smell, an effect inside a returning function, a wrapper that hides nothing, bare/broad except | reads syntax only: it cannot see whether a class is ever used as a key |
| Complexity | `radon cc` / `complexipy` (if configured) | functions that are hard to follow | a long cohesive function can be healthy |
| Dead code | `vulture` (if configured) | names nothing reaches | false positives on framework hooks; verify before deleting |
| Layers | `import-linter` / `grimp` / `tach` (if configured) | a dependency direction the project forbids | needs a declared contract to be meaningful |

## Why `ty`

`ty` is Astral's Rust type checker: 10x-100x faster than mypy or pyright on a
cold project, which makes type checking cheap enough to run on every analysis
rather than as a separate errand. Two properties matter for existing code:

- **Progressive adoption**: it reports on partially typed code without demanding
  a full annotation pass first.
- **Baselines** (`ty check --update-baseline`): record today's diagnostics, then
  fail only on new ones. This is how a legacy module enters analysis without a
  rewrite.

It is **beta** (0.0.x). Pin the version when a gate depends on it, and keep
`mypy`/`pyright` as the fallback when the project already uses one: the point is
to read types, not to win a tool argument. Do not migrate a project's checker
during a review or a refactor.

## What this means for a change

- A checker that cannot run is `unverified`, never clean. Say which tool was
  missing and what it would have covered.
- Run the checks with the exit status visible to whoever invoked you: piping
  through `tail`/`head` discards it, and a passing run becomes indistinguishable
  from a failing one.
- Match the supported Python floor. Newer syntax than the project declares is a
  compatibility break, not an improvement.
