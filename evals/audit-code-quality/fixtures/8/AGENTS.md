# Eval repo

## Rules

- No dependency cycles. `src/app.js` is the only entry point.
- A file that is not reachable from `src/app.js` is dead code.
- A module imports only what it uses; every export has a consumer.

## Commands

- Test: none configured
- Coverage: none configured
- Lint: none configured
- Dependency graph and cycles: `./bin/dependency-cruiser src --output-type json`
- Unused files and exports: `./bin/knip --reporter json`
