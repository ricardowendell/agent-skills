---
id: SPEC-0058
title: The corpus leaves the skill
status: implemented
priority: P1
task: TASK-94
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-94 - evals-tirar-o-corpus-de-dentro-do-skill-SPEC-0058.md
  - docs/specs/SPEC-0057-the-cost-of-measuring.md
  - docs/evals/coverage.md
  - CONTRIBUTING.md
related_decisions: []
depends_on: []
blocks: []
files:
  - .githooks/pre-commit
  - .gitignore
  - CHANGELOG.md
  - CONTRIBUTING.md
  - docs/evals/coverage.md
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/pipeline-bookends-matrix.md
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/prompts/SPEC-0001-remeasure-eval-matrix.prompt.md
  - docs/prompts/SPEC-0003-deterministic-harness-state.prompt.md
  - docs/prompts/SPEC-0004-observable-near-misses.prompt.md
  - docs/prompts/SPEC-0005-approval-given-apply.prompt.md
  - docs/prompts/SPEC-0006-mutation-pilot-review-code.prompt.md
  - docs/prompts/SPEC-0046-deny-control-arm-corpus.prompt.md
  - docs/README.md
  - docs/specs/active/SPEC-0058-the-corpus-leaves-the-skill.md
  - evals/audit-code-quality/cases.md
  - evals/audit-code-quality/fixtures/1/AGENTS.md
  - evals/audit-code-quality/fixtures/1/docs/architecture.md
  - evals/audit-code-quality/fixtures/1/git.json
  - evals/audit-code-quality/fixtures/1/src/cart.js
  - evals/audit-code-quality/fixtures/1/src/legacy/report.js
  - evals/audit-code-quality/fixtures/1/src/math.js
  - evals/audit-code-quality/fixtures/1/src/pricing.js
  - evals/audit-code-quality/fixtures/4/AGENTS.md
  - evals/audit-code-quality/fixtures/4/git.json
  - evals/audit-code-quality/fixtures/4/src/legacy/util.js
  - evals/audit-code-quality/fixtures/4/src/payments/charge.js
  - evals/audit-code-quality/fixtures/4/src/payments/refund.js
  - evals/audit-code-quality/fixtures/5/AGENTS.md
  - evals/audit-code-quality/fixtures/5/docs/architecture.md
  - evals/audit-code-quality/fixtures/5/git.json
  - evals/audit-code-quality/fixtures/5/src/api/orders.js
  - evals/audit-code-quality/fixtures/5/src/orders/repository.js
  - evals/audit-code-quality/fixtures/5/src/orders/service.js
  - evals/audit-code-quality/fixtures/5/src/orders/validation.js
  - evals/audit-code-quality/fixtures/6/AGENTS.md
  - evals/audit-code-quality/fixtures/6/docs/architecture.md
  - evals/audit-code-quality/fixtures/6/git.json
  - evals/audit-code-quality/fixtures/6/src/api/quote.js
  - evals/audit-code-quality/fixtures/6/src/pricing/index.js
  - evals/audit-code-quality/fixtures/6/src/pricing/money.js
  - evals/audit-code-quality/fixtures/6/src/pricing/rules.js
  - evals/audit-code-quality/fixtures/7/AGENTS.md
  - evals/audit-code-quality/fixtures/7/docs/architecture.md
  - evals/audit-code-quality/fixtures/7/git.json
  - evals/audit-code-quality/fixtures/7/src/export.js
  - evals/audit-code-quality/fixtures/7/src/format/currency.js
  - evals/audit-code-quality/fixtures/7/src/format/date.js
  - evals/audit-code-quality/fixtures/7/src/format/percent.js
  - evals/audit-code-quality/fixtures/7/src/report.js
  - evals/audit-code-quality/fixtures/8/AGENTS.md
  - evals/audit-code-quality/fixtures/8/bin/dependency-cruiser
  - evals/audit-code-quality/fixtures/8/bin/knip
  - evals/audit-code-quality/fixtures/8/git.json
  - evals/audit-code-quality/fixtures/8/package.json
  - evals/audit-code-quality/fixtures/8/src/app.js
  - evals/audit-code-quality/fixtures/8/src/legacy.js
  - evals/audit-code-quality/fixtures/8/src/unused.js
  - evals/audit-code-quality/fixtures/9/git.json
  - evals/audit-docs/cases.md
  - evals/audit-docs/fixtures/1/AGENTS.md
  - evals/audit-docs/fixtures/1/docs/principles/design.md
  - evals/audit-docs/fixtures/1/docs/product/vision.md
  - evals/audit-docs/fixtures/3/AGENTS.md
  - evals/audit-docs/fixtures/3/change.patch
  - evals/audit-docs/fixtures/3/docs/architecture.md
  - evals/audit-docs/fixtures/3/docs/decisions/README.md
  - evals/audit-docs/fixtures/3/docs/product/vision.md
  - evals/audit-docs/fixtures/3/docs/system/README.md
  - evals/audit-docs/fixtures/3/git.json
  - evals/audit-docs/fixtures/4/AGENTS.md
  - evals/audit-docs/fixtures/4/docs/decisions/ADR-0001-remove-rate-cap.md
  - evals/audit-docs/fixtures/4/docs/specs/SPEC-0002-refunds.md
  - evals/audit-docs/fixtures/4/docs/system/gates.md
  - evals/audit-docs/fixtures/4/docs/system/limits.md
  - evals/audit-docs/fixtures/4/docs/system/rate.md
  - evals/audit-docs/fixtures/4/package.json
  - evals/audit-docs/fixtures/4/src/rate.js
  - evals/audit-docs/fixtures/4/test/rate.test.js
  - evals/bootstrap-project-harness/cases.md
  - evals/bootstrap-project-harness/fixtures/1/package.json
  - evals/bootstrap-project-harness/fixtures/1/README.md
  - evals/bootstrap-project-harness/fixtures/1/src/index.ts
  - evals/bootstrap-project-harness/fixtures/1/tsconfig.json
  - evals/bootstrap-project-harness/fixtures/10/.pre-commit-config.yaml
  - evals/bootstrap-project-harness/fixtures/10/.python-version
  - evals/bootstrap-project-harness/fixtures/10/pyproject.toml
  - evals/bootstrap-project-harness/fixtures/11/poetry.lock
  - evals/bootstrap-project-harness/fixtures/11/pyproject.toml
  - evals/bootstrap-project-harness/fixtures/14/.editorconfig
  - evals/bootstrap-project-harness/fixtures/14/.github/workflows/ci.yml
  - evals/bootstrap-project-harness/fixtures/14/.gitignore
  - evals/bootstrap-project-harness/fixtures/14/.nvmrc
  - evals/bootstrap-project-harness/fixtures/14/.opencode/opencode.json
  - evals/bootstrap-project-harness/fixtures/14/.oxlintrc.json
  - evals/bootstrap-project-harness/fixtures/14/.prettierrc
  - evals/bootstrap-project-harness/fixtures/14/AGENTS.md
  - evals/bootstrap-project-harness/fixtures/14/commitlint.config.cjs
  - evals/bootstrap-project-harness/fixtures/14/docs-check.mjs
  - evals/bootstrap-project-harness/fixtures/14/docs/architecture.md
  - evals/bootstrap-project-harness/fixtures/14/docs/decisions/README.md
  - evals/bootstrap-project-harness/fixtures/14/docs/experience/README.md
  - evals/bootstrap-project-harness/fixtures/14/docs/pipeline.md
  - evals/bootstrap-project-harness/fixtures/14/docs/principles/design.md
  - evals/bootstrap-project-harness/fixtures/14/docs/product/vision.md
  - evals/bootstrap-project-harness/fixtures/14/docs/prompts/SPEC-0001-demo.prompt.md
  - evals/bootstrap-project-harness/fixtures/14/docs/specs/SPEC-0001-demo.md
  - evals/bootstrap-project-harness/fixtures/14/docs/system/README.md
  - evals/bootstrap-project-harness/fixtures/14/docs/WORKFLOW.md
  - evals/bootstrap-project-harness/fixtures/14/git.json
  - evals/bootstrap-project-harness/fixtures/14/justfile
  - evals/bootstrap-project-harness/fixtures/14/lefthook.yml
  - evals/bootstrap-project-harness/fixtures/14/package.json
  - evals/bootstrap-project-harness/fixtures/14/README.md
  - evals/bootstrap-project-harness/fixtures/14/spec-sha.mjs
  - evals/bootstrap-project-harness/fixtures/14/src/index.js
  - evals/bootstrap-project-harness/fixtures/14/test/index.test.mjs
  - evals/bootstrap-project-harness/fixtures/14/tsconfig.json
  - evals/bootstrap-project-harness/fixtures/15/.editorconfig
  - evals/bootstrap-project-harness/fixtures/15/.github/workflows/ci.yml
  - evals/bootstrap-project-harness/fixtures/15/.gitignore
  - evals/bootstrap-project-harness/fixtures/15/.nvmrc
  - evals/bootstrap-project-harness/fixtures/15/.opencode/opencode.json
  - evals/bootstrap-project-harness/fixtures/15/.oxlintrc.json
  - evals/bootstrap-project-harness/fixtures/15/.prettierrc
  - evals/bootstrap-project-harness/fixtures/15/AGENTS.md
  - evals/bootstrap-project-harness/fixtures/15/commitlint.config.cjs
  - evals/bootstrap-project-harness/fixtures/15/docs-check.mjs
  - evals/bootstrap-project-harness/fixtures/15/docs/architecture.md
  - evals/bootstrap-project-harness/fixtures/15/docs/decisions/README.md
  - evals/bootstrap-project-harness/fixtures/15/docs/experience/README.md
  - evals/bootstrap-project-harness/fixtures/15/docs/pipeline.md
  - evals/bootstrap-project-harness/fixtures/15/docs/principles/design.md
  - evals/bootstrap-project-harness/fixtures/15/docs/product/vision.md
  - evals/bootstrap-project-harness/fixtures/15/docs/prompts/SPEC-0001-demo.prompt.md
  - evals/bootstrap-project-harness/fixtures/15/docs/specs/SPEC-0001-demo.md
  - evals/bootstrap-project-harness/fixtures/15/docs/system/README.md
  - evals/bootstrap-project-harness/fixtures/15/docs/WORKFLOW.md
  - evals/bootstrap-project-harness/fixtures/15/git.json
  - evals/bootstrap-project-harness/fixtures/15/justfile
  - evals/bootstrap-project-harness/fixtures/15/package.json
  - evals/bootstrap-project-harness/fixtures/15/README.md
  - evals/bootstrap-project-harness/fixtures/15/spec-sha.mjs
  - evals/bootstrap-project-harness/fixtures/15/src/index.js
  - evals/bootstrap-project-harness/fixtures/15/test/index.test.mjs
  - evals/bootstrap-project-harness/fixtures/15/tsconfig.json
  - evals/bootstrap-project-harness/fixtures/16/.gitkeep
  - evals/bootstrap-project-harness/fixtures/17/bun.lock
  - evals/bootstrap-project-harness/fixtures/17/bunfig.toml
  - evals/bootstrap-project-harness/fixtures/17/package.json
  - evals/bootstrap-project-harness/fixtures/17/README.md
  - evals/bootstrap-project-harness/fixtures/17/src/index.ts
  - evals/bootstrap-project-harness/fixtures/17/test/index.test.ts
  - evals/bootstrap-project-harness/fixtures/17/tsconfig.json
  - evals/bootstrap-project-harness/fixtures/18/.nvmrc
  - evals/bootstrap-project-harness/fixtures/18/package.json
  - evals/bootstrap-project-harness/fixtures/18/pnpm-lock.yaml
  - evals/bootstrap-project-harness/fixtures/18/README.md
  - evals/bootstrap-project-harness/fixtures/18/src/index.ts
  - evals/bootstrap-project-harness/fixtures/18/test/index.test.ts
  - evals/bootstrap-project-harness/fixtures/18/tsconfig.json
  - evals/bootstrap-project-harness/fixtures/19/package.json
  - evals/bootstrap-project-harness/fixtures/19/README.md
  - evals/bootstrap-project-harness/fixtures/19/src/index.ts
  - evals/bootstrap-project-harness/fixtures/19/tsconfig.json
  - evals/bootstrap-project-harness/fixtures/2/.prettierrc
  - evals/bootstrap-project-harness/fixtures/2/package.json
  - evals/bootstrap-project-harness/fixtures/2/README.md
  - evals/bootstrap-project-harness/fixtures/2/src/index.ts
  - evals/bootstrap-project-harness/fixtures/2/tsconfig.json
  - evals/bootstrap-project-harness/fixtures/20/biome.json
  - evals/bootstrap-project-harness/fixtures/20/package.json
  - evals/bootstrap-project-harness/fixtures/20/README.md
  - evals/bootstrap-project-harness/fixtures/20/src/index.ts
  - evals/bootstrap-project-harness/fixtures/20/tsconfig.json
  - evals/bootstrap-project-harness/fixtures/21/package.json
  - evals/bootstrap-project-harness/fixtures/21/packages/a/package.json
  - evals/bootstrap-project-harness/fixtures/21/packages/a/src/index.ts
  - evals/bootstrap-project-harness/fixtures/21/packages/b/package.json
  - evals/bootstrap-project-harness/fixtures/21/packages/b/src/index.ts
  - evals/bootstrap-project-harness/fixtures/21/README.md
  - evals/bootstrap-project-harness/fixtures/21/tsconfig.json
  - evals/bootstrap-project-harness/fixtures/22/.python-version
  - evals/bootstrap-project-harness/fixtures/22/package.json
  - evals/bootstrap-project-harness/fixtures/22/pyproject.toml
  - evals/bootstrap-project-harness/fixtures/22/README.md
  - evals/bootstrap-project-harness/fixtures/22/src/index.ts
  - evals/bootstrap-project-harness/fixtures/22/tsconfig.json
  - evals/bootstrap-project-harness/fixtures/23/bun.lock
  - evals/bootstrap-project-harness/fixtures/23/bunfig.toml
  - evals/bootstrap-project-harness/fixtures/23/package.json
  - evals/bootstrap-project-harness/fixtures/23/README.md
  - evals/bootstrap-project-harness/fixtures/23/src/index.ts
  - evals/bootstrap-project-harness/fixtures/23/tsconfig.json
  - evals/bootstrap-project-harness/fixtures/3/eslint.config.js
  - evals/bootstrap-project-harness/fixtures/3/lefthook.yml
  - evals/bootstrap-project-harness/fixtures/3/package.json
  - evals/bootstrap-project-harness/fixtures/5/docs/inbox/2026-01-01-idea.md
  - evals/bootstrap-project-harness/fixtures/5/docs/product/vision.md
  - evals/bootstrap-project-harness/fixtures/5/README.md
  - evals/bootstrap-project-harness/fixtures/7/.editorconfig
  - evals/bootstrap-project-harness/fixtures/7/.opencode/opencode.json
  - evals/bootstrap-project-harness/fixtures/7/.prettierrc
  - evals/bootstrap-project-harness/fixtures/7/AGENTS.md
  - evals/bootstrap-project-harness/fixtures/7/docs-check.mjs
  - evals/bootstrap-project-harness/fixtures/7/docs/decisions/README.md
  - evals/bootstrap-project-harness/fixtures/7/docs/experience/README.md
  - evals/bootstrap-project-harness/fixtures/7/docs/principles/design.md
  - evals/bootstrap-project-harness/fixtures/7/docs/product/vision.md
  - evals/bootstrap-project-harness/fixtures/7/docs/prompts/SPEC-0001-demo.prompt.md
  - evals/bootstrap-project-harness/fixtures/7/docs/specs/SPEC-0001-demo.md
  - evals/bootstrap-project-harness/fixtures/7/docs/system/README.md
  - evals/bootstrap-project-harness/fixtures/7/docs/WORKFLOW.md
  - evals/bootstrap-project-harness/fixtures/7/eslint.config.js
  - evals/bootstrap-project-harness/fixtures/7/justfile
  - evals/bootstrap-project-harness/fixtures/7/lefthook.yml
  - evals/bootstrap-project-harness/fixtures/7/lint-staged.config.mjs
  - evals/bootstrap-project-harness/fixtures/7/package.json
  - evals/bootstrap-project-harness/fixtures/7/README.md
  - evals/bootstrap-project-harness/fixtures/7/spec-sha.mjs
  - evals/bootstrap-project-harness/fixtures/9/.python-version
  - evals/bootstrap-project-harness/fixtures/9/pyproject.toml
  - evals/bootstrap-project-harness/fixtures/9/README.md
  - evals/capture-idea/cases.md
  - evals/capture-idea/fixtures/1/AGENTS.md
  - evals/capture-idea/fixtures/1/docs/inbox/.gitkeep
  - evals/capture-idea/fixtures/1/README.md
  - evals/capture-idea/fixtures/2/AGENTS.md
  - evals/capture-idea/fixtures/3/AGENTS.md
  - evals/corpus-baseline.json
  - evals/find-blind-spots/cases.md
  - evals/find-blind-spots/fixtures/4/AGENTS.md
  - evals/find-blind-spots/fixtures/4/plan.md
  - evals/groom-backlog/cases.md
  - evals/groom-backlog/fixtures/1/AGENTS.md
  - evals/groom-backlog/fixtures/1/docs/backlog/now-next-later.md
  - evals/groom-backlog/fixtures/1/docs/product/scope.md
  - evals/groom-backlog/fixtures/3/AGENTS.md
  - evals/groom-backlog/fixtures/3/docs/specs/SPEC-0003-onboarding.md
  - evals/groom-backlog/fixtures/4/AGENTS.md
  - evals/groom-backlog/fixtures/4/product/vision.md
  - evals/groom-backlog/fixtures/4/work/backlog.md
  - evals/groom-backlog/fixtures/5/AGENTS.md
  - evals/groom-backlog/fixtures/5/docs/backlog/now-next-later.md
  - evals/groom-backlog/fixtures/5/docs/product/scope.md
  - evals/implement-from-prompt/cases.md
  - evals/implement-from-prompt/fixtures/1/AGENTS.md
  - evals/implement-from-prompt/fixtures/1/docs/prompts/SPEC-0007-demo.prompt.md
  - evals/implement-from-prompt/fixtures/1/docs/specs/SPEC-0007-demo.md
  - evals/implement-from-prompt/fixtures/1/package.json
  - evals/implement-from-prompt/fixtures/1/src/index.ts
  - evals/implement-from-prompt/fixtures/2/AGENTS.md
  - evals/implement-from-prompt/fixtures/2/package.json
  - evals/implement-from-prompt/fixtures/2/src/index.js
  - evals/implement-from-prompt/fixtures/3/AGENTS.md
  - evals/implement-from-prompt/fixtures/3/docs/prompts/SPEC-0010-slugify.prompt.md
  - evals/implement-from-prompt/fixtures/3/docs/specs/SPEC-0010-slugify.md
  - evals/implement-from-prompt/fixtures/3/package.json
  - evals/implement-from-prompt/fixtures/3/src/index.js
  - evals/implement-from-prompt/fixtures/3/src/text.js
  - evals/implement-from-prompt/fixtures/3/tests/generated.test.js
  - evals/implement-from-prompt/fixtures/4/AGENTS.md
  - evals/implement-from-prompt/fixtures/4/docs/prompts/SPEC-0012-echo.prompt.md
  - evals/implement-from-prompt/fixtures/4/docs/specs/SPEC-0012-echo.md
  - evals/implement-from-prompt/fixtures/4/package.json
  - evals/implement-from-prompt/fixtures/7/AGENTS.md
  - evals/implement-from-prompt/fixtures/7/docs/prompts/SPEC-0020-echo-status.prompt.md
  - evals/implement-from-prompt/fixtures/7/docs/specs/SPEC-0020-echo-status.md
  - evals/implement-from-prompt/fixtures/7/package.json
  - evals/implement-from-prompt/fixtures/7/src/index.js
  - evals/implement-from-prompt/fixtures/7/test/legacy.test.js
  - evals/implement-from-prompt/fixtures/8/AGENTS.md
  - evals/implement-from-prompt/fixtures/8/docs/prompts/SPEC-0021-format-currency.prompt.md
  - evals/implement-from-prompt/fixtures/8/docs/specs/SPEC-0021-format-currency.md
  - evals/implement-from-prompt/fixtures/8/package.json
  - evals/implement-from-prompt/fixtures/8/src/index.js
  - evals/implement-from-prompt/fixtures/8/test/index.test.js
  - evals/process-inbox/cases.md
  - evals/process-inbox/fixtures/1/AGENTS.md
  - evals/process-inbox/fixtures/1/docs/inbox/2026-01-01-digest-email.md
  - evals/process-inbox/fixtures/1/docs/product/vision.md
  - evals/record-decision/cases.md
  - evals/record-decision/fixtures/1/docs/architecture.md
  - evals/record-decision/fixtures/1/docs/decisions/ADR-0001-single-container-deployment.md
  - evals/record-decision/fixtures/1/docs/decisions/ADR-0002-message-queue.md
  - evals/record-decision/fixtures/1/docs/decisions/README.md
  - evals/record-decision/fixtures/2/docs/architecture.md
  - evals/record-decision/fixtures/2/docs/decisions/ADR-0001-single-container-deployment.md
  - evals/record-decision/fixtures/2/docs/decisions/ADR-0002-message-queue.md
  - evals/record-decision/fixtures/2/docs/decisions/README.md
  - evals/record-decision/fixtures/3/docs/architecture.md
  - evals/record-decision/fixtures/3/docs/decisions/ADR-0001-single-container-deployment.md
  - evals/record-decision/fixtures/3/docs/decisions/ADR-0002-message-queue.md
  - evals/record-decision/fixtures/3/docs/decisions/README.md
  - evals/record-decision/fixtures/4/AGENTS.md
  - evals/record-decision/fixtures/5/AGENTS.md
  - evals/record-decision/fixtures/5/docs/architecture.md
  - evals/record-decision/fixtures/5/docs/decisions/ADR-0001-single-container-deployment.md
  - evals/record-decision/fixtures/5/docs/decisions/ADR-0002-message-queue.md
  - evals/record-decision/fixtures/5/docs/decisions/README.md
  - evals/report-project-status/cases.md
  - evals/review-code/cases.md
  - evals/review-code/fixtures/1/change.patch
  - evals/review-code/fixtures/1/git.json
  - evals/review-code/fixtures/10/change.patch
  - evals/review-code/fixtures/10/docs/specs/SPEC-0008-retry-with-backoff.md
  - evals/review-code/fixtures/10/git.json
  - evals/review-code/fixtures/2/change.patch
  - evals/review-code/fixtures/2/git.json
  - evals/review-code/fixtures/3/change.patch
  - evals/review-code/fixtures/3/git.json
  - evals/review-code/fixtures/4/change.patch
  - evals/review-code/fixtures/4/git.json
  - evals/review-code/fixtures/5/AGENTS.md
  - evals/review-code/fixtures/6/AGENTS.md
  - evals/review-code/fixtures/7/change.patch
  - evals/review-code/fixtures/7/git.json
  - evals/review-code/fixtures/8/change.patch
  - evals/review-code/fixtures/8/git.json
  - evals/review-code/fixtures/9/change.patch
  - evals/review-code/fixtures/9/git.json
  - evals/review-code/fixtures/base-red/AGENTS.md
  - evals/review-code/fixtures/base-red/docs/architecture.md
  - evals/review-code/fixtures/base-red/docs/prompts/SPEC-0007-cart-tax.prompt.md
  - evals/review-code/fixtures/base-red/docs/specs/SPEC-0007-cart-tax.md
  - evals/review-code/fixtures/base-red/package.json
  - evals/review-code/fixtures/base-red/spec-sha.mjs
  - evals/review-code/fixtures/base-red/src/cart.js
  - evals/review-code/fixtures/base-red/test/cart.test.js
  - evals/review-code/fixtures/base-red/test/legacy.test.js
  - evals/review-code/fixtures/base/AGENTS.md
  - evals/review-code/fixtures/base/docs/architecture.md
  - evals/review-code/fixtures/base/docs/prompts/SPEC-0007-cart-tax.prompt.md
  - evals/review-code/fixtures/base/docs/specs/SPEC-0007-cart-tax.md
  - evals/review-code/fixtures/base/package.json
  - evals/review-code/fixtures/base/spec-sha.mjs
  - evals/review-code/fixtures/base/src/cart.js
  - evals/review-code/fixtures/base/test/cart.test.js
  - evals/survey-inflight-work/cases.md
  - evals/survey-inflight-work/fixtures/1/discount.patch
  - evals/survey-inflight-work/fixtures/1/git.json
  - evals/survey-inflight-work/fixtures/1/tax.patch
  - evals/survey-inflight-work/fixtures/2/git.json
  - evals/survey-inflight-work/fixtures/2/tax.patch
  - evals/survey-inflight-work/fixtures/base/AGENTS.md
  - evals/survey-inflight-work/fixtures/base/src/app.js
  - evals/survey-inflight-work/fixtures/base/src/cart.js
  - evals/tighten-harness/cases.md
  - evals/tighten-harness/fixtures/1/AGENTS.md
  - evals/tighten-harness/fixtures/1/eslint.config.js
  - evals/tighten-harness/fixtures/1/justfile
  - evals/tighten-harness/fixtures/1/package.json
  - evals/tighten-harness/fixtures/1/src/big.js
  - evals/tighten-harness/fixtures/1/src/small.js
  - evals/tighten-harness/fixtures/2/AGENTS.md
  - evals/tighten-harness/fixtures/2/eslint.config.js
  - evals/tighten-harness/fixtures/2/justfile
  - evals/tighten-harness/fixtures/2/package.json
  - evals/tighten-harness/fixtures/2/src/huge.js
  - evals/tighten-harness/fixtures/3/README.md
  - evals/tighten-harness/fixtures/5/AGENTS.md
  - evals/tighten-harness/fixtures/5/eslint.config.js
  - evals/tighten-harness/fixtures/5/justfile
  - evals/tighten-harness/fixtures/5/package.json
  - evals/tighten-harness/fixtures/5/src/huge.js
  - evals/tighten-harness/fixtures/6/AGENTS.md
  - evals/tighten-harness/fixtures/6/eslint.config.js
  - evals/tighten-harness/fixtures/6/justfile
  - evals/tighten-harness/fixtures/6/package.json
  - evals/tighten-harness/fixtures/6/src/big.js
  - evals/tighten-harness/fixtures/6/src/small.js
  - evals/write-implementation-prompt/cases.md
  - evals/write-implementation-prompt/fixtures/1/AGENTS.md
  - evals/write-implementation-prompt/fixtures/1/docs/architecture.md
  - evals/write-implementation-prompt/fixtures/1/docs/product/vision.md
  - evals/write-implementation-prompt/fixtures/1/docs/specs/SPEC-0007-demo.md
  - evals/write-implementation-prompt/fixtures/2/AGENTS.md
  - evals/write-implementation-prompt/fixtures/2/docs/specs/SPEC-0008-export.md
  - evals/write-implementation-prompt/fixtures/3/AGENTS.md
  - evals/write-implementation-prompt/fixtures/3/docs/specs/SPEC-0009-audit-log.md
  - evals/write-implementation-prompt/fixtures/4/AGENTS.md
  - evals/write-implementation-prompt/fixtures/4/docs/architecture.md
  - evals/write-implementation-prompt/fixtures/4/docs/prompts/SPEC-0007-import-csv.prompt.md
  - evals/write-implementation-prompt/fixtures/4/docs/specs/SPEC-0011-bulk-import.md
  - README.md
  - scripts/check-staleness.mjs
  - scripts/check-staleness.test.mjs
  - scripts/emit-promptfoo.mjs
  - scripts/lib/evals/corpus.test.mjs
  - scripts/lib/evals/execute.test.mjs
  - scripts/lib/evals/fixture.mjs
  - scripts/lib/evals/fixture.test.mjs
  - scripts/lib/evals/leak.mjs
  - scripts/lib/evals/leak.test.mjs
  - scripts/lib/evals/parse.mjs
  - scripts/lib/evals/parse.test.mjs
  - scripts/lib/evals/speccheck.mjs
  - scripts/lib/evals/speccheck.test.mjs
  - scripts/promptfoo/provider.mjs
  - scripts/replay-evals.mjs
  - scripts/run-evals.mjs
  - scripts/validate-skills.mjs
  - skills/audit-code-quality/references/evals.md
  - skills/audit-code-quality/references/evals/1/AGENTS.md
  - skills/audit-code-quality/references/evals/1/docs/architecture.md
  - skills/audit-code-quality/references/evals/1/git.json
  - skills/audit-code-quality/references/evals/1/src/cart.js
  - skills/audit-code-quality/references/evals/1/src/legacy/report.js
  - skills/audit-code-quality/references/evals/1/src/math.js
  - skills/audit-code-quality/references/evals/1/src/pricing.js
  - skills/audit-code-quality/references/evals/4/AGENTS.md
  - skills/audit-code-quality/references/evals/4/git.json
  - skills/audit-code-quality/references/evals/4/src/legacy/util.js
  - skills/audit-code-quality/references/evals/4/src/payments/charge.js
  - skills/audit-code-quality/references/evals/4/src/payments/refund.js
  - skills/audit-code-quality/references/evals/5/AGENTS.md
  - skills/audit-code-quality/references/evals/5/docs/architecture.md
  - skills/audit-code-quality/references/evals/5/git.json
  - skills/audit-code-quality/references/evals/5/src/api/orders.js
  - skills/audit-code-quality/references/evals/5/src/orders/repository.js
  - skills/audit-code-quality/references/evals/5/src/orders/service.js
  - skills/audit-code-quality/references/evals/5/src/orders/validation.js
  - skills/audit-code-quality/references/evals/6/AGENTS.md
  - skills/audit-code-quality/references/evals/6/docs/architecture.md
  - skills/audit-code-quality/references/evals/6/git.json
  - skills/audit-code-quality/references/evals/6/src/api/quote.js
  - skills/audit-code-quality/references/evals/6/src/pricing/index.js
  - skills/audit-code-quality/references/evals/6/src/pricing/money.js
  - skills/audit-code-quality/references/evals/6/src/pricing/rules.js
  - skills/audit-code-quality/references/evals/7/AGENTS.md
  - skills/audit-code-quality/references/evals/7/docs/architecture.md
  - skills/audit-code-quality/references/evals/7/git.json
  - skills/audit-code-quality/references/evals/7/src/export.js
  - skills/audit-code-quality/references/evals/7/src/format/currency.js
  - skills/audit-code-quality/references/evals/7/src/format/date.js
  - skills/audit-code-quality/references/evals/7/src/format/percent.js
  - skills/audit-code-quality/references/evals/7/src/report.js
  - skills/audit-code-quality/references/evals/8/AGENTS.md
  - skills/audit-code-quality/references/evals/8/bin/dependency-cruiser
  - skills/audit-code-quality/references/evals/8/bin/knip
  - skills/audit-code-quality/references/evals/8/git.json
  - skills/audit-code-quality/references/evals/8/package.json
  - skills/audit-code-quality/references/evals/8/src/app.js
  - skills/audit-code-quality/references/evals/8/src/legacy.js
  - skills/audit-code-quality/references/evals/8/src/unused.js
  - skills/audit-code-quality/references/evals/9/git.json
  - skills/audit-docs/references/evals.md
  - skills/audit-docs/references/evals/1/AGENTS.md
  - skills/audit-docs/references/evals/1/docs/principles/design.md
  - skills/audit-docs/references/evals/1/docs/product/vision.md
  - skills/audit-docs/references/evals/3/AGENTS.md
  - skills/audit-docs/references/evals/3/change.patch
  - skills/audit-docs/references/evals/3/docs/architecture.md
  - skills/audit-docs/references/evals/3/docs/decisions/README.md
  - skills/audit-docs/references/evals/3/docs/product/vision.md
  - skills/audit-docs/references/evals/3/docs/system/README.md
  - skills/audit-docs/references/evals/3/git.json
  - skills/audit-docs/references/evals/4/AGENTS.md
  - skills/audit-docs/references/evals/4/docs/decisions/ADR-0001-remove-rate-cap.md
  - skills/audit-docs/references/evals/4/docs/specs/SPEC-0002-refunds.md
  - skills/audit-docs/references/evals/4/docs/system/gates.md
  - skills/audit-docs/references/evals/4/docs/system/limits.md
  - skills/audit-docs/references/evals/4/docs/system/rate.md
  - skills/audit-docs/references/evals/4/package.json
  - skills/audit-docs/references/evals/4/src/rate.js
  - skills/audit-docs/references/evals/4/test/rate.test.js
  - skills/bootstrap-project-harness/references/evals.md
  - skills/bootstrap-project-harness/references/evals/1/package.json
  - skills/bootstrap-project-harness/references/evals/1/README.md
  - skills/bootstrap-project-harness/references/evals/1/src/index.ts
  - skills/bootstrap-project-harness/references/evals/1/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/10/.pre-commit-config.yaml
  - skills/bootstrap-project-harness/references/evals/10/.python-version
  - skills/bootstrap-project-harness/references/evals/10/pyproject.toml
  - skills/bootstrap-project-harness/references/evals/11/poetry.lock
  - skills/bootstrap-project-harness/references/evals/11/pyproject.toml
  - skills/bootstrap-project-harness/references/evals/14/.editorconfig
  - skills/bootstrap-project-harness/references/evals/14/.github/workflows/ci.yml
  - skills/bootstrap-project-harness/references/evals/14/.gitignore
  - skills/bootstrap-project-harness/references/evals/14/.nvmrc
  - skills/bootstrap-project-harness/references/evals/14/.opencode/opencode.json
  - skills/bootstrap-project-harness/references/evals/14/.oxlintrc.json
  - skills/bootstrap-project-harness/references/evals/14/.prettierrc
  - skills/bootstrap-project-harness/references/evals/14/AGENTS.md
  - skills/bootstrap-project-harness/references/evals/14/commitlint.config.cjs
  - skills/bootstrap-project-harness/references/evals/14/docs-check.mjs
  - skills/bootstrap-project-harness/references/evals/14/docs/architecture.md
  - skills/bootstrap-project-harness/references/evals/14/docs/decisions/README.md
  - skills/bootstrap-project-harness/references/evals/14/docs/experience/README.md
  - skills/bootstrap-project-harness/references/evals/14/docs/pipeline.md
  - skills/bootstrap-project-harness/references/evals/14/docs/principles/design.md
  - skills/bootstrap-project-harness/references/evals/14/docs/product/vision.md
  - skills/bootstrap-project-harness/references/evals/14/docs/prompts/SPEC-0001-demo.prompt.md
  - skills/bootstrap-project-harness/references/evals/14/docs/specs/SPEC-0001-demo.md
  - skills/bootstrap-project-harness/references/evals/14/docs/system/README.md
  - skills/bootstrap-project-harness/references/evals/14/docs/WORKFLOW.md
  - skills/bootstrap-project-harness/references/evals/14/git.json
  - skills/bootstrap-project-harness/references/evals/14/justfile
  - skills/bootstrap-project-harness/references/evals/14/lefthook.yml
  - skills/bootstrap-project-harness/references/evals/14/package.json
  - skills/bootstrap-project-harness/references/evals/14/README.md
  - skills/bootstrap-project-harness/references/evals/14/spec-sha.mjs
  - skills/bootstrap-project-harness/references/evals/14/src/index.js
  - skills/bootstrap-project-harness/references/evals/14/test/index.test.mjs
  - skills/bootstrap-project-harness/references/evals/14/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/15/.editorconfig
  - skills/bootstrap-project-harness/references/evals/15/.github/workflows/ci.yml
  - skills/bootstrap-project-harness/references/evals/15/.gitignore
  - skills/bootstrap-project-harness/references/evals/15/.nvmrc
  - skills/bootstrap-project-harness/references/evals/15/.opencode/opencode.json
  - skills/bootstrap-project-harness/references/evals/15/.oxlintrc.json
  - skills/bootstrap-project-harness/references/evals/15/.prettierrc
  - skills/bootstrap-project-harness/references/evals/15/AGENTS.md
  - skills/bootstrap-project-harness/references/evals/15/commitlint.config.cjs
  - skills/bootstrap-project-harness/references/evals/15/docs-check.mjs
  - skills/bootstrap-project-harness/references/evals/15/docs/architecture.md
  - skills/bootstrap-project-harness/references/evals/15/docs/decisions/README.md
  - skills/bootstrap-project-harness/references/evals/15/docs/experience/README.md
  - skills/bootstrap-project-harness/references/evals/15/docs/pipeline.md
  - skills/bootstrap-project-harness/references/evals/15/docs/principles/design.md
  - skills/bootstrap-project-harness/references/evals/15/docs/product/vision.md
  - skills/bootstrap-project-harness/references/evals/15/docs/prompts/SPEC-0001-demo.prompt.md
  - skills/bootstrap-project-harness/references/evals/15/docs/specs/SPEC-0001-demo.md
  - skills/bootstrap-project-harness/references/evals/15/docs/system/README.md
  - skills/bootstrap-project-harness/references/evals/15/docs/WORKFLOW.md
  - skills/bootstrap-project-harness/references/evals/15/git.json
  - skills/bootstrap-project-harness/references/evals/15/justfile
  - skills/bootstrap-project-harness/references/evals/15/package.json
  - skills/bootstrap-project-harness/references/evals/15/README.md
  - skills/bootstrap-project-harness/references/evals/15/spec-sha.mjs
  - skills/bootstrap-project-harness/references/evals/15/src/index.js
  - skills/bootstrap-project-harness/references/evals/15/test/index.test.mjs
  - skills/bootstrap-project-harness/references/evals/15/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/16/.gitkeep
  - skills/bootstrap-project-harness/references/evals/17/bun.lock
  - skills/bootstrap-project-harness/references/evals/17/bunfig.toml
  - skills/bootstrap-project-harness/references/evals/17/package.json
  - skills/bootstrap-project-harness/references/evals/17/README.md
  - skills/bootstrap-project-harness/references/evals/17/src/index.ts
  - skills/bootstrap-project-harness/references/evals/17/test/index.test.ts
  - skills/bootstrap-project-harness/references/evals/17/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/18/.nvmrc
  - skills/bootstrap-project-harness/references/evals/18/package.json
  - skills/bootstrap-project-harness/references/evals/18/pnpm-lock.yaml
  - skills/bootstrap-project-harness/references/evals/18/README.md
  - skills/bootstrap-project-harness/references/evals/18/src/index.ts
  - skills/bootstrap-project-harness/references/evals/18/test/index.test.ts
  - skills/bootstrap-project-harness/references/evals/18/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/19/package.json
  - skills/bootstrap-project-harness/references/evals/19/README.md
  - skills/bootstrap-project-harness/references/evals/19/src/index.ts
  - skills/bootstrap-project-harness/references/evals/19/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/2/.prettierrc
  - skills/bootstrap-project-harness/references/evals/2/package.json
  - skills/bootstrap-project-harness/references/evals/2/README.md
  - skills/bootstrap-project-harness/references/evals/2/src/index.ts
  - skills/bootstrap-project-harness/references/evals/2/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/20/biome.json
  - skills/bootstrap-project-harness/references/evals/20/package.json
  - skills/bootstrap-project-harness/references/evals/20/README.md
  - skills/bootstrap-project-harness/references/evals/20/src/index.ts
  - skills/bootstrap-project-harness/references/evals/20/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/21/package.json
  - skills/bootstrap-project-harness/references/evals/21/packages/a/package.json
  - skills/bootstrap-project-harness/references/evals/21/packages/a/src/index.ts
  - skills/bootstrap-project-harness/references/evals/21/packages/b/package.json
  - skills/bootstrap-project-harness/references/evals/21/packages/b/src/index.ts
  - skills/bootstrap-project-harness/references/evals/21/README.md
  - skills/bootstrap-project-harness/references/evals/21/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/22/.python-version
  - skills/bootstrap-project-harness/references/evals/22/package.json
  - skills/bootstrap-project-harness/references/evals/22/pyproject.toml
  - skills/bootstrap-project-harness/references/evals/22/README.md
  - skills/bootstrap-project-harness/references/evals/22/src/index.ts
  - skills/bootstrap-project-harness/references/evals/22/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/23/bun.lock
  - skills/bootstrap-project-harness/references/evals/23/bunfig.toml
  - skills/bootstrap-project-harness/references/evals/23/package.json
  - skills/bootstrap-project-harness/references/evals/23/README.md
  - skills/bootstrap-project-harness/references/evals/23/src/index.ts
  - skills/bootstrap-project-harness/references/evals/23/tsconfig.json
  - skills/bootstrap-project-harness/references/evals/3/eslint.config.js
  - skills/bootstrap-project-harness/references/evals/3/lefthook.yml
  - skills/bootstrap-project-harness/references/evals/3/package.json
  - skills/bootstrap-project-harness/references/evals/5/docs/inbox/2026-01-01-idea.md
  - skills/bootstrap-project-harness/references/evals/5/docs/product/vision.md
  - skills/bootstrap-project-harness/references/evals/5/README.md
  - skills/bootstrap-project-harness/references/evals/7/.editorconfig
  - skills/bootstrap-project-harness/references/evals/7/.opencode/opencode.json
  - skills/bootstrap-project-harness/references/evals/7/.prettierrc
  - skills/bootstrap-project-harness/references/evals/7/AGENTS.md
  - skills/bootstrap-project-harness/references/evals/7/docs-check.mjs
  - skills/bootstrap-project-harness/references/evals/7/docs/decisions/README.md
  - skills/bootstrap-project-harness/references/evals/7/docs/experience/README.md
  - skills/bootstrap-project-harness/references/evals/7/docs/principles/design.md
  - skills/bootstrap-project-harness/references/evals/7/docs/product/vision.md
  - skills/bootstrap-project-harness/references/evals/7/docs/prompts/SPEC-0001-demo.prompt.md
  - skills/bootstrap-project-harness/references/evals/7/docs/specs/SPEC-0001-demo.md
  - skills/bootstrap-project-harness/references/evals/7/docs/system/README.md
  - skills/bootstrap-project-harness/references/evals/7/docs/WORKFLOW.md
  - skills/bootstrap-project-harness/references/evals/7/eslint.config.js
  - skills/bootstrap-project-harness/references/evals/7/justfile
  - skills/bootstrap-project-harness/references/evals/7/lefthook.yml
  - skills/bootstrap-project-harness/references/evals/7/lint-staged.config.mjs
  - skills/bootstrap-project-harness/references/evals/7/package.json
  - skills/bootstrap-project-harness/references/evals/7/README.md
  - skills/bootstrap-project-harness/references/evals/7/spec-sha.mjs
  - skills/bootstrap-project-harness/references/evals/9/.python-version
  - skills/bootstrap-project-harness/references/evals/9/pyproject.toml
  - skills/bootstrap-project-harness/references/evals/9/README.md
  - skills/bootstrap-project-harness/scripts/harness-state.test.mjs
  - skills/capture-idea/references/evals.md
  - skills/capture-idea/references/evals/1/AGENTS.md
  - skills/capture-idea/references/evals/1/docs/inbox/.gitkeep
  - skills/capture-idea/references/evals/1/README.md
  - skills/capture-idea/references/evals/2/AGENTS.md
  - skills/capture-idea/references/evals/3/AGENTS.md
  - skills/find-blind-spots/references/evals.md
  - skills/find-blind-spots/references/evals/4/AGENTS.md
  - skills/find-blind-spots/references/evals/4/plan.md
  - skills/groom-backlog/references/evals.md
  - skills/groom-backlog/references/evals/1/AGENTS.md
  - skills/groom-backlog/references/evals/1/docs/backlog/now-next-later.md
  - skills/groom-backlog/references/evals/1/docs/product/scope.md
  - skills/groom-backlog/references/evals/3/AGENTS.md
  - skills/groom-backlog/references/evals/3/docs/specs/SPEC-0003-onboarding.md
  - skills/groom-backlog/references/evals/4/AGENTS.md
  - skills/groom-backlog/references/evals/4/product/vision.md
  - skills/groom-backlog/references/evals/4/work/backlog.md
  - skills/groom-backlog/references/evals/5/AGENTS.md
  - skills/groom-backlog/references/evals/5/docs/backlog/now-next-later.md
  - skills/groom-backlog/references/evals/5/docs/product/scope.md
  - skills/implement-from-prompt/references/evals.md
  - skills/implement-from-prompt/references/evals/1/AGENTS.md
  - skills/implement-from-prompt/references/evals/1/docs/prompts/SPEC-0007-demo.prompt.md
  - skills/implement-from-prompt/references/evals/1/docs/specs/SPEC-0007-demo.md
  - skills/implement-from-prompt/references/evals/1/package.json
  - skills/implement-from-prompt/references/evals/1/src/index.ts
  - skills/implement-from-prompt/references/evals/2/AGENTS.md
  - skills/implement-from-prompt/references/evals/2/package.json
  - skills/implement-from-prompt/references/evals/2/src/index.js
  - skills/implement-from-prompt/references/evals/3/AGENTS.md
  - skills/implement-from-prompt/references/evals/3/docs/prompts/SPEC-0010-slugify.prompt.md
  - skills/implement-from-prompt/references/evals/3/docs/specs/SPEC-0010-slugify.md
  - skills/implement-from-prompt/references/evals/3/package.json
  - skills/implement-from-prompt/references/evals/3/src/index.js
  - skills/implement-from-prompt/references/evals/3/src/text.js
  - skills/implement-from-prompt/references/evals/3/tests/generated.test.js
  - skills/implement-from-prompt/references/evals/4/AGENTS.md
  - skills/implement-from-prompt/references/evals/4/docs/prompts/SPEC-0012-echo.prompt.md
  - skills/implement-from-prompt/references/evals/4/docs/specs/SPEC-0012-echo.md
  - skills/implement-from-prompt/references/evals/4/package.json
  - skills/implement-from-prompt/references/evals/7/AGENTS.md
  - skills/implement-from-prompt/references/evals/7/docs/prompts/SPEC-0020-echo-status.prompt.md
  - skills/implement-from-prompt/references/evals/7/docs/specs/SPEC-0020-echo-status.md
  - skills/implement-from-prompt/references/evals/7/package.json
  - skills/implement-from-prompt/references/evals/7/src/index.js
  - skills/implement-from-prompt/references/evals/7/test/legacy.test.js
  - skills/implement-from-prompt/references/evals/8/AGENTS.md
  - skills/implement-from-prompt/references/evals/8/docs/prompts/SPEC-0021-format-currency.prompt.md
  - skills/implement-from-prompt/references/evals/8/docs/specs/SPEC-0021-format-currency.md
  - skills/implement-from-prompt/references/evals/8/package.json
  - skills/implement-from-prompt/references/evals/8/src/index.js
  - skills/implement-from-prompt/references/evals/8/test/index.test.js
  - skills/process-inbox/references/evals.md
  - skills/process-inbox/references/evals/1/AGENTS.md
  - skills/process-inbox/references/evals/1/docs/inbox/2026-01-01-digest-email.md
  - skills/process-inbox/references/evals/1/docs/product/vision.md
  - skills/record-decision/references/evals.md
  - skills/record-decision/references/evals/1/docs/architecture.md
  - skills/record-decision/references/evals/1/docs/decisions/ADR-0001-single-container-deployment.md
  - skills/record-decision/references/evals/1/docs/decisions/ADR-0002-message-queue.md
  - skills/record-decision/references/evals/1/docs/decisions/README.md
  - skills/record-decision/references/evals/2/docs/architecture.md
  - skills/record-decision/references/evals/2/docs/decisions/ADR-0001-single-container-deployment.md
  - skills/record-decision/references/evals/2/docs/decisions/ADR-0002-message-queue.md
  - skills/record-decision/references/evals/2/docs/decisions/README.md
  - skills/record-decision/references/evals/3/docs/architecture.md
  - skills/record-decision/references/evals/3/docs/decisions/ADR-0001-single-container-deployment.md
  - skills/record-decision/references/evals/3/docs/decisions/ADR-0002-message-queue.md
  - skills/record-decision/references/evals/3/docs/decisions/README.md
  - skills/record-decision/references/evals/4/AGENTS.md
  - skills/record-decision/references/evals/5/AGENTS.md
  - skills/record-decision/references/evals/5/docs/architecture.md
  - skills/record-decision/references/evals/5/docs/decisions/ADR-0001-single-container-deployment.md
  - skills/record-decision/references/evals/5/docs/decisions/ADR-0002-message-queue.md
  - skills/record-decision/references/evals/5/docs/decisions/README.md
  - skills/report-project-status/references/evals.md
  - skills/review-code/references/evals.md
  - skills/review-code/references/evals/1/change.patch
  - skills/review-code/references/evals/1/git.json
  - skills/review-code/references/evals/10/change.patch
  - skills/review-code/references/evals/10/docs/specs/SPEC-0008-retry-with-backoff.md
  - skills/review-code/references/evals/10/git.json
  - skills/review-code/references/evals/2/change.patch
  - skills/review-code/references/evals/2/git.json
  - skills/review-code/references/evals/3/change.patch
  - skills/review-code/references/evals/3/git.json
  - skills/review-code/references/evals/4/change.patch
  - skills/review-code/references/evals/4/git.json
  - skills/review-code/references/evals/5/AGENTS.md
  - skills/review-code/references/evals/6/AGENTS.md
  - skills/review-code/references/evals/7/change.patch
  - skills/review-code/references/evals/7/git.json
  - skills/review-code/references/evals/8/change.patch
  - skills/review-code/references/evals/8/git.json
  - skills/review-code/references/evals/9/change.patch
  - skills/review-code/references/evals/9/git.json
  - skills/review-code/references/evals/base-red/AGENTS.md
  - skills/review-code/references/evals/base-red/docs/architecture.md
  - skills/review-code/references/evals/base-red/docs/prompts/SPEC-0007-cart-tax.prompt.md
  - skills/review-code/references/evals/base-red/docs/specs/SPEC-0007-cart-tax.md
  - skills/review-code/references/evals/base-red/package.json
  - skills/review-code/references/evals/base-red/spec-sha.mjs
  - skills/review-code/references/evals/base-red/src/cart.js
  - skills/review-code/references/evals/base-red/test/cart.test.js
  - skills/review-code/references/evals/base-red/test/legacy.test.js
  - skills/review-code/references/evals/base/AGENTS.md
  - skills/review-code/references/evals/base/docs/architecture.md
  - skills/review-code/references/evals/base/docs/prompts/SPEC-0007-cart-tax.prompt.md
  - skills/review-code/references/evals/base/docs/specs/SPEC-0007-cart-tax.md
  - skills/review-code/references/evals/base/package.json
  - skills/review-code/references/evals/base/spec-sha.mjs
  - skills/review-code/references/evals/base/src/cart.js
  - skills/review-code/references/evals/base/test/cart.test.js
  - skills/survey-inflight-work/references/evals.md
  - skills/survey-inflight-work/references/evals/1/discount.patch
  - skills/survey-inflight-work/references/evals/1/git.json
  - skills/survey-inflight-work/references/evals/1/tax.patch
  - skills/survey-inflight-work/references/evals/2/git.json
  - skills/survey-inflight-work/references/evals/2/tax.patch
  - skills/survey-inflight-work/references/evals/base/AGENTS.md
  - skills/survey-inflight-work/references/evals/base/src/app.js
  - skills/survey-inflight-work/references/evals/base/src/cart.js
  - skills/tighten-harness/references/evals.md
  - skills/tighten-harness/references/evals/1/AGENTS.md
  - skills/tighten-harness/references/evals/1/eslint.config.js
  - skills/tighten-harness/references/evals/1/justfile
  - skills/tighten-harness/references/evals/1/package.json
  - skills/tighten-harness/references/evals/1/src/big.js
  - skills/tighten-harness/references/evals/1/src/small.js
  - skills/tighten-harness/references/evals/2/AGENTS.md
  - skills/tighten-harness/references/evals/2/eslint.config.js
  - skills/tighten-harness/references/evals/2/justfile
  - skills/tighten-harness/references/evals/2/package.json
  - skills/tighten-harness/references/evals/2/src/huge.js
  - skills/tighten-harness/references/evals/3/README.md
  - skills/tighten-harness/references/evals/5/AGENTS.md
  - skills/tighten-harness/references/evals/5/eslint.config.js
  - skills/tighten-harness/references/evals/5/justfile
  - skills/tighten-harness/references/evals/5/package.json
  - skills/tighten-harness/references/evals/5/src/huge.js
  - skills/tighten-harness/references/evals/6/AGENTS.md
  - skills/tighten-harness/references/evals/6/eslint.config.js
  - skills/tighten-harness/references/evals/6/justfile
  - skills/tighten-harness/references/evals/6/package.json
  - skills/tighten-harness/references/evals/6/src/big.js
  - skills/tighten-harness/references/evals/6/src/small.js
  - skills/write-implementation-prompt/references/evals.md
  - skills/write-implementation-prompt/references/evals/1/AGENTS.md
  - skills/write-implementation-prompt/references/evals/1/docs/architecture.md
  - skills/write-implementation-prompt/references/evals/1/docs/product/vision.md
  - skills/write-implementation-prompt/references/evals/1/docs/specs/SPEC-0007-demo.md
  - skills/write-implementation-prompt/references/evals/2/AGENTS.md
  - skills/write-implementation-prompt/references/evals/2/docs/specs/SPEC-0008-export.md
  - skills/write-implementation-prompt/references/evals/3/AGENTS.md
  - skills/write-implementation-prompt/references/evals/3/docs/specs/SPEC-0009-audit-log.md
  - skills/write-implementation-prompt/references/evals/4/AGENTS.md
  - skills/write-implementation-prompt/references/evals/4/docs/architecture.md
  - skills/write-implementation-prompt/references/evals/4/docs/prompts/SPEC-0007-import-csv.prompt.md
  - skills/write-implementation-prompt/references/evals/4/docs/specs/SPEC-0011-bulk-import.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node --test scripts/check-staleness.test.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0058-the-corpus-leaves-the-skill.md --base main
