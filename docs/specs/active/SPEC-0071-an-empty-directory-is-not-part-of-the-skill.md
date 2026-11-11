---
id: SPEC-0071
title: An empty directory is not part of the skill
status: implemented
priority: P2
task: TASK-107
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-107 - evals-um-diretorio-vazio-nao-rastreado-muda-o-tree-hash-da-skill.md
  - docs/specs/SPEC-0069-does-the-description-actually-route.md
  - docs/evals/coverage.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/fixture.mjs
  - scripts/lib/evals/fixture.test.mjs
  - scripts/check-staleness.mjs
  - scripts/check-staleness.test.mjs
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0071-an-empty-directory-is-not-part-of-the-skill.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0071-an-empty-directory-is-not-part-of-the-skill.md --base main
---

## Purpose

`stagedTreeHash` (`scripts/lib/evals/fixture.mjs:212-227`) hashes each entry of a
skill tree, including directories:

```js
for (const { rel, isDir } of expand(root, "**")) {
  h.update(`${rel}\u0000${isDir ? "d" : "f"}\u0000`)
```

An **empty, untracked** directory therefore changes a skill's published tree
hash. During `SPEC-0069` this made the same checkout answer `54 stale` and `55
stale` depending on where it ran: `skills/groom-backlog/references/` — empty, no
tracked file, created on 2026-11-10 — made `groom-backlog#2` read *fresh* in the
primary checkout (`e2a3b99f…`) and *stale* in a clean worktree (`724bb8ad…`). A
published number became a function of the working directory, and a reading had to
be corrected after the fact.

An empty directory carries no content. It should not be part of a skill's
identity.

## User Outcome

- The tree hash of a skill is the same in every checkout that contains the same
  files, whatever empty directories happen to exist.
- No published hash changes: the fix removes a source of drift, it does not
  renumber history.
- `check-staleness` cannot flip a cell because someone left an empty directory
  behind.

## Scope

### F1 — skip physically empty directories

In `stagedTreeHash`, an entry whose `isDir` is true is hashed **only if the
directory has at least one entry of its own** on disk. A directory with content
is still hashed exactly as today, so every hash computed over a tree that has no
empty directory stays byte-identical.

Empty is a filesystem fact (`readdirSync(path).length === 0`), not a derived
count over the filtered list. A directory whose children are all excluded by
`inCorpus` (for example a `references/` holding only `evals.md`) keeps its entry,
because choosing otherwise would renumber trees that exist today.

### F2 — prove no hash moved

Compute each skill's tree hash before and after the change on the same checkout
and publish the comparison: **zero** differences expected. If any skill's hash
moves, stop: that means the rule is broader than intended, and the spec is wrong,
not the tree.

### F3 — a regression test

`fixture.test.mjs` gains a test that builds a skill tree in a temp directory:
hash it, `mkdir` an empty subdirectory, hash again — **identical**; then add a
file to that directory and hash again — **different**. Plus a test that a
directory containing a file participates (the existing behaviour, kept).

### F4 — say what the hash covers

One line next to `stagedTreeHash`, and one in `docs/evals/coverage.md` where the
published hashes live: the hash covers the files and the non-empty directories of
the skill tree, and an untracked **file** still changes it by design — that is
what makes a dirty checkout visible as staleness.

## Non-Goals

- **No switch to `git ls-files`.** The hash is taken from the working tree because
  a draw stages the working tree. Hashing only tracked files would hide an
  untracked file that the draw actually read.
- **No re-hashing of history.** No stored `skillHash` is rewritten; the point is
  that they stay valid.
- **No change to `governedFiles` or `skillFileHashes`** — a per-file record is
  already immune to this.
- **No paid draw.** The proof is arithmetic over the current checkout.
- **No cleanup of the empty directory.** It was removed during `SPEC-0069`;
  this spec fixes the reader, not the checkout.

## Flow

1. **F1** — add the emptiness check.
2. **F2** — snapshot every `skills/*` hash before and after; publish the table
   (expected all `same`).
3. **F3** — the three tests.
4. **F4** — the two sentences.

## Data

- `scripts/lib/evals/fixture.mjs:212-227` — `stagedTreeHash`.
- `scripts/check-staleness.mjs:242` — its only production caller.
- `skills/*` — 14 skills; the before/after snapshot.
- `docs/evals/coverage.md:568-587` — the dated readings that exposed the defect.

## Acceptance Criteria

1. An empty directory added to or removed from a skill tree does not change
   `stagedTreeHash`; a directory with a file does.
2. Every skill's hash is identical before and after the change on the same
   checkout (table published, 14 rows).
