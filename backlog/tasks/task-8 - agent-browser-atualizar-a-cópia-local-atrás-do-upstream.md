---
id: TASK-8
title: 'agent-browser: atualizar a cópia local, atrás do upstream desde maio'
status: Done
assignee: []
created_date: '2026-11-02T17:54:00Z'
updated_date: '2026-11-02T18:10:00Z'
labels: []
dependencies: []
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A cópia instalada de agent-browser é de 2026-05-16 (.skill-lock.json: c1470a4) e o upstream reescreveu o stub desde então. Duas divergências concretas, medidas em 2026-11-02: (1) a description local (349 caracteres, patch entre aspas da TASK-3) contra a atual, de 925 caracteres, que delega o conteúdo a `agent-browser skills get core` em vez de descrever workflows; (2) o `allowed-tools` local ainda permite `Bash(npx agent-browser:*)`, que o commit `495a987` "fix(skills): remove unpinned npx permission" (2026-10-29) removeu do upstream. Risco: a skill instalada descreve um fluxo que o CLI atual não usa mais e mantém uma permissão que o projeto retirou. Fix: reinstalar pelo instalador de skills (ou aplicar o stub atual à mão), re-verificar validate-skills e conferir o hash no lock. O patch de aspas da TASK-3 deixa de ser necessário: a description atual já é YAML válido. Não renomear a skill.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SKILL.md byte-idêntico ao de 495a987 (blob 67e8a49)
- [x] #2 .skill-lock.json com skillFolderHash aee3afd3 e updatedAt de hoje
- [x] #3 validate-skills exit 0; descrição de 925 chars aceita como warning de skill externa
- [x] #4 allowed-tools sem permissão npx, justificado pela versão instalada
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T17:54:00Z

---

Aberto ao fechar a TASK-3: o defeito de YAML não existe mais no HEAD, mas a cópia local continua na revisão de maio. A reinstalação mexe em diretório gitignored e muda como o agente carrega a skill, então é decisão à parte — não entra no fechamento da TASK-3.

---

Implementado em 2026-11-02, sem usar o instalador.

O `skills` CLI não existe nesta máquina, e `npx skills add` reescreveria o lock inteiro e exigiria rede para três skills. Como local e upstream têm exatamente um arquivo cada (`SKILL.md`), a atualização foi substituição de arquivo único a partir do commit `495a987`, conferida por blob: `git hash-object` deu `67e8a49ad8d8e5874b9e3a5d802df68d5e5e7d76`, igual ao blob daquele commit. O tree sha do diretório em `495a987` e em `main` é o mesmo (`aee3afd3…`), então fixar o commit não muda o conteúdo.

O `skillFolderHash` não hasheia o arquivo local: é o tree sha do diretório no repo de origem, no commit da instalação. Cinco formas de hash local testadas em `find-skills` e `orchestration` não batem com os valores gravados, e o tree sha atual do `find-skills` upstream é outro. Por isso o lock recebeu `aee3afd3dd9c879a14816dd6dca77c938f8c9c10` e `updatedAt` = 2026-11-02T18:08:10.262Z.

AC-3, com a ressalva medida depois: `validate-skills --root skills` — o caminho do pre-commit e do CI — retorna "All clear" e **não vê** esta skill, porque arquivos não versionados são pulados quando `--root` é passado. O warning de 925 > 500 aparece só no scan global (sem `--root`), junto de outro já existente (`~/.codex/skills/.system/imagegen`, 572 chars). Fica aceito: é skill externa, exit 0.

AC-4: `allowed-tools` passou a ser só `Bash(agent-browser:*)`. O binário instalado é 0.41.1 em `~/.volta/bin/agent-browser`, no PATH, e `agent-browser skills list` mostra todos os subcomandos citados pelo stub novo (`core`, `electron`, `slack`, `dogfood`, `derive-client`, `vercel-sandbox`, `protected-vercel-deployments`, `agentcore`). O `npx` era supérfluo aqui, não uma capacidade.

Backup do arquivo anterior: `~/.local/share/opencode/backups/agent-browser-SKILL.md.2026-11-02`. Ele fica fora do repo: `.skill-lock.json` e `skills/agent-browser/` são gitignored, então nada disso entra em commit e o registro durável do que foi instalado é este comentário mais o lock.
<!-- COMMENTS:END -->