---

## Purpose

An eval dataset is development material. Today it ships inside the artifact:
14 `skills/<id>/references/evals.md` and 72 fixture directories live under
`skills/<id>/references/`, so every staged skill carries its own answer key and
the control-arm deny list has to name `<skill>/references/evals` explicitly
(SPEC-0046). Moving the corpus out makes the boundary structural instead of a
path list, and it removes ~1.5 MB of test material from what a skill packages.

## User Outcome

- `skills/<id>/references/` contains only material an agent should read at
  runtime. A fixture is never one of those files.
- A reviewer can tell at a glance that `evals/` is not shipped.
- The isolation boundary stops depending on a hard-coded corpus path.

## Scope

### F1 — the layout

```text
skills/<id>/references/          runtime references only
evals/<id>/cases.md              the cases, moved from references/evals.md
evals/<id>/fixtures/<n>/         the fixture trees, moved from references/evals/<n>/
```

`git mv` only; case numbers, prompts, `why:` lines, assertions, `git.json`
contents and fixture bytes are preserved. `references/evals.md` becomes
`evals/<id>/cases.md`; `references/evals/<n>/` becomes
`evals/<id>/fixtures/<n>/`.

### F2 — discovery reads one layout

`parse.mjs` `readEvals` and `fixture.mjs` `stageFixture` resolve the new paths
only. No dual-source support, no compatibility fallback: a case that cannot be
found is an error, not a silent empty corpus.

