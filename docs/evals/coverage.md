# Eval coverage

Inventory of the cases in `evals/*/cases.md`: what exists, how it is staged, and
what has actually been measured. Counts come from
`node scripts/eval.mjs list --root skills` and from the fixture
directories; they are not estimates. Paths quoted inside a measurement note name
the layout at the time of that run; SPEC-0058 moved the corpus out of the skill.

| Skill | Cases | Trigger | Manual | Fixture | Evidence recorded |
| --- | --- | --- | --- | --- | --- |
| `audit-docs` | 4 | 2 | 0 | tree 1; tree 3 staged via `git.json`; tree 4 drift fixture | case 3: 3/3, skill loaded 3/3 (`why:`, no run dir); case 4: 3/3, defect + intentional evolution + future filtered, no writes (`2026-11-05T08-46-00--audit-docs`) |
| `bootstrap-project-harness` | 23 | 3 | 1 | trees 1, 2, 3, 5, 7, 9, 10, 11, 14, 15, 16–23; 14 and 15 via `git.json` | case 14: 12/12 re-judged (first pass 9/12 on a reply regex); case 15: 3/3 (`why:`, no run dir). Re-measured after the Oxlint rename (SPEC-0045, `agentworks/deepseek-v4-1-flash`, five draws): case 14 5/5 and case 15 1/5 (failing `unchanged justfile`) in `2026-11-08T23-32-34--bootstrap-project-harness--agentworks-deepseek-v4-1-flash` (clean, `findings=0`, `isolated=yes`). Stack review, skill arm: #16 4/4 clean (1 stalled), #17 4/4 clean (1 stalled), #18 5/5, #19 5/5, #20 0/5 on `unchanged biome.json` (the skill merged the four Biome limits), #21 5/5, #22 5/5, #23 trigger 4/4 clean + 1 contaminated (host read), all in `2026-11-08T21-52-29--bootstrap-project-harness--agentworks-deepseek-v4-1-flash` (dirty: 2 stalls + 1 host read, `isolated=no`). Control: no cell reached five clean draws; #19 reached 2 clean draws and both failed, the other cells 0 clean with 5 contaminated each, in `2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill` (dirty: 33 skill leaks + 7 host reads, `isolated=no`); the control still read the real install, so every behavioural cell was **unresolved** at that point, not a separator. **#19 is measured without another draw (SPEC-0047):** with-skill `2026-11-09T07-37-44--bootstrap-project-harness--agentworks-deepseek-v4-1-flash` is 5/5 passed and `isolated=yes`; the control `2026-11-09T10-59-41--bootstrap-project-harness--…--without-skill` replays under the current detector (v6) with `node scripts/eval.mjs inspect --leaks` to four clean draws, `deniedDraws=1`: r1 is a **store leak** (SPEC-0052), so the four other draws are the evidentiary base, with 0/4 passed (all four red on `file AGENTS.md`, `file justfile`, `filematch eslint.config.js` and `filematch justfile eslint`) — a **separator** on the rule (5/5 vs 0/4). The stored control `result.json` still records the older v3 contamination (`skillLeaks=1`, `isolated=no`) by design; the replay is the evidence, not the artefact |
| `capture-idea` | 3 | 2 | 0 | trees 1–3 | published matrix: #1 5/5 with the skill; control **unresolved** under v2 (`2026-11-07T08-27-30--capture-idea--agentworks-deepseek-v4-1-flash--without-skill`: 0/0 clean, 5 contaminated — every draw read the install under `/Users/wendell/.agents/skills` (`r1` the directory, the rest the `SKILL.md`)), after v1 clean subsets 0/2, 0/2 and 0/0 (every clean draw failed `status: unprocessed`; dirs `2026-11-06T16-40-32--capture-idea`, `…17-07-09--without-skill`, `…17-23-44…`, `…17-32-50…`, all dirty); #2 trigger 5/5; #3 routing **5/5** with `process-inbox` staged as the declared sibling in `2026-11-06T19-06-50--capture-idea` (v2, `isolated=yes`), replacing the pre-fix 0/4 clean cross-skill-staging record `2026-11-06T16-50-30--capture-idea` (findings=1); re-measured under the enforced boundary (SPEC-0050, `agentworks/deepseek-v4-1-flash`, five draws): #1 is 5/5 clean with the skill (`2026-11-09T12-39-33--capture-idea--agentworks-deepseek-v4-1-flash`, `findings=0 isolated=yes`); the control `2026-11-09T12-41-57--capture-idea--…--without-skill` is 5/5 clean and 1/5 passed under the v5 replay (SPEC-0051, `deniedDraws=2`), the other four red on `filematch docs/inbox/*.md status: unprocessed` — **separator** (5/5 vs 1/5). Its stored `result.json` still records r1 as a v4 `skillLeaks=1` on `/Users/wendell/.config/opencode/skills`; SPEC-0051 re-judged that draw as `denied` (empty listing, content from another file), so the replay is the evidence. See `pipeline-bookends-matrix.md` |
| `find-blind-spots` | 4 | 2 | 0 | tree 4 | case 4: 3/3, skill loaded 3/3 (`why:`, no run dir) |
| `groom-backlog` | 7 | 2 | 0 | trees 1, 3, 4, 5 | ablation on 4 fixture cases, 2026-11-05: both arms 4/4; index-first not promoted (tokens +65% on the adversarial case) (`09-32-51`, `09-34-43`, `09-39-15`, `09-43-45`); #2: pre-detector 3/3 with and 3/3 without at `3d38b31` (`2026-11-05T17-09-40--groom-backlog`, `2026-11-05T17-13-34--groom-backlog--without-skill`); re-run under the leak detector at `8777e0b`: with skill 3/3 clean (`2026-11-06T07-53-16--groom-backlog`), without it 0/3 with 2 contaminated — clean control 0/1 (`2026-11-06T07-47-34--groom-backlog--without-skill`), so #2 was unresolved at that point, not a regression case; re-measured under the enforced boundary (SPEC-0050, five draws): the skill arm is 5/5 clean (`2026-11-09T12-50-37--groom-backlog--agentworks-deepseek-v4-1-flash`, `findings=0 isolated=yes`) and the control `2026-11-09T12-55-35--groom-backlog--…--without-skill` is 4/5 clean under the v6 replay (`deniedDraws=2`): r2 is a **store leak** (`evals/groom-backlog/2.md`, the previous `result.json` and prior `2.r*.md` transcripts), so the four other draws are the evidentiary base (4/4 passed) — **non-discriminator** (5/5 vs 5/5). The store is corpus and the read is denied under enforcement (SPEC-0052). The control artefact still records r2 as v4 `skillLeaks=1` for `skills/groom/SKILL.md` and `hostReads=1` for `/Users/wendell/.agents/commands`; SPEC-0051 re-judged it as `denied` because the `cat` returned `No such file or directory`, not the file's content, so the replay is the evidence |
| `implement-from-prompt` | 12 | 2 | 0 | trees 1, 2, 3, 4, 7–12 | discriminating set (SPEC-0033, v2, `agentworks/deepseek-v4-1-flash`): #1 **5/5 vs 0/5** (`2026-11-07T08-57-39--implement-from-prompt--agentworks-deepseek-v4-1-flash`, `…08-59-39--without-skill`, `findings=0 isolated=yes`) and #8 **5/5 vs 0/5** (`…09-01-25…`, `…09-04-41--without-skill`, clean); see `discriminating-cases.md`. Published matrix: #1 and #8 separate 12/12 vs 0/12 on the default (`2026-11-05T12-35-30--implement-from-prompt`, `2026-11-05T12-42-05--implement-from-prompt--without-skill`, `2026-11-05T12-48-46--implement-from-prompt`, `2026-11-05T12-56-03--implement-from-prompt--without-skill`; these four predate the leak field, so `check-eval-run` reports `warnings=12` — pre-detector history, the rates stand); on `gpt-6-luna` #1 is 5/5 vs **0/5** (the old 1/5 control pass read the installed `SKILL.md`; re-measured at `2026-11-06T07-05-38--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`) and #8 is 5/5 vs 1/5 (`2026-11-05T13-18-27--implement-from-prompt--opencode-go-gpt-6-luna`, `2026-11-05T13-22-08--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`, `2026-11-05T13-25-10--implement-from-prompt--opencode-go-gpt-6-luna`, `2026-11-05T13-28-38--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`; the one #1 control pass read the real `SKILL.md`); #7 non-discriminator 5/5 both arms; #2 readable after SPEC-0019: gate 12/12 at `07f4fe6`, 11/12 passed (`2026-11-06T10-38-39--implement-from-prompt`), so the Gate A 2/5 did not reproduce (the delta includes the SPEC-0016 rule change, so the cause is not isolated); its control re-read under the detector is **0/3 draws**, 1 contaminated (`r3`) and the two clean draws failed the reply assertion (**0/2 clean**) at `2026-11-06T07-31-00--implement-from-prompt--without-skill`; the load across #1/#2/#5/#8 at n=12 was 45 of 46 clean draws loaded the skill (`2026-11-06T10-34-26`, `…10-38-39`, `…10-45-29`, `…10-53-13`); the one miss is #5 r9, which read the staged SKILL.md directly without calling the skill tool (a trigger case, so the tool call stays the routing signal — TASK-39), and #5's two exclusions are one contamination and one stall; #4 re-measured after SPEC-0016 (write target vs read dependency + fixture `package.json`): 5/5 with vs 3/5 without at `6dd38aa` (`2026-11-05T15-00-48--implement-from-prompt`, `2026-11-05T15-06-58--implement-from-prompt--without-skill`; two control reds are 600 s provider timeouts), so #4 is a non-discriminator and stays as a regression case; #1/#7/#8 kept 5/5 with skill (`2026-11-05T15-30-10--implement-from-prompt`, `2026-11-05T15-36-40--implement-from-prompt`, `2026-11-05T15-44-35--implement-from-prompt`); #3 is no longer `manual` after SPEC-0022: 1/1 with skill (`2026-11-06T11-28-49--implement-from-prompt`), no control, so it is a regression case, not a separator; trigger #5 4/5, #6 5/5 (`2026-11-05T11-52-43--implement-from-prompt`); **iterative corpus (SPEC-0034)** is below: #9 **non-discriminator** 4/5 vs 5/5, #10 **unresolved** 2/5 vs 5/5 under the SPEC-0066 replay (routing: 2 draws loaded, 2 harness-passing — every miss is (b) offered, not chosen (SPEC-0068: 8/8, 0 unlisted, 0 gate-rejected); r1 now passes `ranpass` through the fixture's `npm test` → `node --test`, r4 was already green), #11 **holdout non-discriminator** 5/5 assertions vs 5/5 (1/5 loaded), #12 **separator** 4/5 vs 0/5; runs, hashes and red assertions in [`iterative-corpus.md`](iterative-corpus.md); the `SPEC-0068` description hypothesis was tested on `#11` (SPEC-0069, three paid draws): **0/3 loaded** (`skillGate.source: null` in every draw), so it was reverted to the 0.7.0 wording and `#11` keeps its class — smoke run `2026-11-11T11-21-09--implement-from-prompt--agentworks-deepseek-v4-1-flash` (`skillHash 218f51bb…`, `isolated=yes`), no F2 drawn; the body's prompt-artifacts rule (SPEC-0070, zero draws) was checked on the loaded `#9`/`#10`/`#12` draws: 7 of 11 assistant replies mention the prompt framing, 0 stopped or redirected because of it, so `SKILL.md` stays byte-identical — the per-draw table, the decision and the reopening condition are in [`iterative-corpus.md`](iterative-corpus.md#the-prompt-artifacts-rule-spec-0070) |
| `process-inbox` | 3 | 2 | 0 | tree 1 | published matrix: #1 5/5 with the skill; control **unresolved** under v2 — default `02-51-15` is 0/2 valid clean (1 abort, 2 contaminated), and `03-08-51` is 5 provider aborts, not evidence; agentworks 0/2. v1 subsets 0/1, 0/1 and 0/1 are history. #2 trigger 4/4 clean scored draws loaded (`2026-11-06T16-55-11--process-inbox`, findings=1); #3 routing **5/5** with `capture-idea` staged as the declared sibling in `2026-11-06T19-09-27--process-inbox` (v2, `isolated=yes`), replacing the pre-fix 0/5 cross-skill-staging record; re-measured under the enforced boundary (SPEC-0050, five draws): #1 is 5/5 clean with the skill (`2026-11-09T12-44-11--process-inbox--agentworks-deepseek-v4-1-flash`, `findings=0 isolated=yes`) and the control `2026-11-09T12-46-48--process-inbox--…--without-skill` is 0/5 clean (`deniedDraws=3`, `isolated=yes`), every draw red on `unchanged docs/inbox/2026-01-01-digest-email.md` and `nodir docs/backlog` — **separator** (5/5 vs 0/5). See `pipeline-bookends-matrix.md` |
| `record-decision` | 5 | 2 | 0 | trees 1–5 | published matrix: #1 separator 4/5 vs **1/5** (`2026-11-06T16-43-33--record-decision`, `2026-11-06T17-11-37--record-decision--without-skill`); #2 separator 4/5 vs **0/5** (`2026-11-06T16-45-46--record-decision`, `2026-11-06T17-28-10--record-decision--without-skill`); #3 non-discriminator 4/5 vs 5/5 (`2026-11-06T16-48-00--record-decision`, `2026-11-06T17-20-53--record-decision--without-skill`); triggers #4/#5 5/5 in `2026-11-06T17-04-07--record-decision`; see `pipeline-bookends-matrix.md` |
| `review-code` | 10 | 2 | 0 | trees 1–7 plus `base/` and `base-red/`; 1–4 and 7–10 via `git.json` | discriminating set (SPEC-0033, v2): #7 **5/5 vs 0/5** (`2026-11-07T09-07-52--review-code--agentworks-deepseek-v4-1-flash`, `…09-11-14--without-skill`, clean; the control fails `verdict REJECT` 5/5, 3 approve and 2 miss the token), the **holdout**; see `discriminating-cases.md`. Published matrix; #4 fixture revised 2026-11-05: 5/5 with, 3/5 without (`2026-11-05T07-34-32--review-code`, `…07-47-21--review-code--without-skill`); #7 red gate: 3/3 with, 0/3 without (`…09-05-36`, `…09-32-10--without-skill`). **SPEC-0056 wave** (cases 8–10 and regressions 1, 2, 7, five draws per arm) is below. **SPEC-0078 wave** re-measured #3–#6 at `skillHash 9a28572…` on 2026-11-11 (`agentworks/deepseek-v4-1-flash`, detector `cf2e2e319d975a5b`, five draws per measured cell, 30 scored draws / 32 paid attempts (two infrastructure retries, `#5 r4` and `#6 r4`); all six runs clean and enforced — see the table below): #3 `5/5 vs 0/5` **separator** (`2026-11-11T14-32-10--review-code--agentworks-deepseek-v4-1-flash` / `2026-11-11T14-37-56--review-code--agentworks-deepseek-v4-1-flash--without-skill`), #4 `5/5 vs 2/5` **non-discriminator** on the judgement — at measurement time the control r3–r5 rejected with a negated opening the closed table could not read, red `verdict REJECT`; SPEC-0079's replay reads them and the control cell is `5/5` (`2026-11-11T14-43-55--review-code--agentworks-deepseek-v4-1-flash` / `2026-11-11T14-46-54--review-code--agentworks-deepseek-v4-1-flash--without-skill`), #5 and #6 are triggers measured with-skill only, `5/5` each (`2026-11-11T14-49-32--review-code--agentworks-deepseek-v4-1-flash`, `2026-11-11T14-54-36--review-code--agentworks-deepseek-v4-1-flash`); table below |
| `survey-inflight-work` | 5 | 3 | 0 | tree 1 via `git.json` with a local bare `origin`; tree 2 without a remote | iteration 1, 1 draw/case: with-skill 4/4 (`2026-11-04T21-49-16`); control case 1 0/1, only the `unknown` PR state separated (`…21-45-26`); control case 2 0/1, only the no-remote line separated (`…21-57-53`). Case 5 (near-miss against `report-project-status`) added 2026-11-08, not measured |
| `sync-branch` | 6 | 2 | 0 | trees 1–4 via `git.json` (shared `base/`; `mainPatch` advances the base after the branch is cut, `dirty` adds the uncommitted change); 5–6 stage no fixture | declared, not measured — six deterministic cases staged 6/6 with `--level smoke` on 2026-11-12 (`2026-11-12T21-57-40--sync-branch`, `manifest.json` `counts.staged: 6`; the manifest is the evidence, not a scored result), no paid draw. Case 1 asserts the branch name and the ahead/behind relation in the reply; there is no git-state assertion kind (adding one is frozen), so only `unchanged` is deterministic state, and branch/ahead/behind are observed through `reply`. The GATES surface is asserted through `reply` as `not run`/no tests because the fixture configures no test command. Cases 1–4 assert the protected files with `unchanged`, case 2 is the dirty-tree adversarial case and case 3 the conflict one. Two observations are gaps, not passes: the harness has no "did not run" kind, so "never force-pushes" and "no `reset --hard`" are observed only by `unchanged` plus the reply; and AC4's detached-HEAD half is not staged because the F0 ruling authorizes only `mainPatch`/`dirty` (a detached key would be a new capability), so case 4 stages the no-remote refusal (`SPEC-0039`, F3). Source: `SPEC-0039` |
| `audit-code-quality` | 9 | 2 | 0 | trees 1 and 4 via `git.json`; 5–8 via `git.json`; 9 stages tree 6 via `evals/9/git.json` | iteration 1: with-skill 4/4 (`2026-11-04T21-55-53`); control case 1 0/1, only coverage `unknown` separated (`…21-47-51`); case 4 on the final 8-assertion version 1/1 with skill (`2026-11-04T21-59-17`) against 0/1 without (`2026-11-04T21-59-17--audit-code-quality--without-skill`) on `SCOPE:`/`rule`/`CAPTURE OPTIONS` — one draw per arm, so it does not separate reliably (`…21-57-53` is the pre-contract 5-assertion version); **SPEC-0055 wave:** architecture cases 5–7 and deterministic cases 8–9, five draws per arm on `agentworks/deepseek-v4-1-flash`; skill arms 5/5, 4/5, 4/5, 3/5 and 4/5 passed against 0/5 in every control; all ten published cells are clean under the enforced boundary; see the SPEC-0055 wave below |
| `tighten-harness` | 6 | 2 | 0 | trees 1, 2, 3, 5, 6 | case 5: 3/3 passed, skill loaded 0/3 (`why:`, no run dir) |
| `write-implementation-prompt` | 6 | 2 | 1 | trees 1–4 | SPEC-0030 re-measure at `dcf5177` (`skillHash 046369c2…`, detector v2; the clean behavioural cells are `isolated=yes`, the trigger runs carry their findings): #1 5/5 clean (`2026-11-06T19-25-26--write-implementation-prompt`), control **unresolved** under v2: default 0/3 clean in two runs (`2026-11-07T01-46-26--write-implementation-prompt--without-skill`, `…02-58-14…`) and agentworks 0/2 (`08-17-29`); every clean draw failed `spec_sha:`. Four v1 attempts are history; #2 5/5 clean (`2026-11-06T19-28-47--write-implementation-prompt`), control **separator** under v2 on the default model (`2026-11-07T03-01-29--write-implementation-prompt--without-skill`: 5/5 clean, **0/5 passed**); the agentworks control (`08-20-10`) only reached 0/4 clean, a route difference. The v1 `15-30-39` 0/4 replay-clean is history; #4 5/5 clean (`2026-11-06T19-30-26--write-implementation-prompt`), control **non-discriminator** under v2: default **4/4 valid passed** (`2026-11-07T02-03-01--write-implementation-prompt--without-skill`; 1 rep aborted), agentworks 2/2 (`08-22-28`); the v1 `14-37-23` 4/4 passed is history; #3 `manual` (history `14-01-54` split 4/5; not re-run); triggers: #5 stays a **trigger case** — `loaded 5/5` in both `2026-11-06T19-32-45--write-implementation-prompt` and `2026-11-06T19-53-34--write-implementation-prompt`, **no behavioural cell** and no stall-free cell: r1 285.3 s, r4 150.9 s, r3 477.7 s and r5 268.4 s each killed by the 120 s watchdog after its last event (a `step_start` with nothing after it), retried once and the retry stalled too; best clean subsets 1/1 and 2/2, contamination 2/5 and 1/5. The store's support goes to the **runner** (SPEC-0076): `scripts/lib/evals/agent.mjs` arms the watchdog on stream bytes, and this stream is silent while a tool runs — #5 ran a host-hunt `shell` for 118.51 s with no bytes and `exit 0` (`19-53-34` r3, `state.time`), so 120 s of silence can be a live child at work, not a dead stream — while the provider stays **undecided**: no `provider.*` frame is stored in any stall (the `error` field is absent from every stalled `execution`), and the killed window cannot be separated from a live-but-quiet tool either; the two are separable by instrumentation, not by another draw. The empty #5 fixture (the draw hunts the host for `SPEC-0012`) is what makes its silent steps long, not a long prompt-file generation; #6 clean 5/5 in `2026-11-06T20-12-15--write-implementation-prompt` (`findings=0 warnings=0 isolated=yes`), 5/5 in `19-32-45`, 4/5 in `19-53-34` (r3 loaded) — improved but not deterministic; canary 12/12 `13-51-35`; `13-46-05` discarded (`r8` read `.lane/trees`); re-measured under the enforced boundary (SPEC-0050, five draws): #1 is 5/5 clean with the skill (`2026-11-09T13-07-02--write-implementation-prompt--agentworks-deepseek-v4-1-flash`, `findings=0 isolated=yes`) and the control `2026-11-09T13-11-33--write-implementation-prompt--…--without-skill` is 0/5 clean (`deniedDraws=1`, `isolated=yes`), every draw red on `filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:` — **separator** (5/5 vs 0/5). See `write-implementation-prompt-matrix.md` |
| `report-project-status` | 4 | 3 | 0 | tree 3 (`base: "."`, no remote) | case 3 measured 2026-11-13, five draws per arm, `opencode-go/deepseek-v4.1-flash`, detector `cf2e2e319d975a5b`: **separator** — with the skill 5/5 clean and 4/5 passed, control 5/5 clean and 0/5 passed; both run dirs and the red draw in the section below. Triggers #1/#2/#4 stay declared (`why:`, no run dir). The "at most three next steps" cap is human-checked, not machine-checked. Source: issue #11, `SPEC-0083` |
| **total** | **107** | **33** | **2** | | |

