# UI corpus decision memo

- **Spec:** SPEC-0097 — The UI territory is measured, not assumed
- **Date:** 2026-11-16
- **Status:** the instrument is built and stages (F1–F3). **One cell is
  measured** — `critique`, five draws per arm (F4a) — and it is a
  **non-discriminator**: the control reproduces every behavioural assertion. The
  other three cells (F4b) are gated on a budget decision: at the measured
  per-draw price the four-cell wave costs US$ 0.721–0.829 including the discarded
  smoke, above the spec's US$ 0.50 ceiling. `companion-skills.json` has no
  `impeccable` entry: one cell is not the four the entry would rest on (§8). No
  skill is created by this memo.

## 1. The instrument (F1–F2)

Four plain trees under this directory, each with an `AGENTS.md` (task contract +
declared human review) and the page files:

| Tree | Capability | The page | Editable |
| --- | --- | --- | --- |
| `critique/` | hierarchy critique | a landing page with three CTAs (`Start free trial`, `Book a demo`, `Read the docs`) repeated at identical weight nine times, in a type ramp where `h1` and `h2` are both `1.25rem` | no |
| `audit/` | accessibility audit | a payout form with five fields that carry a placeholder instead of a label and helper text at `#9aa0a6` on `#ffffff` (about 2.6:1) | no |
| `empty-state/` | empty state | an orders table — header, filters, a `New order` action — whose body is one `<td colspan="5">No data</td>` | yes |
| `document/` | design system | a settings page whose `:root` block holds the whole token system, with no `DESIGN.md` anywhere | partly (create `DESIGN.md`) |

`ui-cases.md` defines the four cells: `prompt`, `why`, `expect`, `assert:`. The
machine half is `skill impeccable` (the load gate), `reply`, `changed`,
`unchanged`, `file` and `filematch` — every one an existing kind. Nothing
compares a screenshot, queries a DOM or computes a style: the visual half is a
human-review item per case, declared in the same file and in each `AGENTS.md`
(§7). Freeze-compatible by construction.

## 2. The pin and the mirror (F3)

The skill under measurement is the host install at `~/.agents/skills/impeccable`
— outside this checkout, and listed in `.gitignore` so an in-tree install would
not be committed either — so the cases cannot be staged from the repository root
without breaking CI on a clean checkout. The runnable copy is the gitignored
mirror `.lane/pinned/impeccable/` (the `SPEC-0085` shape):

| Fact | Value |
| --- | --- |
| Source | `pbakaus/impeccable` — <https://github.com/pbakaus/impeccable> |
| Skill version | `4.8.1` (`SKILL.md` → `metadata.version`) |
| Engine | `0.1.19` (`scripts/VERSION`) |
| Licence | **Apache-2.0**, Copyright 2025 Paul Bakaus — confirmed 2026-11-16 in `LICENSE` at the source URL above; the repository also ships `NOTICE.md`, which no redistribution here triggers (nothing from the mirror is committed) |
| Staged tree hash | `b1fbb5d894be28f1d8f430fcc159fca78a5a0114062b4fe2bde01b3d231ae0b6` |

The copy is verbatim: the harness `treeHash` of the install and of
`mirror/skills/impeccable` are the same digest above, and no file was edited.

The mirror stages all four cells with no finding:

```
$ node scripts/eval.mjs check --root .lane/pinned/impeccable
warn: impeccable: case 4: file DESIGN.md — unverified target: the draw must create it
warn: impeccable: case 4: filematch DESIGN.md --ink-strong — unverified target: the draw must create it
warn: impeccable: case 4: filematch DESIGN.md --space-3 — unverified target: the draw must create it
Parsed 4 case(s): 4 runnable, 0 manual; 4 fixture(s) staged.

No findings.
```

The three warnings are the declared create target of case 4 (the draw writes
`DESIGN.md`), the same class `write-implementation-prompt` carries. The CI path
is unchanged: `node scripts/eval.mjs check --root skills` still parses 110 cases
and stages 108 with no findings, because nothing about the installed skill or the
mirror enters the tracked tree.

Durable fixture hashes (path-independent, same algorithm as a run record):

