# UI corpus decision memo

- **Spec:** SPEC-0097 — The UI territory is measured, not assumed
- **Date:** 2026-11-16
- **Status:** the instrument is built and stages (F1–F3). **Two cells are
  measured** — `critique` and `audit`, five draws per arm each — and both are
  **non-discriminators**: the control reproduces every behavioural assertion. The
  funded stage is closed at two cells; `empty-state` and `document` are deferred
  to `TASK-121` (follow-up), not measured. The stage spent **US$ 0.449202**,
  inside the amended US$ 0.95 ceiling; the smoke's six discarded draws are
  included. The `companion-skills.json` entry is **withheld**: the measured tree
  is a built artifact the registry's clone-and-copy contract cannot reproduce
  (§9). No skill is created by this memo.

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

## 4. The cost arithmetic and the funded stage

The spec's full wave is 5+5 draws on each of four cells — 40 draws — under the
original **US$ 0.50** ceiling, later amended to **US$ 0.95** for the funded stage
(two cells plus the smoke). The arithmetic below is what drove that amendment.

Measured at this pin, the two costs a draw actually has:

| Draw shape | Measured cost per draw | Draws |
| --- | --- | --- |
| skill loaded (5–9 steps) | 0.021640 / 0.026729 / 0.031654 — **mean US$ 0.026674** | 3 |
| no skill call (2 steps) | 0.010086 / 0.009405 / 0.008572 — **mean US$ 0.009354** | 3 |

Projected four-cell wave:

- all 20 candidate draws load: `20 × 0.026674 + 20 × 0.009354` = **US$ 0.721**;
- a 2/3 load rate (what the calibrated smoke and the measured cells observed):
  `20 × (0.667 × 0.026674 + 0.333 × 0.009354) + 20 × 0.009354` = **US$ 0.605**.

With the US$ 0.108084 already spent on the smoke, the total is **US$ 0.713 to
US$ 0.829** — 1.43× to 1.66× the ceiling. The ceiling is not reachable at 40
draws: it leaves US$ 0.0098 per draw after the smoke, which is the price of a
draw that never loads the skill.

The human gate on 2026-11-16 chose to stop the **four-cell** wave rather than
raise the ceiling inside a measurement, then approved **one** cell (critique, §5),
then a **second** cell (audit, §6), then closed the stage at those two and
deferred the other two to `TASK-121`. The stage's ceiling was amended to
**US$ 0.95** for the smoke plus the two cells, and the spend landed at
**US$ 0.449202** — the smoke's US$ 0.108084, the critique cell's US$ 0.173000
and the audit cell's US$ 0.168118.

Per-cell cost, measured (both arms, five draws each):

| Cell | With skill | Control | Total | Draws |
| --- | --- | --- | --- | --- |
| critique (§5) | 0.129987 | 0.043013 | **0.173000** | 10 |
| audit (§6) | 0.092201 | 0.075918 | **0.168118** | 10 |
| smoke (§3, discarded) | — | — | **0.108084** | 6 |
| **stage total** | | | **0.449202** | 26 |

The two deferred cells are not a gap in the instrument: their fixtures stage
clean and their cases parse (§7). At the observed per-cell price
(US$ 0.168–0.173) they are ≈ US$ 0.34 of follow-up work, which `TASK-121` owes
with the same 5+5 shape.

**One attempt was cancelled.** `2026-11-16T10-54-59--impeccable--agentworks-deepseek-v4-1-flash`
(case 3, `empty-state`, with-skill arm) was stopped before scoring: the manifest
records `status: running`, `finishedAt: null`, `counts: null`, and
`cases/impeccable--03/` holds no `result.json` and no transcript. It is **zero
draws and no recorded cost** — `check-eval-run` reports `cases=0 reps=0
findings=2` (`incomplete manifest`, `incomplete impeccable--03 r0`), which is the
artifact of a cancelled run, not a measurement. It is not counted anywhere above
and nothing was reconstructed from it.

