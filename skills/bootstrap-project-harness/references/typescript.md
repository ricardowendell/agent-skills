# TypeScript/Node stack specifics

Toolchain: bun (runtime + deps), TypeScript, ESLint (flat config), Prettier,
Vitest/Jest, Lefthook (hooks), commitlint (commit messages). lint-staged for
staged-file checks. Technical templates live in `templates/ts/`.

## Linter limits

| Metric                  | Limit    |
| ----------------------- | -------- |
| Cyclomatic complexity   | error 10 |
| Max params per function | error 4  |
| Max lines per function  | warn 60  |
| Max lines per file      | warn 200 |
| Min test coverage       | optional |

## Security

Block `.env`, `.db`, and data files at commit. Run `bun audit --audit-level=high`
(pre-commit skips it when the registry is unreachable).

## Language quick reference

| Component       | Tool             |
| --------------- | ---------------- |
| Type check      | `tsc --noEmit`   |
| Linter          | ESLint           |
| Formatter       | Prettier         |
| Tests           | Vitest or Jest   |
| Hook manager    | Lefthook         |
| Commit messages | commitlint       |
| Docs sensor     | `node docs-check.mjs` |

## Notes

- Runtime pin: `.nvmrc` (or `.node-version`).
- OpenCode's built-in **prettier** formatter formats `.ts`/`.js` on edit — expect
  edited files to be reformatted.
- Optional: dependency-cruiser for modularity (`templates/ts/dependency-cruiser-rules.md`).