### F3 — `files:` can name a subtree

`speccheck` compares `files:` against `git diff --name-only` by exact equality,
so this move would need 368 entries. Add one rule: an entry ending in `/` covers
every path under that prefix. An undeclared file under a declared subtree stays
caught; a subtree that matches nothing is a warning, like a declared file the
diff did not touch.

### F4 — nothing eval-shaped stays in a skill

`validate-skills.mjs` fails when any `skills/*/references/evals*` path exists
after the move. This is the guard that keeps the boundary from drifting back.

### F5 — the two dead corpus consumers go

`scripts/emit-promptfoo.mjs` and `scripts/promptfoo/provider.mjs` hard-code the
old corpus path and have no consumer. They are deleted here rather than updated;
SPEC-0059's deletion list loses exactly these two entries.

## Non-Goals

- No DSL change: prompts, assertions, `why:` and `git.json` keep their shape.
- No rewrite of `docs/specs/**` or `backlog/**`. They cite the old paths as
  history; that history is not edited. `check-staleness` reports the affected
  cells instead of hiding them.
- No change to `docs/evals/experiments/**` (SPEC-0059 archives it) or to
  `docs/evals/review-code-matrix.md` (SPEC-0063 rewrites it).
- No paid draw. Every acceptance criterion is deterministic.
- No change to skill behaviour: `SKILL.md` files are untouched.