Not in the table and not in those totals: `TASK-58` (visual change planning,
`SPEC-0036`) and `TASK-60` (experience review, `SPEC-0038`) have no case, no
fixture and no run dir. They are accepted on **declared human review** — a person
reads the diff or the preview — and no harness separated them
([`SPEC-0077`](../specs/active/SPEC-0077-no-visual-oracle-and-the-claim-says-so.md)).
A visual oracle is a future item with its own budget, not a coverage cell.

## The status report's cell (SPEC-0083)

`report-project-status` #3 is no longer manual. The case stages
`evals/report-project-status/fixtures/3/`: a plain repo (`git.json`
`{ "base": "." }`, **no remote**) whose `AGENTS.md` names `backlog/tasks/`,
`docs/specs/active/` and the gates (`node --check src/app.js`), with one `ready`
spec, one backlog task, a two-entry `CHANGELOG.md` and `src/app.js` as the
sentinel. It asserts the report surface — the skill loads, `STATUS:` is printed,
`ISSUES … unknown` and `CI … unknown` appear, a `NEXT STEPS` block appears, no
issue number is invented (`noreply #[0-9]+`) and `src/app.js` is unchanged. The
"at most three next steps" cap stays a human `expect:`: no assertion kind counts
lines, so that half is checked by a reader, not by the harness.

