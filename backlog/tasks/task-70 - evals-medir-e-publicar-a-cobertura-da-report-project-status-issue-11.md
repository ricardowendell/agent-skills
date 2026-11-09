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

created: 2026-11-09T17:27:46.212Z

---

Correção do comentário anterior da SPEC-0050, que ainda publicava os vereditos velhos (capture-idea #1 e groom-backlog #2 como unresolved, e "isolated=yes em toda run"). Este comentário o substitui; o anterior fica como registro append-only.

Re-julgamento read-only sob o detector v5 (def64b2d6a1baa6e, SPEC-0051), sem modelo e sem draw novo. Os manifestos registram params.isolation.enforced=true (seatbelt). check-eval-run nos dois artefatos de controle guardados sob v4 (capture-idea #1 e groom-backlog #2) imprime isolated=no com skillLeaks=1; o replay-evals --leaks sob v5 é a evidência, não o artefato — a mesma ressalva do #19.

Vereditos finais:

- capture-idea #1 — separator (5/5 vs 1/5). Controle com cinco draws limpos sob v5 (deniedDraws=2); quatro vermelhos em filematch docs/inbox/*.md status: unprocessed e um passa. Runs: 2026-11-09T12-39-33--capture-idea--agentworks-deepseek-v4-1-flash vs 2026-11-09T12-41-57--capture-idea--agentworks-deepseek-v4-1-flash--without-skill.
- process-inbox #1 — separator (5/5 vs 0/5), inalterado. Controle vermelho em unchanged docs/inbox/2026-01-01-digest-email.md e nodir docs/backlog; deniedDraws=3.
- write-implementation-prompt #1 — separator (5/5 vs 0/5), inalterado. Controle vermelho em filematch docs/prompts/SPEC-0007-*.prompt.md spec_sha:; deniedDraws=1.
- groom-backlog #2 — non-discriminator (5/5 vs 5/5). O draw r2 do controle leu artefatos de runs anteriores no eval store (~/.local/share/opencode/evals/groom-backlog/2.md, o result.json anterior e transcripts 2.r*.md de runs com skill e de um controle anterior), então fica excluído da base probatória; a evidência do controle são os outros quatro draws (4/4 passed), com deniedDraws=2. O furo de isolamento/detecção é a TASK-77.
- bootstrap-project-harness #19 — separator na regra (5/5 vs 1/5), citado da SPEC-0047, não re-rodado. O result.json guardado do controle ainda mostra a contaminação v3; o replay é a evidência.

Publicado em docs/evals/coverage.md e CHANGELOG.md. Nenhum oráculo, fixture ou why: foi editado e nenhuma AC desta task é marcada.

---
<!-- COMMENTS:END -->
