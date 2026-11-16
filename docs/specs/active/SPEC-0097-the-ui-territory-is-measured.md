---
id: SPEC-0097
title: The UI territory is measured, not assumed
status: implemented
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

- A reader of `docs/analysis/ui-corpus/decision.md` sees, per measured cell,
  whether `impeccable` separates from the control, with the pin, the run
  directories and the raw counts — and which cells were out of scope and why.
- `companion-skills.json` carries `impeccable` only where the entry names an
  install the bootstrap can perform; otherwise the decision says why not, and the
  measurement is still published.
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
- 5 draws with the skill and 5 without, per measured case (two in this stage),
  on `agentworks/deepseek-v4-1-flash`.
- Ceiling: **US$ 0.50 total, discarded draws included**; the total is published
  with the run directories, per-draw status and cost.
- A cell is `separator`, `non-discriminator` or `unresolved`, with the reason;
  a non-discriminator is a valid result and is published as such.

**Staged scope (amended by the maintainer, 2026-11-16).** The funded stage is two
cells, 5+5 each, with a stage ceiling of **US$ 0.95** (the discarded smoke
included):

- **`critique` and `audit`, measured.** Five draws per arm on the pinned model;
  the per-cell verdicts, run directories and costs are in
  [`docs/analysis/ui-corpus/decision.md`](../../analysis/ui-corpus/decision.md)
  §5–§6. Both are **non-discriminators**.
- **`empty-state` and `document`, deferred.** Out of scope for this spec and
  owned by follow-up `TASK-121`. The reason is budget: at the measured price the
  four-cell wave costs US$ 0.713–0.829 including the smoke, and the two
  remaining cells are ≈ US$ 0.34 of work. Their cells are `unresolved` in
  `decision.md` §7; nothing about them is claimed here.

### F5 — the registry, only with evidence

Add `impeccable` to `companion-skills.json` only if the entry names an install
the bootstrap can perform: a `pin` that is a **commit**, the declared licence,
and a `path` the cloned revision actually contains. The measurement exists (two
cells), but the entry is **withheld**: the measured tree is a built artifact
(`treeHash b1fbb5d8…`) assembled by the plugin/npm channel, while the upstream
revision `924bbd194d02e5e15a227e75b5901fb0d7a4ecad` — tagged `skill-v4.8.1` and
`cli-v4.8.1` (both peeling to `924bbd19…`) — carries `skill/` (singular) with
`SKILL.src.md`. Recording it
would list a skill that `git checkout <pin>` + `cp -R <path>` cannot install.
The confirmed facts and the blocker are in `decision.md` §9; nothing enters the
manifest.

### F6 — the pointer

`docs/analysis/ui-corpus/README.md` is the discoverable entry point for the UI
evidence; no `docs/evals/coverage.md` edit is made here, because `SPEC-0096`
already publishes there and the queue forbids the collision.

## Non-Goals

- No new skill. `SPEC-0036` and `SPEC-0038` stay paused; their fate is decided by
  the evidence this spec publishes, not here.
- No measurement of `empty-state` or `document` in this spec: the funded stage
  closed at `critique` and `audit`, and the two remaining cells are deferred to
  `TASK-121` — out of scope here, `unresolved` in `decision.md` §7.
- No entry in `companion-skills.json` for `impeccable`: the measured tree is a
  built artifact the manifest's commit-pin + `path` contract cannot install, so
  the entry stays out and the blocker is recorded (`decision.md` §9).
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
3. The funded stage — the smoke and the two 5+5 cells — ran on the pinned model;
   every draw's run directory, status and cost is published in `decision.md`,
   within the amended US$ 0.95 ceiling including discarded draws. The cancelled
   `empty-state` attempt is recorded as zero draws and no recorded cost.
4. Each measured cell has a verdict (`separator`/`non-discriminator`/
   `unresolved`) with the reason and the declared human-review items listed. The
   two deferred cells are declared out of scope (`TASK-121`) and `unresolved`,
   not scored.
