# Eval coverage

Inventory of the cases in `evals/*/cases.md`: what exists, how it is staged, and
what has actually been measured. Counts come from
`node scripts/run-evals.mjs --root skills --list` and from the fixture
directories; they are not estimates. Paths quoted inside a measurement note name
the layout at the time of that run; SPEC-0058 moved the corpus out of the skill.

| Skill | Cases | Trigger | Manual | Fixture | Evidence recorded |
| --- | --- | --- | --- | --- | --- |
| `audit-docs` | 4 | 2 | 0 | tree 1; tree 3 staged via `git.json`; tree 4 drift fixture | case 3: 3/3, skill loaded 3/3 (`why:`, no run dir); case 4: 3/3, defect + intentional evolution + future filtered, no writes (`2026-11-05T08-46-00--audit-docs`) |
| `bootstrap-project-harness` | 23 | 3 | 1 | trees 1, 2, 3, 5, 7, 9, 10, 11, 14, 15, 16–23; 14 and 15 via `git.json` | case 14: 12/12 re-judged (first pass 9/12 on a reply regex); case 15: 3/3 (`why:`, no run dir). Re-measured after the Oxlint rename (SPEC-0045, `agentworks/deepseek-v4-1-flash`, five draws): case 14 5/5 and case 15 1/5 (failing `unchanged justfile`) in `2026-11-08T23-32-34--bootstrap-project-harness--agentworks-deepseek-v4-1-flash` (clean, `findings=0`, `isolated=yes`). Stack review, skill arm: #16 4/4 clean (1 stalled), #17 4/4 clean (1 stalled), #18 5/5, #19 5/5, #20 0/5 on `unchanged biome.json` (the skill merged the four Biome limits), #21 5/5, #22 5/5, #23 trigger 4/4 clean + 1 contaminated (host read), all in `2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash` (dirty: 2 stalls + 1 host read, `isolated=no`). Control: no cell reached five clean draws; #19 reached 2 clean draws and both failed, the other cells 0 clean with 5 contaminated each, in `2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill` (dirty: 33 skill leaks + 7 host reads, `isolated=no`); the control still read the real install, so every behavioural cell was **unresolved** at that point, not a separator. **#19 is measured without another draw (SPEC-0047):** with-skill `2026-11-09T07-37-44--bootstrap-project-harness--agentworks-deepseek-v4-1-flash` is 5/5 passed and `isolated=yes`; the control `2026-11-09T10-59-41--bootstrap-project-harness--…--without-skill` replays under the current detector (v6) with `node scripts/replay-evals.mjs --leaks` to four clean draws, `deniedDraws=1`: r1 is a **store leak** (SPEC-0052), so the four other draws are the evidentiary base, with 0/4 passed (all four red on `file AGENTS.md`, `file justfile`, `filematch eslint.config.js` and `filematch justfile eslint`) — a **separator** on the rule (5/5 vs 0/4). The stored control `result.json` still records the older v3 contamination (`skillLeaks=1`, `isolated=no`) by design; the replay is the evidence, not the artefact |
| `capture-idea` | 3 | 2 | 0 | trees 1–3 | published matrix: #1 5/5 with the skill; control **unresolved** under v2 (`2026-11-07T08-27-30--capture-idea--agentworks-deepseek-v4-1-flash--without-skill`: 0/0 clean, 5 contaminated — every draw read the install under `/Users/wendell/.agents/skills` (`r1` the directory, the rest the `SKILL.md`)), after v1 clean subsets 0/2, 0/2 and 0/0 (every clean draw failed `status: unprocessed`; dirs `2026-11-06T16-40-32--capture-idea`, `…17-07-09--without-skill`, `…17-23-44…`, `…17-32-50…`, all dirty); #2 trigger 5/5; #3 routing **5/5** with `process-inbox` staged as the declared sibling in `2026-11-06T19-06-50--capture-idea` (v2, `isolated=yes`), replacing the pre-fix 0/4 clean cross-skill-staging record `2026-11-06T16-50-30--capture-idea` (findings=1); re-measured under the enforced boundary (SPEC-0050, `agentworks/deepseek-v4-1-flash`, five draws): #1 is 5/5 clean with the skill (`2026-11-09T12-39-33--capture-idea--agentworks-deepseek-v4-1-flash`, `findings=0 isolated=yes`); the control `2026-11-09T12-41-57--capture-idea--…--without-skill` is 5/5 clean and 1/5 passed under the v5 replay (SPEC-0051, `deniedDraws=2`), the other four red on `filematch docs/inbox/*.md status: unprocessed` — **separator** (5/5 vs 1/5). Its stored `result.json` still records r1 as a v4 `skillLeaks=1` on `/Users/wendell/.config/opencode/skills`; SPEC-0051 re-judged that draw as `denied` (empty listing, content from another file), so the replay is the evidence. See `pipeline-bookends-matrix.md` |
| `find-blind-spots` | 4 | 2 | 0 | tree 4 | case 4: 3/3, skill loaded 3/3 (`why:`, no run dir) |
| `groom-backlog` | 7 | 2 | 0 | trees 1, 3, 4, 5 | ablation on 4 fixture cases, 2026-11-05: both arms 4/4; index-first not promoted (tokens +65% on the adversarial case) (`09-32-51`, `09-34-43`, `09-39-15`, `09-43-45`); #2: pre-detector 3/3 with and 3/3 without at `3d38b31` (`2026-11-05T17-09-40--groom-backlog`, `2026-11-05T17-13-34--groom-backlog--without-skill`); re-run under the leak detector at `8777e0b`: with skill 3/3 clean (`2026-11-06T07-53-16--groom-backlog`), without it 0/3 with 2 contaminated — clean control 0/1 (`2026-11-06T07-47-34--groom-backlog--without-skill`), so #2 was unresolved at that point, not a regression case; re-measured under the enforced boundary (SPEC-0050, five draws): the skill arm is 5/5 clean (`2026-11-09T12-50-37--groom-backlog--agentworks-deepseek-v4-1-flash`, `findings=0 isolated=yes`) and the control `2026-11-09T12-55-35--groom-backlog--…--without-skill` is 4/5 clean under the v6 replay (`deniedDraws=2`): r2 is a **store leak** (`evals/groom-backlog/2.md`, the previous `result.json` and prior `2.r*.md` transcripts), so the four other draws are the evidentiary base (4/4 passed) — **non-discriminator** (5/5 vs 5/5). The store is corpus and the read is denied under enforcement (SPEC-0052). The control artefact still records r2 as v4 `skillLeaks=1` for `skills/groom/SKILL.md` and `hostReads=1` for `/Users/wendell/.agents/commands`; SPEC-0051 re-judged it as `denied` because the `cat` returned `No such file or directory`, not the file's content, so the replay is the evidence |
| `implement-from-prompt` | 8 | 2 | 0 | trees 1, 2, 3, 4, 7, 8 | discriminating set (SPEC-0033, v2, `agentworks/deepseek-v4-1-flash`): #1 **5/5 vs 0/5** (`2026-11-07T08-57-39--implement-from-prompt--agentworks-deepseek-v4-1-flash`, `…08-59-39--without-skill`, `findings=0 isolated=yes`) and #8 **5/5 vs 0/5** (`…09-01-25…`, `…09-04-41--without-skill`, clean); see `discriminating-cases.md`. Published matrix: #1 and #8 separate 12/12 vs 0/12 on the default (`2026-11-05T12-35-30--implement-from-prompt`, `2026-11-05T12-42-05--implement-from-prompt--without-skill`, `2026-11-05T12-48-46--implement-from-prompt`, `2026-11-05T12-56-03--implement-from-prompt--without-skill`; these four predate the leak field, so `check-eval-run` reports `warnings=12` — pre-detector history, the rates stand); on `gpt-6-luna` #1 is 5/5 vs **0/5** (the old 1/5 control pass read the installed `SKILL.md`; re-measured at `2026-11-06T07-05-38--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`) and #8 is 5/5 vs 1/5 (`2026-11-05T13-18-27--implement-from-prompt--opencode-go-gpt-6-luna`, `2026-11-05T13-22-08--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`, `2026-11-05T13-25-10--implement-from-prompt--opencode-go-gpt-6-luna`, `2026-11-05T13-28-38--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`; the one #1 control pass read the real `SKILL.md`); #7 non-discriminator 5/5 both arms; #2 readable after SPEC-0019: gate 12/12 at `07f4fe6`, 11/12 passed (`2026-11-06T10-38-39--implement-from-prompt`), so the Gate A 2/5 did not reproduce (the delta includes the SPEC-0016 rule change, so the cause is not isolated); its control re-read under the detector is **0/3 draws**, 1 contaminated (`r3`) and the two clean draws failed the reply assertion (**0/2 clean**) at `2026-11-06T07-31-00--implement-from-prompt--without-skill`; the load across #1/#2/#5/#8 at n=12 was 45 of 46 clean draws loaded the skill (`2026-11-06T10-34-26`, `…10-38-39`, `…10-45-29`, `…10-53-13`); the one miss is #5 r9, which read the staged SKILL.md directly without calling the skill tool (a trigger case, so the tool call stays the routing signal — TASK-39), and #5's two exclusions are one contamination and one stall; #4 re-measured after SPEC-0016 (write target vs read dependency + fixture `package.json`): 5/5 with vs 3/5 without at `6dd38aa` (`2026-11-05T15-00-48--implement-from-prompt`, `2026-11-05T15-06-58--implement-from-prompt--without-skill`; two control reds are 600 s provider timeouts), so #4 is a non-discriminator and stays as a regression case; #1/#7/#8 kept 5/5 with skill (`2026-11-05T15-30-10--implement-from-prompt`, `2026-11-05T15-36-40--implement-from-prompt`, `2026-11-05T15-44-35--implement-from-prompt`); #3 is no longer `manual` after SPEC-0022: 1/1 with skill (`2026-11-06T11-28-49--implement-from-prompt`), no control, so it is a regression case, not a separator; trigger #5 4/5, #6 5/5 (`2026-11-05T11-52-43--implement-from-prompt`) |
| `process-inbox` | 3 | 2 | 0 | tree 1 | published matrix: #1 5/5 with the skill; control **unresolved** under v2 — default `02-51-15` is 0/2 valid clean (1 abort, 2 contaminated), and `03-08-51` is 5 provider aborts, not evidence; agentworks 0/2. v1 subsets 0/1, 0/1 and 0/1 are history. #2 trigger 4/4 clean scored draws loaded (`2026-11-06T16-55-11--process-inbox`, findings=1); #3 routing **5/5** with `capture-idea` staged as the declared sibling in `2026-11-06T19-09-27--process-inbox` (v2, `isolated=yes`), replacing the pre-fix 0/5 cross-skill-staging record; re-measured under the enforced boundary (SPEC-0050, five draws): #1 is 5/5 clean with the skill (`2026-11-09T12-44-11--process-inbox--agentworks-deepseek-v4-1-flash`, `findings=0 isolated=yes`) and the control `2026-11-09T12-46-48--process-inbox--…--without-skill` is 0/5 clean (`deniedDraws=3`, `isolated=yes`), every draw red on `unchanged docs/inbox/2026-01-01-digest-email.md` and `nodir docs/backlog` — **separator** (5/5 vs 0/5). See `pipeline-bookends-matrix.md` |
| `record-decision` | 5 | 2 | 0 | trees 1–5 | published matrix: #1 separator 4/5 vs **1/5** (`2026-11-06T16-43-33--record-decision`, `2026-11-06T17-11-37--record-decision--without-skill`); #2 separator 4/5 vs **0/5** (`2026-11-06T16-45-46--record-decision`, `2026-11-06T17-28-10--record-decision--without-skill`); #3 non-discriminator 4/5 vs 5/5 (`2026-11-06T16-48-00--record-decision`, `2026-11-06T17-20-53--record-decision--without-skill`); triggers #4/#5 5/5 in `2026-11-06T17-04-07--record-decision`; see `pipeline-bookends-matrix.md` |
| `review-code` | 10 | 2 | 0 | trees 1–7 plus `base/` and `base-red/`; 1–4 and 7–10 via `git.json` | discriminating set (SPEC-0033, v2): #7 **5/5 vs 0/5** (`2026-11-07T09-07-52--review-code--agentworks-deepseek-v4-1-flash`, `…09-11-14--without-skill`, clean; the control fails `verdict REJECT` 5/5, 3 approve and 2 miss the token), the **holdout**; see `discriminating-cases.md`. Published matrix; #4 fixture revised 2026-11-05: 5/5 with, 3/5 without (`2026-11-05T07-34-32--review-code`, `…07-47-21--review-code--without-skill`); #7 red gate: 3/3 with, 0/3 without (`…09-05-36`, `…09-32-10--without-skill`). **SPEC-0056 wave** (cases 8–10 and regressions 1, 2, 7, five draws per arm) is below |
| `survey-inflight-work` | 5 | 3 | 0 | tree 1 via `git.json` with a local bare `origin`; tree 2 without a remote | iteration 1, 1 draw/case: with-skill 4/4 (`2026-11-04T21-49-16`); control case 1 0/1, only the `unknown` PR state separated (`…21-45-26`); control case 2 0/1, only the no-remote line separated (`…21-57-53`). Case 5 (near-miss against `report-project-status`) added 2026-11-08, not measured |
| `audit-code-quality` | 9 | 2 | 0 | trees 1 and 4 via `git.json`; 5–8 via `git.json`; 9 stages tree 6 via `evals/9/git.json` | iteration 1: with-skill 4/4 (`2026-11-04T21-55-53`); control case 1 0/1, only coverage `unknown` separated (`…21-47-51`); case 4 on the final 8-assertion version 1/1 with skill (`2026-11-04T21-59-17`) against 0/1 without (`2026-11-04T21-59-17--audit-code-quality--without-skill`) on `SCOPE:`/`rule`/`CAPTURE OPTIONS` — one draw per arm, so it does not separate reliably (`…21-57-53` is the pre-contract 5-assertion version); **SPEC-0055 wave:** architecture cases 5–7 and deterministic cases 8–9, five draws per arm on `agentworks/deepseek-v4-1-flash`; skill arms 5/5, 4/5, 4/5, 3/5 and 4/5 passed against 0/5 in every control; all ten published cells are clean under the enforced boundary; see the SPEC-0055 wave below |
| `tighten-harness` | 6 | 2 | 0 | trees 1, 2, 3, 5, 6 | case 5: 3/3 passed, skill loaded 0/3 (`why:`, no run dir) |
| `write-implementation-prompt` | 6 | 2 | 1 | trees 1–4 | SPEC-0030 re-measure at `dcf5177` (`skillHash 046369c2…`, detector v2; the clean behavioural cells are `isolated=yes`, the trigger runs carry their findings): #1 5/5 clean (`2026-11-06T19-25-26--write-implementation-prompt`), control **unresolved** under v2: default 0/3 clean in two runs (`2026-11-07T01-46-26--write-implementation-prompt--without-skill`, `…02-58-14…`) and agentworks 0/2 (`08-17-29`); every clean draw failed `spec_sha:`. Four v1 attempts are history; #2 5/5 clean (`2026-11-06T19-28-47--write-implementation-prompt`), control **separator** under v2 on the default model (`2026-11-07T03-01-29--write-implementation-prompt--without-skill`: 5/5 clean, **0/5 passed**); the agentworks control (`08-20-10`) only reached 0/4 clean, a route difference. The v1 `15-30-39` 0/4 replay-clean is history; #4 5/5 clean (`2026-11-06T19-30-26--write-implementation-prompt`), control **non-discriminator** under v2: default **4/4 valid passed** (`2026-11-07T02-03-01--write-implementation-prompt--without-skill`; 1 rep aborted), agentworks 2/2 (`08-22-28`); the v1 `14-37-23` 4/4 passed is history; #3 `manual` (history `14-01-54` split 4/5; not re-run); triggers: #5 loaded 5/5 in both `2026-11-06T19-32-45` and `2026-11-06T19-53-34` but has no stall-free five-draw cell (stalls r1/r4 and r3/r5, event gaps in the matrix; contamination; best clean subsets 1/1 and 2/2); #6 clean 5/5 in `2026-11-06T20-12-15--write-implementation-prompt` (`findings=0 warnings=0 isolated=yes`), 5/5 in `19-32-45`, 4/5 in `19-53-34` (r3 loaded) — improved but not deterministic; canary 12/12 `13-51-35`; `13-46-05` discarded (`r8` read `.lane/trees`); re-measured under the enforced boundary (SPEC-0050, five draws): #1 is 5/5 clean with the skill (`2026-11-09T13-07-02--write-implementation-prompt--agentworks-deepseek-v4-1-flash`, `findings=0 isolated=yes`) and the control `2026-11-09T13-11-33--write-implementation-prompt--…--without-skill` is 0/5 clean (`deniedDraws=1`, `isolated=yes`), every draw red on `filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:` — **separator** (5/5 vs 0/5). See `write-implementation-prompt-matrix.md` |
| `report-project-status` | 4 | 3 | 1 | none | declared, not measured: three trigger/near-miss cases and one manual behavioural case (#3); no fixture and no run dir. Source: issue #11 (2026-11-08), skill merged in `fca9c78` |
| **total** | **97** | **31** | **3** | | |

## Discriminating set (issue #5)

Three cases separate two arms at n=5 under detector v2, with both arms clean:
`implement-from-prompt` #1 (5/5 vs 0/5, `status: implemented`),
`implement-from-prompt` #8 (5/5 vs 0/5, `nofile src/format.js`) and `review-code`
#7 (5/5 vs 0/5, `verdict REJECT`). `review-code` #7 is the **holdout**, frozen
in `SPEC-0033` before the first draw; its control fails the token 5/5, but 3/5
approve and 2/5 only miss the token. One more separates on the default model:
`write-implementation-prompt` #2 (5/5 vs 0/5, `03-01-29`). The runs and hashes are
in [`discriminating-cases.md`](discriminating-cases.md).

## Evidence rules

- A run directory cited **as evidence** takes one of two explicit paths:
  - **A detector with the `host-reads` capability** (v2 `71bfb85a91cd68ab`, v3
    `d8478beab04a4e3e`, v4 `d3e95ef948f983b7`, v5
    `def64b2d6a1baa6e`, v6 `9149d6ab1ca57343`): `node
    scripts/check-eval-run.mjs <run-dir>` reports `findings=0 warnings=0
    skillLeaks=0 hostReads=0 isolated=yes deniedDraws=N`. That means no skill or host
    read, no contaminated draw, no aborted draw (timeout, stall, provider
    limit), no lost gate, no missing provenance, no unfinished run, at least one
    draw that ran, and the manifest records an isolated run (`params.isolate:
    true`). `deniedDraws=N` counts draws that probed the corpus and were refused
    (`denied` on a draw's `result.json` is the entry count, not the draw count);
    it is not a finding and does not deny isolation (SPEC-0048). The isolation
    verdict is **capability-based, not digest equality** (SPEC-0049): a v2 run
    already looked for host reads, so a clean one is `isolated=yes`, and
    `check-evidence` accepts the same run by the same capability.
    A run that also carries `params.isolation` needs `enforced: true` there:
    `params.isolate` alone is a throwaway home, not a proven boundary. A
    manifest without `params.isolation` is legacy and keeps the boolean rule,
    so the historical `isolated=yes` citations stay valid. A manifest with
    `enforced: false` can never print `isolated=yes`; it prints `unknown`.
  - **v1** (`a31d58f79a6c7038` and earlier), an unknown digest, or a run whose
    stored artefact predates the rule that would clear it (a v3 control that
    probed the corpus with `2>/dev/null`, the 10-59-41 case): history, never a
    clean measurement under the stored artefact. Citable as replay-verified
    history only when `node scripts/replay-evals.mjs --leaks <run-dir>` prints
    `clean` (or `clean … deniedDraws=N`) and, when the manifest records an
    enforced boundary, `isolated=yes`; the citation names that replay. The
    replay re-judges the stored transcripts under the current detector. The
    other reader, `node scripts/check-eval-run.mjs <run-dir>`, reports the stored
    artefact and prints `isolated=unknown` for a v1 run, because the artefact
    still records the digest it ran under; that is not the replay's verdict.
  A directory that fails may still be cited **as the record of the failure
  itself**, with the finding named; it cannot supply a clean pass rate.
  `isolated=no` means the checker saw a skill or host read; `unknown` is neither
  a dirty verdict nor a clean one.
- The two paths above apply to runs covered by a named replay (the 0.5.0 wave
  and later). Rows whose runs predate that replay — the pre-detector
  `implement-from-prompt` 12/12 vs 0/12 cells (`warnings=12`) are the example —
  are **history**: their numbers are cited as historical direction, not as a
  clean measurement, and cannot underwrite a v2 claim.
- `stoppedEarly: true` is a complete run, not an unfinished one: the stop rule
  fired between waves and `reps` is the number of draws actually run. Cite
  `reps`/`passed` (e.g. "8/8, stopped early"), never the requested `--repeat`.
- A control from an earlier wave is citable only when `fixtureHash`, `promptHash`
  and `detectorVersion` match the new run. Any divergence — one fixture byte, a
  prompt edit, a detector change — re-runs the control (SPEC-0020).
- A pre-SPEC-0017 run that started before the detector landed and has no `leak`
  field at all is `not checkable`: the checker emits `warn leak-missing`, and a
  citation must state its `warnings=N`. It is history, not a clean measurement.
- A cell names a measurement only when it names the run directory or cites a
  `why:` note that records the number. A note without a run directory is marked
  `no run dir`: the count is honest, the provenance is not. Anything else reads
  `none`.
- `status: manual` cases are counted in `Cases` and excluded from a run; they are
  design intent, not evidence.
- A per-case number belongs in its `why:` line. A measured set belongs in a doc
  beside `review-code-matrix.md`.
- A provider abort is classified per draw and recorded in `execution.error`; the
  0.6.2 audit that swept every stored transcript was deleted in SPEC-0059. That
  audit and its dispositions stay in [`provider-aborts.md`](provider-aborts.md) as
  history — the command it names no longer exists.
- A draw that stalls **after** the skill loaded is provider noise until proven
  otherwise: if a paid run stalls post-load again, stop the wave, record the
  event gap and the attempt, and reopen `TASK-50` with those events. In the
  SPEC-0030 trigger runs 4 of 10 draws stalled this way, each with one retry and
  150–355 s lost; that is a known cost, not a clean measurement.
- Never round a repetition into a rate: `--repeat 3` gives three draws, and the
  matrix says five is enough to see a direction, not to publish a per-case rate.

## Detector v2

The rows above were measured with detector v1 (`a31d58f79a6c7038`), which saw
installed skill roots and `references/evals.md` but not the host checkout.
Detector v2 (`71bfb85a91cd68ab`) adds a separate `host` finding for a read into
the checkout root or one of its documented subdirectories (`docs/`, the checkout
`AGENTS.md`, `scripts/`, `skills/`, `runs/`) or into `.lane/trees/`; a `leak`
finding keeps its v1 meaning (installed skill or answer key). The numbers above
are unchanged. The 0.5.0 rows are **replay-verified v1 history**, not v2
measurements: none of them can print `isolated=yes`, and each is citable only
through the replay below.

Detector v3 (`d8478beab04a4e3e`, SPEC-0048) adds `denied`: a corpus path whose
call's output shows a permission denial for that path is a refused attempt, not
a read. It is recorded and counted, but it neither contaminates the draw nor
makes `isolated=no`; a successful read of the same path is still `leak`/`host`.

Detector v4 (`d3e95ef948f983b7`, SPEC-0049) closes the suppressed-probe gap.
Under an enforced run (`params.isolation.enforced: true`), a corpus hit whose
call returned nothing for that path and whose output carries no denial naming it
is a `denied` attempt, not a `leak`/`host`: `ls … 2>/dev/null` discards the only
line that would name the refusal, and the boundary plus its canary — not the
transcript — is what proves the read could not succeed. A call that demonstrably
returned the path's content (a non-shell result, or a shell output line naming
the path outside a denial) is still a leak. Without enforcement the v3 rule is
unchanged. Re-judging the 10-59-41 control with the replay yields five clean
draws and `deniedDraws=1`; its stored v3 artefact still reports the leak it
recorded, which is why the replay is the citation for that cell.

Detector v5 (`def64b2d6a1baa6e`, SPEC-0051) makes content count only for the
path it names: under enforcement a corpus hit is a `leak` only when the call
returned **that path's** content — a non-shell result carrying a body, or a
shell output line naming the path (or a child) with no error marker
(`No such file or directory`, `permission denied`, `Operation not permitted`,
`EPERM`, `EACCES`, `Is a directory`, `Not a directory`) and no ` -> ` symlink
arrow. Sibling output, an ENOENT line and an `ls` symlink listing are not a read
of the hit path; they fall to the enforced residual and are `denied`. Without
enforcement the v4 rule is unchanged. The two SPEC-0050 control runs
`2026-11-09T12-41-57--capture-idea--…--without-skill` and
`2026-11-09T12-55-35--groom-backlog--…--without-skill` replay to five clean
draws each with `isolated=yes`; SPEC-0050 publishes the cell verdicts. v6
re-judges the groom control (the store rule below).

Detector v6 (`9149d6ab1ca57343`, SPEC-0052) makes the eval store corpus. The
store is `<home>/.local/share/opencode/evals` — every answer key
(`<skill>/<n>.md`), every prior transcript and result, `baseline.json` and
`last-run.json`. `corpusRoots` adds the whole subtree to the seatbelt deny (and
its resolved path, because the throwaway home inherits the real `.local` as a
symlink), and a store hit is a `leak` (an answer key), never `host`. The rule is
checked before the isolated-home exclusion, so
`<isolated-home>/.local/share/opencode/evals/…` is the real store. Without
enforcement the hit is a leak; under enforcement it is `denied` unless the call
returned that path's content, which keeps the SPEC-0051 rule ahead of it. The
deny is scoped to `evals`:
`auth.json`, `evals-archive` and `evals-*-backup` are outside it.

The store-wide re-judge (`node scripts/replay-evals.mjs --leaks --all`, no model,
no write) found eight draws that touch the store. Five moved clean → `leak`, and
every one reads the store:

| run dir | cell | draw | before → after | store path |
| --- | --- | --- | --- | --- |
| `2026-11-02T01-25-09--bootstrap-project-harness` | `#14` | r2 | clean → `leak` | answer keys under `evals/bootstrap-project-harness/`, `evals/last-run.json` |
| `2026-11-06T15-33-16--write-implementation-prompt` | `#5` | r3, r5 | clean → `leak` | `evals/write-implementation-prompt/5.{md,json}` via the isolated `.local` symlink |
| `2026-11-09T10-59-41--bootstrap-project-harness--…--without-skill` | `#19` | r1 | clean → `leak` | `evals/baseline.json`, `…/bootstrap-project-harness/12.json`, `13.json`, a prior transcript |
| `2026-11-09T12-55-35--groom-backlog--…--without-skill` | `#2` | r2 | clean → `leak` | `evals/groom-backlog/2.md`, the previous `result.json` and `2.r*.md` |

Three already-dirty draws gained store hits without a verdict change:
`2026-11-04T21-49-16--survey-inflight-work` #3,
`2026-11-06T15-49-43--write-implementation-prompt` #5 r3 and
`2026-11-06T16-02-56--write-implementation-prompt` #5 r4 (already `dirty(host)`
under v5 from a host read of `/Users/wendell/.agents`; v6 adds the store `leak`).
No other draw changed: every verdict change is a store read, no draw gained a
non-store hit, and no cell that was clean for another reason became dirty. The two SPEC-0050 controls affected
are re-judged above: `groom-backlog` #2 is 4/5 clean with 4/4 passed
(non-discriminator) and `bootstrap-project-harness` #19 is 4/5 clean with 0/4
passed over the clean base (separator 5/5 vs 0/4).