Measured 2026-11-13 in the spec's worktree at `repoSha 7573ede`:
`node scripts/eval.mjs compare report-project-status 3 --repeat 5 --root skills`
(the spec's command omits `--root`; without it the CLI discovers the *installed*
skills and would measure `~/.agents`, not the checkout). Model
`opencode-go/deepseek-v4.1-flash` (config default), level `behavior`,
concurrency 4, detector `cf2e2e319d975a5b`, five scored draws per arm. Both runs
record `params.isolation.enforced: true` (seatbelt) and
`node scripts/check-eval-run.mjs` reports `findings=0 warnings=0 skillLeaks=0
hostReads=0 isolated=yes deniedDraws=0` for both. The with-skill arm records
`skillHash b16fa771…`, the checkout's filtered tree hash; the control stages no
skill, so its `skillHash` is `null` by construction.

| arm | run directory | clean | passed | draws (r1–r5) | red assertion |
| --- | --- | --- | --- | --- | --- |
| with skill | `2026-11-13T09-53-13--report-project-status` | 5/5 | 4/5 | r1 fail, r2–r5 pass | r1: `reply ISSUES[\s\S]{0,120}?unknown`, `reply CI[\s\S]{0,120}?unknown` |
| without skill | `2026-11-13T09-49-36--report-project-status--without-skill` | 5/5 | 0/5 | r1–r5 fail | all five: `skill report-project-status`, `reply STATUS:`, both `unknown` lines, `reply NEXT STEPS`; r2, r3, r5 also `noreply #[0-9]+` |