5. `companion-skills.json` is unchanged: the `impeccable` entry is withheld,
   because the measured tree is a built artifact the registry's commit-pin +
   `path` contract cannot reproduce. `decision.md` §9 records the confirmed pin
   (`skill-v4.8.1` → `924bbd19…`), the upstream `skill/` path with
   `SKILL.src.md`, and the built-artifact gap.
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

**Status: implemented.** F1–F3 and F6 landed; **two cells are measured 5+5**
(`critique`, `audit`) and both are **non-discriminators**; the other two cells
are out of scope and owned by `TASK-121`; **F5** is closed with the entry
**withheld** and the confirmed blocker recorded. The funded stage spent
**US$ 0.449202** against the amended **US$ 0.95** ceiling, discarded smoke
included.

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
listed in each `AGENTS.md` and in `decision.md` §8.

### F3 — the mirror (done)

`.lane/pinned/impeccable/` (gitignored) holds `skills/impeccable` copied verbatim
(staged tree hash `b1fbb5d8…`, identical to the `~/.agents/skills/impeccable`
install) and `evals/impeccable/cases.md` + four fixtures. `check --root
.lane/pinned/impeccable` → `Parsed 4 case(s): 4 runnable, 0 manual; 4 fixture(s)
staged. / No findings.` (three warnings = case 4's declared `DESIGN.md` create
target). `--root skills` is unchanged: 110 cases parsed, 108 staged, no findings.

### F4 — the funded stage: smoke + two cells

**Smoke, 6 discarded draws** on case 1, model `agentworks/deepseek-v4-1-flash`,
detector `cf2e2e319d975a5b`, seatbelt isolation enforced:

| Run directory | Prompt | Draws | Loaded | Status | Cost |
| --- | --- | --- | --- | --- | --- |
| `2026-11-15T22-32-09--impeccable--agentworks-deepseek-v4-1-flash` | `e310e713…` | 3 | 1/3 | r2 5/5; r1, r3 red on the load gate only | US$ 0.041130 |
| `2026-11-15T22-37-09--impeccable--agentworks-deepseek-v4-1-flash` | `20b4297e…` | 3 | 2/3 | r2, r3 5/5; r1 red on the load gate only | US$ 0.066954 |

**Smoke spend: US$ 0.108084.** The prompt was calibrated to the skill's own
vocabulary ("UX review … critique the visual hierarchy") after the first smoke's
1/3 load rate, before any control draw; both prompt hashes are published. Measured
per-draw cost in that phase: US$ 0.026674 with the skill, US$ 0.009354 without —
the four-cell wave projected to US$ 0.713–0.829, 1.43×–1.66× the original US$ 0.50
ceiling, which is why the maintainer split the stage.

**Critique (case 1), 5+5** — prompt `20b4297e…`, fixture `ae60be75…`:

| Arm | Run directory | Loaded | Clean | Scored | Behavioural |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-16T09-47-18--impeccable--agentworks-deepseek-v4-1-flash` | **3/5** | 5/5 | 3/5 | **5/5** (4/5 as-run) |
| without skill | `2026-11-16T09-56-17--impeccable--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 | 5/5 | 0/5 | **5/5** (4/5 as-run) |

Cost US$ 0.129987 + US$ 0.043013 = **US$ 0.173000**. `check-eval-run`: with
`findings=2` (`gate-miss r1`, `r4`), without `findings=0`; both `skillLeaks=0
hostReads=0 isolated=yes deniedDraws=0`. The `reply [Hh]ierarchy` oracle
misread two genuine critiques (with r4, control r1), was corrected to
`reply ([Hh]ierarchy|[Pp]rimary|type[- ]scale)`, and the same ten paid draws were
re-judged with `inspect --replay` at zero cost; both readings are published in
`decision.md` §5. **Verdict: `non-discriminator`** — the control reproduces every
behavioural assertion 5/5.

**Audit (case 2), 5+5** — prompt `13f6ea0a…`, fixture `63c05d32…`, `repoSha
759b7af`:

| Arm | Run directory | Loaded | Clean | Scored | Behavioural |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-16T10-47-01--impeccable--agentworks-deepseek-v4-1-flash` | **2/5** | 5/5 | 2/5 | **5/5** |
| without skill | `2026-11-16T10-51-31--impeccable--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 | 5/5 | 0/5 | **5/5** |