## Flow

1. **F0 — the checker first.** Teach `speccheck` the subtree rule with tests, so
   the spec's own `files:` is reviewable.
2. **F1 — the move.** `git mv` the 14 case files and 13 fixture trees.
3. **F2 — the reader.** Point discovery at the new layout; delete the old
   resolution.
4. **F3 — the guard.** Add the stray-eval check and the negative test for it.
5. **F4 — the citations.** Update the documents that name the old paths, except
   the historical record.
6. **F5 — the proof.** Compare the corpus before and after: same case ids, same
   prompts, same assertions, same fixture tree hashes.

## Data

- `evals/` (new) and the 14 `skills/*/references/evals.md` + 13 fixture trees
  (removed).
- `scripts/lib/evals/{parse,fixture,speccheck,leak}.mjs` and their tests.
- `scripts/{run-evals,replay-evals,check-staleness,validate-skills}.mjs`.
- `README.md`, `CONTRIBUTING.md`, `docs/README.md`, six `docs/prompts/*.md`,
  four `docs/evals/*.md`.

## Acceptance Criteria

1. Every case is discovered under the same skill id and case number after the
   move. A before/after comparison of parsed cases — number, title, prompt,
   `why:`, assertions — is identical, and the comparison itself is committed as
   a test or a scripted check.
