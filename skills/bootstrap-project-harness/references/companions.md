# Companion skills (opt-in)

Companions are third-party skills this catalog **measured** and pinned but does
not ship. `companion-skills.json` at the repo root is the only list: an entry
needs an evidence record, so a skill without a measurement does not enter. The
manifest structures the catalog this repo owns; it is **not** the open
template/stack selection registry excluded by issue `#9`.

A companion has a `scope`:

| Scope | Meaning | Example |
| --- | --- | --- |
| `global` | Useful in any host repo | `find-skills`, `agent-browser` |
| `project` | Only useful where the repo carries the matching signals | data contract skills in a data repo |

Nothing in this repo installs a companion on its own, vendors its files, or
ships an installer script. The agent reads the manifest, asks, and only then
runs the pinned copy.

## The step

Run this **after stack detection** and independent of the harness state. It
writes nothing unless the person accepts a suggestion.

1. **Locate the manifest.** From this skill's directory, read
   `../../companion-skills.json` — `<repo>/skills/bootstrap-project-harness/`
   resolves to `<repo>/companion-skills.json`. If the file is absent, there is
   nothing to suggest: say so and continue with the harness.
2. **Intersect the signals.** Compare each entry's `signals` with what detection
   already found:
   - `files` — glob against the repo's tracked files (`*.odcs.yaml`);
   - `directories` — the path exists (`contracts/`);
   - `dependencies` — the name is declared in `package.json`, `pyproject.toml`
     or a requirements file (`datacontract`).
   Any signal matches that entry. No entry matched: say "no companion skill
   applies here" and continue. A React app with none of these signals sees no
   data-contract suggestion.
3. **Ask first.** Show each match as `id`, `pin`, `license` and `evidence`
   (plus `sourceUrl`), and ask whether to install it. An unanswered question is
   not consent: do not install on silence, and do not infer a yes from "set up
   the harness".
4. **Install the pinned copy** only on accept. Clone the `sourceUrl`, check out
   the `pin`, and copy the entry's `path` into the agent's skills directory:

   ```sh
   TMP="$(mktemp -d)"
   git clone <sourceUrl> "$TMP"
   git -C "$TMP" checkout <pin>
   cp -R "$TMP"/<path> <agent-skills-dir>/
   ```

   The skills directory is host state, not the consumer repo: `~/.config/opencode/skills/`,
   `~/.claude/skills/`, `~/.codex/skills/` or `~/.agents/skills/`, matching the
   agent in use. Adapt the copy step per host; Claude Code and Codex may have a
   plugin marketplace channel, which is preferable when available. Remove the
   temporary clone afterwards.
5. **Record the declaration** in the consumer's `AGENTS.md` (create the section
   once, add a line per accepted companion):

   ```markdown
   ## Companion skills

   - `breaking-change-check` — `datacontract/datacontract-skills` @ `dc06664`,
     MIT, measured in 0.9.0 (`SPEC-0085`). Installed because this repo carries
     `contracts/` and `*.odcs.yaml`. Re-install steps:
     `docs/integrations/datacontract.md`.
   ```

   The section carries the id, the pin and why it was accepted. A teammate who
   clones the repo reads the declaration and materializes it on demand; the
   files themselves stay out of the consumer repo.

## Reading the manifest

```json
{
  "id": "breaking-change-check",
  "group": "datacontract",
  "scope": "project",
  "source": "datacontract/datacontract-skills",
  "sourceUrl": "https://github.com/datacontract/datacontract-skills",
  "pin": "dc0666466d2bdc0fa077b4ee08d07c43aa4db2c8",
  "path": "skills/breaking-change-check",
  "license": "MIT",
  "signals": {
    "files": ["*.odcs.yaml"],
    "directories": ["contracts/"],
    "dependencies": ["datacontract"]
  },
  "evidence": "SPEC-0085 (0.9.0)"
}
```

- `group` groups entries that were measured together; today it is `datacontract`.
- `pin` is a commit, never a branch: the measured revision, not "whatever is
  latest".
- `evidence` names the spec and release that measured it. The 0.9.0 result was
  **no behavioural separation** against the control, so these companions are a
  recommended process route, not a measured separator.

## What not to do

- Do not install without a recorded yes; silence is not consent.
- Do not copy upstream files into the consumer repo or this one.
- Do not add an entry to the manifest for an unmeasured skill; list it as
  available-but-unmeasured in `docs/integrations/datacontract.md` instead.
- Do not install a companion the repo has no signal for, even if the person asks
  for "all of them" — report why it does not apply and let them override
  explicitly.
- Do not treat a companion install as a harness requirement: it is never part of
  the audit checklist.