`node scripts/replay-evals.mjs --leaks <run-dir…>` (or `--leaks --all`)
re-judged the 0.5.0 wave from its transcripts, with no model and no write into
the run directories: 49 run directories and 57 cells (the four skills, their
controls, the two `write-implementation-prompt` canaries, and the
`agentworks-gpt-oss-120b` pilot cells, which all replay clean). 26 cells are
dirty; a cell is listed once, with the rules the replay found.

| cell | run dir | draws | replay verdict | clean under v1? |
| --- | --- | --- | --- | --- |
| `write-implementation-prompt#1` | `2026-11-06T13-46-05--write-implementation-prompt` | 8 | `dirty(host)` | yes — already discarded by hand (r8 read `.lane/trees`) |
| `write-implementation-prompt#5` | `2026-11-06T14-07-04--write-implementation-prompt` | 5 | `dirty(host)` | yes — **new** |
| `write-implementation-prompt#6` | `2026-11-06T14-07-04--write-implementation-prompt` | 5 | `dirty(host)` | yes — **new** |
| `write-implementation-prompt#1` | `2026-11-06T14-28-07--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#2` | `2026-11-06T14-30-42--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#3` | `2026-11-06T14-32-58--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#4` | `2026-11-06T14-37-23--write-implementation-prompt--without-skill` | 5 | `dirty(host)` | yes — **new** (r5 grep of the checkout root, denied) |
| `write-implementation-prompt#2` | `2026-11-06T14-40-36--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#5` | `2026-11-06T14-43-01--write-implementation-prompt` | 5 | `dirty(leak)` | no |
| `write-implementation-prompt#1` | `2026-11-06T15-15-52--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#1` | `2026-11-06T15-18-26--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#1` | `2026-11-06T15-20-43--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#2` | `2026-11-06T15-25-06--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#2` | `2026-11-06T15-27-30--write-implementation-prompt--without-skill` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#2` | `2026-11-06T15-30-39--write-implementation-prompt--without-skill` | 5 | `dirty(host)` | yes — **new** (r1 glob of the checkout root, denied) |
| `write-implementation-prompt#5` | `2026-11-06T15-33-16--write-implementation-prompt` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#6` | `2026-11-06T15-33-16--write-implementation-prompt` | 5 | `dirty(host)` | yes — **new** (r1 grep of the checkout root, denied) |
| `write-implementation-prompt#5` | `2026-11-06T15-49-43--write-implementation-prompt` | 5 | `dirty(leak,host)` | no |
| `write-implementation-prompt#5` | `2026-11-06T16-02-56--write-implementation-prompt` | 5 | `dirty(leak,host)` | no |
| `capture-idea#3` | `2026-11-06T16-50-30--capture-idea` | 5 | `dirty(leak)` | no |
| `capture-idea#1` | `2026-11-06T17-07-09--capture-idea--without-skill` | 5 | `dirty(leak)` | no |
| `process-inbox#1` | `2026-11-06T17-08-43--process-inbox--without-skill` | 5 | `dirty(leak)` | no |
| `capture-idea#1` | `2026-11-06T17-23-44--capture-idea--without-skill` | 5 | `dirty(leak,host)` | no |
| `process-inbox#1` | `2026-11-06T17-25-52--process-inbox--without-skill` | 5 | `dirty(leak,host)` | no |
| `capture-idea#1` | `2026-11-06T17-32-50--capture-idea--without-skill` | 5 | `dirty(leak,host)` | no |
| `process-inbox#1` | `2026-11-06T17-34-41--process-inbox--without-skill` | 5 | `dirty(leak)` | no |