2. Fixture bytes are preserved: each `evals/<id>/fixtures/<n>/` tree hash equals
   the tree hash of the old `skills/<id>/references/evals/<n>/`.
3. `parse.mjs` and `fixture.mjs` read the new layout only; no fallback to the old
   path exists anywhere in `scripts/`.
4. `node scripts/run-evals.mjs --root skills --list --check` parses 97 cases
   (94 runnable, 3 manual), the same set as before the move.
5. `speccheck` accepts a trailing-slash subtree entry: an undeclared file under a
   declared subtree is still an error, a declared subtree that matches nothing is
   a warning, and an entry without the slash keeps exact-equality behaviour.
6. `validate-skills.mjs` fails on a stray `skills/*/references/evals*` path, with
   a test that proves the failure.
7. A staged with-skill run no longer contains any fixture path. Prove it at
   `--level smoke` by staging one case and asserting the staged tree has no
   `references/evals` entry.
8. No file under `docs/specs/**` or `backlog/**` is modified.
9. `scripts/emit-promptfoo.mjs` and `scripts/promptfoo/provider.mjs` are gone and
   nothing references them.
10. All gates in `tests:` pass, including `check-evidence` (0 errors) and
    `check-staleness` (exit 0; the report's numbers may change because citations
    now resolve to the same runs, and any change is explained in Results).
