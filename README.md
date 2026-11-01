# agent-skills

[![skills](https://github.com/ricardowendell/agent-skills/actions/workflows/skills.yml/badge.svg)](https://github.com/ricardowendell/agent-skills/actions/workflows/skills.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Agent skills for a product-thinking workflow: capture an idea, turn it into a
spec, implement it from a scoped prompt, and keep the docs honest.

They are plain Markdown — `SKILL.md`, optional `references/`, no runtime or
dependencies — so OpenCode, Claude Code, Codex, GitHub Copilot CLI, or any agent
that loads `SKILL.md` files can use them. This README is the map; each `SKILL.md`
is the manual, and most skills read your `AGENTS.md` before acting.

## What a session looks like

> `/capture "users lose drafts when the tab closes"` → `/process-inbox` files it
> under backlog → `/groom` writes `docs/specs/SPEC-0007-draft-autosave.md`
> (`status: ready`) → `/prompt SPEC-0007` writes the implementation prompt →
> `/implement` builds it, adds `tests/draft-autosave.test.ts`, and sets the spec
> `implemented` → `/review-code` walks the acceptance criteria and approves the
> diff → `/docs-check` confirms nothing drifted.

Every stage between capture and audit can refuse. That is the design: a skill
that cannot refuse is just a prompt.

## Quickstart

Install with symlinks, so `git pull` updates the skills in place:

```sh
git clone https://github.com/ricardowendell/agent-skills.git ~/src/agent-skills

mkdir -p ~/.claude/skills
for s in ~/src/agent-skills/skills/*/; do
  ln -sfn "$s" ~/.claude/skills/"$(basename "$s")"
done
```

Other agents use the same pattern with a different directory — see
[Compatibility](#compatibility).

**New project**

```sh
/bootstrap                      # docs tree, AGENTS.md, hooks, lint limits, CI
/capture "users lose drafts when the tab closes"
```

`/bootstrap` merges into existing config and reports collisions instead of
overwriting.

**Existing project**

```sh
/process-inbox                  # classify what you already have
```

If `docs/` already has material, `/bootstrap` stops and sends you here instead of
inventing product content. `/capture` is always safe — it only preserves your
wording.

## Skills

| Skill | What it does | Call it with |
| --- | --- | --- |
| `bootstrap-project-harness` | Docs tree, `AGENTS.md`, hooks, lint limits and CI, for a new or existing repo | `/bootstrap` |
| `capture-idea` | Saves a raw idea in `docs/inbox`, with your wording preserved | `/capture` |
| `process-inbox` | Classifies raw notes into vision, principles, experience, system, decisions, backlog | `/process-inbox` |
| `groom-backlog` | Turns a backlog item into a small spec with acceptance criteria | `/groom` |
| `write-implementation-prompt` | Turns a `ready` spec into a scoped implementation prompt | `/prompt` |
| `implement-from-prompt` | Builds it, tests it, and flips the spec to `implemented` | `/implement` |
| `review-code` | Reviews a diff or PR against its spec; returns APPROVE or REJECT with evidence | `/review-code` |
| `find-blind-spots` | Interviews you until every branch of a plan is closed | `/blind-spots` |
| `audit-docs` | Read-only drift and contradiction audit of the product docs | `/docs-check` |
| `record-decision` | Records a decision as an ADR, including what was traded away | `/record-decision` |
| `tighten-harness` | Tightens one gate, with evidence and no source changes | `/tighten-harness` |

## The loop

| # | Stage | Reads | Writes | Refuses when |
| --- | --- | --- | --- | --- |
| 1 | Capture | your words | `docs/inbox/<date>-<slug>.md`, `status: unprocessed` | never — it only preserves |
| 2 | Process | inbox notes | edits under `product/`, `principles/`, `experience/`, `system/`, `decisions/`, `backlog/` | a note is still exploratory, or a product-doc change lacks your confirmation |
| 3 | Groom | backlog + product docs | `docs/specs/SPEC-NNNN-<slug>.md`, `status: ready` | intent is unclear, scope is too broad, or a gap blocks implementation |
| 4 | Prompt | the `ready` spec | `docs/prompts/SPEC-NNNN-<slug>.prompt.md` | the spec is not `ready` |
| 5 | Blind spots *(optional)* | the prompt | the prompt, with open branches resolved | the plan still has an open branch |
| 6 | Implement | prompt + spec | code, tests; spec moves `in_progress` → `implemented` | an acceptance criterion fails, or scope would change |
| 7 | Review | diff + spec | no files — a verdict with evidence | an AC lacks evidence, a gate fails, or the change cannot be isolated |
| 8 | Audit | all docs | findings + proposed edits | nothing — it is read-only |

The spec status is the contract between stages:

- `/groom` only writes `ready` when acceptance criteria exist and nothing blocks
  implementation.
- `/prompt` refuses any other status, so a half-groomed spec cannot become code.
- `/implement` marks `in_progress` before editing, and `implemented` only after
  walking **every** acceptance criterion and populating `tests:`.
- `/review-code` never approves with a failing or unrun gate; it produces the
  evidence, and the project's gate records the transition.
- `/docs-check` catches drift after the fact — it never edits.

## Where files go

<details>
<summary>The docs tree created by <code>/bootstrap</code></summary>

```
docs/
  inbox/                    # raw captures (capture-idea)
  backlog/                  # now-next-later.md, release-plan.md
  product/                  # vision.md, scope.md, language.md
  principles/               # design.md, visual-design.md, voice.md, product-principles.md
  experience/               # user journeys
  system/                   # descriptions; links to architecture.md
  decisions/                # ADR-NNNN-*.md
  specs/                    # SPEC-NNNN-*.md
  prompts/                  # SPEC-NNNN-*.prompt.md
  architecture.md           # the normative architecture rules
  WORKFLOW.md               # one-page index of this loop, for the repo
```

`architecture.md` holds the rules; `system/` only describes and links to them.
Skills resolve literal paths from `AGENTS.md`, so a different layout still works
for them. The `docs-check` sensor is the exception: it expects `docs/specs/` and
`docs/prompts/`, and discovers prompts recursively, so a subfolder per prompt
kind is allowed but not required.

</details>

## Compatibility

| Agent | Skills | Commands | Subagent |
| --- | --- | --- | --- |
| OpenCode | `~/.config/opencode/skills/` | `~/.config/opencode/commands/` | `~/.config/opencode/agents/` |
| Claude Code | `~/.claude/skills/` | `~/.claude/commands/` | `~/.claude/agents/` |
| Codex | `~/.codex/skills/` | call by name | — |
| GitHub Copilot CLI | `~/.agents/skills/` (native, no install) | call by name | custom agents, selected manually |

Copilot CLI discovers `~/.agents/skills` on its own — verified with
`copilot skill list`. Prompt files (`.github/prompts/`) and custom agents are
IDE-facing and not shipped here, and a skill cannot delegate to them; the skills
need no adapter.

Commands are optional: the skills work when named in a request. To install the
stubs and the read-only `spec-reviewer` subagent:

```sh
# OpenCode
cp ~/src/agent-skills/commands/*.md ~/.config/opencode/commands/
cp ~/src/agent-skills/agents/*.md   ~/.config/opencode/agents/

# Claude Code
cp ~/src/agent-skills/claude/commands/*.md ~/.claude/commands/
cp ~/src/agent-skills/claude/agents/*.md   ~/.claude/agents/
```

`claude/commands/` is the same set without the OpenCode-only frontmatter
(`agent:`, `subagent:`), and `claude/agents/spec-reviewer.md` uses Claude Code's
`tools:` field instead.

You can also ask in domain terms — "turn this into a spec" — and let the agent
match a skill's description. That works, but it is the least deterministic way
to invoke one.

## Troubleshooting

- **The agent ignores a skill.** It matches on `description`, which is loaded on
  every step — keep it under 500 characters and trigger-shaped. Check with
  `node scripts/validate-skills.mjs --root skills`.
- **`docs-check` cannot see my prompts.** The sensor expects `docs/specs/` and
  `docs/prompts/` (recursive). Skills are flexible about layout; the sensor is
  not.
- **Evals will not run.** They need the `opencode` binary and a model provider
  key. `run-evals.mjs --list` works without either.
- **I edited a skill and nothing changed.** A symlinked install only needs
  `git pull`; a copied install has to be re-copied.

## Validate

The repo ships the same checks its CI runs:

```sh
node scripts/validate-skills.mjs --root skills
node scripts/run-evals.mjs --root skills --list --check
node --test scripts/lib/evals/*.test.mjs
node scripts/check-sensor-parity.mjs
```

`validate-skills.mjs` checks frontmatter, the description budget, cross-tree
drift, and broken symlinks. `--check` rejects a case with no prompt, an unknown
assertion kind, or a duplicate number. The unit tests cover the runner itself —
parser, globs, assertions, staging — and need neither `opencode` nor a provider.
The behavioural run stays local, since it needs both.

### Case format

```md
1. **Review against SPEC-0007.**
   - prompt: Review this branch against SPEC-0007.
   - why: the diff satisfies every AC
   - expect: Runs the documented gate and reports the command and result.
   - assert: verdict APPROVE
   - gate: off
   - needs: gates
```

`prompt` is the only text sent to the agent. `why` records the scenario for a
reader and is never sent — before this split, the parenthetical note was appended
to the prompt, which told the agent the answer. `expect` lines stay
human-checked. `status: manual` keeps a case in the file (as design intent) while
excluding it from a run. `needs: gates` lets `--level behavior` skip an expensive
case; nothing is tagged today, so behaviour equals full until a case earns the
tag. `gate: off` releases a case from the provenance gate — required by trigger
cases, which ask whether a skill was chosen at all.

A case normally ships a fixture tree under `references/evals/<n>/`. When the
skill needs history (a diff to review, a branch to compare), the case ships a
`git.json` manifest instead: the tree is committed as `main`, `change.patch` is
applied on a branch, and that branch is left checked out.

### Assertions

Every filesystem kind takes a glob (`*` inside a segment, `**` across them), and
a pattern that matches nothing fails — a wildcard with no effect must not read as
a pass.

| kind | passes when |
| --- | --- |
| `file` / `dir` | at least one file / directory matches |
| `nofile` / `nodir` | nothing matches |
| `filematch` | a matching file's content matches the regex |
| `unchanged` / `changed` | every match is identical / different from staging |
| `reply` / `noreply` | the assistant's own text matches / does not match |
| `verdict` | the reply's `VERDICT:` line names the expected token |
| `ran` / `ranpass` | a shell command matching the regex executed / exited 0 |
| `tool` / `notool` | the named tool was used / was not |
| `skill` / `notskill` | the id was loaded / was not (other skills may load) |
| `noskill` | no skill was loaded at all |

Pick the kind that matches what the skill may do. `unchanged` is for a file the
skill must never touch — code under review, prose being audited. For a file it
may annotate (a backlog item, an index row), assert that the original text
survives; byte-identity fails the first time the skill adds a useful pointer.

### What a run proves

Each case stages its fixture and a copy of the skill under review in a scratch
dir. The copy lands in `<scratch>/.opencode/skills/<id>/`, which shadows a global
install of the same id, and the transcript records its hash — otherwise a local
run could quietly test the installed skill and a CI run could test none. A case
counts as `passed` only when the process exits 0, at least one assertion ran,
every assertion passed, and that copy was the skill that loaded; a case with no
assertions is `unscored` and fails the run. Nothing is appended to the prompt to
make a run cheaper: a cheaper run is a different test.

The scratch dir is not an OS sandbox — the agent can still write outside it. The
protection is `unchanged` plus the fixture's own `git status`.

The eval corpus is never staged. `references/evals.md` holds every case's prompt,
expectations and assertions, and `references/evals/<n>/` the fixtures of the
other cases; an agent that reads either can satisfy a case without exercising the
skill. Forty of the first 194 transcripts did exactly that, and closing the leak
moved one trigger near-miss from 3/3 to 0/3 — rerun anything measured before.

### Does the skill add value?

Two opt-in modes answer that without leaving the runner:

```sh
# with the skill pinned in the scratch dir (default)
node scripts/run-evals.mjs --skill review-code --run
# control arm: nothing staged, the skill tool denied
node scripts/run-evals.mjs --skill review-code --run --no-skill
# plus a second opinion over the expect: lines
node scripts/run-evals.mjs --skill review-code --run --judge
# every trigger case, three times each
node scripts/run-evals.mjs --tag trigger --repeat 3 --run
```

`--judge` records whether it graded its own homework: a judge that is also the
model under test is reported as `selfJudged`, and it may only cite text the run
actually produced — a quote it cannot find counts as `unverifiable`, never as
`met`.

`--no-skill` stages the same fixture with the skill tool denied and no copy in
`.opencode/skills/`, and records `arm: without-skill`; the gate then requires
that no skill loaded. It measures whether the skill is *used and needed*, not
whether its text is unreachable — an agent can still read an installed copy from
disk, so treat a strong control-arm result as "this task may not need a skill",
not as proof that it ignored one.

`--judge [model]` scores every `expect:` line against the agent's reply and its
command log, with the system prompt in `scripts/lib/evals/judge.mjs`. It is
opt-in because it costs a model call per case, it never sees the `why:` line,
and its verdict can fail a case that passed deterministically but never rescue
one that failed. The threshold is `--judge-threshold` (default 0.8); an
expectation the judge cannot decide is `unverifiable` and does not dilute the
score. Treat the first runs as calibration: a case where both arms fail the same
expectation is usually a badly written expectation, not a regression. The first
review-code run did exactly that — both arms omitted the case's `Not verified`
line, which the deterministic assertions could not see.

 
### Selecting cases

`--tag <a,b>` keeps the cases carrying every listed tag; `--tag trigger` is the
routing set, and a filtered run is never compared against the implicit baseline
(a subset would report every unselected case as missing).

### Repetitions

One verdict from a non-deterministic agent is one draw. `--repeat <n>` runs each
selected case n times and writes `.r1.md`, `.r2.md`, … plus one JSON with the
full repetition list; the case passes only when every repetition does. Flakes are
therefore visible as a pass rate (`[4/5]` in the console, `passRate` and
`repetitions` in the artifact) instead of being averaged into a green run.
`--min-pass <ratio>` lowers that bar in writing when a known-flaky case needs to
land; it is never the default. Staging is deterministic, so `--level smoke`
ignores `--repeat`.

### Triggers

A trigger case pairs a prompt that should reach a skill with a near-miss that
should not, and asserts routing instead of artefacts:

```md
6. **Near-miss: a failure being debugged, not a change being reviewed.**
   - prompt: Why did my build fail on Node 20?
   - gate: off
   - assert: notskill review-code
```

`skill <id>` is routing evidence only; provenance (is it the checkout's copy?)
stays in the case gate, so a trigger case can assert that a *different* skill
was chosen. Near-misses assert the outcome, not the tool call, whenever
consulting a skill is the correct guardrail: `record-decision` answering
"Postgres or SQLite?" may load the skill to find its own rule, and the case
fails only if it files an ADR nobody decided.

Where no other skill owns the prompt, even that is not stable: `find-blind-spots`
#4 and `tighten-harness` #5 load the skill in one or two of three runs and then
name the request as someone else's job. Both are `status: manual` with the
measured load rate recorded, because the assertion would track the model's
curiosity rather than its routing.

### Replay

```sh
node scripts/replay-evals.mjs --quiet
```

Re-judges recorded transcripts without calling a model. `reply`, `noreply`,
`verdict`, `tool`, `ran`, `ranpass`, `skill` and `notskill` replay exactly;
`file`/`unchanged` need the scratch tree and are skipped. Use it to see what an
assertion change would do to the runs you already have, before paying for new
ones. A verdict that came from `--judge`, or a case whose assertions changed
after the run, will read as a difference — look, don't assume.

### Matrix runs with Promptfoo

Repetition, a model × arm matrix and cost reporting are commodity work, so they
can be delegated — without moving the verdict out of this repo:

```sh
node scripts/emit-promptfoo.mjs --tag matrix --models default,opencode-go/gpt-6-luna
npx promptfoo eval -c scripts/promptfoo/promptfoo.yaml --repeat 3
```

`scripts/promptfoo/provider.mjs` imports the same library, stages the same
fixture, pins the same skill and classifies with the same rules; the only
assertion on the Promptfoo side reads `metadata.status`, so the two front ends
cannot disagree about what passed. The generated YAML is a build artifact and is
not committed; `evals.md` remains the source. Enable the judge there with
`judge: { model: default, threshold: 0.8 }` in a provider's config — one judge
per execution, same rule as the CLI.

### Artifacts and regressions

Every case writes `<skill>/<n>.md` (transcript) and `<skill>/<n>.json` (status,
per-assertion results, loaded skill, token and cost totals, duration, tool-call
count, repo sha and model) under `~/.local/share/opencode/evals/`. The run writes
`last-run.json`; `--save-baseline` keeps the current run as `baseline.json`, and
the next full run compares against it automatically. A case that moves from
`passed` to `failed` (or to `unscored`) is a regression and fails the run; a case
that disappears from an explicit `--baseline` comparison is reported as missing
rather than assumed fine.

## Optional companion skills

Some instructions (notably the `bootstrap-project-harness` workflow template)
mention skills that are **not** part of this repo. They are third-party projects
with their own licenses; install them from the upstream source:

| Skill | Upstream |
| --- | --- |
| `graphify` | <https://github.com/Graphify-Labs/graphify> |
| `impeccable` | <https://github.com/pbakaus/impeccable> |
| `agent-browser` | <https://github.com/vercel-labs/agent-browser> |
| `orchestration` | <https://github.com/stablyai/orca> |
| `find-skills` | <https://github.com/vercel-labs/skills> |

No third-party skill content is redistributed here.

## License

MIT — see [LICENSE](LICENSE).
