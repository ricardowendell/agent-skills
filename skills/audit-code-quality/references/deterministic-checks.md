# Deterministic checks: detect, run, record, classify

These are the signals that should not be a matter of opinion. The audit uses the
project's own tools and never installs one. A slot with no tool, no project
script and no reproducible output is **`unmeasured`** — never "clean", never a
zero.

## Slots

| Slot | Tool (examples) | Output | What the register cites |
| --- | --- | --- | --- |
| cycles / boundaries | `dependency-cruiser`, `madge --circular` | JSON | the cycle or the forbidden edge, the rule name |
| unused files / exports / deps | `knip` | JSON | the file, export or dependency, plus the entry point |
| duplication | `jscpd` | JSON | both locations and the duplicated block size |
| coverage | `c8`, `nyc`, `coverage.py` | summary | the measured percentage and the uncovered module |
| complexity / size | declared lint limits, `lizard` | JSON or text | the limit, the measured value and the file |
| Python boundaries / dead code | `import-linter`, `vulture`, `radon` | text or JSON | the import edge, the unused symbol or the complexity |

The tools are examples, not a dependency list. A project script that wraps one
of them (for example `npm run deps`, `just deps`, `uv run lint-imports`) is the
same slot and is preferred: it carries the project's pinned version and
configuration.

## Protocol, in order

1. **Detect** the tool or the project script. Read the project's own declaration:
   `package.json`, `justfile`, `Makefile`, `pyproject.toml`, `tox.ini`,
   `noxfile.py`, the CI file, the tool's config. Detection never installs and
   never rewrites a manifest or a lockfile.
2. **Run** the local binary or script with a pinned version, JSON output where
   the tool supports it, and a timeout. No network and no `npx --yes`. If only a
   global binary exists, record its version; do not upgrade it.
3. **Record** the exact command, its exit status and its count in
   `MEASUREMENTS`. The reader must be able to run the same line and get the same
   shape.
4. **Classify** each result (next section).
5. **Scope** to the declared path. Run the tool on that path when it accepts
   one; when it does not, record the whole-project result and mark the
   out-of-scope matches as not analyzed. Never infer coverage from a count of
   test files.

## Classification

| Result | Class | Register entry |
| --- | --- | --- |
| A violation of a written rule (declared no-cycle rule, configured threshold, reachability from the declared entry point) | `rule` | cite the rule's file and line, plus the tool output |
| A heuristic (unused export with dynamic imports in play, duplication below the configured threshold, an uncovered module) | `judgement` | state the cost and what would make it wrong |
| Tool absent, not declared, unconfigured, crashed, timed out or produced no parseable output | `unmeasured` | `not run: <command> — <reason>`; never clean |

A non-zero exit is not automatically a finding: read the tool's output. A
scanner that fails to start is `unmeasured`, not a cycle.

## Recording format

```text
MEASUREMENTS
- `./bin/dependency-cruiser src --output-type json` → exit 0; 1 cycle:
  src/app.js ↔ src/legacy.js (rule: no-circular)
- `./bin/knip --reporter json` → exit 0; 1 unused file: src/unused.js
- `c8 --reporter=json-summary` → not run: no coverage script declared
- `jscpd --reporters json` → unmeasured: not declared (no config, no script)
```

Name a tool only when its command ran. "The graph looks clean" is not a
measurement, and an absent tool is not a zero.
