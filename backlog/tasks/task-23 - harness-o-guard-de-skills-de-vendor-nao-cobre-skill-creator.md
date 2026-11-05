---
id: TASK-23
title: 'harness: o guard de skills de vendor não cobre skill-creator'
status: Done
assignee: []
created_date: '2026-11-05T00:00:00Z'
updated_date: '2026-11-05T10:00:00Z'
labels: []
milestone: m-0
dependencies: []
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`skills/skill-creator/` é uma skill de vendor (`anthropics/skills`), já ignorada em `.gitignore:17`. O guard do CI (`.github/workflows/skills.yml`) recusa skills de terceiros trackeadas para cinco ids — `agent-browser`, `impeccable`, `graphify`, `find-skills`, `orchestration` — e não inclui `skill-creator`. Hoje o diretório existe no disco e está fora do índice, então o passo passa; se alguém forçar o track, o CI não percebe.

Duas saídas: adicionar `skill-creator` ao regex do guard, ou derivar a lista de uma fonte única (o `.gitignore` já a mantém). A primeira é a mudança mínima; a segunda evita que as duas listas divirjam de novo.

A linha do `.gitignore` que ignora a skill também pertence a esta task: ela já está no working tree e deve ser commitada junto com o guard, não com as duas skills novas.

Achado durante o grooming da SPEC-0007; separado dela para não misturar guarda de vendor com o contrato das duas skills novas.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 o guard cobre `skill-creator`, ou deriva a lista de uma fonte única que já o inclui
- [x] #2 no estado atual `git ls-files skills | grep -E '^skills/(agent-browser|impeccable|graphify|find-skills|orchestration|skill-creator)/'` sai vazio, e um caminho forçado no índice faz o passo falhar
- [x] #3 nenhuma skill autoral casa com o regex
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-05T00:00:00Z

---

Fechada em 2026-11-05. `skill-creator` entrou no regex do passo "No third-party skills redistributed" (`.github/workflows/skills.yml:34`).

Verificação:

- `git ls-files skills | grep -E '^skills/(agent-browser|impeccable|graphify|find-skills|orchestration|skill-creator)/'` → vazio no repo;
- repo temporário com `skills/skill-creator/SKILL.md` forçado no índice → o passo saiu `1`;
- as 11 raízes de skills autorais não casam com o regex.

A linha `skills/skill-creator/` do `.gitignore` já estava no working tree e entra com esta task, não com a SPEC-0007.
<!-- COMMENTS:END -->
