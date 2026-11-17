# Tooling and verification

Read for compatibility, project setup choices, or selecting checks.

## Preserve the repository contract

Inspect `pyproject.toml`, runtime pins, lockfiles, CI, task recipes, and existing
commands. Match the supported Python floor; newer syntax is a compatibility
change. Preserve the working package manager, formatter, checker and hook manager
unless migration is part of the request.

For a new project with no toolchain choice, consider uv for dependency/environment
management, Ruff for linting/formatting, and pytest for tests. Choose a supported
checker deliberately; do not replace mypy or pyright with ty merely because it is
newer. Prefer the catalog's bootstrap workflow when setup is the task.

Use the existing dependency command so configuration and lockfile remain aligned.
Avoid new dependencies when the standard library meets the requirement.

## Match checks to risk

| Change | Useful evidence |
| --- | --- |
| Small behavior fix | Relevant test, applicable lint and type checks |
| Public interface | Callers, type checks, compatibility and error cases |
| Structural refactor | Existing behavior plus effect-order/invariant checks |
| Custom value object | Equality, hashing and mutation behavior |
| Streaming | Generator input, early output, final/empty input |
| Resource lifecycle | Cleanup on success, error and early termination |
| Concurrency | Bounds, cancellation, failure and shutdown |
| Performance claim | Comparable baseline and candidate measurements |

Run configured gates without weakening thresholds. Do not invent a universal
coverage target or comprehensive suite for every small edit. Add a test when it
can catch a meaningful regression; avoid tests that merely repeat implementation
details. A complex refactor may need characterization before restructuring.

When the project has no prescribed wrapper, common uv-based checks are:
```sh
uv run ruff check .
uv run ruff format --check .
uv run mypy .
uv run pytest
```
Use only tools configured for the project, with its actual paths and options.
These examples are not authority to install a second toolchain.

## Report evidence precisely

Separate executed checks, static inspection, and unrun checks. Record relevant
commands and outcomes; a missing dependency or unavailable environment is not a
pass. State material limitations without claiming broad correctness from one
green test or model capability from an unmeasured prompt.
