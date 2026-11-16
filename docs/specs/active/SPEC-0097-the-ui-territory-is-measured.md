---
id: SPEC-0097
title: The UI territory is measured, not assumed
status: paused
priority: P0
task: TASK-120
created_at: 2026-11-15
updated_at: 2026-11-16
source_docs:
  - backlog/tasks/task-120 - ui-medir-o-impeccable-antes-de-criar-skill-de-UI-UX.md
  - docs/roadmap.md
  - docs/analysis/paused-specs-review.md
  - docs/analysis/data-corpus/README.md
  - docs/specs/SPEC-0085-contract-ab-measurement.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/analysis/ui-corpus/README.md
  - docs/analysis/ui-corpus/ui-cases.md
  - docs/analysis/ui-corpus/decision.md
  - docs/analysis/ui-corpus/critique/AGENTS.md
  - docs/analysis/ui-corpus/critique/index.html
  - docs/analysis/ui-corpus/critique/styles.css
  - docs/analysis/ui-corpus/audit/AGENTS.md
  - docs/analysis/ui-corpus/audit/form.html
  - docs/analysis/ui-corpus/audit/styles.css
  - docs/analysis/ui-corpus/empty-state/AGENTS.md
  - docs/analysis/ui-corpus/empty-state/orders.html
  - docs/analysis/ui-corpus/empty-state/styles.css
  - docs/analysis/ui-corpus/document/AGENTS.md
  - docs/analysis/ui-corpus/document/index.html
  - docs/analysis/ui-corpus/document/styles.css
  - companion-skills.json
  - docs/specs/active/SPEC-0097-the-ui-territory-is-measured.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0097-the-ui-territory-is-measured.md --base main
---

## Purpose

The roadmap says the `ui-refactor` cluster has gap `0` because "`impeccable` and
`simplify` already cover it" — and the 2026-11-15 paused-specs audit answers
that with the only honest reading: *"Whether `impeccable` and `simplify` actually
cover the visual territory: no measurement exists."* `companion-skills.json`
exists for exactly this and says an entry needs a measurement; `impeccable` has
none.

The skill is installed in the host's skills root at `~/.agents/skills/impeccable`
(`pbakaus/impeccable`, skill `4.8.1`, engine `0.1.19`); this checkout has no
`skills/impeccable` (the path is listed in `.gitignore` for hosts that install
in-tree), so a corpus at the repo root under `evals/impeccable/` would break CI:
`node scripts/eval.mjs check --root skills` stages every case, and the skill is
not in a clean checkout.

The data program already solved this shape (`SPEC-0085`): the durable corpus
lives in `docs/analysis/`, the runnable staging lives in a **gitignored mirror**,
and the decision is published. This spec reuses that instrument for UI/UX:
measure the installed skill against the control before any new skill is
considered.

## User Outcome

- A reader of `docs/analysis/ui-corpus/decision.md` sees, per cell, whether
  `impeccable` separates from the control, with the pin, the run directories and
  the raw counts.
- `companion-skills.json` carries `impeccable` only if a measurement exists;
  otherwise the decision says why not.
- CI stays green: nothing about the installed skill or the mirror is committed.

## Scope

### F1 — the durable corpus

`docs/analysis/ui-corpus/` with `README.md`, `ui-cases.md`, `decision.md` and
four case trees, each carrying `AGENTS.md` (the task contract and the declared
human review) and the page files:

| tree | capability | read-only? |
| --- | --- | --- |
| `critique/` | hierarchy critique of a landing page with three competing CTAs | yes — `unchanged` |
| `audit/` | accessibility audit of a form with unlabeled inputs and low-contrast helper text | yes — `unchanged` |
| `empty-state/` | design the empty state of an orders table that renders `No data` | no — `changed` |
| `document/` | document the existing CSS token system into `DESIGN.md` | partially — `unchanged` on the CSS |

The corpus is an instrument, not a product: it exists so a later spec can decide
whether a skill is missing, not to justify one.

### F2 — the cases use the existing vocabulary

