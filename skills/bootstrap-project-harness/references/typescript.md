# TypeScript/Node stack specifics

The default stack for a new repository, the supported alternatives when a
project already has them, and the condition under which each is the right
choice. A number appears here only when it decides something; the comparison
that produced it is not part of the decision and does not live in this file.

The change is additive. An existing stack is detected and preserved
(`SPEC-0042`); nothing here forces a migration.

## Default for an empty repository

| Component | Default | Pin |
| --- | --- | --- |
| Runtime | Node.js 24 LTS | `24.15.0` (`.nvmrc`, `engines.node >= 22.18.0`) |
| Package manager | npm | `npm@11.12.1` (`packageManager`) |
| Compiler | TypeScript | `7.0.2` |
| Modules | ESM, `NodeNext`, native type stripping | — |
| Linter | Oxlint | `1.92.0` |
| Formatter | Prettier | `3.9.10` |
| Tests | `node:test` | built into Node |
| Build (library/CLI only) | `tsc -p tsconfig.build.json` | — |
| Hooks | Lefthook | unchanged by this decision |
| Commit messages | commitlint | unchanged by this decision |
| Monorepo | npm workspaces; no Turbo/Nx by default | — |

Runtime and package manager are separate choices. The default pairs Node with
npm because that is one installation and one lockfile; a project may use Node
with pnpm, or Bun with npm-installed dependencies, without changing the
compiler, linter or test runner.

## Compiler and modules

TypeScript 7.0.2 is the default. Two facts decide the configuration:

- **`types: ["node"]` is explicit.** With `@types/node@26.6.6`, TypeScript 6
  and 7 no longer auto-include `@types`; 5.9 did. Without the field, `process`
  and `node:test` are unresolved (`TS2591`).
- **`rootDir` is explicit.** Emitting with 6 or 7 fails with `TS5011` unless
  `rootDir` is set.

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "types": ["node"],
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "test"]
}
```

`src` imports use `.ts` specifiers (`./args.ts`). Node 24 runs those directly;
`rewriteRelativeImportExtensions` turns them into `.js` on emit. The build
config adds `"noEmit": false`, `"rootDir": "src"`, `"outDir": "dist"` and
`"declaration": true` with `"include": ["src"]`.

`erasableSyntaxOnly` is the gate that keeps the source runnable by Node's type
stripping. An `enum` is rejected by Node (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`)
and by `tsc` (`TS1294`); no enums, namespaces or parameter properties.

TypeScript 6.0.3 is the supported compiler when the ESLint stack is chosen:
`typescript-eslint@8.72.1` declares `typescript >=4.8.4 <6.1.0`, and installing
7.0.2 fails with `ERESOLVE`. The other two lint stacks have no TypeScript peer
range.

## Lint and formatter

One tool per responsibility: **Oxlint** lints, **Prettier** formats. They do
not compete, and no second linter is added.

| Pair | Limits | Choose when |
| --- | --- | --- |
| **Oxlint + Prettier (default)** | exact | new repository; the four limits with their shipped severities |
| Biome 2.6.6 | complexity replaced | a single binary matters more than an exact cyclomatic gate |
| ESLint 10 + typescript-eslint + Prettier | exact, type-aware | type-aware rules are required; costs a second dependency stack and caps TypeScript at 6 |
| Oxlint + Oxfmt 0.77 | exact, formatter pre-1.0 | only JS/TS is formatted and a 0.x formatter is acceptable |

The default keeps the four quality limits with their shipped severities and
options, without adding a second linter. Prettier is kept over Oxfmt because it
is a stable 3.x and formats the Markdown/JSON/YAML a repository also contains;
swapping it for a pre-1.0 formatter buys speed at the cost of formatter churn.

