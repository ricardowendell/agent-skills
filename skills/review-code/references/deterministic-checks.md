# Deterministic checks: diff first, detect, run, record, classify

These are the signals in a diff that should not be a matter of opinion. The
review uses the project's own tools; it never installs one. The layer is
diff-scoped: a slot is opened only when the changed paths can reach it. A slot
with no tool and no project script is **`unverified`** — never "clean", never a
zero, and never a blocking finding on its own.

Fix the review object first (`git diff --name-only <base>...<head>` and the
changed hunks). Every command below is scoped to those paths; when a tool only
accepts a directory, run it there and discard matches outside the diff.

## Slots

| Slot | Tool (examples) | When the diff has | What the review cites |
| --- | --- | --- | --- |
| security patterns | `semgrep --baseline-commit <base>` | code or config | the rule id, the `file:line`, the flow |
| secrets | `gitleaks` | files or history | the path and the redacted match location |
| dependencies | `osv-scanner` | a lockfile or manifest | the package, version and advisory id |
| workflows | `actionlint`, `zizmor` | `.github/**` | the workflow file, line and rule |
| shell | `shellcheck` | `*.sh` | the path, line and rule code |
| dead code / cycles | `knip`, `dependency-cruiser` | changed files only | the file, export or edge |
| type / test / lint | the project's commands | always, if declared | the exact command and exit |

The tools are examples, not a dependency list. A project script that wraps one
of them (`npm run lint`, `just test`, `uv run mypy`) is the same slot and is
preferred: it carries the pinned version and the project's configuration. A
project that already runs a tool in CI does not need a second opinion from a
locally invented command.

## Protocol, in order

1. **Scope.** List the changed files. A slot whose trigger is absent is not
   opened; record it as `not applicable` and move on.
2. **Detect** the tool or the project script from the project's own
   declaration: `package.json`, `justfile`, `Makefile`, `pyproject.toml`,
   `tox.ini`, the CI file, the tool's config. Detection never installs and never
   rewrites a manifest or a lockfile.
3. **Run** the local binary or script with a timeout, the changed path when the
   tool accepts one, and JSON output where it supports it. No network and no
   `npx --yes`. If only a global binary exists, record its version; do not
   upgrade it.
4. **Record** the exact command, its exit status and its count in
   `MEASUREMENTS`. The reader must be able to run the same line and get the same
   shape.
5. **Classify** each result (next section).
6. **Filter** tool output to the changed files. A violation outside the diff is
   recorded as context only; it cannot block this change.

## Classification

| Result | Class | Entry |
| --- | --- | --- |
| a violation of a written rule that the changed lines introduce or expose | `rule` | `blocking` when it breaks the spec, a public contract or a security boundary; otherwise `should-fix` |
| a heuristic (unused export with dynamic imports in play, duplication below the configured threshold, a cycle outside the changed path) | `judgement` | `should-fix` or `nit`; state the cost and what would make it wrong |
| tool absent, not declared, unconfigured, crashed, timed out or produced no parseable output | `unverified` | `not run: <command> — <reason>`; never a pass |

A non-zero exit is not automatically a finding: read the tool's output. A
scanner that fails to start is `unverified`, not a defect. A missing tool is
never a reason to reject the change, and a pass from a tool that did not run is
never evidence.

## Recording format

```text
MEASUREMENTS
- `semgrep scan --baseline-commit <base> --config <config>` → exit 1; 1 blocking:
  src/export.js:7 (rule: javascript.lang.security.detect-child-process)
- `gitleaks detect --source . --log-opts <base>..<head>` → exit 0; 0 leaks
- `actionlint .github/workflows/ci.yml` → not run: not declared in the project
- `knip --reporter json` → unverified: absent and no project script
```

Name a tool only when its command ran. "The scanner looks clean" is not a
measurement, and an absent tool is not a zero.