Cost US$ 0.092201 + US$ 0.075918 = **US$ 0.168118**. `check-eval-run`: with
`findings=3` (`gate-miss r2`, `r3`, `r4`), without `findings=0`; both
`skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0`. No assertion needed
correction: the label and contrast assertions passed in all ten draws.
**Verdict: `non-discriminator`** — the control finds the unlabelled fields and
the contrast 5/5, and so does the skill arm.

**Ceiling amendment, recorded.** The maintainer amended AC-3's ceiling to
**US$ 0.95** for the funded stage (smoke + two cells) after the four-cell
projection; the stage closed at **US$ 0.449202** — smoke 0.108084 + critique
0.173000 + audit 0.168118. The two remaining cells were deferred, not dropped:
`TASK-121` owns `empty-state` and `document` (≈ US$ 0.34 at the observed per-cell
price).

**One cancelled attempt.** `2026-11-16T10-54-59--impeccable--agentworks-deepseek-v4-1-flash`
(case 3, `empty-state`, with-skill) was stopped before scoring: manifest
`status: running`, `finishedAt: null`, `counts: null`, `cases/impeccable--03/`
with no `result.json` and no transcript. Zero draws, no recorded cost;
`check-eval-run` reports `cases=0 reps=0 findings=2` (`incomplete manifest`,
`incomplete impeccable--03 r0`). It is recorded as cancelled and counts nowhere.

### F5 — the registry (entry withheld)

`companion-skills.json` is **unchanged**: the three datacontract entries, no
`impeccable`. The final review found the entry could not be listed honestly, and
it was withdrawn rather than patched:

- A pin in this registry is a **commit**, never a version: `companions.md` says
  "`pin` is a commit, never a branch: the measured revision", and the install is
  `git checkout <pin>` + `cp -R <path>`. `4.8.1` is not a ref.
- `git ls-remote --tags` on `pbakaus/impeccable` lists `skill-v4.8.1` and
  `cli-v4.8.1`, both **peeling to**
  `924bbd194d02e5e15a227e75b5901fb0d7a4ecad`; there is no `4.8.1` tag.
- At that commit the skill is `skill/` (singular) with `SKILL.src.md`; the
  measured tree (`treeHash b1fbb5d8…`) is the **built artifact**, assembled by
  the plugin/npm channel. Clone + checkout + copy cannot reproduce what the
  cells measured, so the entry would list a skill the bootstrap cannot install.
- Materialising it needs a documented built-artifact channel in the schema — a
  decision, not a line in this spec.

What was verified and is reusable when that channel exists: source
`pbakaus/impeccable`, licence Apache-2.0 (Copyright 2025 Paul Bakaus, confirmed
2026-11-16 in `LICENSE`), skill `4.8.1` / engine `0.1.19`, the tag → commit
mapping above, and the measured tree hash. The measurement stays published in
`decision.md` §5–§6 and is the evidence; the blocker is §9 there. `TASK-121`
owns the built-artifact question alongside the two deferred cells.

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
| `node --test scripts/lib/evals/*.test.mjs` | pass — 574 tests, 0 fail |
| `node --test scripts/lib/*.test.mjs` | pass — 24 tests, 0 fail |
| `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` | pass — 42 tests, 0 fail |
| `node scripts/check-sensor-parity.mjs` | pass — 2/2 fixtures in parity |
| `node scripts/check-evidence.mjs` | pass — 6 documents, 0 errors, 0 warnings |
| `node scripts/check-staleness.mjs` | pass (report: 77 cited, 49 stale, 3 uncited — pre-existing; this corpus is not cited there) |
| `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0097-the-ui-territory-is-measured.md --base main` | pass — contract holds, no findings |

### Out of scope

- **`empty-state` and `document`** — the two artifact-shaped cells, deferred to
  `TASK-121`; their cells are `unresolved` in `decision.md` §7 and nothing about
  them is claimed.
- **The upstream `4.8.1` tag check** — owed to `TASK-121` while it prepares the
  follow-up.
- **No skill, harness, assertion kind, detector or `docs/evals/coverage.md`
  change** is part of this spec.
