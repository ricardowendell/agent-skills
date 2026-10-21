# agent-skills

Agent skills for a product-thinking workflow: capture an idea, turn it into a
spec, implement it from a scoped prompt, and keep the docs honest. Each skill is
plain Markdown (`SKILL.md` plus optional `references/`) with no runtime, build
step, or dependencies, so OpenCode, Claude Code, Codex, and any agent that loads
`SKILL.md` files can use them.

This README is the map. Each `SKILL.md` is the manual, and most skills read your
`AGENTS.md` before acting — that file is where the paths below are resolved.

## Quickstart

Clone and symlink the skills into your agent's skill directory:

```sh
git clone https://github.com/ricardowendell/agent-skills.git ~/src/agent-skills

# Claude Code
mkdir -p ~/.claude/skills
for s in ~/src/agent-skills/skills/*/; do
  ln -sfn "$s" ~/.claude/skills/"$(basename "$s")"
done
```

The same pattern works for `~/.codex/skills` (Codex) and
`~/.config/opencode/skills` (OpenCode). Symlinks mean `git pull` updates the
installed skills in place.

Then pick your starting point.

### New project

```sh
/bootstrap                      # docs tree, AGENTS.md, hooks, lint limits, CI
/capture "users lose drafts when the tab closes"
```

`/bootstrap` writes the docs layout, `docs/WORKFLOW.md` and the technical
harness. It is additive: it merges into existing config and reports collisions
instead of overwriting.

### Existing project

```sh
/process-inbox                  # classify what you already have
```

If `docs/` already contains material, `/bootstrap` deliberately stops and sends
you here rather than inventing product content. `/capture` is always safe to
run, because it only preserves your wording.

## Three ways to use a skill

| Mode | How | When |
| --- | --- | --- |
| **Explicit command** | `/capture "..."` — requires `commands/` installed (see [Commands](#commands)) | You want one specific stage, deterministically |
| **By name** | "use the `record-decision` skill to log this" | No install needed; works in any agent |
| **Automatic** | Ask in domain terms — "turn this into a spec" — and the agent matches a skill's description | Convenient, least deterministic |

## The loop

| # | Stage | Command | Reads | Writes | Refuses when |
| --- | --- | --- | --- | --- | --- |
| 1 | Capture | `/capture "idea"` | your words | `docs/inbox/<date>-<slug>.md` (`status: unprocessed`) | never — it only preserves |
| 2 | Process | `/process-inbox` | inbox notes | edits under `product/`, `principles/`, `experience/`, `system/`, `decisions/`, `backlog/` | a note is still exploratory, or a product-doc change lacks your confirmation |
| 3 | Groom | `/groom <backlog item>` | backlog + product docs | `docs/specs/SPEC-NNNN-<slug>.md` (`status: ready`) | intent is unclear, scope is too broad, or a gap blocks implementation |
| 4 | Prompt | `/prompt SPEC-NNNN` | the `ready` spec | `docs/prompts/SPEC-NNNN-<slug>.prompt.md` | the spec is not `ready` |
| 5 | Blind spots *(optional)* | `/blind-spots` | the prompt | the prompt, with open branches resolved | the plan still has an open branch |
| 6 | Implement | `/implement <prompt>` | prompt + spec | code, tests; spec moves `in_progress` → `implemented` | an acceptance criterion fails, or scope would change |
| 7 | Audit | `/docs-check` | all docs | findings + proposed edits | nothing — it is read-only |

Steps 2 through 6 can all be refused. That is the design: a skill that cannot
refuse is just a prompt.

A full pass, using the worked example that ships with the bootstrap template:

> `/capture "users lose drafts when the tab closes"` → `/process-inbox` files it
> under backlog → `/groom` writes `docs/specs/SPEC-0007-draft-autosave.md`
> (`status: ready`) → `/prompt SPEC-0007` writes the implementation prompt →
> `/implement` builds it, adds `tests/draft-autosave.test.ts`, and sets the spec
> `implemented` → `/docs-check` confirms nothing drifted.

## The docs layout

The pipeline writes into a fixed layout, created by `/bootstrap`:

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
If your repo already uses a different layout, the skills still work: concept
names are stable, and literal paths come from `AGENTS.md`. The `docs-check`
sensor is the exception — it expects `docs/specs/` and `docs/prompts/`, and
discovers prompts recursively, so a subfolder per prompt kind is allowed but not
required.

## Spec lifecycle

```
draft ──/groom──▶ ready ──/prompt──▶ ready ──/implement──▶ in_progress ──▶ implemented
```

- `/groom` only writes `ready` when acceptance criteria exist and nothing blocks
  implementation.
- `/prompt` refuses any other status, so a half-groomed spec cannot become code.
- `/implement` marks `in_progress` before editing and only marks `implemented`
  after walking **every** acceptance criterion, populating `tests:` on the way.
- `/docs-check` catches drift after the fact — it never edits.

## Outside the loop

| Skill | Use it when | Guardrail |
| --- | --- | --- |
| `record-decision` | A decision was made and the trade-off is worth keeping | Writes an ADR; asks instead of inventing a rationale |
| `tighten-harness` | A refactor or milestone earned a stricter gate | One ratchet per pass, config only, never loosens a gate |
| `find-blind-spots` | A plan is about to become code | Interviews you until every branch is closed |
| `audit-docs` | Periodically, or before a release | Read-only; proposes scoped edits |

`bootstrap-project-harness` is the other side stage: it runs once per project.

## Commands

`commands/` holds thin slash-command stubs that call each skill, and `agents/`
holds the read-only `spec-reviewer` subagent used by `docs-check`. Neither is
required — the skills work when called by name.

| Command | Skill |
| --- | --- |
| `/capture` | `capture-idea` |
| `/process-inbox` | `process-inbox` |
| `/groom` | `groom-backlog` |
| `/prompt` | `write-implementation-prompt` |
| `/implement` | `implement-from-prompt` |
| `/docs-check` | `audit-docs` |
| `/bootstrap` | `bootstrap-project-harness` |
| `/blind-spots` | `find-blind-spots` |
| `/record-decision` | `record-decision` |
| `/tighten-harness` | `tighten-harness` |

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

## Validate

The repo ships the same checks its CI runs:

```sh
node scripts/validate-skills.mjs --root skills
node scripts/run-evals.mjs --root skills --list
node scripts/check-sensor-parity.mjs
```

`validate-skills.mjs` checks frontmatter, the description budget, cross-tree
drift, and broken symlinks. The full eval run needs an `opencode` binary and a
model provider key, so it stays local.

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
