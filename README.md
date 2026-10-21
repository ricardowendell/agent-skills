# agent-skills

Agent skills for a product-thinking workflow: capture ideas, turn them into
specs, implement from a scoped prompt, and keep the docs honest. Plus a
bootstrap skill that wires the technical and product harness for a new project.

Each skill is a directory with a `SKILL.md` (frontmatter + instructions) and,
where useful, `references/` with deeper material and eval fixtures. They are
plain Markdown — no runtime, no build step, no dependencies. Any agent that
loads `SKILL.md` files works: OpenCode, Claude Code, Codex, and similar.

## Skills

| Skill | What it does |
| --- | --- |
| [`bootstrap-project-harness`](skills/bootstrap-project-harness) | Sets up the technical harness (hooks, lint limits, CI) and the product-docs skeleton for TypeScript/Node (bun) or Python (uv). Detects the stack, never overwrites, reports collisions. |
| [`capture-idea`](skills/capture-idea) | Captures a rough idea as a raw inbox note, preserving the user's own wording. No classification, no rewriting. |
| [`process-inbox`](skills/process-inbox) | Turns raw inbox notes into stable product docs (vision, principles, experience, system, decisions, backlog) while keeping the raw notes. |
| [`groom-backlog`](skills/groom-backlog) | Turns a backlog item into a small, implementation-ready spec with acceptance criteria. Updates existing specs before creating new ones; does not expand scope. |
| [`write-implementation-prompt`](skills/write-implementation-prompt) | Converts a `ready` spec into a scoped implementation prompt. Refuses to run on a spec that is not ready. |
| [`implement-from-prompt`](skills/implement-from-prompt) | Implements a structured prompt and verifies the result, preserving the prompt's scope and safeguards. |
| [`find-blind-spots`](skills/find-blind-spots) | Interviews you adversarially about a plan until every branch of the decision tree is resolved. Cheapest checkpoint before implementation. |
| [`audit-docs`](skills/audit-docs) | Read-only audit of product docs: contradictions, duplicates, unclear principles, misplaced ideas, scope creep. Proposes scoped edits, never expands scope. |

## The pipeline

```
capture-idea → process-inbox → groom-backlog → write-implementation-prompt
             → [find-blind-spots] → implement-from-prompt → audit-docs
```

`bootstrap-project-harness` runs once, at the start of a project. `audit-docs`
runs periodically, or as a gate before a release.

The skills name each other rather than depending on a specific command runner,
so you can bind them to the slash commands of your agent (for example
`/capture`, `/groom`, `/prompt`, `/implement`) or call them by name.

## Install

Clone the repo and symlink the skills you want into your agent's skill
directory:

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

If you use the Skills CLI (`npx skills`), you can also install straight from
the repo:

```sh
npx skills add ricardowendell/agent-skills
```

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
mention skills that are **not** part of this repo. They are third-party
projects with their own licenses; install them from the upstream source:

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
