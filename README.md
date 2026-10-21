# agent-skills

[![skills](https://github.com/ricardowendell/agent-skills/actions/workflows/skills.yml/badge.svg)](https://github.com/ricardowendell/agent-skills/actions/workflows/skills.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Agent skills for a product-thinking workflow: capture an idea, turn it into a
spec, implement it from a scoped prompt, and keep the docs honest.

They are plain Markdown — `SKILL.md`, optional `references/`, no runtime or
dependencies — so OpenCode, Claude Code, Codex, or any agent that loads
`SKILL.md` files can use them. This README is the map; each `SKILL.md` is the
manual, and most skills read your `AGENTS.md` before acting.

## What a session looks like

> `/capture "users lose drafts when the tab closes"` → `/process-inbox` files it
> under backlog → `/groom` writes `docs/specs/SPEC-0007-draft-autosave.md`
> (`status: ready`) → `/prompt SPEC-0007` writes the implementation prompt →
> `/implement` builds it, adds `tests/draft-autosave.test.ts`, and sets the spec
> `implemented` → `/docs-check` confirms nothing drifted.

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
| 7 | Audit | all docs | findings + proposed edits | nothing — it is read-only |

The spec status is the contract between stages:

- `/groom` only writes `ready` when acceptance criteria exist and nothing blocks
  implementation.
- `/prompt` refuses any other status, so a half-groomed spec cannot become code.
- `/implement` marks `in_progress` before editing, and `implemented` only after
  walking **every** acceptance criterion and populating `tests:`.
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
node scripts/run-evals.mjs --root skills --list
node scripts/check-sensor-parity.mjs
```

`validate-skills.mjs` checks frontmatter, the description budget, cross-tree
drift, and broken symlinks. The full eval run stays local, since it needs a model
provider.

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