Biome is a supported alternative when a single binary matters. It is stable
2.x, but its complexity rule is cognitive, not cyclomatic; the replacement is
stated under [Quality limits](#quality-limits).

Oxfmt is a supported alternative for projects that only format JavaScript and
TypeScript and accept a pre-1.0 tool. It is not the default.

## Quality limits

The default reproduces the four limits, severities and options that
`skills/bootstrap-project-harness/templates/ts/.oxlintrc.json.template` ships
today. Nothing in this table is a tightening.

| Limit | Default (Oxlint) | ESLint alternative | Biome alternative |
| --- | --- | --- | --- |
| Cyclomatic complexity 10 | `error` | `error` | `error`, but cognitive (`noExcessiveCognitiveComplexity`, `maxAllowedComplexity: 10`) |
| Max parameters 4 | `error` | `error` | `error` (`useMaxParams`, `max: 4`) |
| Max 60 lines/function | `warn`, `skipBlankLines: true`, `skipComments: true` | same | `warn`, `maxLines: 60`, `skipBlankLines: true` |
| Max 200 lines/file | `warn`, `skipBlankLines: true`, `skipComments: true` | same | `warn`, `maxLines: 200`, `skipBlankLines: true` |

Coverage stays optional.

`.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn", "oxc"],
  "categories": { "correctness": "error", "suspicious": "warn" },
  "rules": {
    "complexity": ["error", { "max": 10 }],
    "max-params": ["error", 4],
    "max-lines-per-function": ["warn", { "max": 60, "skipBlankLines": true, "skipComments": true }],
    "max-lines": ["warn", { "max": 200, "skipBlankLines": true, "skipComments": true }]
  }
}
```

**Cognitive complexity is not a superset of cyclomatic complexity.** A wide
`switch` adds many cyclomatic paths but one cognitive point, so Biome would miss
it. Choosing Biome therefore replaces the complexity gate; its line rules behave
the same. That is why it is not the default. The table mirrors the template so this reference cannot claim a limit
the scaffold does not install; a tightening changes the template and this table
in the same diff.

## Tests and scripts

`node:test` is the default. It needs no dependency and runs TypeScript directly
on Node 24; `bun test` runs the same files unchanged when Bun is the runtime.

Vitest 5.1 is the supported alternative when watch mode, a browser runner or
its reporting is wanted. Its cost is a test-file migration — Vitest does not
run `node:test` files and has no `before`/`after` aliases (they are
`beforeAll`/`afterAll`), so every test import and hook name changes.

```json
{
  "scripts": {
    "lint": "oxlint src test",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "node --test \"test/**/*.test.ts\"",
    "test:watch": "node --test --watch \"test/**/*.test.ts\"",
    "coverage": "node --test --experimental-test-coverage \"test/**/*.test.ts\"",
    "check": "npm run format:check && npm run lint && npm run typecheck && npm test",
    "docs:check": "node docs-check.mjs",
    "build": "tsc -p tsconfig.build.json"
  }
}
```

`build` exists only for a library or CLI. Vitest coverage needs
`@vitest/coverage-v8` pinned to the same version.

## Build, API and monorepo

- **API/backend:** no build step. Node 24 runs the TypeScript directly; `tsc
  --noEmit` is the type gate. A bundler would add a second failure surface for
  no runtime benefit.
- **Library and CLI:** `tsc` is the default build and produces ESM plus
  declarations. `tsdown` 0.23.7 is the supported alternative for bundling or
  dual-format output: still pre-1.0, emits `.mjs`/`.d.mts` by default (the
  `exports` map must match), and warns that its `tsgo` generator is deprecated
  on TypeScript 7.0.
- **Monorepo:** npm workspaces; no Turbo/Nx by default. Turbo adds
  `node_modules`, a `turbo.json` and a `packageManager` requirement; add it when
  a workspace has cacheable outputs large enough to pay for it.

## Runtime and package manager

The default is Node 24 + npm; runtime and package manager are independent
choices.

- **pnpm 11.1** is supported. Each script invocation pays the pnpm wrapper, so
  for a small repository the per-gate cost is larger than the install saving.
- **Bun 1.3** is supported as runtime and package manager. It is not the
  default: Node 24 is an LTS line with a published support window, the project's
  CI images and native dependencies are exercised against Node's ABI, and Bun is
  a different runtime contract that needs its own CI coverage. No runner here
  typechecks — `tsc --noEmit` remains the type gate under Node and under Bun
  alike.
- **Node floor:** 22.18, where type stripping became available without a flag.
  TypeScript 7's `tsc`, `tsdown` and Vitest have their own floors (see
  [Minimum versions](#minimum-versions)).

## Supply chain and CI

### Audit behaviour

`--audit-level=high` exits 1 both for a real finding and for an unreachable
registry (`ECONNREFUSED`, `fetch failed`, `audit request failed`), so exit 1 is
ambiguous. The gate parses `--json` (or the error text when parsing fails) and
distinguishes **a finding** from **unavailable**. It never treats exit 1 as
green and never uses `|| true`.

A pinned dependency can become vulnerable without a code change, which is why
the audit is scheduled nightly as well as run on pull requests.

### Policy per gate

| Tier | Audit | Unavailable registry | Real finding |
| --- | --- | --- | --- |
| local-fast | not run (stated skip, no green claim) | — | — |
| pre-push | `npm audit --json --audit-level=high` | warn, continue (fail-open) | fail |
| PR | same, plus OSV/CodeQL/Gitleaks | **fail** (red, labelled unavailable) | fail |
| nightly/release | same, scheduled | **fail** | fail |

A skipped audit is never reported as a pass: local-fast prints that the audit
did not run.

### Pins and frozen installs

- Exact versions in `devDependencies`; a committed `package-lock.json`;
  `npm ci` everywhere in CI. `npm ci` rejects a lockfile that drifted from
  `package.json` (`EUSAGE`), so a dependency change cannot ride in without a
  lockfile update.
- `packageManager` names the package manager and version; `.nvmrc` and
  `engines.node` name the runtime. No `latest` tag in a dependency, a CLI
  install, or a workflow.
- GitHub Actions are pinned by full commit SHA, with the version in a comment.
  OSV-Scanner, CodeQL and Gitleaks are pinned the same way. `permissions:` is
  least privilege (`contents: read` by default).
- Tool versions in this reference are exact; upgrading one is a deliberate diff,
  not a floating range.

## Gate tiers

| Tier | Checks | Skipped, and named |
| --- | --- | --- |
| local-fast (pre-commit) | `format:check`, `lint`, `typecheck`, `test` on changed files | audit, build, coverage |
| pre-push | the above plus `build` | coverage and the security scans |
| PR | `npm ci`, `check`, audit, OSV, CodeQL, Gitleaks; Node 24 and the 22.18 floor | the release tag |
| nightly/release | PR set plus coverage, full audit, semver/CHANGELOG/tag | — |

`--no-verify` is a human escape hatch, not a CI behaviour.

## Compatibility

- Detect and preserve: if `package.json` already names ESLint, Biome, TSLint,
  Jest, Vitest, Bun, pnpm or another runner, keep it. Do not add a second linter
  or formatter.
- New repositories get the default. Existing repositories get only additive
  pieces (for example a missing `check` script), never a rewritten config.
- If the detected stack cannot express a limit, record the replacement in the
  project, as with Biome's cognitive complexity; do not drop the limit
  silently.
- No forced migration and no rewrite of the skills runtime or the pdlc.

## Minimum versions

| Tool | Default / supported | Why this floor |
| --- | --- | --- |
| Node.js | 24.15.0 (default), 22.18.0 floor | type stripping without a flag from 22.18; Vitest allows ^22.12, tsdown ^22.18 |
| npm | 11.12.1 | bundled with Node 24.15; `packageManager` pin |
| pnpm | 11.1.2 (alternative) | lockfile and `--frozen-lockfile` |
| Bun | 1.3.14 (alternative) | `bun audit`, `bun test`, `node:test` compatibility |
| TypeScript | 7.0.2 (default), 6.0.3 with ESLint | `>=5.7` for `rewriteRelativeImportExtensions`, `>=5.8` for `erasableSyntaxOnly`; `typescript-eslint@8.72.1` accepts `<6.1.0` |
| Oxlint | 1.92.0 | the four limit rules and `correctness` categories |
| Prettier | 3.9.10 | Markdown/JSON/YAML formatting |
| Biome | 2.6.6 (alternative) | stable 2.x, `preset: recommended` |
| ESLint | 10.14.0 (alternative) | flat config, `typescript-eslint@8.72.1` peer |
| typescript-eslint | 8.72.1 (alternative) | peer `eslint ^8.57 \|\| ^9 \|\| ^10` |
| Vitest | 5.1.0 (alternative) | engines `^22.12 \|\| ^24 \|\| >=26` |
| tsdown | 0.23.7 (alternative) | engines `^22.18 \|\| ^24.11 \|\| >=26` |
| @types/node | 26.6.6 | the version measured; pin it instead of floating |

## Official links

- Node.js releases and type stripping: <https://nodejs.org/en/about/previous-releases>, <https://nodejs.org/api/typescript.html>
- Node test runner: <https://nodejs.org/api/test.html>
- npm audit: <https://docs.npmjs.com/cli/commands/npm-audit>; pnpm audit: <https://pnpm.io/cli/audit>; Bun audit: <https://bun.com/docs/install/audit>
- pnpm: <https://pnpm.io/installation>; Bun: <https://bun.com/docs>
- TypeScript config: <https://www.typescriptlang.org/tsconfig>
- Oxlint: <https://oxc.rs/docs/guide/usage/linter>; Oxfmt: <https://oxc.rs/docs/guide/usage/formatter>
- Prettier: <https://prettier.io/docs/>
- Biome: <https://biomejs.dev/guides/getting-started/>
- typescript-eslint: <https://typescript-eslint.io/getting-started/>
- ESLint: <https://eslint.org/docs/latest/use/getting-started>
- Vitest: <https://vitest.dev/guide/>
- tsdown: <https://tsdown.dev/guide/>
- Turbo: <https://turbo.build/repo/docs>; Nx: <https://nx.dev/getting-started/intro>
- OSV-Scanner: <https://google.github.io/osv-scanner/>
- CodeQL: <https://codeql.github.com/docs/>
- Gitleaks: <https://github.com/gitleaks/gitleaks>
- GitHub Actions hardening and SHA pinning: <https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions>
- Dependency cooldowns and lockfile policy: <https://docs.npmjs.com/cli/configuring-npm/package-lock-json>

## Notes

- The pre-commit hook is a separate decision; this document does not change
  Lefthook or commitlint.
- Commit block (unchanged): the pre-commit hook rejects `*.env`, `*.env.*`,
  `*.db` and `data/*` (`skills/bootstrap-project-harness/templates/ts/lefthook.yml`).
- Docs sensor (unchanged): `node docs-check.mjs` from `templates/ts/`, installed
  by `SKILL.md` step 12 and run as `docs:check` in the pre-push tier.
- OpenCode's built-in **prettier** formatter formats `.ts`/`.js` on edit — expect
  edited files to be reformatted.
- Optional: dependency-cruiser for modularity (`templates/ts/dependency-cruiser-rules.md`).
