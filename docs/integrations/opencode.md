# OpenCode integration

How this repo plugs into OpenCode, and which copy is authoritative.

## What the repo ships

| Path | For | Status |
| --- | --- | --- |
| `skills/` | every skill in the kit | canonical |
| `commands/` | OpenCode slash commands (`/capture`, `/prompt`, `/review-code`, …) | canonical |
| `agents/spec-reviewer.md` | read-only subagent used by `/docs-check` | canonical |
| `claude/commands/`, `claude/agents/` | Claude Code variants of the same set | mirror |

The repo is the only source. The machine holds links, never copies.

## What the machine links

| Path | Points to | Kind |
| --- | --- | --- |
| `~/.config/opencode/commands` | `commands/` | one directory symlink |
| `~/.config/opencode/agents/spec-reviewer.md` | `agents/spec-reviewer.md` | per-file symlink |

A command added or edited in `commands/` is visible to OpenCode without a copy
step. There is no second list to keep in sync; a divergence means the path is
still a real directory.

`~/.config/opencode/skills/` is **not** a mirror of `skills/`: it holds
OpenCode-only skills (upstream or installed ones). The kit's skills are read from
the canonical `~/.agents/skills` tree.

## Install

```sh
SRC=~/src/agent-skills          # the clone, or this repo
mkdir -p ~/.config/opencode/agents

ln -sfn "$SRC/commands" ~/.config/opencode/commands
ln -sfn "$SRC/agents/spec-reviewer.md" ~/.config/opencode/agents/spec-reviewer.md
```

`ln -sfn` replaces a symlink but not a non-empty directory. If commands were
copied before, check that nothing is divergent and remove the directory first:

```sh
diff -rq "$SRC/commands" ~/.config/opencode/commands   # must be empty
rm -rf ~/.config/opencode/commands
ln -sfn "$SRC/commands" ~/.config/opencode/commands
```

## Verify

```sh
readlink ~/.config/opencode/commands                    # → .../agent-skills/commands
ls ~/.config/opencode/commands/*.md | wc -l             # same count as commands/
```

If a new file in `commands/` does not appear, `readlink` will show that the path
is still a directory or a stale copy.

## Claude Code

`claude/commands/` mirrors `commands/` with Claude frontmatter: the set is the
same, minus the OpenCode-only `agent:`/`subagent:` keys. Link it the same way if
you use Claude Code:

```sh
ln -sfn "$SRC/claude/commands" ~/.claude/commands
ln -sfn "$SRC/claude/agents/spec-reviewer.md" ~/.claude/agents/spec-reviewer.md
```
