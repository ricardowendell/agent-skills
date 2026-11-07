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
| `specs/active/` | the pdlc work queue; `plan`, `prompt`, `verify` and `merge` read here |
| `prompts/` | implementation prompts generated from `ready` specs |
| `evals/` | the `review-code`, `implement-from-prompt`, `write-implementation-prompt` and `pipeline-bookends` matrices, the `harness-health.md` baseline, experiment records, and `coverage.md` |
| `integrations/` | how each agent host is wired; `opencode.md` is this kit's canonical-vs-link map |
| `../runs/` | pdlc run records, one per verified cycle |

`evals/coverage.md` is the inventory: cases per skill, how each is staged, and
what has actually been measured.

## Two backlogs

- `docs/backlog/` is what `/process-inbox` and `/groom` read and write in a
  consuming project. It does not exist here.
- `backlog/` at the repo root is the working queue used to build this repo
  (`config.yml`, `tasks/task-N …`). A task becomes a spec under `docs/specs/`,
  and the spec names its source task in `source_docs`.

## The pdlc cycle

The process policy is [`pipeline.md`](pipeline.md): mode, release tier, retry
budget and the `lint`/`selftest` gates. A spec enters the queue as
`specs/active/SPEC-NNNN-*.md` with `status: ready`, a `task:` binding and a
`files:` list; `pdlc plan` sees only that queue. After `verify` and `merge`, the
task closes and the run record lands in `runs/`. Specs already implemented move
to `specs/` as the durable record, untouched by the cycle.

## Where to start

1. [`README.md`](../README.md) — what the skills are and how they are evaluated.
2. [`CONTRIBUTING.md`](../CONTRIBUTING.md) — adding a skill or a case, and how to
   measure it.
3. [`evals/coverage.md`](evals/coverage.md) — which cases exist and which have
   evidence.
4. [`evals/review-code-matrix.md`](evals/review-code-matrix.md),
   [`evals/implement-from-prompt-matrix.md`](evals/implement-from-prompt-matrix.md),
   [`evals/write-implementation-prompt-matrix.md`](evals/write-implementation-prompt-matrix.md)
   and [`evals/pipeline-bookends-matrix.md`](evals/pipeline-bookends-matrix.md)
   — the published matrices.