`ui-cases.md` defines the four cases in the eval format (`prompt`, `why`,
`expect`, `assert:`), using only the closed set of assertion kinds in
`README.md` (`reply`, `noreply`, `file`, `filematch`, `unchanged`, `changed`,
`dir`, `nofile`, `verdict`), plus `skill` — the pre-existing load gate
`SPEC-0085` uses to name a draw that never reached the skill under review.
**No visual oracle**: the `(b)` decision of
`SPEC-0077` stands, so the visual judgment is a declared human-review item per
case, never a claimed deterministic pass. Freeze-compatible by construction.

### F3 — the gitignored mirror

`.lane/pinned/impeccable/` (gitignored) carries `skills/impeccable` copied
verbatim from the install and `evals/impeccable/cases.md` plus the staged
fixtures built from the durable trees. `node scripts/eval.mjs check --root
.lane/pinned/impeccable` must stage all four cells with no finding; the same
command on `--root skills` is unchanged (CI path). Nothing from the mirror is
committed.

### F4 — the A/B measurement

- A 3-draw smoke on the first case before the wave; stop and fix the case if the
  skill does not load or an assertion misclassifies what the transcript did.
- 5 draws with the skill and 5 without, per case, on
  `agentworks/deepseek-v4-1-flash`.
- Ceiling: **US$ 0.50 total, discarded draws included**; the total is published
  with the run directories, per-draw status and cost.
- A cell is `separator`, `non-discriminator` or `unresolved`, with the reason;
  a non-discriminator is a valid result and is published as such.

**Staged scope (amended 2026-11-16).** The measurement was split, because the
four-cell wave does not fit the ceiling:

- **F4a — `critique`, measured.** Five draws per arm on the pinned model; the
  per-cell verdict and the costs are published in
  [`docs/analysis/ui-corpus/decision.md`](../../analysis/ui-corpus/decision.md)
  §5.
- **F4b — `audit`, `empty-state`, `document`, gated.** Not run: at the measured
  price per draw (US$ 0.026674 with the skill, US$ 0.009354 without) the full
  40-draw wave costs US$ 0.713–0.829 including the discarded smoke, 1.43×–1.66×
  the US$ 0.50 ceiling. The remaining three cells need a budget decision (raise
  the ceiling to about US$ 0.85, or fund a screening and publish it as one); they
  are `unresolved` until then. The reason is cost, not design.

### F5 — the registry, only with evidence

Add `impeccable` to `companion-skills.json` (source `pbakaus/impeccable`, the
declared licence, pin `4.8.1` / engine `0.1.19`, the staged tree hash recorded
at measurement) **only if** the measurement exists. If the source or licence
cannot be confirmed, `decision.md` records the gap and the entry waits.

### F6 — the pointer

`docs/analysis/ui-corpus/README.md` is the discoverable entry point for the UI
evidence; no `docs/evals/coverage.md` edit is made here, because `SPEC-0096`
already publishes there and the queue forbids the collision.

## Non-Goals

- No new skill. `SPEC-0036` and `SPEC-0038` stay paused; their fate is decided by
  the evidence this spec publishes, not here.
- No edit to `skills/impeccable` — it is upstream; the mirror copies it.
- No new assertion kind, matcher, oracle or harness change (the freeze stands).
- No screenshot comparison, DOM query, computed style or `axe`; those were the
  frozen visual-oracle options.
- No release cut; `CHANGELOG.md`/version is a separate gate.
- No measurement of `simplify` — it lives outside this repo.

## Flow

1. **F1/F2** — the trees, the AGENTS.md contracts and the four case definitions.
2. **F3** — the mirror and the model-free check staging all four cells.
3. **F4** — smoke, then the 5+5 wave, then `decision.md`.
4. **F5** — the registry entry (or the recorded gap); F6 is the corpus README
   pointing at `decision.md`.

## Data

- `~/.agents/skills/impeccable` — the installed skill (host state, gitignored;
  copied verbatim into the mirror).
- `docs/analysis/data-corpus/` — the template: README, `ab-cases.md`,
  `decision.md`, the gitignored mirror.
