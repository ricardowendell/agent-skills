# TypeScript/Node stack specifics

The default stack for a new repository, the alternatives that are supported
when a project already has them, and the measurements behind the choice.
Measured 2026-11-08 with the three throwaway fixtures described in
[Matrix](#matrix). No vendor benchmark was used; every number below is a
recorded run, and every command is reproducible.

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
compiler, linter or test runner. The cross-product runs are in
[Runtime and package manager](#runtime-and-package-manager).

## Compiler and modules

TypeScript 7.0.2 is the default. Its native compiler typechecked the library in
**171 ms** against **322 ms** for 6.0.3 in the same interleaved window (1.9x).
Emit was verified for both: ESM output with rewritten import extensions and
`.d.ts` files.

Two migration facts from the runs:

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

| Pair | lint | format:check | Combined | Limits |
| --- | --- | --- | --- | --- |
| **Oxlint + Prettier (default)** | 145 ms | 208 ms | **353 ms** | exact |
| Biome 2.6.6 | 141 ms | 135 ms | 276 ms | complexity replaced |
| ESLint 10 + typescript-eslint + Prettier | 384 ms | 208 ms | 592 ms | exact, type-aware |
| Oxlint + Oxfmt 0.77 | 145 ms | 144 ms | 289 ms | exact, formatter pre-1.0 |

The default gives up about **77 ms** per full check against Biome to keep the
four quality limits with their shipped severities and options, without adding a
second linter. Oxlint is 2.6x faster than ESLint at linting and, unlike ESLint,
has no TypeScript peer cap.
Prettier is kept over Oxfmt: it is a stable 3.x and formats the Markdown/JSON/YAML
that a repository also contains. The **64 ms** it costs over Oxfmt is accepted to
avoid formatter churn and a 0.x dependency.

Biome is a supported alternative when a single binary matters. It is stable
2.x and the fastest pair, but its complexity rule is cognitive, not cyclomatic;
the replacement is stated under [Quality limits](#quality-limits).

Oxfmt is a supported alternative for projects that only format JavaScript and
TypeScript and accept a pre-1.0 tool. It is not the default.

## Quality limits

The default reproduces the four limits, severities and options that
`skills/bootstrap-project-harness/templates/ts/eslint.config.js.template` ships
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

**The Biome divergence, measured.** A fixture with a 12-branch function, a
five-times-nested function, a five-parameter function, a 73-line function and a
210-line file produced:

- Oxlint: 4 findings — the 12-branch function (complexity 13), the parameters,
  the 73-line function, the 210-line file. The nested function was not flagged
  (cyclomatic complexity 6).
- ESLint with the same four rules: the same 4 findings.
- Biome: 5 findings — all of the above plus the nested function, because
  cognitive complexity scores nesting.

The shipped warn/skip options were checked separately. A 209-line file with 30
comment lines and 29 blank lines, and a 67-line function with 8 comment lines
and blank lines, pass Oxlint and ESLint with the skip flags and pass Biome with
`skipBlankLines`; Oxlint and ESLint produce the same two warnings when the flags
are removed. All three flag the dense controls (a 210-line file and a 68-line
function) with the skip flags on. Biome passed the same sparse fixture with only
`skipBlankLines` set and flagged the dense controls; that is an observed match
on these fixtures, not a claim about why. The measured divergence is the
complexity rule, not the line-rule results.

Cognitive complexity is not a superset of cyclomatic complexity: a wide
`switch` adds many cyclomatic paths but one cognitive point, so Biome would miss
it. Choosing Biome therefore replaces the complexity gate; the line rules behave
the same on the fixtures. That is why it is not the default.

**Proposed tightening for SPEC-0043 (not decided here).** Raising the two line
rules from `warn` to `error`, or counting blank and comment lines, would change
what the harness ships and needs its own baseline. It is not in the table above.
The table mirrors the template so this reference cannot claim a limit the
scaffold does not install; if SPEC-0043 adopts a tightening, it must change the
template and this table in the same diff.

## Tests and scripts

`node:test` is the default. It needs no dependency, runs TypeScript directly on
Node 24, and was **1.5–1.6x faster** than Vitest: 239 ms vs 365 ms on the API
fixture and 191 ms vs 301 ms on the CLI.

Vitest 5.1 is the supported alternative when watch mode, a browser runner or
its reporting is wanted. Its cost is visible: +30% on clean install
(602 → 780 ms, two extra packages) and a test-file migration — Vitest does not
run `node:test` files, has no `before`/`after` aliases (they are
`beforeAll`/`afterAll`), so every test import and hook name changes. `bun test`
runs `node:test` files unchanged (verified) and is 7x faster, but only when the
Bun runtime is chosen.

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

`build` exists only for a library or CLI. Coverage was measured once per runner:
`node:test` 313 ms, Vitest 506 ms, `bun test` 84 ms. Vitest coverage needs
`@vitest/coverage-v8` pinned to the same version.

## Build, API and monorepo

- **API/backend:** no build step. Node 24 runs the TypeScript directly; `tsc
  --noEmit` is the type gate. A bundler would add a second failure surface for
  no runtime benefit.
- **Library and CLI:** `tsc` is the default build (158 ms) and produces ESM plus
  declarations. `tsdown` 0.23.7 is the supported alternative for bundling or
  dual-format output: 231 ms on the same library (+46%), still pre-1.0, emits
  `.mjs`/`.d.mts` by default (the `exports` map must match), and warns that its
  `tsgo` generator is deprecated on TypeScript 7.0.
- **Monorepo:** npm workspaces; no Turbo/Nx by default. In a two-package
  workspace, `npm run check --workspaces` took 257–278 ms and Turbo 2.11.10 took
  178–208 ms, but added 36 MB of `node_modules`, a `turbo.json`, and a
  `packageManager` requirement, and reported `Cached: 0` on consecutive runs in
  this fixture. That is not enough to earn a default; add Turbo when a workspace
  has cacheable outputs large enough to pay for it.

## Runtime and package manager

The default is Node 24 + npm. The alternatives were measured as separate
choices, and the cross-product runs pass in both directions:

| Combination | `test` | `lint` |
| --- | --- | --- |
| Node 24 + npm-installed deps | 174 ms | 124 ms |
| Bun 1.3 runtime + npm-installed deps | 25 ms | 54 ms |
| Node 24 + Bun-installed deps | 178 ms | 122 ms |

- **pnpm 11.1** is supported. Clean install with a warm cache was 422 ms
  against 824 ms for npm, but each script invocation pays the pnpm wrapper:
  `lint` 265 ms vs 142 ms and `test` 318 ms vs 217 ms in the same window. For a
  small repository the per-gate cost is larger than the install saving.
- **Bun 1.3** is supported as runtime and package manager. Warm frozen install
  was 43 ms, `bun test` 24–30 ms, and `bun audit` exists. Its numbers are the
  fastest measured, but it is not the default: Node 24 is an LTS line with a
  published support window, the project's CI images and native dependencies are
  exercised against Node's ABI, and Bun is a different runtime contract that
  needs its own CI coverage. No runner here typechecks — `tsc --noEmit` remains
  the type gate under Node and under Bun alike.
- **Node floor:** 22.18, where type stripping became available without a flag.
  TypeScript 7's `tsc`, `tsdown` and Vitest have their own floors (see
  [Minimum versions](#minimum-versions)).

## Supply chain and CI

### Audit behaviour, measured

`--audit-level=high` against a real high-severity dependency (`lodash@4.17.20`):

| Manager | Command | Result |
| --- | --- | --- |
| npm 11.12 | `npm audit --audit-level=high` | exit 1, 1 high |
| pnpm 11.1 | `pnpm audit --audit-level high` | exit 1, 2 high + 2 moderate |
| Bun 1.3 | `bun audit` | exit 1, 2 high + 2 moderate |

A clean dependency (`nanoid@5.1.16`) exits 0 with `found 0 vulnerabilities`.
The advisory database changes over time: `lodash@4.17.20` and even `4.17.21`
were both reported high on the measurement day. A pinned dependency can become
vulnerable without a code change, which is why the audit is scheduled nightly as
well as run on pull requests.

**Exit code 1 is ambiguous.** An unreachable registry also exits 1:

| Manager | Output on `--registry http://127.0.0.1:1` |
| --- | --- |
| npm | `ECONNREFUSED`; `--json` emits `{ "message": …, "error": … }` with no `vulnerabilities` |
| pnpm | `TypeError: fetch failed` (no JSON) |
| Bun | `ConnectionRefused: audit request failed` |

The gate therefore parses `--json` (or the error text when parsing fails) and
distinguishes **a finding** from **unavailable**. It never treats exit 1 as
green and never uses `|| true`.

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
  `package.json` (`EUSAGE`, verified), so a dependency change cannot ride in
  without a lockfile update.
- `packageManager` names the package manager and version; `.nvmrc` and
  `engines.node` name the runtime. No `latest` tag in a dependency, a CLI
  install, or a workflow.
- GitHub Actions are pinned by full commit SHA, with the version in a comment.
  OSV-Scanner, CodeQL and Gitleaks are pinned the same way. `permissions:` is
  least privilege (`contents: read` by default).
- Tool versions in the reference are exact; upgrading one is a deliberate diff
  with its own measurement, not a floating range.

## Gate tiers

Measured on the default stack, warm cache, interleaved window. Times are wall
clock for the whole fixture.

| Tier | Checks | Approximate cost |
| --- | --- | --- |
| local-fast (pre-commit) | `format:check`, `lint`, `typecheck`, `test` on changed files | 763 ms (208 + 145 + 171 + 239) |
| pre-push | the above plus `build` | 920 ms |
| PR | `npm ci`, `check`, audit, OSV, CodeQL, Gitleaks; Node 24 and the 22.18 floor | 1.5 s local commands + scans |
| nightly/release | PR set plus coverage, full audit, semver/CHANGELOG/tag | 2.1 s local commands + scans |

Skipped work is named, not silent: local-fast skips audit, build and coverage;
pre-push skips coverage and the security scans; PR skips the release tag.
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

## Matrix

### Method

Three fixtures, all outside this repository and not committed:

- **CLI:** argument parsing with `node:util.parseArgs`, a `greet` function, four
  `node:test` cases.
- **API/backend:** a pure request handler (health, create/list notes, invalid
  JSON) plus a real `node:http` server exercised with `fetch` on port 0; four
  tests.
- **Library:** `slugify` and a generic `chunk`, four tests, an ESM build with
  declarations.

Six stacks per profile: Biome, ESLint + typescript-eslint + Prettier, Oxlint +
Oxfmt, Biome with pnpm, Biome with Bun (runtime and package manager), and Biome
with Vitest. Every cell used the same strict compiler settings, the same
`strict`/`noUncheckedIndexedAccess`/`exactOptionalPropertyTypes` flags and
`@types/node@26.6.6`.

Commands, run in each cell:

```sh
npm install                                  # once, creates the lockfile
rm -rf node_modules && npm ci                # clean install, warm cache
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build                                # library and CLI only
rm -rf node_modules && npm ci && npm run check   # CI equivalent
```

pnpm uses `pnpm install --frozen-lockfile` and `pnpm run <script>`; Bun uses
`bun install --frozen-lockfile`, `bun run <script>` and `bun test`. Each command
ran once cold (first execution after install) and three times warm; the table
shows cold → warm median (min–max). Clean installs are three warm-cache runs;
the cold-cache column is one run with an isolated empty cache and is
network-bound (3.2–22.7 s across cells). The CI-total column is a single
end-to-end sample per cell, the same disclosure as the cold install; only the
individual commands carry a median and spread. Versions are the pinned set in
[Minimum versions](#minimum-versions); every cell used exactly those versions,
except TypeScript 6.0.3 in the ESLint cell because of its peer range.

Host: macOS 27.2, Apple M4 Max, 14 cores, 36 GB, Node 24.15.0 arm64. Load
average during the sweep was 8–15; that makes absolute medians only comparable
within one sweep. The decisive comparisons were re-run round-robin, one
comparison per window (next section), which is why they are quoted above.

### CLI

| stack | install cold / clean (ms) | format:check cold → warm | lint cold → warm | typecheck cold → warm | test cold → warm | build cold → warm | CI total (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| biome | 8624 / 576 (559–584) | 254 → 131 (129–138) | 153 → 128 (128–133) | 211 → 140 (137–145) | 197 → 185 (182–187) | 169 → 139 (138–147) | 1451 (exit 0) |
| eslint | 4369 / 487 (462–505) | 221 → 199 (198–206) | 427 → 322 (321–325) | 324 → 313 (312–318) | 198 → 195 (191–198) | 323 → 313 (312–317) | 1720 (exit 0) |
| oxlint | 3213 / 418 (403–425) | 151 → 135 (130–137) | 150 → 130 (126–136) | 199 → 140 (137–142) | 187 → 182 (181–184) | 180 → 154 (151–156) | 1255 (exit 0) |
| biome-pnpm | 5964 / 349 (330–358) | 657 → 290 (280–309) | 274 → 256 (249–258) | 371 → 267 (264–279) | 309 → 299 (288–303) | 263 → 260 (255–267) | 1978 (exit 0) |
| biome-bun | 8074 / 26 (24–26) | 404 → 60 (57–64) | 64 → 61 (59–62) | 131 → 72 (68–78) | 27 → 25 (25–27) | 67 → 66 (65–66) | 664 (exit 0) |
| vitest | 9207 / 763 (763–766) | 250 → 136 (132–160) | 150 → 139 (138–141) | 232 → 160 (147–175) | 393 → 315 (308–318) | 166 → 150 (150–156) | 1855 (exit 0) |

### API/backend

| stack | install cold / clean (ms) | format:check cold → warm | lint cold → warm | typecheck cold → warm | test cold → warm | CI total (ms) |
| --- | --- | --- | --- | --- | --- | --- |
| biome | 11997 / 724 (619–845) | 260 → 141 (139–148) | 157 → 134 (130–135) | 216 → 145 (145–147) | 240 → 226 (225–242) | 1494 (exit 0) |
| eslint | 4871 / 487 (482–509) | 229 → 206 (206–214) | 649 → 357 (354–357) | 375 → 326 (323–337) | 230 → 227 (226–228) | 1937 (exit 0) |
| oxlint | 5273 / 445 (444–466) | 150 → 134 (132–149) | 147 → 135 (132–135) | 225 → 159 (156–175) | 231 → 225 (224–232) | 1255 (exit 0) |
| biome-pnpm | 9211 / 361 (351–363) | 444 → 279 (266–307) | 301 → 263 (257–277) | 345 → 273 (264–275) | 344 → 337 (335–338) | 1854 (exit 0) |
| biome-bun | 17304 / 28 (25–28) | 233 → 66 (66–66) | 101 → 63 (62–66) | 162 → 78 (78–80) | 42 → 33 (32–33) | 413 (exit 0) |
| vitest | 22667 / 815 (778–982) | 374 → 138 (136–140) | 170 → 141 (138–144) | 234 → 162 (160–163) | 408 → 318 (318–333) | 1872 (exit 0) |

The vitest row was re-measured after a fixture fix (Vitest hook names) and is
from a separate window; its install column is not comparable to the other rows.
The interleaved test comparison below is the fair one.

### Library

| stack | install cold / clean (ms) | format:check cold → warm | lint cold → warm | typecheck cold → warm | test cold → warm | build cold → warm | CI total (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| biome | 13922 / 691 (642–851) | 351 → 146 (136–148) | 155 → 151 (143–154) | 228 → 149 (147–150) | 205 → 197 (187–202) | 181 → 153 (148–156) | 1451 (exit 0) |
| eslint | 5139 / 524 (495–538) | 236 → 217 (210–221) | 705 → 402 (374–422) | 367 → 336 (334–344) | 200 → 196 (188–202) | 333 → 305 (303–314) | 1796 (exit 0) |
| oxlint | 5338 / 461 (413–462) | 173 → 137 (132–141) | 146 → 134 (128–135) | 429 → 156 (146–234) | 189 → 187 (186–192) | 163 → 152 (144–176) | 1204 (exit 0) |
| biome-pnpm | 4166 / 550 (479–563) | 485 → 277 (270–284) | 300 → 334 (288–375) | 453 → 368 (323–369) | 327 → 309 (302–350) | 401 → 338 (296–356) | 2518 (exit 0) |
| biome-bun | 7787 / 55 (47–56) | 255 → 106 (102–295) | 208 → 125 (114–131) | 288 → 106 (103–133) | 39 → 46 (40–46) | 151 → 124 (110–124) | 510 (exit 0) |
| vitest | 16852 / 778 (771–1012) | 421 → 146 (138–150) | 184 → 156 (147–166) | 272 → 175 (166–185) | 447 → 342 (330–347) | 207 → 170 (164–191) | 2108 (exit 0) |

### Interleaved head-to-head

Each comparison ran round-robin in a single window so load hit every lane in
that row equally. Medians, n=7 (test/lint/typecheck/install) or n=5
(format/build/cross-runtime).

The CLI install rows are the one place where the sweep and this window disagree
in absolute terms: across the npm CLI cells the sweep reads 418–766 ms (418 ms
on the default Oxlint cell; 576 ms belongs to the Biome cell), while `npm ci`
reads 824 ms in this window, when the host was under higher load. Within each
window the ordering is stable (npm > pnpm > Bun), and the 824/422/43 ratios are
the ones used for the decision. The difference is the window and load, not the
stack.

| Lane | Median | Range |
| --- | --- | --- |
| lint: Oxlint (library) | 145 ms | 128–169 |
| lint: Biome (library) | 141 ms | 131–277 |
| lint: ESLint (library) | 384 ms | 351–582 |
| format:check: Prettier | 208 ms | 195–232 |
| format:check: Biome | 135 ms | 129–157 |
| format:check: Oxfmt | 144 ms | 133–165 |
| test: API, `node:test` | 239 ms | 225–259 |
| test: API, Vitest | 365 ms | 327–388 |
| test: CLI, `node:test` | 191 ms | 185–234 |
| test: CLI, Vitest | 301 ms | 289–374 |
| test: CLI, `bun test` | 30 ms | 26–58 |
| typecheck: TypeScript 7.0.2 | 171 ms | 143–198 |
| typecheck: TypeScript 6.0.3 | 322 ms | 300–355 |
| build: `tsc` | 158 ms | 148–188 |
| build: `tsdown` | 231 ms | 219–552 |
| install: npm `ci` (CLI) | 824 ms | 751–989 |
| install: pnpm frozen (CLI) | 422 ms | 409–501 |
| install: Bun frozen (CLI) | 43 ms | 38–57 |
| install: npm `ci` (API) | 602 ms | 560–656 |
| install: npm `ci` (API + Vitest) | 780 ms | 752–916 |
| test: Node runtime + npm deps | 174 ms | 173–175 |
| test: Bun runtime + npm deps | 25 ms | 24–28 |
| test: Node runtime + Bun deps | 178 ms | 167–190 |
| lint: Node runtime + npm deps | 124 ms | 122–186 |
| lint: Bun runtime + npm deps | 54 ms | 52–124 |
| lint: Node runtime + Bun deps | 122 ms | 120–132 |

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
- The fixtures are throwaway and not committed. Their commands, versions and
  outputs are recorded above; the repository only ships this document and the
  spec that records the decision.
