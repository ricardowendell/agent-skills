---
id: TASK-3
title: 'agent-browser: description inválida no frontmatter'
status: To Do
assignee: []
created_date: '2026-10-29T13:26:00Z'
updated_date: '2026-11-02T13:27:00Z'
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
- [x] #1 description citada, texto preservado
- [ ] #2 validate-skills.mjs verde e Copilot carrega a skill
- [ ] #3 issue aberta upstream com o diff
- [ ] #4 patch local sobrevive a reinstall ou está documentado como não-sobrevivente
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T13:27:00Z

---

Patch local aplicado em 2026-11-02: a description passou a ser um escalar entre aspas, texto preservado (349 caracteres, nenhuma aspa interna). validate-skills segue verde. O YAML era inválido de fato — escalar simples não pode conter ': ' — mas o loader do OpenCode aceita; o do Copilot, segundo a task, recusa. AC-2 segue parcial: só o validate-skills foi verificado aqui, Copilot não está disponível. AC-3 (issue upstream) e AC-4 (sobrevivência a reinstall) continuam abertos; o arquivo é gitignored, então o patch não entra no histórico e some no próximo update da skill.

---
<!-- COMMENTS:END -->