- `evals/review-code/cases.md` — the case-format reference, including the
  `expect:`/human-review discipline.
- `companion-skills.json` — the registry schema (`source`, `sourceUrl`, `pin`,
  `path`, `license`, `signals`, `evidence`).

## Acceptance Criteria

1. The four trees exist with `AGENTS.md` and pages; `ui-cases.md` defines each
   case in the eval format, with assertions only from the existing kind list and
   the visual judgment declared as human review.
2. `node scripts/eval.mjs check --root .lane/pinned/impeccable` stages all four
   cells with no finding; `node scripts/eval.mjs check --root skills` is
   unchanged (CI green).
3. The smoke and the 5+5 wave ran on the pinned model; every draw's run
   directory, status and cost is published in `decision.md`, with the total at
   or below US$ 0.50 including discarded draws.
4. Each cell has a verdict (`separator`/`non-discriminator`/`unresolved`) with
   the reason and the declared human-review items listed.
5. `companion-skills.json` has the entry only if the source, licence and pin are
   named; otherwise `decision.md` records why the entry waits.
6. No skill file, harness file or assertion kind changed; every command in
   `tests:` exits 0.

## Decisions

- **Measure the installed skill before writing one.** The gap-0 claim is an
  assumption; the audit says unverified, and the registry requires evidence.
- **The corpus is an instrument.** It follows the corpus-first rule the data
  program already paid for.
- **The mirror keeps CI green and the upstream unredistributed.** The same
  pattern as `SPEC-0085`, including the gitignored staging.
- **The visual half is declared human review.** A deterministic visual oracle is
  frozen; the cases must not smuggle one in through an assertion.

## Open Questions

- Whether the upstream publication allows the mirror copy and the registry entry
  (licence confirmed at measurement time).
- Whether `simplify`, outside this repo, needs the same treatment later.

## Prompt Notes

- Follow `docs/analysis/data-corpus/` as the template: `README.md`,
  `*-cases.md`, `decision.md`, and a gitignored mirror.
- Grep `evals/review-code/cases.md` for the case grammar before writing; every
  `assert:` must be a kind the parser knows.
- Calibrate with the smoke first; a changed assertion is re-judged and published,
  never silently edited.
- Publish the total cost **with** the discarded draws; that was an explicit
  finding of the 2026-11-11 review.
- Copy the skill verbatim into the mirror; never edit it, and never commit the
  mirror.

## Results

**Status: paused.** F1–F3 and F6 landed; **F4a measured the `critique` cell**
(5+5) and it is a **non-discriminator**; **F4b** (the other three cells) is
gated on a budget decision; **F5** waits on F4b. Nothing was invented to fill the
gap and no cell is reported beyond what ran.

### F1 — the durable corpus (done)

`docs/analysis/ui-corpus/` carries `README.md`, `ui-cases.md`, `decision.md` and
the four trees, each with `AGENTS.md` (task contract + declared human review) and
its page files: `critique/` (landing page, three CTAs at identical weight in a
flat type ramp, read-only), `audit/` (payout form, five unlabelled fields,
helper text at ~2.6:1, read-only), `empty-state/` (orders table rendering
`No data`, editable), `document/` (CSS token system, no `DESIGN.md`, CSS
read-only).

### F2 — the cases (done)

`ui-cases.md` defines four cells with `prompt`/`why`/`expect`/`assert:`. Kinds
used: `skill impeccable` (the pre-existing load gate, listed with the others in
`README.md` §Assertions), `reply`, `changed`, `unchanged`, `file`, `filematch`.
No visual oracle: the visual half is a declared human-review item per case,
listed in each `AGENTS.md` and in `decision.md` §7.

### F3 — the mirror (done)

`.lane/pinned/impeccable/` (gitignored) holds `skills/impeccable` copied verbatim
(staged tree hash `b1fbb5d8…`, identical to the `~/.agents/skills/impeccable`
install) and `evals/impeccable/cases.md` + four fixtures. `check --root
.lane/pinned/impeccable` → `Parsed 4 case(s): 4 runnable, 0 manual; 4 fixture(s)
staged. / No findings.` (three warnings = case 4's declared `DESIGN.md` create
target). `--root skills` is unchanged: 110 cases parsed, 108 staged, no findings.