| Tree | `treeHash` | Prompt hash |
| --- | --- | --- |
| `critique/` (case 1) | `ae60be75e0e6d86a052254223c963ab59c9064fa736882e0bf68bb18163e1b0f` | `20b4297e0b3370c0dd9051eef274abd3aacabd0089611eebcc9b99385d239c4b` |
| `audit/` (case 2) | `63c05d326fd8d03fcd84176d800179d5141215d9b700d0543cf61fe0dd4e6315` | `13f6ea0a329402728a17a10a42fde8555151a028d424e8fbfdfc55622c1a030c` |
| `empty-state/` (case 3) | `900e85645a16cef834cb830e4b1a398a55c45ba334c53a73f60f23b8162a963d` | `d8938561f9c10b5674fdaa197eb7e3277ec0537da9b101b54e18e2af224ac428` |
| `document/` (case 4) | `88c5690f4d4cd282ee5282a12a8b16896286cc451c8f1d1aa90f6a69590beec2` | `63b7462181ac8d0118815957a0662e5e63212a6dcc34b0fb9d75d739c89a1294` |

Recompute with:

```sh
node --input-type=module -e "import { treeHash } from './scripts/lib/evals/fixture.mjs'; console.log(treeHash('docs/analysis/ui-corpus/critique'))"
```

## 3. The smoke (6 discarded draws)

Six draws ran on case 1 before any wave: three on the first prompt, three on the
calibrated one. All six are **discarded** — they are the calibration, not a
count. Model `agentworks/deepseek-v4-1-flash` (explicit `--model`), agent
`build`, level `behavior`, concurrency 4, detector `cf2e2e319d975a5b`, seatbelt
isolation `enforced: true`, `repoSha 4c09690`.

| Run directory | Prompt hash | Draw | Loaded | Status | Steps | Cost (US$) |
| --- | --- | --- | --- | --- | --- | --- |
| `2026-11-15T22-32-09--impeccable--agentworks-deepseek-v4-1-flash` | `e310e713…` | r1 | no | 4/5 (load gate red) | 2 | 0.010086 |
| | | r2 | yes | 5/5 | 5 | 0.021640 |
| | | r3 | no | 4/5 (load gate red) | 2 | 0.009405 |
| `2026-11-15T22-37-09--impeccable--agentworks-deepseek-v4-1-flash` | `20b4297e…` | r1 | no | 4/5 (load gate red) | 2 | 0.008572 |
| | | r2 | yes | 5/5 | 7 | 0.026729 |
| | | r3 | yes | 5/5 | 7 | 0.031654 |

**Discarded draws: 6. Total: US$ 0.108084.**

**What the smoke found, and what was changed.** With the first prompt
("Critique the visual hierarchy of this landing page…") the skill loaded in
**1/3** draws; the two misses answered from the model's own knowledge in two
steps, with no skill call and no skill read. That is the smoke's declared failure
mode — the case has to load before it can measure anything — so the prompt was
calibrated **before any control draw** to the skill's own vocabulary ("Give me a
UX review of this landing page: critique the visual hierarchy…"), which is a
natural user ask and does not name the skill. On the calibrated prompt it loaded
in **2/3**. No assertion was edited after seeing a paid draw in this phase; the
change is the prompt, it precedes every count, and both prompt hashes are
published above. (The one assertion that was later corrected is §5's
`reply` oracle, and its correction is published with both readings.)

Both smoke runs are clean: `check-eval-run` reports `findings` equal to the load
misses only (2 and 1), `warnings=0 skillLeaks=0 hostReads=0 isolated=yes
deniedDraws=0`, no contamination, no infrastructure attempt. The calibrated
prompt hash `20b4297e…` is the current case 1 prompt; `e310e713…` is history.

**The assertions did not misclassify anything here**, with one exception found
later: the `reply` keyword gate did misread two genuine critiques in the paid
cell (§5), and it was corrected before publication. The load misses were true
misses: in each, only `skill impeccable` was red and the critique was strong, so
calling it green would have hidden that the skill was never used.

## 4. The cost arithmetic, and why the four-cell wave did not run (F4b)

The spec's full wave is 5+5 draws on each of four cells — 40 draws — with a
ceiling of **US$ 0.50 total, discarded draws included**.

Measured at this pin, the two costs a draw actually has:

| Draw shape | Measured cost per draw | Draws |
| --- | --- | --- |
| skill loaded (5–9 steps) | 0.021640 / 0.026729 / 0.031654 — **mean US$ 0.026674** | 3 |
| no skill call (2 steps) | 0.010086 / 0.009405 / 0.008572 — **mean US$ 0.009354** | 3 |

Projected four-cell wave:

- all 20 candidate draws load: `20 × 0.026674 + 20 × 0.009354` = **US$ 0.721**;
- a 2/3 load rate (what the calibrated smoke and the measured cell observed):
  `20 × (0.667 × 0.026674 + 0.333 × 0.009354) + 20 × 0.009354` = **US$ 0.605**.

With the US$ 0.108084 already spent on the smoke, the total is **US$ 0.713 to
US$ 0.829** — 1.43× to 1.66× the ceiling. The ceiling is not reachable at 40
draws: it leaves US$ 0.0098 per draw after the smoke, which is the price of a
draw that never loads the skill.

The human gate on 2026-11-16 chose to stop the **four-cell** wave rather than
raise the ceiling inside a measurement, then approved **one** cell as F4a (§5).
Two ways to unblock F4b, both human decisions:

1. **Raise the ceiling to about US$ 0.85** and run the remaining three cells
   unchanged (5+5 each, 30 draws): US$ 0.454 at the observed 2/3 load rate,
   US$ 0.540 all-load, so the total lands at US$ 0.735–0.822 with the smoke and
   the critique cell already spent.
2. **Keep US$ 0.50** and cut F4b to a screening (2+2 per cell, 4 draws per
   remaining cell at about US$ 0.061 each): US$ 0.182 for the three cells,
   US$ 0.463 accumulated. That is published as a screening, never as evidence.

**The staged scope is therefore F4a + F4b.** F4a measured `critique` (this
memo); F4b — `audit`, `empty-state`, `document` — is gated on that budget
decision, and its cells are `unresolved` (§6). The reason is cost, not design:
all three fixtures stage clean and their cases parse.

## 5. The critique cell (F4a), measured

Five draws per arm on case 1, one run directory each, same prompt
(`20b4297e…`) and same fixture (`ae60be75…`) in both arms. Model
`agentworks/deepseek-v4-1-flash`, agent `build`, level `behavior`, concurrency 4,
detector `cf2e2e319d975a5b`, seatbelt isolation enforced, `repoSha 4c09690`,
`repeat 5`.

| Arm | Run directory |
| --- | --- |
| without skill (control) | `2026-11-16T09-56-17--impeccable--agentworks-deepseek-v4-1-flash--without-skill` |
| with skill | `2026-11-16T09-47-18--impeccable--agentworks-deepseek-v4-1-flash` |

### Per draw

| Draw | Arm | Loaded | As-run | Cost (US$) | Steps |
| --- | --- | --- | --- | --- | --- |
| r1 | with | no | red: `skill` | 0.011534 | 2 |
| r2 | with | yes | pass 5/5 | 0.038313 | 8 |
| r3 | with | yes | pass 5/5 | 0.033803 | 9 |
| r4 | with | no | red: `skill`, `reply hierarchy` | 0.008502 | 2 |
| r5 | with | yes | pass 5/5 | 0.037834 | 7 |
| r1 | without | — | red: `skill`, `reply hierarchy` | 0.008158 | 2 |
| r2 | without | — | red: `skill` | 0.009578 | 2 |
| r3 | without | — | red: `skill` | 0.008213 | 2 |
| r4 | without | — | red: `skill` | 0.008672 | 2 |
| r5 | without | — | red: `skill` | 0.008392 | 2 |

**Cell cost: US$ 0.129987 (with) + US$ 0.043013 (without) = US$ 0.173000.**
**Accumulated including the six discarded smoke draws: US$ 0.281084.**

`check-eval-run` on the two runs:

```
with skill:    cases=1 reps=5 findings=2 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0   (exit 1)
without skill: cases=1 reps=5 findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0   (exit 0)
```

The two `findings` are `gate-miss impeccable#1 r1` and `r4`: the skill was not
loaded. They are published as failures of the skill arm, not re-judged
(`SPEC-0092` precedent). No draw is contaminated, no leak, no host read, no
denied draw.