**Class: separator — 5/5 clean vs 5/5 clean, with 4/5 passing against 0/5.** The
control reached five clean draws, so the cell is not `unresolved`; the skill
carries the report contract the control does not. The case-level verdict is
`failed` in both arms because `--min-pass` defaults to 1 and the with-skill arm
lost one draw; the published numbers above are per draw, as the five-draw rule
counts them.

The red draw is named, not softened: in
`2026-11-13T09-53-13--report-project-status` r1 the skill loaded and printed
every block, but localised the degradation token — `**ISSUES** … - open:
**desconhecido**` and `**CI** … **desconhecido**` — so the literal `unknown`
never appears. The skill's own "Degradation and refusal" section requires
`ISSUES: unknown` and `CI: unknown`, so this is a miss against the contract, not
a harness artefact; the other four draws print the literal token inside an
otherwise Portuguese report (r2: `- abertas: **unknown** — gh issue list falhou`),
so the assertion is reachable and not language-hostile. The oracle was not edited
after the first draw. A follow-up decides between the two honest fixes (assert
the degradation in the reply's language, or require the literal token in the
skill) — both are outside this spec. One observation is recorded rather than
fixed: `noreply #[0-9]+` also matches "AC #1" / "AC #2" phrasing, so three of the
control's reds are that numbering, not an invented issue; the control still fails
all five on the surface, so the class is unchanged.

