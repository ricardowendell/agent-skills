# UI corpus

Four small interface trees and the case definitions that measure whether an
installed UI/UX skill sees what a reader sees. The corpus is an **instrument**:
it exists so a later spec can decide whether a skill is missing, not to justify
one. No skill is created from it.

The per-cell decision, the pin and the cost record are in
[`decision.md`](decision.md); the four case definitions are in
[`ui-cases.md`](ui-cases.md).

## What is here

| Tree | Capability | Editable? | Files |
| --- | --- | --- | --- |
| `critique/` | hierarchy critique of a landing page with three competing CTAs | no — `unchanged` | `AGENTS.md`, `index.html`, `styles.css` |
| `audit/` | accessibility audit of a form with unlabelled inputs and low-contrast helper text | no — `unchanged` | `AGENTS.md`, `form.html`, `styles.css` |
| `empty-state/` | design the empty state of an orders table that renders `No data` | yes — `changed` | `AGENTS.md`, `orders.html`, `styles.css` |
| `document/` | document the existing CSS token system into `DESIGN.md` | partly — `unchanged` on the CSS | `AGENTS.md`, `index.html`, `styles.css` |

Each tree carries an `AGENTS.md` with two halves: the task contract for the
agent (what is editable, what evidence exists) and the human-review list for the
person reading the run. The trees are plain files — no build step, no data, no
network — so a fixture is the directory itself.

## The cases

`ui-cases.md` defines four cells in the eval format (`prompt`, `why`, `expect`,
`assert:`). Two rules decide the design:

- **Only existing assertion kinds.** The machine half uses `reply`,
  `changed`/`unchanged`, `file`, `filematch` and `skill` — every one of them is
  in the closed list in `README.md` §Assertions. The one `skill
  impeccable` assertion is the load gate `SPEC-0085` already uses: a draw that
  never reached the skill is named, not read as a behavioural pass. No new kind,
  matcher or flag was added.
- **No visual oracle.** The `(b)` decision of `SPEC-0077` stands: nothing here
  compares a screenshot, queries a DOM, reads a computed style or runs `axe`.
  The visual judgment is a declared human-review item per case, listed in each
  `AGENTS.md` and in `decision.md` — never a claimed deterministic pass.

## The mirror (gitignored)

The skill under measurement is installed in the host's skills root at
`~/.agents/skills/impeccable`, outside this checkout — there is no
`skills/impeccable` in the repo (the path is in `.gitignore` for hosts that
install in-tree). Staging the cases from the repository root would therefore
break CI on a clean checkout. The runnable copy lives in a gitignored mirror,
the same shape `SPEC-0085` uses for the contract corpus:

```
.lane/pinned/impeccable/
  skills/impeccable/            copied verbatim from the install
  evals/impeccable/cases.md     copied verbatim from ui-cases.md
  evals/impeccable/fixtures/1/  the critique tree
  evals/impeccable/fixtures/2/  the audit tree
  evals/impeccable/fixtures/3/  the empty-state tree
  evals/impeccable/fixtures/4/  the document tree
```

Nothing from the mirror is committed, and the skill is never edited. Rebuild it
from the repository root with:

```sh
MIRROR=.lane/pinned/impeccable
mkdir -p "$MIRROR/skills" "$MIRROR/evals/impeccable/fixtures"
cp -R "$HOME/.agents/skills/impeccable" "$MIRROR/skills/impeccable"
cp docs/analysis/ui-corpus/ui-cases.md "$MIRROR/evals/impeccable/cases.md"
cp -R docs/analysis/ui-corpus/critique/.    "$MIRROR/evals/impeccable/fixtures/1/"
cp -R docs/analysis/ui-corpus/audit/.       "$MIRROR/evals/impeccable/fixtures/2/"
cp -R docs/analysis/ui-corpus/empty-state/. "$MIRROR/evals/impeccable/fixtures/3/"
cp -R docs/analysis/ui-corpus/document/.    "$MIRROR/evals/impeccable/fixtures/4/"
```

A change to a case is made in `ui-cases.md` (or in a tree) and re-copied; the
mirror is never the place an edit starts.

## Running it

Model-free: stage all four cells. The three `file`/`filematch` warnings on case 4
are the declared create target (`DESIGN.md`), not findings.

```sh
node scripts/eval.mjs check --root .lane/pinned/impeccable   # 4 cases, 0 findings
node scripts/eval.mjs check --root skills                    # the CI path, unchanged
```

Paid, one cell at a time (the model is the one the spec pins):

```sh
node scripts/eval.mjs run impeccable 1 --arm with --repeat 5 \
  --root .lane/pinned/impeccable --model agentworks/deepseek-v4-1-flash
node scripts/eval.mjs run impeccable 1 --arm without --repeat 5 \
  --root .lane/pinned/impeccable --model agentworks/deepseek-v4-1-flash
```

(`compare impeccable 1 --repeat 5` runs both arms in one invocation; the two
`run` calls above are the same thing in two run directories. Case numbers are
the mirror's: 1 critique, 2 audit, 3 empty-state, 4 document.) The control arm
stages no skill — the skill tool is denied — and the candidate arm stages
`.lane/pinned/impeccable/skills/impeccable` in the scratch. Five draws per arm is
the evidence floor; a lower count is a screening and must be published as one.
Read the cost of a draw **before** starting a wave: `decision.md` §4 records the
measured per-draw price, the amendment that funded two cells, and the two cells
`TASK-121` still owes.

When a transcript assertion turns out to misclassify what a paid draw did, the
case is corrected and the stored draws are re-judged model-free — never
re-scored by eye:

```sh
node scripts/eval.mjs inspect <run-dir> --replay --root .lane/pinned/impeccable/skills --verbose
```

## Rules

- The instrument is not a product, and no skill is authored here: the program's
  rule is that a skill follows a corpus that shows a gap, not the other way
  round.
- The visual half is a person's reading, declared per case. An assertion that
  stands in for it would be the visual oracle the freeze forbids.
- The upstream skill is copied, never edited, and never committed. A mirror that
  differs from the install (`treeHash`) invalidates the measurement.
- A case that fails on staging is fixed in `ui-cases.md` or the tree and
  re-probed. A draw that a transcript assertion misread is corrected and
  re-judged with `inspect --replay` over the same paid draws; an as-run red is
  never quietly replaced, both readings are published.
- `docs/evals/coverage.md` is not edited for this corpus: this README and
  `decision.md` are the discoverable entry point.