### The oracle that was wrong, and the re-judge

The as-run cell had two extra reds — with r4 and control r1 — on
`reply [Hh]ierarchy`. Both transcripts are strong hierarchy critiques (9 CTAs at
identical weight, a flat 2-step type scale, no primary action, the fineprint
misattached); neither uses the literal word "hierarchy". The assertion was a
keyword gate that misread what the draw did, so the case was corrected to
`reply ([Hh]ierarchy|[Pp]rimary|type[- ]scale)` — the words these critiques
actually use — and the **same ten paid draws** were re-judged model-free with
`inspect --replay` (no new draw, no new cost):

```
$ node scripts/eval.mjs inspect <run-dir> --replay --root .lane/pinned/impeccable/skills --verbose
with r1 failed -> failed   red: skill impeccable
with r2 passed -> passed
with r3 passed -> passed
with r4 failed -> failed   red: skill impeccable
with r5 passed -> passed
without r1..r5: failed -> failed   red: skill impeccable
```

The two `reply` reds become passes; the seven `skill` reds stay red. Both
readings are published here, and the as-run count is not erased.

### Counts

| Arm | Clean draws | Loaded | Scored (all assertions) | Behavioural (all but `skill`) |
| --- | --- | --- | --- | --- |
| with skill | 5/5 | **3/5** (r2, r3, r5) | **3/5** as-run and re-judged | **5/5** re-judged (4/5 as-run) |
| without skill | 5/5 | 0/5 by construction | **0/5** (the load assertion) | **5/5** re-judged (4/5 as-run) |

