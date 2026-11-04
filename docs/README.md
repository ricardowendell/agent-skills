# This repo's docs

This tree records changes to the skills and the eval harness in this repository.
It is not the product-doc tree that `/bootstrap` creates in a consuming project:
there is no `product/`, `principles/`, `experience/`, `system/`,
`architecture.md` or `WORKFLOW.md` here, because this repo has no product to
document. The specs below describe edits to `skills/`, `scripts/` and the
templates.

## Map

| Path | Holds |
| --- | --- |
| `inbox/` | raw analyses, processed in place (`status: processed`) |
| `specs/` | `SPEC-NNNN-*.md` — the durable record of why the harness changed |
| `prompts/` | implementation prompts generated from `ready` specs |
| `evals/` | the `review-code` matrix, experiment records, and `coverage.md` |

`evals/coverage.md` is the inventory: cases per skill, how each is staged, and
what has actually been measured.

## Two backlogs

- `docs/backlog/` is what `/process-inbox` and `/groom` read and write in a
  consuming project. It does not exist here.
- `backlog/` at the repo root is the working queue used to build this repo
  (`config.yml`, `tasks/task-N …`). A task becomes a spec under `docs/specs/`,
  and the spec names its source task in `source_docs`.

## Where to start

1. [`README.md`](../README.md) — what the skills are and how they are evaluated.
2. [`CONTRIBUTING.md`](../CONTRIBUTING.md) — adding a skill or a case, and how to
   measure it.
3. [`evals/coverage.md`](evals/coverage.md) — which cases exist and which have
   evidence.
4. [`evals/review-code-matrix.md`](evals/review-code-matrix.md) — the one
   published matrix.