**The staged scope is therefore two cells.** `critique` and `audit` are measured
and both are non-discriminators; `empty-state` and `document` are `unresolved`
and deferred to `TASK-121` (§7). The reason is budget, not design.

## 5. The critique cell, measured (5+5)

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
review (§8) and is not scored by this memo.

## 6. The audit cell, measured (5+5)

Five draws per arm on case 2, one run directory each, same prompt
(`13f6ea0a…`) and same fixture (`63c05d32…`) in both arms. Same model, agent,
level and detector as §5; `repoSha 759b7af`, `repeat 5`, isolation enforced.

| Arm | Run directory |
| --- | --- |
| without skill (control) | `2026-11-16T10-51-31--impeccable--agentworks-deepseek-v4-1-flash--without-skill` |
| with skill | `2026-11-16T10-47-01--impeccable--agentworks-deepseek-v4-1-flash` |

### Per draw

| Draw | Arm | Loaded | As-run | Cost (US$) | Steps |
| --- | --- | --- | --- | --- | --- |
| r1 | with | yes | pass 5/5 | 0.021288 | 8 |
| r2 | with | no | red: `skill` | 0.015047 | 3 |
| r3 | with | no | red: `skill` | 0.016855 | 3 |
| r4 | with | no | red: `skill` | 0.013558 | 4 |
| r5 | with | yes | pass 5/5 | 0.025453 | 5 |
| r1 | without | — | red: `skill` | 0.015140 | 5 |
| r2 | without | — | red: `skill` | 0.016458 | 3 |
| r3 | without | — | red: `skill` | 0.015463 | 3 |
| r4 | without | — | red: `skill` | 0.011098 | 3 |
| r5 | without | — | red: `skill` | 0.017759 | 4 |

**Cell cost: US$ 0.092201 (with) + US$ 0.075918 (without) = US$ 0.168118.**

`check-eval-run` on the two runs:

```
with skill:    cases=1 reps=5 findings=3 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0   (exit 1)
without skill: cases=1 reps=5 findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0   (exit 0)
```

The three `findings` are `gate-miss impeccable#2 r2`, `r3`, `r4`: the skill was
not loaded. Published as failures of the skill arm, not re-judged. No
contamination, no leak, no host read, no denied draw.

### Counts

| Arm | Clean draws | Loaded | Scored (all assertions) | Behavioural (all but `skill`) |
| --- | --- | --- | --- | --- |
| with skill | 5/5 | **2/5** (r1, r5) | **2/5** (r1, r5) | **5/5** |
| without skill | 5/5 | 0/5 by construction | **0/5** (the load assertion) | **5/5** |

Per-assertion failures: `skill impeccable` — 3 with-skill draws, 5 control draws;
`reply (label|aria)`, `reply (contrast|WCAG|4.5|ratio)`, `unchanged form.html`,
`unchanged styles.css` — **0 failures in all ten draws**. Both loaded draws and
every control draw name the unlabelled fields and the helper-text contrast in the
reply. No assertion was corrected for this cell.

### Verdict: non-discriminator

The control reproduces the whole behavioural half in **5/5** clean draws — the
per-field label findings and the contrast finding with a ratio — and the skill
arm matches it in **5/5**, including both draws that loaded the skill. The scored
2/5 vs 0/5 split is the load gate (routing 2/5), published as a skill-arm
failure, not a separator. As with §5, the visual half (whether the fixes are the
right ones) is human review (§8).

## 7. Per-cell status

| Cell | Class | Reason |
| --- | --- | --- |
| 1 — `critique/` | **non-discriminator** | measured 5+5 (§5): control 5/5 behavioural, skill 5/5 behavioural, load gate 3/5. The bare model already produces the critique. |
| 2 — `audit/` | **non-discriminator** | measured 5+5 (§6): control 5/5 behavioural, skill 5/5 behavioural, load gate 2/5. The bare model already finds the labels and the contrast. |
| 3 — `empty-state/` | **unresolved** | deferred to `TASK-121`: not funded in this stage, no draw of either arm. The fixture stages clean and the case parses. |
| 4 — `document/` | **unresolved** | deferred to `TASK-121` for the same reason. The fixture stages clean and the case parses. |

