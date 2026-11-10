---
id: TASK-95
title: 'skill: AGENTS.md como contrato de roteamento (SPEC-0061)'
status: To Do
assignee: []
created_date: '2026-11-10T21:58:00Z'
labels: []
dependencies: []
references:
  - AGENTS.md
  - skills/bootstrap-project-harness/templates/AGENTS.md.template
  - skills/bootstrap-project-harness/scripts/template-parity.test.mjs
priority: medium
type: task
ordinal: 95000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: PR 5 do plano de simplificacao (2026-11-10). O AGENTS.md da raiz tem 39 linhas mas carrega caveats de versao do pdlc e links para registros historicos; o template gerado pelo bootstrap tem 102 linhas com comandos just universais, placeholders de stack e um workflow duplicado. Alvo: contrato curto de operacao na raiz (mantendo a secao pdlc e apontando docs/pipeline.md como unica policy) e um AGENTS.md gerado a partir do projeto real, sem placeholder, sem comando inventado, apontando o WORKFLOW.md existente. Sem tocar em references/evals* (movido pela SPEC-0058) e sem editar casos de eval nesta spec. Zero draws.
<!-- SECTION:DESCRIPTION:END -->