Five cells that were clean under v1 are newly invalidated by a host read (the
sixth, `13-46-05`, was already discarded by hand):

- `2026-11-06T14-07-04--write-implementation-prompt` #5: r1 read the checkout
  `AGENTS.md` and `docs/specs/SPEC-0012-paraphrase-lens-spec-reviewer.md`
  (both denied). #6: r1 read only
  `docs/specs/SPEC-0012-paraphrase-lens-spec-reviewer.md`; the `AGENTS.md` read
  is `#5.r1`, not `#6.r1`.
- `2026-11-06T14-37-23--write-implementation-prompt--without-skill` #4: r5
  grepped `/Users/wendell/.agents` (denied). The published "5/5 in both arms" is
  now 4/5 clean on the control.
- `2026-11-06T15-30-39--write-implementation-prompt--without-skill` #2: r1
  globbed `/Users/wendell/.agents` (denied). The #2 separator's published "0/5
  clean control" is 0/4 clean — the direction is unchanged, but the clean
  five-draw control is not.
- `2026-11-06T15-33-16--write-implementation-prompt` #6: r1 grepped
  `/Users/wendell/.agents` (denied), so this trigger run's clean subset is one
  draw smaller.

The `record-decision` controls (`17-11-37`, `17-15-33`, `17-20-53`, `17-28-10`)
and the two agentworks controls replay clean, so not every 0.5.0 control reads
the host; the deny-layer question (SPEC-0028) stayed open until SPEC-0046 /
TASK-71 added the OS boundary. The 12-draw canary at
`2026-11-06T13-51-35` is clean and remains citable as replay-verified v1
history.