### F4 — the smoke and the cost arithmetic

Six discarded calibration draws on case 1, model `agentworks/deepseek-v4-1-flash`,
detector `cf2e2e319d975a5b`, seatbelt isolation enforced, `repoSha 4c09690`:

| Run directory | Prompt | Draws | Loaded | Status | Cost |
| --- | --- | --- | --- | --- | --- |
| `2026-11-15T22-32-09--impeccable--agentworks-deepseek-v4-1-flash` | `e310e713…` | 3 | 1/3 | r2 5/5; r1, r3 red on the load gate only | US$ 0.041130 |
| `2026-11-15T22-37-09--impeccable--agentworks-deepseek-v4-1-flash` | `20b4297e…` | 3 | 2/3 | r2, r3 5/5; r1 red on the load gate only | US$ 0.066954 |

**Smoke spend: US$ 0.108084 (6 discarded draws).** The prompt was calibrated to
the skill's own vocabulary ("UX review … critique the visual hierarchy") after
the first smoke's 1/3 load rate, before any control draw; both prompt hashes are
published and no assertion changed in that phase. `check-eval-run` on both runs:
only the load misses as findings, `skillLeaks=0 hostReads=0 isolated=yes`.

Measured per-draw cost: **US$ 0.026674** with the skill (three loaded draws:
0.021640 / 0.026729 / 0.031654) and **US$ 0.009354** without (three 2-step
draws: 0.010086 / 0.009405 / 0.008572). The full 40-draw wave therefore costs
**US$ 0.721** all-load and **US$ 0.605** at the observed 2/3 load rate; with the
smoke, **US$ 0.713–0.829** — 1.43× to 1.66× the US$ 0.50 ceiling. The human gate
chose to stop the four-cell wave and fund **one** cell (F4a). See the amended
staged scope in §Scope and `decision.md` §4.

### F4a — the critique cell, measured (5+5)

Same prompt (`20b4297e…`) and fixture (`ae60be75…`) in both arms; five draws
each, `repeat 5`, `agentworks/deepseek-v4-1-flash`, detector
`cf2e2e319d975a5b`, isolation enforced.

| Arm | Run directory |
| --- | --- |
| without skill | `2026-11-16T09-56-17--impeccable--agentworks-deepseek-v4-1-flash--without-skill` |
| with skill | `2026-11-16T09-47-18--impeccable--agentworks-deepseek-v4-1-flash` |

| Draw | Arm | Loaded | As-run | Cost (US$) | Steps |
| --- | --- | --- | --- | --- | --- |
| r1 | with | no | red: `skill` | 0.011534 | 2 |
| r2 | with | yes | pass 5/5 | 0.038313 | 8 |
| r3 | with | yes | pass 5/5 | 0.033803 | 9 |
| r4 | with | no | red: `skill`, `reply hierarchy` | 0.008502 | 2 |
| r5 | with | yes | pass 5/5 | 0.037834 | 7 |
| r1 | without | — | red: `skill`, `reply hierarchy` | 0.008158 | 2 |
| r2–r5 | without | — | red: `skill` | 0.009578 / 0.008213 / 0.008672 / 0.008392 | 2 |

**Cell cost: US$ 0.173000** (with 0.129987 + without 0.043013); **accumulated
with the smoke: US$ 0.281084** — within the ceiling.

`check-eval-run`: with-skill `cases=1 reps=5 findings=2 warnings=0 skillLeaks=0
hostReads=0 isolated=yes deniedDraws=0` (exit 1, the two `gate-miss` r1/r4);
without-skill `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes
deniedDraws=0` (exit 0). No contamination, no leak, no host read, no denied draw.

