# UI cases

The durable definitions of the four UI cells measured by `SPEC-0097`. The mirror
`.lane/pinned/impeccable/` copies this file verbatim into
`evals/impeccable/cases.md`, with the fixtures copied from the four trees beside
it (`fixtures/<n>/`). The prompt and the fixture hash are identical in both arms;
only the staged skill changes.

**B arm:** the installed `impeccable` skill (`pbakaus/impeccable`, skill `4.8.1`,
engine `0.1.19`), copied verbatim into the gitignored mirror. **A arm:** the same
prompt and fixture with no skill staged. The mirror is not committed; the
decisions and the run directories are in [`decision.md`](decision.md).

**No visual oracle.** The `(b)` decision of `SPEC-0077` stands, so every case
parts the judgment in two: the machine-checked assertions below, and the visual
half, which is a declared human-review item read by a person. The assertions only
use the closed kind list in `README.md`; the one addition is `skill impeccable`,
the load gate `SPEC-0085` already uses, so a draw that never loaded the skill is
named instead of read as a behavioural pass. Nothing here compares a screenshot,
queries a DOM or computes a style.

Each tree's `AGENTS.md` carries the same split for the agent: the task contract
(what is editable) and the human-review list for the person reading the run.

1. **Critique: a landing page with three competing calls to action.**
   - prompt: Give me a UX review of this landing page: critique the visual hierarchy. `index.html` and `styles.css` are the whole page. I want to know what the page is asking the visitor to do, whether it reads as one clear next step, and what I should change first. Read-only: report the review, do not change any file.
   - tags: ui
   - why: the page repeats three calls to action ("Start free trial", "Book a demo", "Read the docs") at identical weight in the hero, in every feature card and in the closing block, inside a type ramp where `h1`, `h2` and the body are all `1rem`–`1.25rem`. A hierarchy critique has to see the competition and choose a primary action; a plain summary of the page does not. The visual half — whether the proposed hierarchy is good — is human review, because no assertion can look at the page.
   - expect: Names the three competing calls to action and the absence of a primary one.
   - expect: Proposes a specific hierarchy — which action becomes primary, which are demoted or removed.
   - expect: Human review (visual): every claim is tied to what `index.html` and `styles.css` show (label, class, size, order), not to taste or an invented screenshot.
   - expect: Human review (visual): the critique would change the page if a designer applied it; "it looks fine" or a generic list of heuristics fails.
   - assert: skill impeccable
   - assert: reply [Hh]ierarchy
   - assert: reply (Start free trial|Book a demo|Read the docs)
   - assert: unchanged index.html
   - assert: unchanged styles.css

2. **Audit: a form with unlabelled inputs and low-contrast helper text.**
   - prompt: Audit this payout form for accessibility problems. `form.html` and `styles.css` are the whole page. Give me the findings with the file and the selector or line for each, and the fix. Read-only: report the audit, do not change any file.
   - tags: ui
   - why: five fields carry a placeholder instead of a label (`account_name`, `routing_number`, `account_number`, `cadence`, `threshold`) and `.helper` is `#9aa0a6` on `#ffffff` (about 2.6:1, under 4.5:1). Both are readable facts in the two files; the cell measures whether the audit names them per field with a fix, not whether it recites WCAG. The visual half — whether the fixes hold once applied — is human review.
   - expect: Names the unlabelled fields one by one, not "add labels" in general.
   - expect: Names the helper-text contrast as a contrast finding with a ratio or a threshold.
   - expect: Human review (visual): accessibility facts are separated from cosmetic preferences, and each fix is concrete (`<label for>`, `aria-describedby`, a darker token) and scoped to the file that carries the defect.
   - expect: Human review (visual): the audit does not invent a browser session, a computed-style dump or a conformance claim the two files cannot support.
   - assert: skill impeccable
   - assert: reply (label|aria)
   - assert: reply (contrast|WCAG|4\.5|ratio)
   - assert: unchanged form.html
   - assert: unchanged styles.css

3. **Empty state: an orders table that renders `No data`.**
   - prompt: The orders table on this page shows `No data` because the account has no orders yet. Design the empty state for it in `orders.html` and `styles.css`: what it says, what it offers, and how it behaves for someone who has never created an order. This tree is editable.
   - tags: ui
   - why: the page is a finished table — header, filters, a `New order` action — whose empty body is one `<td colspan="5">No data</td>`. The cell measures whether the empty state is designed as a state (reason, next step, kept table vocabulary) rather than reworded. `changed orders.html` makes the no-op impossible; what the state looks like is human review, because a visual oracle is frozen.
   - expect: The empty state is a designed state — a reason and a next step — not `No data` reworded.
   - expect: It says which empty case it designed (first use vs an empty filter result) and matches the page's real next step.
   - expect: Human review (visual): the table keeps its five columns and still works when rows exist.
   - expect: Human review (visual): the state is reachable without a mouse and the copy does not invent data, permissions or an account the page does not have.
   - assert: skill impeccable
   - assert: changed orders.html
   - assert: reply ([Ee]mpty[- ]?state|no orders|first order)

4. **Design system: document the token system into `DESIGN.md`.**
   - prompt: Document the CSS token system in `styles.css` as `DESIGN.md` at the root of this tree, so a component author can use it without reading the stylesheet. Do not change `index.html` or `styles.css`. Tell me what you wrote and what is missing from the system.
   - tags: ui
   - why: the `:root` block defines a small system (`--ink-strong`, `--ink-muted`, `--surface-raised`, `--text-sm`…`--text-xl`, `--space-1`…`--space-8`, `--radius-1/2`, `--measure`) with no `DESIGN.md` anywhere. The cell measures whether the agent reads the tokens that exist and writes a document a component author can use, instead of describing a system it wishes the page had. The file and two token names are checkable; whether the document is usable is human review.
   - expect: `DESIGN.md` at the tree root documents the tokens the CSS defines, with their values.
   - expect: It carries the roles (colour, type ramp, spacing scale) and names what the system is missing rather than inventing it.
   - expect: Human review (visual): a component author could build with it without opening `styles.css`; a copy of the `:root` block in prose fails.
   - expect: Human review (visual): it records how tokens combine (surface vs ink, what carries emphasis) and states its own limits (no motion, no dark theme, no breakpoints).
   - assert: skill impeccable
   - assert: file DESIGN.md
   - assert: filematch DESIGN.md --ink-strong
   - assert: filematch DESIGN.md --space-3
   - assert: unchanged index.html
   - assert: unchanged styles.css
   - assert: reply DESIGN\.md
