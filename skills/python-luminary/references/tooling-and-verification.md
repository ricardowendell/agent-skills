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
installed) and to `vulture` (also via `uvx`), then adds its own syntax-level
findings. Use `--no-tools` when only the local scan is wanted, `--json` for
machine output. Every finding carries the blind spot of the rule that produced
it. A tool that is absent is reported as `unavailable` with the reason; one that
ran and found nothing is reported as `clean`; neither is ever silently omitted,
because silence reads as "not checked".

Every tool runs with the **target project's root** as its working directory.
This matters: a type checker started from the skill's own directory resolves
imports against the wrong environment and reports every first-party import as
missing. On a real 73-module project this was the difference between 458
diagnostics and 1. When the target has no `pyproject.toml`, the scan falls back
to the target directory.

The scan also prints a `[shape]` block before the findings: module count, largest
modules with their fan-in/fan-out, the largest functions, effect sites, declared
importlinter layers with how many modules map to one, and any import cycle. That
block is the raw material for the Map phase — it describes proportion, not
correctness. Package `__init__` facades are contracted out of the graph, so a
re-exporting package is not reported as a cycle.

## What the shape block does and does not answer

The architecture question has three parts, and only the first two are mechanical:

| Question | Answered by | Still judgment |
| --- | --- | --- |
| Where is the weight? | shape block: lines per module, largest functions | whether a long module should be split |
| Does the graph cycle or invert? | shape block: cycles, declared layers vs actual edges | whether a violation is a deliberate exception |
| Is the layout discoverable? | nothing — read the tree | whether physical grouping earns its diff |

A flat directory with an enforced layer contract is not the same defect as a flat
directory with no contract. Read the contract first: if the project declares
layers (import-linter, `tach`, module-boundary docs) and the graph respects them,
the missing folders are a discoverability preference, not an architecture defect.
Say which one you found.

## The layers, and what each one actually proves

| Layer | Tool | Proves | Blind spot |
| --- | --- | --- | --- |
| Syntax, bugs, idiom | `ruff check --select B,F,SIM,RET,PIE,PERF,C4,PLW,PLR` | unreachable code, mutable defaults in some shapes, needless assignment, dead branches | not types, not semantics, not intent |
| Types | `ty check` (or `mypy --strict`, or `pyright` if the project uses it) | a declared contract that the code violates | says nothing about whether a value used as a key is *stable* |
| Local rules | `scripts/analyze.py` | dataclass equality that makes a key unusable, `unsafe_hash` as design smell, an effect inside a returning function, a wrapper that hides nothing, bare/broad except | reads syntax only: it cannot see whether a class is ever used as a key |
| Complexity | `radon cc` / `complexipy` (if configured) | functions that are hard to follow | a long cohesive function can be healthy |
| Dead code | `vulture` (if configured) | names nothing reaches | false positives on framework hooks; verify before deleting |
| Layers | `import-linter` / `grimp` / `tach` (if configured) | a dependency direction the project forbids | needs a declared contract to be meaningful |
| Shape | `scripts/analyze.py --json` → `architecture` | module size, fan-in/fan-out, cycles, layer mapping | proportion and topology, not whether a boundary is drawn in the right place |

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