**The pilot, instrumented.** The passive one-week pilot starts at the 0.8.1 cut,
2026-11-13. Metric: **user turns from session start to the first action in
status sessions** (a session whose opening turn asks for project status or next
steps). Baseline: the **15 sessions / 635 turns** of the `report-project-status`
cluster in `docs/analysis/skills-from-sessions-2026-11-07.md`. Window: one week,
closing 2026-11-20. The result is appended to this note after the week as a
follow-up, not a gate; if the week is not observable (no status sessions), that
reason is recorded here and the AC is still met. Nothing in this checkout
collects it retroactively — the pilot is passive by design.

## Discriminating set (issue #5)

Three cases separate two arms at n=5 under detector v2, with both arms clean:
`implement-from-prompt` #1 (5/5 vs 0/5, `status: implemented`),
`implement-from-prompt` #8 (5/5 vs 0/5, `nofile src/format.js`) and `review-code`
#7 (5/5 vs 0/5, `verdict REJECT`). `review-code` #7 is the **holdout**, frozen
in `SPEC-0033` before the first draw; its control fails the token 5/5, but 3/5
approve and 2/5 only miss the token. One more separates on the default model:
`write-implementation-prompt` #2 (5/5 vs 0/5, `03-01-29`). The runs and hashes are
in [`discriminating-cases.md`](discriminating-cases.md).

