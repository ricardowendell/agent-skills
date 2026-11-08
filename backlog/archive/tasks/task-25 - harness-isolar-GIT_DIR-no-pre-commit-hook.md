---
id: TASK-25
title: 'harness: isolar GIT_DIR no pre-commit hook'
status: Done
assignee: []
created_date: '2026-11-05T14:45:00Z'
updated_date: '2026-11-05T16:56:00Z'
labels: []
dependencies: []
priority: high
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
O hook pre-commit roda testes que encenam fixtures com git. Como o git exporta GIT_DIR/GIT_INDEX_FILE para o hook, os filhos herdam esses valores e operam no repo real: em 2026-11-05 o worktree da SPEC-0015 trocou para a branch feature/x, criou commits de fixture e o repo principal ficou com core.bare=true. O estado foi restaurado manualmente. Corrigir o hook para limpar o env antes dos testes e provar que um commit nao muda branch nem core.bare.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 O hook limpa GIT_DIR/GIT_INDEX_FILE/GIT_WORK_TREE depois de resolver ROOT.
- [x] #2 Rodar o hook com GIT_DIR/GIT_INDEX_FILE setados nao muda a branch atual nem core.bare.
- [x] #3 Os cinco comandos do hook continuam verdes.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
2026-11-05 — Fix em `.githooks/pre-commit`: `unset GIT_DIR GIT_INDEX_FILE GIT_WORK_TREE GIT_PREFIX GIT_COMMON_DIR` depois de resolver `ROOT` e entrar nele.

Prova: `GIT_DIR=.git GIT_INDEX_FILE=.git/index GIT_WORK_TREE=$PWD sh .githooks/pre-commit` rodou os cinco comandos (`All clear`, `--list --check`, 125 testes do harness, 17 do bootstrap, parity 2/2) e deixou `branch=main`, `HEAD=1f8372c`, `core.bare=false`; `git status` só mostrou o próprio hook modificado.
<!-- COMMENTS:END -->
