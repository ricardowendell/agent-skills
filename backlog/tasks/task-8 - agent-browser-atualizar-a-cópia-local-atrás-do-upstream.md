---
id: TASK-8
title: 'agent-browser: atualizar a cópia local, atrás do upstream desde maio'
status: To Do
assignee: []
created_date: '2026-11-02T17:54:00Z'
updated_date: '2026-11-02T17:54:00Z'
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
- [ ] #1 diff da cópia local contra o stub do upstream registrado, cada divergência justificada
- [ ] #2 validate-skills.mjs verde e .skill-lock.json com o hash novo
- [ ] #3 allowed-tools sem permissão npx não fixada
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T17:54:00Z

---

Aberto ao fechar a TASK-3: o defeito de YAML não existe mais no HEAD, mas a cópia local continua na revisão de maio. A reinstalação mexe em diretório gitignored e muda como o agente carrega a skill, então é decisão à parte — não entra no fechamento da TASK-3.
<!-- COMMENTS:END -->
