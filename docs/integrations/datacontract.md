# Data contract skills — integration reference

The official [`datacontract/datacontract-skills`](https://github.com/datacontract/datacontract-skills)
are MIT-licensed agent skills for ODCS data contracts, built on the open-source
[Data Contract CLI](https://github.com/datacontract/datacontract-cli). This repo
does **not** ship them; this page is the pin, the install, and what the 0.9.0
A/B measured.

## Which skill answers which ask

| Ask | Skill |
| --- | --- |
| "Crie o contrato ODCS desta tabela / destes requisitos" | `create-data-contract` |
| "Esta mudança de contrato é breaking? Qual o bump?" | `breaking-change-check` |
| "Instale/configure a CLI" (chamada pelo Step 0 das outras) | `datacontract-cli` |

The upstream repo also ships `quality-rules`, `test-data-contract`,
`export-data-contract`, `contract-ci` and `datacontract-editor`. They were **not**
measured in 0.9.0; install them from upstream at your own judgement.

## Install (pinned)

Pin `dc06664` (the revision the 0.9.0 A/B measured, MIT):

```sh
# the skills (into the agent's skills directory)
git clone https://github.com/datacontract/datacontract-skills.git /tmp/dcs
git -C /tmp/dcs checkout dc0666466d2bdc0fa077b4ee08d07c43aa4db2c8
cp -R /tmp/dcs/skills/breaking-change-check /tmp/dcs/skills/create-data-contract \
      /tmp/dcs/skills/datacontract-cli ~/.config/opencode/skills/   # adapt per host

# the CLI the skills build on
uv tool install datacontract-cli
datacontract --version   # 1.2.9 was the measured version
```

Claude Code and Codex have their own plugin marketplace channels
(`claude plugin marketplace add …` / `codex plugin marketplace add …`); use those
when available instead of copying files.

The same three entries are **machine-readable** in
[`companion-skills.json`](../../companion-skills.json): id, group, `project`
scope, source, pin, path, MIT license, detection signals (`**/*.odcs.yaml`,
`contracts/`, `datacontract` in dependencies) and the `SPEC-0085` evidence.
`/bootstrap` reads that manifest, intersects the signals with what it detected,
and asks before installing; nothing is installed on its own. The manifest is a
closed list — the unmeasured skills above stay out of it.

The pin is recorded here and in the run evidence, not in
`.skill-lock.json` (that file is host state, gitignored). Re-derive with the
commands above if the lock does not know the skill.

## ODCS vs ODPS

- **ODCS** (Open Data Contract Standard) is the contract: schema, semantics,
  quality rules, servers, owners. The skills above produce and check it.
- **ODPS** (Open Data Product Standard) describes the **product** around the
  contract — personas, value, fitness. It is not a contract and is not covered by
  these skills; do not model one as the other.

## What the 0.9.0 A/B measured (stay honest)

Four cells — incompatible contract, documented drift, semantic change, ODCS
composition — compared the control (model + CLI, no skill) against these official
skills, five draws per arm (40 clean draws, `SPEC-0085`). Result:
**no behavioural separation**; the control passed every non-load assertion. The
measured conclusion is that **no local contract skill is justified** and these
skills are a **recommended process route, not a measured separator**.

Three instrument limits, declared in
[`docs/analysis/data-corpus/decision.md`](../analysis/data-corpus/decision.md)
§7: the semantic prompt handed over the direction; `datacontract` was on `PATH`
in both arms; n=5 does not exclude a small effect. A valid measurement (neutral
prompt, control without the CLI) is `TASK-116`, not this page.

## Trust

These are third-party skills that run shell commands and read data. Read the
bundled `SKILL.md` before installing; keep credentials in environment variables;
never paste secrets into chat. No upstream content is redistributed in this repo.
