# Tooling and verification

Read for compatibility, project setup choices, or selecting checks.

## Run what the project already trusts

The project's configured tools outrank anything this skill recommends. Existing
`pyproject.toml` settings, a `justfile`/`Makefile` target, or a CI job is the
contract; run that command before reaching for a new tool.

```bash
python3 scripts/analyze.py PATH      # bundled scan; also runs ruff and ty when present
```

`scripts/analyze.py` shells out to `ruff`, to `ty` (via `uvx` when `ty` is not
installed) and to `vulture` when it is present, then adds its own syntax-level
findings. Use `--no-tools` when only the local scan is wanted, `--json` for
machine output. Every finding carries the blind spot of the rule that produced
it. A tool that is absent is reported as `unavailable` with the reason; it is
never read as clean.

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

## Tools considered and not bundled

Each of these answers a real question. They are listed so the next analysis does
not install one without knowing it is already covered, or reach for it where the
bundled layers say the same thing.

| Tool | What it would add | Why it is not in the bundle |
| --- | --- | --- |
| `bandit` | security smells (`eval`, `shell=True`, `pickle`) | ruff's `S` selectors are flake8-bandit; add `S` to the select when the project wants it |
| `refurb` | idiom suggestions | ruff `SIM`/`RET`/`PERF`/`C4` already cover the same territory |
| `radon`, `complexipy` | cyclomatic and cognitive scores | ruff `C901` gates complexity; a score is a number, not a judgment, and this skill already treats size as an investigation signal |
| `libcst` | AST rewriting that preserves formatting | `ast-grep` does structural search and rewrite from the outside, and is already installed |
| `rope` | programmatic rename/extract with scope resolution | a directed edit is clearer for one change; rope's API is dated and adds a dependency for a job the agent does directly |
| `pydeps` | a dependency graph image | an image is not a verdict; `grimp` or `import-linter` answer "does this violate the declared direction" |
| `import-linter`, `grimp`, `tach` | proving a forbidden dependency direction | worth using **when the project declares a contract**; without one, "domain imports infra" is an opinion. Run them if they are configured, never install them to win an argument |
| `coverage` | which paths no test reaches | run it when the project has tests; a legacy module with no tests gets `unverified`, not a number |
| `ast-grep` | "where else does this pattern appear" | used interactively in the map phase, not as a bundled check; forcing patterns into a scanner turns them into noise |

## What this means for a change

- A checker that cannot run is `unverified`, never clean. Say which tool was
  missing and what it would have covered.
- Run the checks with the exit status visible to whoever invoked you: piping
  through `tail`/`head` discards it, and a passing run becomes indistinguishable
  from a failing one.
- Match the supported Python floor. Newer syntax than the project declares is a
  compatibility break, not an improvement.