Per-assertion failures, as-run and re-judged: `skill impeccable` — 2 with-skill
draws, 5 control draws (the control's declared 0/5); `reply ([Hh]ierarchy…)` —
1 with-skill and 1 control draw as-run, 0 each after the correction;
`reply (Start free trial|Book a demo|Read the docs)`, `unchanged index.html`,
`unchanged styles.css` — 0 failures in all ten draws.

### Verdict: non-discriminator

The control reproduces every behavioural assertion in **5/5** clean draws,
including the corrected hierarchy assertion; the skill arm does the same in
**5/5**. There is no behavioural delta to attribute to the skill: a bare model
reads two files and names the nine identical CTAs, the absent primary action and
the flat type scale without any staged skill. The scored 3/5 vs 0/5 is the load
gate — the routing measurement — not a capability: the skill loaded in 3/5
draws, and the two misses produced critiques the human-review items accept.

So the cell is a **non-discriminator**, published as one. Its routing split
(3/5) is named but is not read as a separator: the same model that skipped the
skill wrote the same critique the skill arm wrote. What is *not* measured here is
the visual half — whether the proposals are good — which stays with the human
review (§7) and is not scored by this memo.

## 6. Per-cell status

| Cell | Class | Reason |
| --- | --- | --- |
| 1 — `critique/` | **non-discriminator** | measured 5+5 (§5): control 5/5 behavioural, skill 5/5 behavioural, load gate 3/5. The bare model already produces the critique. |
| 2 — `audit/` | **unresolved** | F4b, gated on the budget decision (§4). No draw of either arm; the fixture stages clean. |
| 3 — `empty-state/` | **unresolved** | F4b, same gate. The fixture stages clean. |
| 4 — `document/` | **unresolved** | F4b, same gate. The fixture stages clean. |

`unresolved` on cells 2–4 is not a claim: nothing was compared there.

## 7. The declared human-review items (listed, not scored)

Every case states these in its `AGENTS.md`; they are the visual half, so no
assertion stands in for them. For the measured critique cell they are the part
this memo deliberately does not score — the reader opens the ten transcripts in
§5's run directories.

**critique/ (case 1 — measured)**

- Does the review name the three competing calls to action and the absence of a
  primary one?
- Does it propose a specific hierarchy — what becomes primary, what is demoted?
- Is every claim tied to what the two files show (label, class, size, order),
  not to taste or an invented screenshot?
- Would applying it change the page — or is it "it looks fine" plus heuristics?

**audit/ (case 2 — not run)**

- Are the unlabelled fields named one by one, not "add labels" in general?
- Is the helper-text contrast named with a ratio or a threshold?
- Are accessibility facts separated from cosmetic preferences, each fix
  concrete (`<label for>`, `aria-describedby`, a darker token) and scoped to the
  file that carries the defect?
- Does the audit avoid inventing a browser session, a computed-style dump or a
  conformance claim the two files cannot support?

**empty-state/ (case 3 — not run)**

- Is the empty state a designed state — a reason and a next step — rather than
  `No data` reworded?
- Is the first-use state distinguished from an empty-filter result, and does the
  action match the page's real next step?
- Does the table keep its five columns and still work when rows exist?
- Is the state reachable without a mouse, and does the copy avoid inventing
  data, permissions or an account the page does not have?

**document/ (case 4 — not run)**

- Does `DESIGN.md` document the tokens the CSS defines, with their values,
  rather than a wishlist?
- Can a component author build with it without opening `styles.css`, or is it
  the `:root` block in prose?
- Does it record how tokens combine (surface vs ink, what carries emphasis)?
- Does it name what is missing (motion, dark theme, breakpoints) instead of
  inventing it?

## 8. The registry decision (F5)

**`impeccable` does not enter `companion-skills.json` this wave.** The manifest's
rule is one entry per *measured* companion, and one cell of four is not the
measurement the entry would rest on — a page-level critique is the easiest of the
four, and it separated in neither direction. Everything the entry needs is
recorded above — source, `sourceUrl`, licence Apache-2.0, pin `4.8.1`, engine
`0.1.19`, staged tree hash `b1fbb5d8…` — so it is a data edit away once F4b
exists. It waits on the draws, not on the facts.

The bootstrap's install step would `git checkout 4.8.1` before copying
`skills/impeccable`; the tag was not verified against the upstream remote in this
wave (the version comes from the installed skill's own `metadata.version`). That
is a second reason to keep the entry closed until someone checks the tag while
preparing it — and a fact to record in the entry when it lands.

## 9. Known limitations

- **No visual oracle.** The `(b)` decision of `SPEC-0077` stands. The page's
  rendered appearance is never read by the harness; a claim about how the result
  *looks* is a person's reading, listed in §7.
- **The load gate is a routing measurement.** `skill impeccable` is red when the
  skill was neither called nor read from the scratch copy. It loaded in 3/5
  draws here, so a B arm's scored count depends on a trigger the case cannot
  force without naming the skill in the prompt — which would make the arm a
  command, not a capability.
- **One cell is one cell.** A non-discriminator on a page-level critique says
  nothing about the empty-state or design-system cells; the instrument's own
  data programme found exactly that split between two composition screens
  (`docs/analysis/data-corpus/decision.md` §4). F4b is the cell set that could;
  it is unfunded, not unneeded.
- **The `reply` oracle is a keyword gate.** The corrected form
  (`hierarchy|primary|type scale`) is what these critiques write; a critique that
  ranks by other vocabulary would read red. It is backed by the human review, and
  its correction is published rather than folded into the as-run count.
- **The fixture `AGENTS.md` is part of the agent's context.** It states the task
  contract and the read-only scope, so a draw is told what is editable. That
  keeps the `unchanged` assertions about compliance rather than luck.
- **The skill is a launcher plus an engine binary.** `scripts/impeccable`
  resolves `scripts/bin/darwin-arm64/impeccable` (18 MB) from inside the scratch
  copy; the skill's own documented degraded path applies when the launcher cannot
  run. The measured cell did not need it, and no draw was asked to render a page.
- **n=5.** Five clean draws per arm can show a large separation or its absence;
  it cannot bound a small delta.
- **The cost figures are recorded provider cost**, not a billing statement: the
  `step-finish` events' `cost` summed per draw, at `agentworks`' declared prices
  for this model.

## 10. What this memo does not decide

- Whether `impeccable` separates from the control on three of the four cells —
  F4b did not run.
- Whether a UI/UX skill is missing. `SPEC-0036` and `SPEC-0038` stay paused until
  the evidence exists; a single non-discriminator does not close or reopen them.
- Whether `simplify` needs the same treatment — it lives outside this repo.
- Whether the ceiling should move. That is a human gate; §4 publishes what the
  remaining cells would cost.