11. Zero paid draws.

## Decisions

- **No dual-source window.** A read-only migration check is allowed inside the
  test suite, but discovery never reads `references/evals*` again. Supporting two
  layouts indefinitely would leave the boundary half-moved.
- **`files:` gains exactly one construct.** A trailing slash means subtree. No
  globs, no negation, no new syntax — `speccheck` exists to be boring.
- **History is not rewritten.** 38 specs and several backlog tasks cite the old
  paths. They are the record of what was true then; editing them would make the
  record agree with the present, which is the one thing a record must not do.

## Open Questions

None.

## Prompt Notes

- Do the `speccheck` subtree rule first and prove it with the 368-path diff; that
  is the only way this spec can pass its own `spec-check`.
- Use `git mv` for every case file and fixture directory so history follows the
  move. Do not `rm` and re-add.
- `git.json` `base` values are relative to the case directory; after the move they
  point at `fixtures/`. Re-resolve and prove with the before/after tree hashes.
- The bootstrap skill's own `references/evals*` moves like every other skill.
  SPEC-0061 is editing that skill's template in parallel and must not touch
  `references/evals*`; if a merge conflict appears there, this spec wins.

## Results

**F3 first — `speccheck` learned the subtree rule.** In
`scripts/lib/evals/speccheck.mjs`, a `files:` entry ending in `/` now covers every
path under that prefix: a covered path is clean, an undeclared file under the
subtree is still an error, a declared subtree the diff never touches is a
warning, and an entry without the slash keeps exact equality. Four tests in
`speccheck.test.mjs` pin those four cases;
`node --test scripts/lib/evals/speccheck.test.mjs` → 25/25 pass. That is what lets
this spec declare `evals/` and the 27 old `references/evals*` prefixes instead of
368 individual paths.

