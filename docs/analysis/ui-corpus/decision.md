# UI corpus decision memo

- **Spec:** SPEC-0097 — The UI territory is measured, not assumed
- **Date:** 2026-11-16
- **Status:** the instrument is built and proves it can stage (F1–F3). The paid
  A/B wave (F4) was **not run**: the noise-free cost of one draw was measured
  first, and the specified 40-draw wave costs about twice the spec's ceiling.
  The human gate on 2026-11-16 chose to stop here rather than raise the ceiling
  silently. Every cell is `unresolved`; `companion-skills.json` has no
  `impeccable` entry (§6). No skill is created by this memo.

This memo records what the instrument is, what the smoke proved, what it cost,
and why the wave did not start. It does not claim a capability.

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
(§5). Freeze-compatible by construction.

## 2. The pin and the mirror (F3)

The skill under measurement is the installed `skills/impeccable` — gitignored, so
the cases cannot be staged from the repository root without breaking CI on a
clean checkout. The runnable copy is the gitignored mirror
`.lane/pinned/impeccable/` (the `SPEC-0085` shape):

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
node --input-type=module -e "import { treeHash, textHash } from './scripts/lib/evals/fixture.mjs'; console.log(treeHash('docs/analysis/ui-corpus/critique'))"
```

## 3. The smoke (F4, first half)

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

**Discarded draws: 6. Total spend: US$ 0.108085.**

**What the smoke found, and what was changed.** With the first prompt
("Critique the visual hierarchy of this landing page…") the skill loaded in
**1/3** draws; the two misses answered from the model's own knowledge in two
steps, with no skill call and no skill read. That is the smoke's declared failure
mode — the case has to load before it can measure anything — so the prompt was
calibrated **before any control draw** to the skill's own vocabulary ("Give me a
UX review of this landing page: critique the visual hierarchy…"), which is a
natural user ask and does not name the skill. On the calibrated prompt it loaded
in **2/3**. No assertion was edited after seeing a draw; the change is the
prompt, it precedes every count, and both prompt hashes are published above.

Both smoke runs are clean: `check-eval-run` reports `findings` equal to the load
misses only (2 and 1), `warnings=0 skillLeaks=0 hostReads=0 isolated=yes
deniedDraws=0`, no contamination, no infrastructure attempt. The calibrated
prompt hash `20b4297e…` is the current case 1 prompt; `e310e713…` is history.

**The assertions did not misclassify anything.** In the four draws that passed,
`unchanged index.html` / `unchanged styles.css` were true (the read-only contract
held) and both `reply` assertions matched what the reply actually argued. In the
two misses, only `skill impeccable` was red: the critique was strong, and calling
it green would have hidden that the skill was never used.

**A finding from the misses, not a result.** The two no-load draws on the first
prompt produced a hierarchy critique that names the three CTAs, the missing
primary action and the flat type scale — from the two files alone, in two steps.
That is the shape of a control draw, and it is a hint, not evidence: no control
arm has been run. It is named here because it bears on the ceiling decision (§4)
and on the next wave's design.

## 4. Why the wave did not run (F4, second half)

The spec's wave is 5+5 draws on each of four cells — 40 draws — with a ceiling of
**US$ 0.50 total, discarded draws included**. The smoke measured the two costs a
draw actually has at this pin:

| Draw shape | Measured cost | Draws available |
| --- | --- | --- |
| skill loaded (5–7 steps) | US$ 0.0216 – 0.0317, mean **0.0292** | 3 |
| no skill call (2 steps) | US$ 0.0086 – 0.0101, mean **0.0094** | 3 |

Projected wave, holding those means:

- all 20 candidate draws load: `20 × 0.0292 + 20 × 0.0094` = **US$ 0.772**;
- a 2/3 load rate (what the calibrated smoke observed):
  `20 × (0.667 × 0.0292 + 0.333 × 0.0094) + 20 × 0.0094` = **US$ 0.640**.

With the US$ 0.108 already spent on the smoke, the total lands between **US$
0.748 and US$ 0.880** — roughly 1.5× to 1.8× the ceiling. The ceiling is not
reachable at 40 draws: it requires US$ 0.0098 per draw, which is the price of a
draw that never loads the skill. Ten draws per case at this pin cannot fit.

The human gate on 2026-11-16 chose to **stop at F1–F3** rather than raise the
ceiling in a measurement memo. Two ways to unblock, both human decisions:

1. **Raise the ceiling to about US$ 1.00** and run the specified wave unchanged
   (40 draws, 5+5 per cell). This is the only shape that satisfies F4/AC-3 as
   written; the total would then be published here with the per-draw costs.
2. **Keep US$ 0.50** and cut the wave to a screening (2+2 per cell, 16 draws at
   about US$ 0.31, plus the US$ 0.108 already spent ≈ US$ 0.42). That is
   published as a screening, never as evidence: 2 draws cannot separate a small
   effect and the spec asks for five.

No draw beyond the smoke was run, so no run directory beyond §3 is cited by this
memo, and no count here is a rate.

## 5. Per-cell status

| Cell | Class | Reason |
| --- | --- | --- |
| 1 — `critique/` | **unresolved** | no control draw and no wave; the ceiling could not fund 5+5 at the measured price (§4). The smoke shows the case stages, loads 2/3, and its read-only assertions hold. |
| 2 — `audit/` | **unresolved** | no draw of any arm. Its fixture stages clean. |
| 3 — `empty-state/` | **unresolved** | no draw of any arm. Its fixture stages clean. |
| 4 — `document/` | **unresolved** | no draw of any arm. Its fixture stages clean. |

`unresolved` is not `non-discriminator`: nothing was compared. A separator or a
non-discriminator claim needs the control arm, and the control arm was never run.

### The declared human-review items (listed, not scored)

Every case states these in its `AGENTS.md`; they are the visual half, so no
assertion stands in for them and none is scored here.

**critique/ (case 1)**

- Does the review name the three competing calls to action and the absence of a
  primary one?
- Does it propose a specific hierarchy — what becomes primary, what is demoted?
- Is every claim tied to what the two files show (label, class, size, order),
  not to taste or an invented screenshot?
- Would applying it change the page — or is it "it looks fine" plus heuristics?

**audit/ (case 2)**

- Are the unlabelled fields named one by one, not "add labels" in general?
- Is the helper-text contrast named with a ratio or a threshold?
- Are accessibility facts separated from cosmetic preferences, each fix
  concrete (`<label for>`, `aria-describedby`, a darker token) and scoped to the
  file that carries the defect?
- Does the audit avoid inventing a browser session, a computed-style dump or a
  conformance claim the two files cannot support?

**empty-state/ (case 3)**

- Is the empty state a designed state — a reason and a next step — rather than
  `No data` reworded?
- Is the first-use state distinguished from an empty-filter result, and does the
  action match the page's real next step?
- Does the table keep its five columns and still work when rows exist?
- Is the state reachable without a mouse, and does the copy avoid inventing
  data, permissions or an account the page does not have?

**document/ (case 4)**

- Does `DESIGN.md` document the tokens the CSS defines, with their values,
  rather than a wishlist?
- Can a component author build with it without opening `styles.css`, or is it
  the `:root` block in prose?
- Does it record how tokens combine (surface vs ink, what carries emphasis)?
- Does it name what is missing (motion, dark theme, breakpoints) instead of
  inventing it?

## 6. The registry decision (F5)

**`impeccable` does not enter `companion-skills.json` this wave.** The manifest's
rule is one entry per *measured* companion; this wave produced no measurement,
only an instrument and a cost finding (§4). Everything the entry would need is
already recorded above — source, `sourceUrl`, licence Apache-2.0, pin `4.8.1`,
engine `0.1.19`, staged tree hash `b1fbb5d8…` — so the entry is a data edit away
once the wave runs. It waits on the draws, not on the facts.

The bootstrap's install step would `git checkout 4.8.1` before copying
`skills/impeccable`; the tag was not verified against the upstream remote in this
wave (the version comes from the installed skill's own `metadata.version`). That
is a second reason to keep the entry closed until someone checks the tag while
preparing it — and a fact to record in the entry when it lands.

## 7. Known limitations

- **No visual oracle.** The `(b)` decision of `SPEC-0077` stands. The page's
  actual rendered appearance is never read by the harness; a claim about how the
  result *looks* is a person's reading, listed in §5.
- **The load gate is a routing measurement.** `skill impeccable` is red when the
  skill was neither called nor read from the scratch copy. The smoke saw 2/3
  loads on the calibrated prompt, so a B arm's score depends on a trigger the
  case cannot force without naming the skill in the prompt — which would make
  the arm a command, not a capability.
- **The fixture `AGENTS.md` is part of the agent's context.** It states the task
  contract and the read-only scope, so a draw is told what is editable. That
  keeps the `unchanged` assertions about compliance rather than luck, and it is
  the same choice the data corpus trees make.
- **The skill is a launcher plus an engine binary.** `scripts/impeccable`
  resolves `scripts/bin/darwin-arm64/impeccable` (18 MB) from inside the scratch
  copy; the skill's own documented degraded path applies when the launcher
  cannot run. The smoke did not need the degraded path, and no draw in this wave
  was asked to render a page.
- **n=0 on the cells.** Nothing here bounds an effect. The smoke's three
  no-skill-call draws (§3) are a hint about where a control might land, not a
  control.
- **The cost figures are recorded provider cost**, not a billing statement: the
  `step-finish` events' `cost` summed per draw, at `agentworks`' declared prices
  for this model.

## 8. What this memo does not decide

- Whether `impeccable` separates from the control — that is the wave's question,
  and the wave did not run.
- Whether a UI/UX skill is missing. `SPEC-0036` and `SPEC-0038` stay paused until
  the evidence exists; this memo does not close or reopen them.
- Whether `simplify` needs the same treatment — it lives outside this repo.
- Whether the ceiling should move. That is a human gate; this memo only publishes
  what the 40-draw wave would cost.