`unresolved` on cells 3–4 is not a claim: nothing was compared there, and the
cancelled `empty-state` attempt (§4) produced no draw to count.

## 8. The declared human-review items (listed, not scored)

Every case states these in its `AGENTS.md`; they are the visual half, so no
assertion stands in for them. For the two measured cells they are the part this
memo deliberately does not score — the reader opens the ten transcripts in §5's
and §6's run directories.

**critique/ (case 1 — measured)**

- Does the review name the three competing calls to action and the absence of a
  primary one?
- Does it propose a specific hierarchy — what becomes primary, what is demoted?
- Is every claim tied to what the two files show (label, class, size, order),
  not to taste or an invented screenshot?
- Would applying it change the page — or is it "it looks fine" plus heuristics?

**audit/ (case 2 — measured)**

- Are the unlabelled fields named one by one, not "add labels" in general?
- Is the helper-text contrast named with a ratio or a threshold?
- Are accessibility facts separated from cosmetic preferences, each fix
  concrete (`<label for>`, `aria-describedby`, a darker token) and scoped to the
  file that carries the defect?
- Does the audit avoid inventing a browser session, a computed-style dump or a
  conformance claim the two files cannot support?

**empty-state/ (case 3 — not run, `TASK-121`)**

- Is the empty state a designed state — a reason and a next step — rather than
  `No data` reworded?
- Is the first-use state distinguished from an empty-filter result, and does the
  action match the page's real next step?
- Does the table keep its five columns and still work when rows exist?
- Is the state reachable without a mouse, and does the copy avoid inventing
  data, permissions or an account the page does not have?

**document/ (case 4 — not run, `TASK-121`)**

- Does `DESIGN.md` document the tokens the CSS defines, with their values,
  rather than a wishlist?
- Can a component author build with it without opening `styles.css`, or is it
  the `:root` block in prose?
- Does it record how tokens combine (surface vs ink, what carries emphasis)?
- Does it name what is missing (motion, dark theme, breakpoints) instead of
  inventing it?

## 9. The registry decision (F5)

**`impeccable` does not enter `companion-skills.json`.** The measurement is
published (§5–§7) and is the evidence; the registry entry is withheld because
the entry cannot name an install the bootstrap can perform, and the manifest
lists only what can be materialised. The three datacontract entries are unchanged.

The facts, confirmed before withdrawing the entry:

- **A pin is a commit, never a version.** `companions.md` states it — "`pin` is
  a commit, never a branch: the measured revision" — and the install step is
  `git clone <sourceUrl> && git checkout <pin> && cp -R <path>`. A version string
  such as `4.8.1` is not a ref the contract can check out.
- **The upstream tags do not include `4.8.1`.** `git ls-remote --tags` on
  <https://github.com/pbakaus/impeccable> lists `skill-v4.8.1` (tag object
  `3a3dc83b…`) and `cli-v4.8.1` (`f8678973…`), both **peeling to**
  `924bbd194d02e5e15a227e75b5901fb0d7a4ecad` (the `^{}` line). Either tag would
  resolve there, but a tag is not a pin and no tag names the built tree this
  memo measured.
- **The upstream tree is not the tree measured.** At `924bbd19…` the skill lives
  at `skill/` (singular) as `SKILL.src.md`; the installed tree has
  `SKILL.md` plus the launcher, engine binary, references and agent files. The
  install is a **built artifact** (the plugin/npm channel assembles it), so
  clone + checkout + `cp -R skill/` does not reproduce the measured
  `treeHash b1fbb5d8…`; it would stage a different tree and a
  `skillHash` that no run in §5–§6 records.
- **A materialisable entry would need a documented built-artifact channel**
  (`npx impeccable install`, or the plugin distribution) in the schema, which
  the current manifest has no field for. That is a schema decision, not a line
  in this memo.

What is verified and can be reused when that channel exists:

| Fact | Value |
| --- | --- |
| Source | `pbakaus/impeccable` |
| Licence | Apache-2.0, Copyright 2025 Paul Bakaus (confirmed 2026-11-16 in `LICENSE`) |
| Skill version | `4.8.1` (`SKILL.md` → `metadata.version`); engine `0.1.19` |
| Upstream tag → commit | `skill-v4.8.1` / `cli-v4.8.1` peel to `924bbd194d02e5e15a227e75b5901fb0d7a4ecad` |
| Upstream path at that commit | `skill/` (singular), `SKILL.src.md` |
| Measured tree | built artifact, `treeHash b1fbb5d8…` (not reproducible by clone+checkout+copy) |

So the entry is **withheld, not refused**: the capability is measured (two
cells, both non-discriminators), and what is missing is a way to install the
artifact the measurement used. Listing it with a version-as-pin and a `path` the
upstream does not have would put a skill in the manifest that the bootstrap
cannot install — the failure mode the manifest exists to prevent. The blocker is
this section; `TASK-121` is where a built-artifact field (or an install-channel
note) would be designed, alongside the two remaining cells.

## 10. Known limitations

- **No visual oracle.** The `(b)` decision of `SPEC-0077` stands. The page's
  rendered appearance is never read by the harness; a claim about how the result
  *looks* is a person's reading, listed in §8.
- **Two of four cells.** Both measured cells are non-discriminators on
  page-level review; `empty-state` (a design that writes to the tree) and
  `document` (an artifact the agent authors, `DESIGN.md`) are the harder shapes
  and are unmeasured. The instrument's own data programme found exactly that
  split between two composition screens (`docs/analysis/data-corpus/decision.md`
  §4), so this is not a formality: the deferral is where a capability could still
  show.
- **The load gate is a routing measurement.** `skill impeccable` was red in 2/5
  (critique) and 3/5 (audit) candidate draws. A B arm's scored count therefore
  depends on a trigger the case cannot force without naming the skill in the
  prompt — which would make the arm a command, not a capability.
- **The `reply` oracle is a keyword gate.** The corrected critique form
  (`hierarchy|primary|type scale`) is what these critiques write; a critique that
  ranks by other vocabulary would read red. It is backed by the human review, and
  its correction is published rather than folded into the as-run count.
- **The fixture `AGENTS.md` is part of the agent's context.** It states the task
  contract and the read-only scope, so a draw is told what is editable. That
  keeps the `unchanged` assertions about compliance rather than luck.
- **The skill is a launcher plus an engine binary.** `scripts/impeccable`
  resolves `scripts/bin/darwin-arm64/impeccable` (18 MB) from inside the scratch
  copy; the skill's own documented degraded path applies when the launcher cannot
  run. Neither measured cell needed it, and no draw was asked to render a page.
- **The measured tree is a built artifact.** The installed
  `~/.agents/skills/impeccable` is assembled by the plugin/npm channel: the
  upstream repository at `924bbd19…` carries `skill/` (singular) with
  `SKILL.src.md`, not the `SKILL.md`, launcher and engine the measurement ran.
  `treeHash b1fbb5d8…` therefore identifies the artifact, and the registry's
  clone + checkout + `cp -R` contract cannot reproduce it (§9). A field for a
  built-artifact install channel is not in the schema; until one exists the entry
  stays out, even though the capability is measured.
- **n=5.** Five clean draws per arm can show a large separation or its absence;
  it cannot bound a small delta.
- **The cost figures are recorded provider cost**, not a billing statement: the
  `step-finish` events' `cost` summed per draw, at `agentworks`' declared prices
  for this model. The cancelled attempt (§4) recorded none.

## 11. What this memo does not decide

- Whether `impeccable` separates on `empty-state` or `document` — those cells did
  not run; `TASK-121` owns them.
- Whether a UI/UX skill is missing. `SPEC-0036` and `SPEC-0038` stay paused: two
  page-level non-discriminators do not close or reopen them, and the two
  artifact-shaped cells are the ones that could.
- Whether `simplify` needs the same treatment — it lives outside this repo.
- Whether the upstream `4.8.1` tag resolves — the entry records the pin and this
  memo records the check as owed.
