---
id: TASK-3
title: 'agent-browser: description inválida no frontmatter'
status: Done
assignee: []
created_date: '2026-10-29T13:26:00Z'
updated_date: '2026-11-07T23:05:00Z'
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
- [x] #3 issue upstream desnecessária: defeito ausente no HEAD, verificado em 2026-11-02
- [x] #4 patch local documentado como não-sobrevivente e desnecessário
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T13:27:00Z

---

Patch local aplicado em 2026-11-02: a description passou a ser um escalar entre aspas, texto preservado (349 caracteres, nenhuma aspa interna). validate-skills segue verde. O YAML era inválido de fato — escalar simples não pode conter ': ' — mas o loader do OpenCode aceita; o do Copilot, segundo a task, recusa. AC-2 segue parcial: só o validate-skills foi verificado aqui, Copilot não está disponível. AC-3 (issue upstream) e AC-4 (sobrevivência a reinstall) continuam abertos; o arquivo é gitignored, então o patch não entra no histórico e some no próximo update da skill.

---

Fechado em 2026-11-02 como resolvido upstream, sem abrir issue.

Verificação no HEAD de `vercel-labs/agent-browser`: a description foi reescrita inteira (925 caracteres) e o valor não contém `": "` nem `" #"`, não começa com aspa — escalar simples válido. O defeito que a task descreve não existe mais. Não foi corrigido como bug; a reescrita o removeu por acidente. Último commit no arquivo: `495a987` "fix(skills): remove unpinned npx permission" (2026-10-29).

Consequência nos ACs, que foram reescritos para registrar o desfecho em vez do plano:
- AC-3: uma issue hoje reportaria um defeito ausente no HEAD. Não aberta.
- AC-4: o patch é gitignored e não sobrevive a reinstall — mas o reinstall traz uma description válida, então ele é desnecessário, não apenas frágil.
- AC-2: Copilot continua sem verificação disponível aqui; o que se sabe é que o YAML local é válido (aspas explícitas) e o OpenCode carrega.

A cópia local é de maio (`c1470a4`, instalada em 2026-05-16) e está atrás do upstream: o `allowed-tools` local ainda tem `Bash(npx agent-browser:*)`, que o `495a987` removeu. Isso é um problema separado, registrado na TASK-8.

---

TASK-53 (reconciliacao): AC-1/3/4 fechados com o patch local e a verificacao no HEAD upstream (comentario de 2026-11-02). AC-2 permanece aberto e NAO e reaberto: o Copilot nao esta disponivel aqui; o verificado e YAML valido + load no OpenCode, e o HEAD upstream ja e valido. O defeito nao existe no HEAD e o patch local e desnecessario, nao so nao-sobrevivente.

---
<!-- COMMENTS:END -->
