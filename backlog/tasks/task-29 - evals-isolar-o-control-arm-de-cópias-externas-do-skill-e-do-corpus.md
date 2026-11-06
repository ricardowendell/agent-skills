---
id: TASK-29
title: 'evals: isolar o control arm de cópias externas do skill e do corpus'
status: Done
assignee: []
created_date: '2026-11-05T16:51:00Z'
updated_date: '2026-11-06T11:25:00Z'
labels: []
dependencies: []
priority: high
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Os controles da SPEC-0015 leram uma cópia stale de references/evals.md em /private/var/folders/.../T/opencode e o SKILL.md real em /Users/wendell/.agents/skills/implement-from-prompt. O gate vê a tool skill, não leitura de arquivo, então o passe conta como controle limpo. Fechar esses caminhos no isolamento ou negar a leitura e remedir os controles afetados.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Controles ou não conseguem ler skill/corpus externos, ou o run registra leak e fica marcado contaminado e excluído; nenhuma leitura externa conta como passe.
- [x] #2 O controle do #1 no gpt-6-luna é remedido e o número publicado reflete a leitura nova.
- [x] #3 O gate continua detectando uso da tool skill.
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-06T11:24:00Z

---

Fechada pela SPEC-0017 (merge em 05f365b). AC-1: o runner grava leak/contaminated por repeticao e contaminada nao conta como passe (leak.mjs + 155 testes). AC-2: #1 luna control remedido, 0/5 em 2026-11-06T07-05-38, e a matriz/coverage refletem. AC-3: gate intacto; with-skill 3/3 carregou a copia staged nos runs de remedicao. Ressalva registrada: permission.external_directory nao bloqueia a leitura (r3 do #2 control leu a skill instalada), entao a deteccao e a garantia. O caso groom-backlog #2 ficou 'unresolved': 2/3 dos controles antigos eram contaminados.

---

created: 2026-11-06T11:25:00Z

---

Nota de integridade: o run record c791585e grava spec_sha d6d91033 (o pin do dispatch), mas a spec merged tem outro sha porque recebeu result.test.mjs/report.test.mjs nos files: e a secao Results durante o ciclo. Mesmo comportamento do record da SPEC-0015; registrado no TASK-36 (vinculo/estado do pdlc).

---
<!-- COMMENTS:END -->