**F1/F2 — the move and the reader.** `git mv` moved 368 files: 14
`skills/<id>/references/evals.md` → `evals/<id>/cases.md` and 13 fixture trees
(72 top-level fixture directories, including the shared `base`/`base-red` trees)
to `evals/<id>/fixtures/<n>/`. Nothing was removed and re-added; `git status`
reports all 368 as renames. `parse.mjs` now resolves the corpus through
`corpusDir(skillDir)` / `skillDirForCorpus(casesFile)` and `readEvals` reads
`evals/<id>/cases.md`; `fixture.mjs` stages `evals/<id>/fixtures/<n>/`.
`run-evals`, `replay-evals`, `check-staleness` and `validate-skills` use the same
layout. There is no fallback: the remaining `references/evals` strings in
`scripts/` are the leak detector's stale-copy rule, the validator's stray guard,
comments that name it as the old shape, and the tests that assert the old path is
absent (`fixture.test.mjs`, `corpus.test.mjs`, `leak.test.mjs`).

**AC-1 — case parity.** Before the move, `evals/corpus-baseline.json` recorded,
per skill, the `cases.md` sha256, every case's `{n, title, prompt, why, assert}`
digest, and every fixture tree hash. The committed test
`every case and fixture survived the move byte-for-byte`
(`scripts/lib/evals/corpus.test.mjs`) re-parses the moved corpus and compares
against it. All 14 skills and 97 cases (94 runnable, 3 manual) match: identical
per-case digests and identical `cases.md` bytes. Aggregate over the sorted
`id#n:title:fieldsSha256` lines: **before `a2c571ceccf78e3d`, after
`a2c571ceccf78e3d`**. `node scripts/run-evals.mjs --root skills --list --check`
→ `Parsed 97 case(s): 94 runnable, 3 manual`, exit 0.

