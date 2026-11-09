---
id: TASK-70
title: 'evals: medir e publicar a cobertura da report-project-status (issue #11)'
status: To Do
assignee: []
created_date: '2026-11-09T00:46:00Z'
labels: []
dependencies: []
references:
  - https://github.com/ricardowendell/agent-skills/issues/11
priority: medium
type: task
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: issue #11. A skill foi mergeada em 2026-11-08 (fca9c78): frontmatter, gh issues, delegacao ao survey, <=3 acoes e guardrails read-only estao cumpridos (5/8 ACs). Faltam: (1) o caso comportamental com fixture (hoje o #3 e manual); (2) a linha de coverage e um run medido com/sem skill; (3) o piloto de 1 semana medindo turnos ate a primeira acao (condicional). O recap (TASK-63) e outro incremento e nao cobre estes ACs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Caso comportamental com fixture roda e o #3 deixa de ser manual
- [ ] #2 Coverage row atualizada e um run medido com/sem skill, com a regra de cinco draws
- [ ] #3 Piloto de 1 semana medindo turnos ate a primeira acao, ou a razao registrada para nao faze-lo
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-09T16:18:14.371Z

---

Registro da SPEC-0050 (onda das quatro células restantes), sem alterar status nem ACs desta task.

Cinco draws por arm, `agentworks/deepseek-v4-1-flash`, detector v4 `d3e95ef948f983b7`; todas as runs com `params.isolation.enforced=true` (seatbelt) e `isolated=yes`.

Separators novos: `process-inbox` #1 (5/5 vs 0/5; controle vermelho em `unchanged docs/inbox/2026-01-01-digest-email.md` e `nodir docs/backlog`; `2026-11-09T12-44-11` vs `2026-11-09T12-46-48--without-skill`, `deniedDraws=3`) e `write-implementation-prompt` #1 (5/5 vs 0/5; controle vermelho em `filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:`; `2026-11-09T13-07-02` vs `2026-11-09T13-11-33--without-skill`, `deniedDraws=1`).

Unresolved por contaminação do controle (um draw em cada): `capture-idea` #1 (controle 4/5 limpo, r1 `skillLeaks=1`, 1/4 limpos passaram em `filematch docs/inbox/*.md status: unprocessed`; `2026-11-09T12-39-33` vs `2026-11-09T12-41-57--without-skill`, `deniedDraws=2`) e `groom-backlog` #2 (controle 4/4 limpos passaram, r2 `skillLeaks=1` + `hostReads=1`; `2026-11-09T12-50-37` vs `2026-11-09T12-55-35--without-skill`, `deniedDraws=2`).

`bootstrap-project-harness` #19 não foi re-rodado: evidência da SPEC-0047 (with-skill `2026-11-09T07-37-44` 5/5; controle `2026-11-09T10-59-41` re-julgado por replay, 5 draws limpos, `deniedDraws=1`, 1/5 passed), separator na regra. O `result.json` armazenado do controle ainda mostra a contaminação v3; o replay é a evidência.

Publicado em `docs/evals/coverage.md` e `CHANGELOG.md`. Nenhum oráculo, fixture ou `why:` foi editado.

---
<!-- COMMENTS:END -->