A denied read is no longer a leak (SPEC-0048). Detection is still the
guarantee — a successful read is `leak`/`host` — but a path whose own call
output shows the permission denial is recorded as `denied`, counted on the
result and in the summary, and does not contaminate the draw. Denial is the
permission layer's decision, and the transcript is the record of it; the old
rule made a control that probed the corpus impossible to clean even when the
boundary held. The F0.1 control of SPEC-0047 is the worked example: its `r3`–`r5`
probes now replay clean with three denied draws and no `leak`/`host`.

A cell-level dirty verdict does not by itself shrink every published clean
subset: where a row above cites a subset (for example,
`write-implementation-prompt` #5 at `2026-11-06T16-02-56`, 3/3), the replay's
per-draw pass leaves that subset intact. The cells above keep their published
numbers; SPEC-0031 re-measured the arms that still mattered under v2.

That re-measure ran at `eb9903e` on `agentworks/deepseek-v4-1-flash` (the default
provider's weekly limit was exhausted), five draws per arm. The skill arms are
clean 5/5 (`2026-11-07T08-25-21--capture-idea--agentworks-deepseek-v4-1-flash`,
`2026-11-07T08-29-45--process-inbox--agentworks-deepseek-v4-1-flash`); the
controls are still dirty or too short: `capture-idea` #1 0/0 clean,
`process-inbox` #1 0/2 clean, `write-implementation-prompt` #1 0/2 and #2 0/4,
and #4 2/2 clean passed. No control reached five clean draws, so the unresolved
cells stayed unresolved at that point and #4 stays a non-discriminator. The control arm still
reads the real install under `/Users/wendell/.agents/skills`; denying the `skill`
tool does not deny the text. Denying that read is **SPEC-0046 / TASK-71**: the
runner probes the host for an OS-level boundary (macOS seatbelt), launches the
child under it, and records `params.isolation` in the manifest. It does not
re-measure anything here. SPEC-0050 measured the four cells under the enforced
boundary at n=5 (separate rows above): `capture-idea` #1,
`process-inbox` #1 and `write-implementation-prompt` #1 are **separators**
(5/5 vs 1/5, 0/5 and 0/5), `groom-backlog` #2 is a **non-discriminator**
(5/5 vs 5/5) after SPEC-0051 re-judged its control read-only, and
`bootstrap-project-harness` #19 is a separator on the rule from SPEC-0047's
replay evidence. No cell remains unresolved for a contaminated control.

The replay above is the named v1 replay for every 0.5.0 row in the table: a row
not listed here is `clean` under it and citable as replay-verified history; a
row listed here is not a clean measurement.

### SPEC-0050 wave (five draws per arm, enforced boundary)

Measured 2026-11-09 on `agentworks/deepseek-v4-1-flash`, concurrency 4, detector
v4 `d3e95ef948f983b7`, then re-judged read-only under detector v5
`def64b2d6a1baa6e` (SPEC-0051) and again under v6 `9149d6ab1ca57343`
(SPEC-0052), both with `node scripts/replay-evals.mjs --leaks`. Every manifest
records `params.isolation.enforced: true` (seatbelt); under v6 every run is
`isolated=yes` except the two controls whose store-reading draw is named below;
`check-eval-run` on the two stored v4 controls still prints `isolated=no`. The #19 row is SPEC-0047's evidence, re-judged by
replay, not a new draw; its stored control artefact still records the v3
contamination. The `capture-idea` and `groom-backlog` control artefacts still
record the v4 contamination (`skillLeaks=1`; the groom also `hostReads=1`) while
the replay is the evidence, exactly as with #19. v6 turns the #19 control's r1
and the groom control's r2 into store leaks; the counts below are the v6 ones.

| cell | arm | run directory | clean draws | passed | deniedDraws | red assertion(s) | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `bootstrap-project-harness` #19 | with-skill (SPEC-0047) | `2026-11-09T07-37-44--bootstrap-project-harness--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 0 | — | **separator** (5/5 vs 0/4) |
| `bootstrap-project-harness` #19 | control (SPEC-0047, replay) | `2026-11-09T10-59-41--bootstrap-project-harness--…--without-skill` | 4/5 (v6; r1 read the store) | 0/4 | 1 | `file AGENTS.md`, `file justfile`, `filematch eslint.config.js`, `filematch justfile eslint` | **separator** (5/5 vs 0/4) |
| `capture-idea` #1 | with-skill | `2026-11-09T12-39-33--capture-idea--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 0 | — | **separator** (5/5 vs 1/5) |
| `capture-idea` #1 | control | `2026-11-09T12-41-57--capture-idea--…--without-skill` | 5/5 (v5 replay; stored r1 `skillLeaks=1`) | 1/5 | 2 | `filematch docs/inbox/*.md status: unprocessed` | **separator** (5/5 vs 1/5) |
| `process-inbox` #1 | with-skill | `2026-11-09T12-44-11--process-inbox--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 0 | — | **separator** (5/5 vs 0/5) |
| `process-inbox` #1 | control | `2026-11-09T12-46-48--process-inbox--…--without-skill` | 5/5 | 0/5 | 3 | `unchanged docs/inbox/2026-01-01-digest-email.md`, `nodir docs/backlog` | **separator** (5/5 vs 0/5) |
| `groom-backlog` #2 | with-skill | `2026-11-09T12-50-37--groom-backlog--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 0 | — | **non-discriminator** (5/5 vs 5/5) |
| `groom-backlog` #2 | control | `2026-11-09T12-55-35--groom-backlog--…--without-skill` | 4/5 (r2 is a store leak; stored r2 `skillLeaks=1`, `hostReads=1`) | 4/4 | 2 | — (r2 is a store leak) | **non-discriminator** (5/5 vs 5/5) |
| `write-implementation-prompt` #1 | with-skill | `2026-11-09T13-07-02--write-implementation-prompt--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 0 | — | **separator** (5/5 vs 0/5) |
| `write-implementation-prompt` #1 | control | `2026-11-09T13-11-33--write-implementation-prompt--…--without-skill` | 5/5 | 0/5 | 1 | `filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:` | **separator** (5/5 vs 0/5) |

The four measured cells resolve to three separators (`capture-idea` #1,
`process-inbox` #1, `write-implementation-prompt` #1) and one
non-discriminator (`groom-backlog` #2). The two cells that the v4 detector
reported as leaked controls are clean under the v5 per-path rule — the stored
artefacts keep the old contamination, the replay is the evidence. The v6 store
rule re-judges one draw in each of the two replayed controls: the `#19` control
r1 and the `groom-backlog` control r2 read the eval store. The store is corpus
and denied under enforcement, so both draws are store leaks; the evidentiary
bases are the other four draws each, and no cell verdict moves. No oracle,
fixture, `why:` line or expected output changed after the draws.

### SPEC-0055 wave (five draws per arm)

Measured 2026-11-10 on `agentworks/deepseek-v4-1-flash`, concurrency 4, detector
v6 `9149d6ab1ca57343`, level `behavior`. Every valid manifest records
`params.isolation.enforced: true` (seatbelt), and `check-eval-run` on each of the
ten published cells prints `findings=0 warnings=0 skillLeaks=0 hostReads=0
isolated=yes deniedDraws=0`. "Clean draws" is the non-contaminated count;
"passed" is the assertion count.

| case | arm | run directory | clean draws | passed | red assertion(s) | verdict |
| --- | --- | --- | --- | --- | --- | --- |
| #5 | with-skill | `2026-11-10T13-28-15--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | — | **separator** (5/5 vs 0/5), keep |
| #5 | control | `2026-11-10T13-31-04--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | **separator** |
| #6 | with-skill | `2026-11-10T13-33-15--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | `reply SCOPE:` (r2) | **separator** (4/5 vs 0/5), keep |
| #6 | control | `2026-11-10T13-36-02--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | **separator** |
| #7 | with-skill | `2026-11-10T13-40-49--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | `reply SCOPE:` (r5) | **separator** (4/5 vs 0/5), keep |
| #7 | control | `2026-11-10T13-43-14--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | **separator** |
| #8 | with-skill | `2026-11-10T13-45-48--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 3/5 | `reply SCOPE:` (r1, r3) | **separator** (3/5 vs 0/5), keep |
| #8 | control | `2026-11-10T13-49-08--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply CAPTURE OPTIONS` | **separator** |
| #9 | with-skill | `2026-11-10T13-59-02--audit-code-quality--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | `reply SCOPE:` (r4) | **separator** (4/5 vs 0/5), keep |
| #9 | control | `2026-11-10T14-02-40--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | `reply SCOPE:`, `reply (unmeasured\|not measured\|not configured\|not installed\|no dependency tool)`, `reply CAPTURE OPTIONS` | **separator** |

Case 8's deterministic assertions passed in both arms: every draw ran
`./bin/dependency-cruiser` and `./bin/knip` (`ran`), named the
`src/app.js` ↔ `src/legacy.js` cycle and the `src/unused.js` /
`unusedHelper` dead code. The separator is the `SCOPE:`/`CAPTURE OPTIONS`
contract, not the ability to read the stubs. Case 9 is the classification
separator: the skill says `unmeasured` in 5/5 draws, the control in 0/5, and the
control invents no metric.

The first case-9 with-skill attempt (`2026-11-10T13-51-55--audit-code-quality--agentworks-deepseek-v4-1-flash`) is **not evidence** (stall, `findings=1`): `evals/9` did not exist yet, so the
staged tree held only the skill; r3 stalled for 171 s (the 120 s watchdog fired; 2 attempts, one runner retry) and the other draws failed
`unchanged` because the fixture files were absent. The fixture pointer
`evals/9/git.json` (`base: "../6"`) was added and the cell re-run. That is one
extra cell of five paid draws, so the wave spent 55 draws, not 50; the overrun
is published rather than hidden.

Decisions: `keep` for all five cases; no `change`, no `drop`. The strict
`reply SCOPE:` line is the skill's own output contract, and the skill draws that
missed it used a `## SCOPE` heading. It was not relaxed after the draws. The
4/5 and 3/5 pass rates are published as rates; they are not reported as five
clean passes, and no oracle, fixture (apart from the missing case-9 pointer) or
`why:` line was changed to reach a pass after the first draw.

### SPEC-0056 wave (five draws per arm)

Measured 2026-11-10 on `agentworks/deepseek-v4-1-flash`, concurrency 4, detector
v6 `9149d6ab1ca57343`, level `behavior`. Every cited manifest records
`params.isolation.enforced: true` (seatbelt), and `check-eval-run` on each
directory prints `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes
deniedDraws=0`. "Clean draws" is the non-contaminated count; "passed" is the
assertion count. New cases 8–10 plus regression cases 1, 2 and 7: **65 paid
draws** — 55 evidence draws, 5 draws of an invalid case-10 setup attempt, and
the 5 case-10 control draws. The human approved the extra 5 draws above the
original 60 ceiling to close the case-10 control.

| case | arm | run directory | clean draws | passed | replayed (verdict / passed) | red assertion(s) | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #8 | with-skill | `2026-11-10T15-02-35--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 / 5/5 | — | **token/contract separator**; substantive judgement matches (both reject), keep |
| #8 | control | `2026-11-10T15-05-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 5/5 / 5/5 | `verdict REJECT` (the control rejects in prose 5/5; the token misses `changes requested`/`needs changes`) | **token/contract separator**, non-discriminator on judgement |
| #9 | with-skill | `2026-11-10T15-08-51--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 / 5/5 | — | **token/contract separator**; substantive judgement matches (both reject), keep |
| #9 | control | `2026-11-10T15-12-14--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 3/5 | 4/5 / 4/5 | `verdict REJECT` (r3, r4), `reply src/export\.js:[0-9]+` (r3 only) | **token/contract separator**, non-discriminator on judgement |
| #10 | with-skill (fixed fixture) | `2026-11-10T15-39-17--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 / 5/5 | — | **token/contract separator**; substantive judgement matches (both approve), keep |
| #10 | control | `2026-11-10T15-54-47--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 3/5 / 0/5 | `verdict APPROVE`, `reply Not verified` (the control approves in prose; no token and no `Not verified` section) | **token/contract separator**, non-discriminator on judgement |
| #1 | with-skill | `2026-11-10T15-20-12--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 / 5/5 | — | **token/contract separator**; substantive judgement matches (both approve), keep |
| #1 | control | `2026-11-10T15-23-10--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 5/5 / 0/5 | `verdict APPROVE` (r1, r4), `reply Not verified` (5/5) | **token/contract separator**, non-discriminator on judgement |
| #2 | with-skill | `2026-11-10T15-26-12--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 4/5 | 4/5 / 4/5 | `verdict REJECT`, `reply AC-2`, `reply 21\.63\|noise\|float` (r4) | **non-discriminator** (4/5 vs 4/5), keep |
| #2 | control | `2026-11-10T15-28-46--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 4/5 | 5/5 / 5/5 | `verdict REJECT` (r5) | **non-discriminator** |
| #7 | with-skill | `2026-11-10T15-31-48--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | 5/5 | 5/5 / 5/5 | — | **separator** (5/5 vs 0/5), holdout, keep |
| #7 | control | `2026-11-10T15-35-51--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 5/5 | 0/5 | 0/5 / 0/5 | `verdict REJECT` | **separator** |

The **replayed** column is the same stored transcripts read with the closed stance
table of SPEC-0062, no new draw: `node scripts/replay-evals.mjs --run <dir>` over
the eight directories the four citations name (the `#1`, `#8`, `#9` and `#10`
cells; the `#2` and `#7` rows replay with it and are shown for completeness). The
measured `passed` column is untouched — it records what the assertion said when
the draws were run. The first number is the `verdict` assertion, the second is the
cell. Per cell: #1 control 3/5 → 5/5 on the token and 0/5 on the cell (`reply Not
verified` fails 5/5); #8 control 0/5 → 5/5 on both; #9 control 3/5 → 4/5 on both,
because r3 states the rejection in prose and names no listed stance; #10 control
0/5 → 3/5 on the token and 0/5 on the cell (r1 and r4 are prose, and `reply Not
verified` fails 5/5). One row moved that SPEC-0056 did not re-judge: the #2
control's r5 (`changes requested`) now reads `REJECT`, so that arm replays 5/5;
its skill arm stays 4/5 because r4 emits no `VERDICT:` line, so #2 remains a
non-discriminator.

**(SPEC-0062) What the `verdict` assertion measures.** It scores the stance line —
the words after `VERDICT:`/`Veredicto:`/`Parecer:` — and not the engineering
judgement the reply carries. A reviewer who rejects the change in a paragraph but
names no stance token is a *miss* for this assertion, exactly as a reviewer who
writes `VERDICT: REJECT` and then argues for merging is a hit: the assertion is a
token/contract reader, and a token/contract separator is not a capability
separator. The replayed column is therefore the judgement-corrected rate: same
draws, same replies, read with the vocabulary the controls actually wrote. The
measured column stays as the historical record of the token's behaviour, and the
two columns are not interchangeable.

Case 8's skill arm ran `npm test`, saw it pass and rejected the public-contract
break in 5/5. Its control rejects the same break in prose 5/5 ("changes
requested", "needs changes", "one blocking defect"), but the `verdict`
assertion's closed stance vocabulary only accepts `request changes`/`reject`, so
the control scores 0/5 on the token. The case is a token/contract separator, not
a substantive one: both arms reject the change and the 0/5 is the missing token.

Case 9's skill arm named `filename` → `buildExportCommand` → `execSync` in 5/5.
Its control rejects the injection in prose 5/5; r1, r2 and r5 emit a recognised
`VERDICT:` stance, r3 and r4 do not, so it scores 3/5. The `reply
src/export\.js:[0-9]+` red is r3 only; r4 cites the `file:line`. Same
classification: token/contract separator, non-discriminator on the substantive
judgement (both reject).

Case 10's fixed skill arm is 5/5. Its control
(`2026-11-10T15-54-47--review-code--agentworks-deepseek-v4-1-flash--without-skill`)
is 5/5 clean and 0/5 passed: it approves the same correct retry in prose 5/5 but
emits no `VERDICT: APPROVE` and no `Not verified` section, so those two
assertions fail. Same classification: token/contract separator,
non-discriminator on the substantive judgement (both approve). The control
closes the arm comparison; #10 is no longer unresolved.

Case 1's control approves the clean diff in prose 5/5 ("compliant — approve",
"approve", "Passes SPEC-0007"), but fails `reply Not verified` in 5/5 and
`verdict APPROVE` in r1/r4. It is a token/contract separator, non-discriminator
on the substantive judgement, and the case stays.

These four per-case readings describe the token's behaviour **at measurement
time**, under the stance table that preceded SPEC-0062; no measured number above
is rewritten. The **replayed** column is the same transcripts under the current
table, and it changes only the token: #1 control r1/r4 now read `APPROVE` (#8
control 5/5, #9 control r4, #10 control r2/r3/r5 likewise), while #9 r3 and
#10 r1/r4 still state their stance only in prose.

**Case 10's first skill arm is not evidence.** The run
`2026-11-10T15-15-21--review-code--agentworks-deepseek-v4-1-flash` (5/5 clean,
0/5 passed) reviewed the original fixture and correctly blocked it: the tests
covered AC-1, the call budget and the rethrow, but not AC-2's delay schedule or
AC-3's defaults and non-integer inputs, so the spec's "correct and tested"
premise was false. The fixture was strengthened — an injected `sleep` seam and
tests for the `[10, 20, 40]`/`[100, 200]` waits, the defaults, and `1.5`/`2.5`
rejections — and the case re-measured. The fixed arm is 5/5; no `expect:` line or
assertion was changed, and the fixture change did not lower the bar. The control
was run after the human approved the extra 5 draws.

Case 2 remains the non-discriminator it already was (4/5 vs 4/5); the r4 skill
failure had no `VERDICT:` line. Case 7's holdout stands at 5/5 vs 0/5.

**AC-6 disclosure.** The wave re-ran #1, #2 and #7 at `skillHash 9a28572…`.
Cases #3–#6 were **not** re-measured at that hash; their published cells in this
document are historical at older `skillHash` values and are not a claim of green
at `9a28572…`.

Decisions: `keep` for #8, #9, #1, #2 and #7; `change` for #10 (the fixture was
strengthened before the fixed arm) and keep it. No case was dropped and no case
is unresolved.

The human-facing reading of this table — one screen per case, with the measured
and replayed columns kept apart and attributed to their waves — is
[`review-code-matrix.md`](review-code-matrix.md). It is a reading aid over the
cells above, not a second count: it publishes no number that is not in this
table or in the run directory it cites, and where the two would disagree this
table wins.

## Staleness

`node scripts/check-staleness.mjs` is a query, not an anecdote: it reads the run
directories cited above, takes the governed hashes stored on each cited cell's
`result.json`, and compares them with the working tree. It reads only the run
manifests and case results — never `baseline.json` or `last-run.json`. A run that
predates SPEC-0057 records the staged tree hash (`skillHash`); that is compared
with a re-computed filtered skill tree. A new draw also records
`skillHashes: { rel: hash }` for the files that govern it — `governs:` narrows
that set, and absent means the whole skill tree. Manual cases are not checked:
they are design intent, not a measurement.

The default form prints the report and exits 0. `--check` exits 1 when any cited
cell is stale **or an uncited citation is present**. It is **report-only** for
now: it is not wired into CI or `docs/pipeline.md`, and promoting it to a gate is
a follow-up after the first clean pass.

A bare timestamp in prose is resolved by unique prefix against the store, and a
bare `HH-MM-SS` by the time slot in the directory name (`slice(11, 19)`). When
several directories match, or none does, the citation is reported as `uncited`
and no run from the whole store is substituted for it. An ellipsis-prefixed
time (`…10-45-29`) is the date-relative shorthand and is not re-resolved from
the clock alone.

First run (2026-11-10, 62 cited cells): **17 stale** —
`audit-code-quality` #1–#4; `groom-backlog` #1, #3 and #4 (the ablation runs at
`1ebd1f1c…`); `implement-from-prompt` #5 and #6; `review-code` #3–#6 (#5 and #6
have no recorded run — they are the cells SPEC-0056 did not re-measure; #3 is
stale against `2026-11-03T10-10-09--review-code--opencode-go-gpt-6-luna`,
measured under a different model); and `survey-inflight-work` #1–#4. Three
citations are `uncited`: the audit pair on line 20 and the two time-only tokens
on lines 683–684 each match more than one directory. The cited cells that SPEC-0056 re-ran at `skillHash 9a28572…`
(`review-code` #1, #2 and #7–#10) are fresh, and
`write-implementation-prompt` #5 is fresh through its later
`2026-11-06T19-53-34` citation.

## Known holes

- **The `verdict` stance vocabulary is closed (SPEC-0056), and was widened in
  SPEC-0062.** The closed table now reads `changes requested`, `needs changes`,
  `blocking`, `do not merge`/`should not merge`, `approve with nits` and the rest
  of `VERDICT_FORMS` in `scripts/lib/evals/kinds.mjs`; a negated or conditional
  form (`not approved`, `cannot approve`, `non-blocking`) is still a miss. The
  SPEC-0056 control arms of `review-code` #1, #8, #9 and #10 therefore replay to
  5/5, 5/5, 4/5 and 3/5 on the token (their cells: 0/5, 5/5, 4/5 and 0/5), and
  the measured column is unchanged. What the assertion still cannot read is a
  stance stated only as prose: #9's r3 and #10's r1/r4 name no listed stance, so
  the red there is the absence of the token, not a different judgement.
- **`review-code` #3–#6 are historical at older hashes (SPEC-0056).** The wave
  re-ran #1, #2 and #7 at `skillHash 9a28572…`; #3–#6 were not re-measured, so
  their published cells are not evidence of green at this hash.
- **A successful bare `ls` of a corpus root reads as `denied` under
  enforcement.** v5's content rule needs a line naming the path, and an `ls`
  that returns only relative names has none, so the residual is `denied`. That
  is reachable only if the boundary is broken — the canary proves the corpus
  read fails first — so the choice is pinned by a test rather than guessing
  attribution from a relative listing.
- **Three SPEC-0017 draws are not checkable, not invalid.** The
  `2026-11-05T13-22-08--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`,
  `2026-11-05T12-00-00--implement-from-prompt--without-skill` and
  `2026-11-05T17-13-34--groom-backlog--without-skill` artefacts predate the
  `leak` field. The checker cannot re-judge them; it reports `warn leak-missing`.
  Their published numbers stay as historical evidence, not as a clean rate.
- **`groom-backlog` #2 is a non-discriminator (SPEC-0050).** The earlier
  reading — 3/3 in both arms — was measured before the runner detected external
  reads. Re-run at `8777e0b` with the detector: with the skill 3/3 clean
  (`2026-11-06T07-53-16--groom-backlog`); without it, 0/3, of which **2/3 were
  contaminated** by the installed `SKILL.md`/`evals.md`
  (`2026-11-06T07-47-34--groom-backlog--without-skill`). SPEC-0050 re-measured
  both arms under the enforced boundary: the skill is 5/5 clean
  (`2026-11-09T12-50-37--groom-backlog--agentworks-deepseek-v4-1-flash`), and the
  control is 4/5 clean in
  `2026-11-09T12-55-35--groom-backlog--…--without-skill` (`deniedDraws=2`) under
  detector v6. Its stored `result.json` still records the v4 contamination of r2
  (`skillLeaks=1` for `skills/groom/SKILL.md`, `hostReads=1` for
  `/Users/wendell/.agents/commands`); SPEC-0051 re-judged that draw read-only as
  `denied`, because the `cat` returned `No such file or directory`, not the
  file's content. Independently, r2 read prior run artefacts in the eval store —
  `evals/groom-backlog/2.md`, the previous `result.json` and prior `2.r*.md`
  transcripts — and is a **store leak** (SPEC-0052), so it is excluded from the
  evidentiary base; the control's evidence is the other four draws, all passed.
  Both arms pass at the same rate on that base, so the case is a
  **non-discriminator**. The store is now corpus and the read is denied under
  enforcement; no residual hole.
- **`write-implementation-prompt` #1 is a separator (SPEC-0050).** Four v1
  control attempts never produced a five-draw clean run: clean subsets 0/3
  (`2026-11-06T15-15-52--write-implementation-prompt--without-skill`), 0/4
  (`2026-11-06T15-18-26--write-implementation-prompt--without-skill`), 0/3
  (`2026-11-06T15-20-43--write-implementation-prompt--without-skill`) and 0/4
  (`2026-11-06T14-28-07--write-implementation-prompt--without-skill`); the v2
  re-measure
  (`2026-11-07T08-17-29--write-implementation-prompt--agentworks-deepseek-v4-1-flash--without-skill`) (dirty)
  was 0/2 clean with 3 contaminated. SPEC-0050 measured it under the enforced
  boundary: 5/5 clean with the skill
  (`2026-11-09T13-07-02--write-implementation-prompt--agentworks-deepseek-v4-1-flash`)
  against 0/5 clean without it
  (`2026-11-09T13-11-33--write-implementation-prompt--…--without-skill`,
  `deniedDraws=1`), all five control draws red on
  `filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:` — **separator**. See
  `write-implementation-prompt-matrix.md`.
- **`write-implementation-prompt` #4 is a non-discriminator.** 5/5 in both arms
  under v1 (`2026-11-06T14-04-25--write-implementation-prompt`,
  `2026-11-06T14-37-23--write-implementation-prompt--without-skill`). The v2
  re-measure
  (`2026-11-07T08-22-28--write-implementation-prompt--agentworks-deepseek-v4-1-flash--without-skill`) (dirty)
  is 2/2 clean passed with 3 contaminated, so the control passes when clean and
  the case cannot separate the arms. The decision stands; the control's 2/2 clean
  subset is not a five-draw rate. A bare agent mirrors the existing prompt and
  records `spec_sha` as often as the skill. Recorded as a regression case; see
  `write-implementation-prompt-matrix.md`.
- **`capture-idea` #1 is a separator (SPEC-0050).** 5/5 with
  the skill under v2
  (`2026-11-07T08-25-21--capture-idea--agentworks-deepseek-v4-1-flash`); the v2
  control
  (`2026-11-07T08-27-30--capture-idea--agentworks-deepseek-v4-1-flash--without-skill`) (dirty)
  is 0/0 clean with 5 contaminated. The v1 attempts were 0/2, 0/2 and 0/0
  (`2026-11-06T17-07-09--capture-idea--without-skill`, `…17-23-44…`,
  `…17-32-50…`), and every clean draw failed `status: unprocessed`. SPEC-0050
  re-measured both arms under the enforced boundary: the skill is 5/5 clean
  (`2026-11-09T12-39-33--capture-idea--agentworks-deepseek-v4-1-flash`); the
  control `2026-11-09T12-41-57--capture-idea--…--without-skill` is 5/5 clean and
  1/5 passed under the v5 replay (`deniedDraws=2`), the other four red on
  `filematch docs/inbox/*.md status: unprocessed` — **separator** (5/5 vs 1/5).
  The stored `result.json` still records r1 as a v4 `skillLeaks=1` on
  `/Users/wendell/.config/opencode/skills`; SPEC-0051 re-judged it read-only as
  `denied`, because the listing was empty and the content came from another file.
  See `pipeline-bookends-matrix.md`.
- **`process-inbox` #1 is a separator (SPEC-0050), not the expected
  non-discriminator.** 5/5 with the skill under v2 on both routes
  (`2026-11-07T02-45-54--process-inbox`,
  `2026-11-07T08-29-45--process-inbox--agentworks-deepseek-v4-1-flash`). The
  default control `02-51-15` was 0/2 valid clean (1 abort, 2 contaminated); the
  agentworks control
  (`2026-11-07T08-31-34--process-inbox--agentworks-deepseek-v4-1-flash--without-skill`) (dirty)
  was 0/2 clean with 3 contaminated. `03-08-51` is **not evidence**: all five
  reps aborted on the provider go-limit, so its assertions are trivially green.
  The v1 controls were 0/1 in each of
  `2026-11-06T17-08-43--process-inbox--without-skill`, `…17-25-52…` and
  `…17-34-41…`. SPEC-0050 measured both arms under the enforced boundary: the
  skill is 5/5 clean
  (`2026-11-09T12-44-11--process-inbox--agentworks-deepseek-v4-1-flash`); the
  control `2026-11-09T12-46-48--process-inbox--…--without-skill` is 0/5 clean
  (`deniedDraws=3`, `isolated=yes`), every draw red on
  `unchanged docs/inbox/2026-01-01-digest-email.md` and `nodir docs/backlog` —
  **separator** (5/5 vs 0/5). See `pipeline-bookends-matrix.md`.
- **`record-decision` #3 is a non-discriminator.** 4/5 with the skill against
  5/5 without it (`2026-11-06T16-48-00--record-decision`,
  `2026-11-06T17-20-53--record-decision--without-skill`): a bare agent performs
  the reversal as reliably as the skill. Recorded as a regression case; see
  `pipeline-bookends-matrix.md`.
- **The cross-skill routing pair was a staging defect; fixed and measured by
  SPEC-0029.** `capture-idea` #3 asserts `skill process-inbox` and
  `process-inbox` #3 asserts `skill capture-idea`; until SPEC-0029 only the skill
  under review was staged, so the target was absent without a read of the real
  install and the pair measured 0/4 and 0/5
  (`2026-11-06T16-50-30--capture-idea`, `findings=1`;
  `2026-11-06T16-55-11--process-inbox`, `findings=1`). The cases now declare the
  sibling with `stage:`; the runner stages and hashes it and records
  `stagedSkills`. Re-measured five draws each on detector v2:
  `2026-11-06T19-06-50--capture-idea` and
  `2026-11-06T19-09-27--process-inbox`, both 5/5 and both `isolated=yes`. The
  0/4 and 0/5 rows remain the pre-fix record. See
  `pipeline-bookends-matrix.md`.
- **The mutation pilot is inconclusive by design**: both controls in
  `experiments/mutation/review-code/` came back `invalid` (SPEC-0006). The
  durable artefact is the rule-coverage map, not a pass rate. Re-run against the
  revised #4 fixture (SPEC-0009), `ignore-spec-sha` is a **survivor**: the rule
  is redundant there because the prompt's `spec_sha` supplies the cue.
- **`implement-from-prompt` has no load defect left**: #1
  and #8 separate (12/12 vs 0/12 on the default model, pre-detector history —
  `warnings=12`, the rates stand); #7 is a
  non-discriminator (5/5 both arms); #2's load defect did not reproduce at
  `07f4fe6` (gate 12/12, 11/12 passed; `2026-11-06T10-38-39--implement-from-prompt`),
  so it is readable but still not a separator — its control has 0/2 clean draws
  at `2026-11-06T07-31-00--implement-from-prompt--without-skill`; #4 was fixed by
  SPEC-0016, which taught the skill to
  tell a write target from a read dependency, and re-measured at 5/5 with the
  skill against 3/5 without it — the fixture's new `package.json` lowered the
  control's bar as well, so #4 is now a regression case instead of broken; #3
  is no longer `manual` after SPEC-0022 (1/1 with skill at
  `2026-11-06T11-28-49--implement-from-prompt`, no control), so it is a
  regression case, not a separator. Since SPEC-0021 the judge reads the
  tool-call ledger: the #7 control moved from 1/5 to 5/5, while #1 with the skill
  stays 0/5 on a behavioural residual (TASK-40) and `unverifiable` still fails
  the case; both re-judged cells are `provenance: partial` because they predate
  SPEC-0020's hashes. See `implement-from-prompt-matrix.md`.
- **`review-code` #2 left the matrix**: it measured 5/5 in both arms on the
  replaced fixture (`2026-11-02T10-27-26--review-code`,
  `2026-11-02T10-31-40--review-code--without-skill`; both pre-detector,
  `warnings=5`), so it is kept as a regression case — regression, not a
  discriminator; decision recorded 2026-11-06 (TASK-34). See
  `review-code-matrix.md`.
- **`audit-code-quality` #4 does not separate reliably**: the pre-contract
  version (`2026-11-04T21-57-53--audit-code-quality--without-skill`, five
  assertions) had no `SCOPE:`, `rule`/`judgement` or `CAPTURE OPTIONS` rule to
  fail, so its pass says nothing about the contract. On the final version (eight
  assertions) the case separated once —
  `2026-11-04T21-59-17--audit-code-quality` 1/1 with the skill against
  `2026-11-04T21-59-17--audit-code-quality--without-skill` 0/1 on those three
  assertions — but one draw per arm cannot carry a discriminator claim. It stays
  a regression case — regression, not a discriminator; decision recorded
  2026-11-06 (TASK-34). Re-measure with n≥5 before promoting it.
- **Two cases are `manual`**: `bootstrap-project-harness` #8 and
  `write-implementation-prompt` #3. They run nowhere today.

## Dispositions

A case published as `regression` is kept to catch a control that misses the
spec, the contract or the gate; `removed` would mean it adds no evidence. The
rows below were decided on existing runs, not a new draw.

| case | decision | reason | run directories | date |
| --- | --- | --- | --- | --- |
| `audit-code-quality` #4 | `regression` | On the final 8-assertion case it separated once (1/1 with the skill vs 0/1 without), but one draw per arm cannot carry a discriminator claim; the earlier 5-assertion run predates the contract. | `2026-11-04T21-57-53--audit-code-quality--without-skill` (pre-contract 5-assertion version), `2026-11-04T21-59-17--audit-code-quality` and `2026-11-04T21-59-17--audit-code-quality--without-skill` (final 8-assertion pair; `warnings=1` each) | 2026-11-06 |
| `review-code` #2 | `regression` | 5/5 in both arms on the replaced fixture: the control finds the spec and cites AC-2, so a diff-reading case cannot discriminate. | `2026-11-02T10-27-26--review-code`, `2026-11-02T10-31-40--review-code--without-skill` (`warnings=5` each, pre-detector) | 2026-11-06 |
| `write-implementation-prompt` #4 | `regression` | 5/5 in both arms under v1. The v2 control is 2/2 clean passed (3 contaminated), so a bare agent mirrors the existing prompt and records `spec_sha` as often as the skill does; the case cannot separate the arms, and the control's 2/2 clean subset is not a five-draw rate. | `2026-11-06T14-04-25--write-implementation-prompt`, `2026-11-06T14-37-23--write-implementation-prompt--without-skill`, `2026-11-07T08-22-28--write-implementation-prompt--agentworks-deepseek-v4-1-flash--without-skill` (v2, `contaminated`) | 2026-11-06 |
| `record-decision` #3 | `regression` | 4/5 with the skill against 5/5 without it: the control writes ADR-0003, marks ADR-0002 superseded and updates the index as reliably as the skill. | `2026-11-06T16-48-00--record-decision`, `2026-11-06T17-20-53--record-decision--without-skill` | 2026-11-06 |

No case is removed: each fails a control that breaks the contract or ignores an
acceptance criterion, which is evidence a later wave can cite.

### Discrimination audit

Every separator claim the audit walked has a control on the same fixture and
prompt, so none is reclassified. `implement-from-prompt` #1 and #8 use the same
`repoSha 3779a20` in both arms on the default model
(`2026-11-05T12-35-30`/`12-42-05` and `12-48-46`/`12-56-03`); the with-skill
cells predate SPEC-0016, so the pairing is historical for that arm while the
control does not load the skill. Luna #1 pairs `2026-11-05T13-18-27` at `3779a20`
(pre-fix `SKILL.md`) with the `2026-11-06T07-05-38` control at `8777e0b`:
`references/evals/1/` and the case-1 assertions are unchanged, but `SKILL.md`
changed in SPEC-0016 and there is no post-fix with-skill luna #1; luna #8 pairs
`13-25-10`/`13-28-38` at `3779a20` (also pre-fix on the with-skill side).
`review-code` #1 was re-measured at `61978f1`
(`20-26-40--matrix`/`20-34-11--matrix--without-skill`) and on luna at `81cba18`
(`20-43-48`/`20-48-34`); #3 at `8b74222`
(`10-06-33--review-code`/`09-56-47--review-code--without-skill`, luna
`10-10-09`/`10-02-34`); #4 and #7 at `7a44564`
(`07-34-32`/`07-47-21`, `09-05-36`/`09-32-10`). `survey-inflight-work` #1/#2 and
`audit-code-quality` #1 share `3784ae7` (`21-49-16`/`21-45-26`,
`21-49-16`/`21-57-53`, `21-55-53`/`21-47-51`). None of the runs cited here
carries `fixtureHash`/`promptHash`, so matching is by `repoSha` plus the
identical case prompt.

Caveats: the default `implement-from-prompt` cells are pre-detector
(`warnings=12`); the luna with-skill and #8 cells and `review-code` #4/#7 are
pre-detector too (`warnings=5`; #7 `warnings=3`), with the luna #1 control the
one clean re-measure (`warnings=0`); the `review-code` #1/#3 runs are pre-detector
as well (`warnings=15` on the matrix dirs, `warnings=5` on the #3 re-measures);
and the `survey` and `audit-code-quality` #1 cells are one draw per case —
directional, not rates. A post-SPEC-0016 with-skill re-measure of
`implement-from-prompt` #1/#8 would close the skill-version gap; it is not opened
as a task here.

The `record-decision` separators are paired at `db7c49a` with matching
`fixtureHash`, `promptHash` and `detectorVersion`: #1
(`16-43-33`/`17-11-37`) and #2 (`16-45-46`/`17-28-10`). `process-inbox` #1 now
has a clean control pair from SPEC-0050 (5/5 vs 0/5) and is a separator;
`capture-idea` #1 has one under the v5 replay (5/5 vs 1/5) and is a separator;
`groom-backlog` #2 is the non-discriminator (5/5 vs 5/5), and
`record-decision` #3 is also a non-discriminator.

## How to update

```sh
# the inventory
node scripts/run-evals.mjs --root skills --list

# which cases stage a committed repo
find evals -name git.json

# which cases are manual (format lines also contain the string)
grep -rn '^[[:space:]]*- status: manual' evals/*/cases.md
```

Recount the totals, update the row you changed, and leave `none` alone unless a
run directory or a `why:` note backs the claim.
