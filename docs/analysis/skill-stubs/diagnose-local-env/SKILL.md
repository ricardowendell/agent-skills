---
name: diagnose-local-env
description: "Diagnose local toolchain drift: shell init order, duplicated or dead PATH entries, orphan env vars from removed version managers, gh accounts and auth state, agent CLI login, and plugin versions. Reports findings with file:line and a minimal fix per finding; applies nothing without confirmation. Use when a shell or CLI misbehaves across sessions, a command-not-found appears at startup, or auth and account state look wrong."
stack-agnostic: false
---

# Diagnose Local Env

## Purpose

Explain why a shell or CLI behaves differently from what is configured, and
propose the smallest reversible fix. The output is a findings table, not a
cleanup.

## Scope

Local machine only: shell init, PATH, environment variables, version managers,
GitHub CLI accounts, agent CLI auth, plugin versions. Not project code, not CI.

## Workflow

1. Fix the observation point: OS and version, shell, `echo $SHELL`, `zsh
   --version` or equivalent, date. Record it in the report.
2. List the init files in load order and record which exist: `~/.zshenv`,
   `~/.zprofile`, `~/.zshrc`, `~/.zlogin`, plus `~/.config/zsh/*` if the
   project uses that layout. Do not read secrets; stop at variable names.
3. Check PATH: duplicates, entries that do not exist, entries that shadow a
   tool the user expects, and order-dependent managers (`nix`, `asdf`, `mise`,
   `pyenv`, `jenv`, `nvm`).
4. Check orphan variables: `JENV_*`, `PYENV_*`, `NVM_*`, `ASDF_*`, `MISE_*`,
   `*_HOME` pointing at a missing directory. A variable set by a manager that
   is no longer installed is drift.
5. Check version managers: installed binaries versus what the init files
   reference. Record the version each one resolves to in a fresh shell.
6. Check `gh`: `gh auth status`, configured accounts, active account, and
   whether a stale host or profile is referenced in config.
7. Check agent CLIs in use: login state, config path, and whether the binary on
   PATH is the one being configured. Never print a token.
8. Check plugin and CLI versions that the user depends on; flag a newer release
   only when the current one is known to be stale.
9. Produce one finding per drift. Each finding: evidence with `arquivo:linha`,
   severity, minimal fix, and whether the fix is reversible.
10. Ask before applying anything. Apply one finding at a time and re-check the
    fresh-shell result after each.

## Output

```text
ENV: <os> <version> - <shell> <version> - <date>
INIT ORDER: <file> (exists|missing) -> ...

FINDINGS
1. <finding> - <severity: high|medium|low>
   evidence: <file:line or command output>
   cause: <one sentence>
   fix: <exact command or diff>
   reversible: yes|no

CLEAN
- <check that passed>

NOT CHECKED
- <check and why it was skipped>
```

## Guardrails

- Read-only by default. Never edit a dotfile, uninstall a package, or change an
  account without showing the exact change and getting confirmation.
- Never use `sudo`, never uninstall, never delete a directory.
- Never print secrets, tokens, or full credential files. Variable names only.
- One finding per change. Do not bundle a cleanup into a diagnosis.
- A fix that requires a new install is proposed, not executed.

## Degradation and refusal

- Not macOS/Linux with a POSIX shell: report what is unsupported and stop.
- A config file is unreadable: report the path and permission, do not escalate.
- The symptom is project-specific (a test, a build, a CI job): say so and stop.
  This skill covers machine drift, not application bugs.