3. `check-staleness` reports the same counts in the primary checkout and in a
   clean worktree of the same commit.
4. The tests in F3 exist and pass, including the "directory with content still
   participates" case.
5. The hash's coverage is stated in code and in one document, including the
   untracked-file caveat.
6. No stored `skillHash` is rewritten and no cell's staleness changes because of
   this fix.
7. Zero paid draws; every command in `tests:` exits 0.

## Decisions

- **Empty is physical emptiness, not a filtered count.** The narrower rule keeps
  every existing hash valid; the broader one would renumber trees that exist
  today and turn a fix into a corpus rewrite.
- **Keep hashing non-empty directories.** They are redundant with their files,
  but removing them would renumber every skill. A redundant line is cheaper than
  a corpus-wide hash change.
- **A dirty checkout stays visible.** The defect is that an *empty* directory —
  which a draw cannot read — changed the identity. An untracked file can be read,
  so it must keep changing the hash.

## Open Questions

None.

## Prompt Notes

- Snapshot the "before" hashes **before** editing `fixture.mjs`; run the snapshot
  with the current code in a separate process, or copy the function, so the
  comparison is real and not recomputed by the new code.
- `expand(root, "**")` returns `{ rel, isDir }`; `readdirSync` on the absolute
  path is the emptiness test. Guard a directory that disappears between the walk
  and the `readdir` — treat that as empty rather than throwing.
- The tests go in `fixture.test.mjs` with its existing temp-directory helper; do
  not add a new fixture mechanism.

## Results

### F1 — the rule

`stagedTreeHash` skips a directory entry whose absolute path is physically empty
(`readdirSync(abs).length === 0`); a directory that disappears between the walk
and the read counts as empty (`isEmptyDir` in `scripts/lib/evals/fixture.mjs`).
Non-empty directories are hashed exactly as before, `inCorpus` is untouched, and
an untracked **file** still moves the hash by design.

### F2 — no hash moved (same checkout, before → after)

Snapshot taken with the pre-edit code in a separate process, then re-taken after
the edit (`spec-0071-snapshot.mjs`, both runs on this worktree).

| skill | before | after | |
| --- | --- | --- | --- |
| audit-code-quality | `ff5a30be` | `ff5a30be` | same |
| audit-docs | `1effd16c` | `1effd16c` | same |
| bootstrap-project-harness | `fee0292c` | `fee0292c` | same |
| capture-idea | `db95ba12` | `db95ba12` | same |
| find-blind-spots | `1eb315ae` | `1eb315ae` | same |
| groom-backlog | `724bb8ad` | `724bb8ad` | same |
| implement-from-prompt | `9147487f` | `9147487f` | same |
| process-inbox | `421c113b` | `421c113b` | same |
| record-decision | `d7343909` | `d7343909` | same |
| report-project-status | `b16fa771` | `b16fa771` | same |
| review-code | `9a285721` | `9a285721` | same |
| survey-inflight-work | `05215a34` | `05215a34` | same |
| tighten-harness | `fd042dd3` | `fd042dd3` | same |
| write-implementation-prompt | `aa5167a3` | `aa5167a3` | same |

14 rows, 0 moved. `groom-backlog` reads `724bb8ad…`, the clean-worktree hash
from SPEC-0069 — the hash the defect used to break.

### F3 — tests

`scripts/lib/evals/fixture.test.mjs` (temp-dir helper `repo`/`files`):

- `an empty directory does not change the staged tree hash` — hash, `mkdir`,
  hash again: identical.
- `a file added to that directory changes the staged tree hash` — a readable
  file still moves it.
- `a directory with a file still participates in the staged tree hash` — one
  directory and one file, digest computed by hand, so the non-empty directory
  entry is proven present.

### F4 — coverage stated

One comment line beside `stagedTreeHash` and one sentence in
`docs/evals/coverage.md` after the dated readings: files and non-empty
directories are hashed; an untracked file still changes the hash by design.

### check-staleness, both checkouts

- worktree: `66 cited cell(s), 55 stale, 3 uncited citation(s); coverage …/SPEC-0071-an-empty-directory-is-not-part-of-the-skill/docs/evals/coverage.md`
- primary `/Users/wendell/.agents` (read-only): `66 cited cell(s), 55 stale, 3 uncited citation(s); coverage /Users/wendell/.agents/docs/evals/coverage.md`

Same counts in both; no stored `skillHash` was rewritten and no cell moved.

### Gates

All commands in `tests:` exit 0 (details in the worker report). Zero paid draws.