**AC-2 — fixture parity.** All **72/72** fixture tree hashes match the pre-move
baseline; aggregate over the sorted `id/name:treeHash` lines: **before
`febd93a742b917ca`, after `febd93a742b917ca`**. `git.json` bases are relative to
the case directory, so they moved with it: `review-code`'s `../base` now resolves
to `evals/review-code/fixtures/base`, `audit-code-quality` #9's `../6` to
`evals/audit-code-quality/fixtures/6`, and `survey-inflight-work`'s `../base` to
`evals/survey-inflight-work/fixtures/base`. `--list --check` re-resolves every
manifest (the `git.json` base check in `parse.mjs`) and exits 0.

**AC-5/AC-6 — the guards.** `validate-skills.mjs` fails on any
`skills/*/references/evals*` path, and the negative test
`validate-skills fails on a stray references/evals path` (in `corpus.test.mjs`)
builds a synthetic skill with one and asserts exit 1 and the error text. The real
checkout is clean: `node scripts/validate-skills.mjs --root skills` → `All clear`,
exit 0; the committed test `no skill checkout carries the eval corpus after the
move` also scans every skill.

**AC-7 — staging proof, no model.** `node scripts/run-evals.mjs --root skills
--level smoke --skill review-code --case 1 --run` staged the case in
`2026-11-10T19-06-29--review-code` (scratch
`/var/folders/4y/djb3lgn91gl9t5hxytq19y600000gn/T/eval-review-code-1-fauliC`).
`find <scratch> -path '*references/evals*'` printed nothing; the staged skill
contains only `SKILL.md` and `references/deterministic-checks.md`. No provider was
called.

**AC-9 — the dead consumers.** `scripts/emit-promptfoo.mjs` and
`scripts/promptfoo/provider.mjs` are deleted, the generated-YAML entry is gone
from `.gitignore`, and the README's Promptfoo section is replaced by a pointer to
the published matrix. No script imports or invokes them. The remaining prose
mentions are history this spec must not rewrite: `docs/specs/SPEC-0001…`,
`docs/evals/review-code-matrix.md` (SPEC-0063 owns that file), and this spec's
CHANGELOG entry naming the deletion.

**AC-10 — gates.**

| command | exit |
| --- | --- |
| `node scripts/validate-skills.mjs --root skills` | 0 (`All clear`) |
| `node scripts/run-evals.mjs --root skills --list --check` | 0 (`Parsed 97`) |
| `node --test scripts/lib/evals/*.test.mjs` | 0 (472 tests) |
| `node --test scripts/lib/*.test.mjs` | 0 (13 tests) |
| `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` | 0 (34 tests) |
| `node scripts/check-sensor-parity.mjs` | 0 (`2/2 fixtures in parity`) |
| `node scripts/check-evidence.mjs` | 0 (8 documents, 0 errors, 100 warnings) |
| `node --test scripts/check-staleness.test.mjs` | 0 (7 tests) |
| `node scripts/check-staleness.mjs` | 0 (report form) |
| `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0058-the-corpus-leaves-the-skill.md --base main` | 0 |

`spec-check` exits 0 with 27 `files-declared-untouched` warnings: git's rename
detection reports only the new path for each of the 368 renames, so the 27
declared old paths (14 `evals.md` files and 13 `evals/` subtrees) appear
untouched. They are declarations of what moved, not missing edits; no
`files-touched-undeclared` finding exists.

`check-staleness` now reports **62 cited, 27 stale, 3 uncited**; before this change
the same tree reported 62 cited, 17 stale, 3 uncited. The same 62 cells resolve
and the cited runs are unchanged. The 10 new stale cells are
`bootstrap-project-harness` #14–#23: `harness-state.test.mjs` lives inside that
skill checkout and had to change its fixture-root constant, so the recorded skill
tree hash (`dd55fd88d57d`) no longer matches the current checkout
(`285348f7f19b`). That is the report correctly saying those draws described a
different tree; it is not a broken citation. `check-evidence`'s 100 warnings are
the same pre-existing dirty-run markers as before.

**Not preserved, and why.**

- The preambles inside the moved `cases.md` files still say
  `references/evals/<n>/`. F1 requires `git mv` with byte-identical content, and
  AC-1/AC-2 compare those bytes; editing the prose would break the parity proof.
  The runner now uses the new path; the prose is a stale authoring note.
- `docs/specs/**`, `backlog/**`, `docs/inbox/` and `docs/analysis/` keep the old
  paths as history, per the Non-Goals. No file under `docs/specs/**` or
  `backlog/**` changed except this spec's own Results.
- The spec's `files:` gained three necessary entries: `harness-state.test.mjs`
  (the fixture-root constant), `.gitignore` (the retired exporter's artifact) and
  `.githooks/pre-commit` (a one-line comment naming the corpus file). They are
  consequences of F1 and AC-9, not extra scope.
- No behavioural eval was run; zero paid draws.