## Iterative corpus (SPEC-0034)

Four small-change cases for `implement-from-prompt` (#9–#12), two arms, five
draws each, one model (`agentworks/deepseek-v4-1-flash`). Case #11 was frozen as
the holdout in `SPEC-0034` before the first draw; its result was read only after
the other three were classified. The full record, hashes, red assertions and the
`SPEC-0035` gap note are in [`iterative-corpus.md`](iterative-corpus.md).

| case | with skill | control | class | run directories (with / control) |
| --- | --- | --- | --- | --- |
| #9 localised change | 4/5 (4/4 loaded; r5 gate-miss) | 5/5 | non-discriminator | `2026-11-08T06-30-24--implement-from-prompt--agentworks-deepseek-v4-1-flash` / `2026-11-08T06-33-14--implement-from-prompt--agentworks-deepseek-v4-1-flash--without-skill` |
| #10 functional fix | 2/5† (2 loaded, 2 harness-passing; r1 passes `ranpass` through the fixture's `npm test` → `node --test`, r4 was already green) | 5/5 | **unresolved** (routing) | `2026-11-08T06-35-22--implement-from-prompt--agentworks-deepseek-v4-1-flash` / `2026-11-08T06-37-25--implement-from-prompt--agentworks-deepseek-v4-1-flash--without-skill` |
| #11 unsafe request (holdout) | 1/5 scored, 5/5 on assertions (1/5 loaded) | 5/5 | non-discriminator | `2026-11-11T06-41-39--implement-from-prompt--agentworks-deepseek-v4-1-flash` / `2026-11-11T06-43-38--implement-from-prompt--agentworks-deepseek-v4-1-flash--without-skill` |
| #12 ambiguous scope | 4/5 (r2 red on the literal `?` matcher) | 0/5 (all red on `unchanged **`) | **separator** | `2026-11-08T06-39-39--implement-from-prompt--agentworks-deepseek-v4-1-flash` / `2026-11-08T06-44-22--implement-from-prompt--agentworks-deepseek-v4-1-flash--without-skill` |

† See [`coverage-history.md`](coverage-history.md).

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
    history only when `node scripts/eval.mjs inspect <run-dir> --leaks` prints
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
- `status: manual` cases are counted in `Cases` and excluded from a run; their
  evidence is a **declared human review**, never a measured separation.
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

## Detector history

Current detector `cf2e2e319d975a5b`. The v2–v6 evolution, the four waves, the
earlier staleness readings, the provenance notes and the discrimination audit
are in [`coverage-history.md`](coverage-history.md).

### Archived citations

The wave tables and the discrimination audit moved to
[`coverage-history.md`](coverage-history.md); their run directories stay here so
`check-staleness` still judges the cells they publish. Each row is the pair the
archived table records for that cell.

| cell | with skill | control |
| --- | --- | --- |
| `audit-code-quality` #5 | `2026-11-10T13-28-15--audit-code-quality--agentworks-deepseek-v4-1-flash` | `2026-11-10T13-31-04--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` |
| `audit-code-quality` #6 | `2026-11-10T13-33-15--audit-code-quality--agentworks-deepseek-v4-1-flash` | `2026-11-10T13-36-02--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` |
| `audit-code-quality` #7 | `2026-11-10T13-40-49--audit-code-quality--agentworks-deepseek-v4-1-flash` | `2026-11-10T13-43-14--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` |
| `audit-code-quality` #8 | `2026-11-10T13-45-48--audit-code-quality--agentworks-deepseek-v4-1-flash` | `2026-11-10T13-49-08--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` |
| `audit-code-quality` #9 | `2026-11-10T13-59-02--audit-code-quality--agentworks-deepseek-v4-1-flash` | `2026-11-10T14-02-40--audit-code-quality--agentworks-deepseek-v4-1-flash--without-skill` |
| `review-code` #8 | `2026-11-10T15-02-35--review-code--agentworks-deepseek-v4-1-flash` | `2026-11-10T15-05-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` |
| `review-code` #9 | `2026-11-10T15-08-51--review-code--agentworks-deepseek-v4-1-flash` | `2026-11-10T15-12-14--review-code--agentworks-deepseek-v4-1-flash--without-skill` |
| `review-code` #10 | `2026-11-10T15-39-17--review-code--agentworks-deepseek-v4-1-flash` | `2026-11-10T15-54-47--review-code--agentworks-deepseek-v4-1-flash--without-skill` |
| `review-code` #1 | `2026-11-10T15-20-12--review-code--agentworks-deepseek-v4-1-flash` | `2026-11-10T15-23-10--review-code--agentworks-deepseek-v4-1-flash--without-skill` |
| `review-code` #2 | `2026-11-10T15-26-12--review-code--agentworks-deepseek-v4-1-flash` | `2026-11-10T15-28-46--review-code--agentworks-deepseek-v4-1-flash--without-skill` |
| `review-code` #7 | `2026-11-10T15-31-48--review-code--agentworks-deepseek-v4-1-flash` | `2026-11-10T15-35-51--review-code--agentworks-deepseek-v4-1-flash--without-skill` |

The discrimination audit's two ambiguous time-only tokens — `21-45-26` and
`21-57-53` — stay here for the same reason: each resolves to more than one run
directory, so `check-staleness` reports them as `uncited` exactly as it did when
the audit lived in this file.

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

Fourth run (2026-11-11, after the `SPEC-0080` description edit): **66 cited
cells, 51 stale, 3 uncited**. The pre-edit baseline in this checkout is 51, not
the third run's 55, because the `SPEC-0078` wave re-measured `review-code` #3–#6
at `9a28572…` after that reading; those four cells are fresh here and the
difference is not this spec's. The `implement-from-prompt` description moves the
tree from `9147487f…` to `52379e16…` (`SKILL.md a015c8fa…`). All twelve
`implement-from-prompt` cells cite an older tree — `#1`–`#10` at
`0389466e…`/`a58c5074…`, `#11` at the `SPEC-0069` smoke's `218f51bb…`, and `#12`
whose with-skill row cites `0389466e…` and whose control records no governed
hashes — and every one of them was **already stale** before the edit. The edit
therefore unstages no fresh cell: **zero** cells move and the count stays 51. The
`#12` routing smoke is
published in [`implement-from-prompt-matrix.md`](implement-from-prompt-matrix.md)
as routing evidence, not in this inventory as the cell, and its run directory is
deliberately not cited here: a citation would make the three-draw smoke the
newest hash-bearing run for `#12` and read as a fresh cell it did not measure.
The three uncited citations are the earlier runs' unchanged history.
The draws keep their stored verdicts; this paragraph is dated too.

A tree hash covers a skill's files and its non-empty directories: an untracked
**file** still changes it by design, which is what makes a dirty checkout visible
as staleness, while an empty, untracked **directory** does not (SPEC-0071).

## Known holes

- **The `verdict` stance vocabulary is closed (SPEC-0056), and was widened in
  SPEC-0062.** The closed table now reads `changes requested`, `needs changes`,
  `blocking`, `do not merge`/`should not merge`, `approve with nits` and the rest
  of `VERDICT_FORMS` in `scripts/lib/evals/kinds.mjs`; a negated or conditional
  form that does not open the verdict line (`cannot approve`, `the branch is not
  approved`, `non-blocking`) is still a miss. SPEC-0079 named the one shape the
  table was wrong to miss: a verdict line that **opens** with the negation of a
  stance (`not ready`, `not implemented`, `not approved`, …) is a rejection. The
  rule is a stance slot, not a phrase, so no `VERDICT_FORMS` entry was added and
  a negation in a later clause never flips an approval. The
  SPEC-0056 control arms of `review-code` #1, #8, #9 and #10 therefore replay to
  5/5, 5/5, 4/5 and 3/5 on the token (their cells: 0/5, 5/5, 4/5 and 0/5), and
  the measured column is unchanged. What the assertion still cannot read is a
  stance stated only as prose: #9's r3 and #10's r1/r4 name no listed stance, so
  the red there is the absence of the token, not a different judgement. Two latent
  residues in the reader are closed by SPEC-0073 — the stance is the last clause
  that names one (`reject the alternative; approve the change` is an approval) and
  a comma ends a clause (`AC-2 is not implemented, changes requested` is a
  rejection) — and both shapes are covered by test; neither has a store instance,
  so no stored draw moves.
- **`review-code` #3–#6 were historical at older hashes (SPEC-0056), until
  SPEC-0078 re-measured them.** The SPEC-0056 wave re-ran #1, #2 and #7 at
  `skillHash 9a28572…`; #3–#6 were not re-measured by it, so their published
  cells were not evidence of green at that hash. SPEC-0078 measured all four on
  2026-11-11 at `9a28572…` (wave below): #3 `5/5 vs 0/5` separator, #4
  `5/5 vs 2/5` non-discriminator on the judgement (replayed `5/5` under
  SPEC-0079), #5 and #6 trigger `5/5`
  each. The pre-detector cells stay in `review-code-matrix.md` as history,
  marked; they are not deleted.
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

## How to update

```sh
# the inventory
node scripts/eval.mjs list --root skills

# which cases stage a committed repo
find evals -name git.json

# which cases are manual (format lines also contain the string)
grep -rn '^[[:space:]]*- status: manual' evals/*/cases.md
```

Recount the totals, update the row you changed, and leave `none` alone unless a
run directory or a `why:` note backs the claim.
