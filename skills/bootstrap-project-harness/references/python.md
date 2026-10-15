# Python (uv) stack specifics

Toolchain: **uv** (env, deps, Python versions), **ruff** (lint + format),
**mypy** (types), **pytest** (+ `pytest-cov`), **pip-audit** (security),
**commitizen** (commit messages), **Lefthook** (hooks). Technical templates live
in `templates/python/`.

Requires uv and just. A repo owned by another package manager
(`poetry.lock`/`[tool.poetry]`, `pdm.lock`/`[tool.pdm]`, `Pipfile`,
`requirements.in`) is **reported and stopped**, not migrated. A repo that merely
already has `black`/`flake8`/`isort`/`mypy`/`pre-commit` is also **reported and
stopped** — do not add ruff/mypy alongside.

## Linter limits (ruff)

| Metric                  | Rule    | Limit    |
| ----------------------- | ------- | -------- |
| Cyclomatic complexity   | `C901`  | error 10 |
| Max params per function | `PLR0913` | error 4 |
| Function/file length    | —       | not enforced |

## Security

Block `.env`, `.db`, and data files at commit. Run `uv run pip-audit` (pre-commit
skips it when the index is unreachable).

## Language quick reference

| Component       | Tool                          |
| --------------- | ----------------------------- |
| Env / deps      | `uv sync`, `uv add --dev`     |
| Type check      | `uv run mypy .`               |
| Linter          | `uv run ruff check .`         |
| Formatter       | `uv run ruff format .`        |
| Tests           | `uv run pytest`               |
| Hook manager    | Lefthook                      |
| Commit messages | `uv run cz check`             |
| Docs sensor     | `uv run python docs_check.py` |

## Notes

- Runtime pin: `.python-version`; keep it aligned with `requires-python` and
  ruff `target-version`.
- `uv.lock` is committed; CI runs `uv sync --locked`.
- Add tool deps with `uv add --dev` (updates the lock) — never hand-edit
  `[dependency-groups]`.
- OpenCode's built-in **ruff** formatter formats `.py` on edit; it reads the same
  `[tool.ruff]`, so it stays consistent with `ruff format --check`.
- The docs sensor (`docs_check.py`) and spec helper (`spec_sha.py`) are stdlib-only
  — no extra dependencies, no Node.