**Oracle correction, published with both readings.** The as-run reds on
`reply [Hh]ierarchy` (with r4, control r1) were strong critiques that never use
the literal word — "no type scale", "nothing is primary". The assertion misread
the draw, so it became `reply ([Hh]ierarchy|[Pp]rimary|type[- ]scale)` and the
**same ten paid draws** were re-judged model-free with `inspect --replay` (no new
draw, no new cost): both `reply` reds become passes; the seven `skill` reds stay
red. The as-run count is not erased.

| Arm | Clean | Loaded | Scored | Behavioural (all but `skill`) |
| --- | --- | --- | --- | --- |
| with skill | 5/5 | **3/5** | 3/5 | **5/5** (4/5 as-run) |
| without skill | 5/5 | 0/5 by construction | 0/5 | **5/5** (4/5 as-run) |

**Verdict: `non-discriminator`.** The control reproduces every behavioural
assertion in 5/5 clean draws, and the skill arm does the same: a bare model reads
two files and names the nine identical CTAs, the missing primary action and the
flat type scale. The 3/5 vs 0/5 scored split is the declared load gate (routing
3/5), published as a failure of the skill arm, not re-judged and not read as a
separator (`SPEC-0092` precedent). The visual half is not scored here; it stays
with §7's human-review items over the ten transcripts.

### F4b — the other three cells (not run, gated)

`audit`, `empty-state` and `document` are `unresolved`: no draw of either arm.
Their fixtures stage clean, and their cases parse. The gate is the budget
decision in `decision.md` §4 — raise the ceiling to about US$ 0.85 for 5+5 on
each, or fund a 2+2 screening and publish it as one.

### F5 — the registry (entry withheld)

`companion-skills.json` has **no** `impeccable` entry: the manifest admits
measured companions, and one cell of four — a non-discriminator on a page-level
critique — is not the measurement the entry would rest on. The facts it needs are
in `decision.md` §8: source `pbakaus/impeccable`, licence Apache-2.0 (confirmed
2026-11-16, Copyright 2025 Paul Bakaus), skill `4.8.1`, engine `0.1.19`, staged
tree hash `b1fbb5d8…`. It waits on F4b, not on the facts; the upstream `4.8.1`
tag is also still unverified against a remote.

### F6 — the pointer (done)

`docs/analysis/ui-corpus/README.md` is the entry point: the four trees, the case
rules (existing kinds, no visual oracle), the gitignored mirror and its rebuild
commands, the two-arm command and the replay correction, and the rules.
`docs/evals/coverage.md` is untouched (the `SPEC-0096` collision is avoided);
nothing from the mirror is committed.

### Gates

| Command | Result |
| --- | --- |
| `node scripts/validate-skills.mjs --root skills` | pass — 15 SKILL.md, all clear |
| `node scripts/eval.mjs check --root skills` | pass — 110 cases, 108 staged, no findings |
| `node scripts/eval.mjs check --root .lane/pinned/impeccable` | pass — 4 cases, 4 staged, no findings |
| `node --test scripts/lib/evals/*.test.mjs` | pass — 574 tests |
| `node --test scripts/lib/*.test.mjs` | pass — 24 tests |
| `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` | pass — 42 tests |
| `node scripts/check-sensor-parity.mjs` | pass — 2/2 fixtures in parity |
| `node scripts/check-evidence.mjs` | pass — 6 documents, 0 errors, 0 warnings |
| `node scripts/check-staleness.mjs` | pass (report: 77 cited, 49 stale, 3 uncited — pre-existing; this corpus is not cited there) |
| `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0097-the-ui-territory-is-measured.md --base main` | pass — one warning, `files-declared-untouched companion-skills.json` (F5 withheld) |

### What is left

- **F4b:** `audit`, `empty-state`, `document` at 5+5 on the pinned model — about
  US$ 0.454 (2/3 load) to US$ 0.540 (all-load) for the three, which needs the
  ceiling raised to about US$ 0.85 including what is already spent.
- **F5:** add `impeccable` to `companion-skills.json` once F4b exists, verifying
  the `4.8.1` tag on the upstream remote while adding it.
- **Nothing else:** no skill, harness, assertion kind, detector or
  `docs/evals/coverage.md` change is owed.
