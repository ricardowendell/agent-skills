---
id: TASK-3
title: 'agent-browser: description inválida no frontmatter'
status: To Do
assignee: []
created_date: '2026-10-29T13:26:00Z'
labels: []
dependencies: []
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
skills/agent-browser/SKILL.md linha 3 tem description sem aspas contendo ": " duas vezes ("websites: navigate" e "(VS Code, ...)"), o que e YAML invalido: o loader do Copilot recusa a skill inteira. A skill e upstream (vercel-labs/agent-browser, hash c1470a4 no .skill-lock.json) e esta no .gitignore, entao um update sobrescreve qualquer patch local. Fix: citar o valor (ou bloco) preservando o texto, registrar no lock/README que e patch local, e abrir issue upstream com o diff. Nao renomear a skill.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 description citada, texto preservado
- [ ] #2 validate-skills.mjs verde e Copilot carrega a skill
- [ ] #3 issue aberta upstream com o diff
- [ ] #4 patch local sobrevive a reinstall ou está documentado como não-sobrevivente
<!-- AC:END -->
