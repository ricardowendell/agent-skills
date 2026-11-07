---
id: TASK-54
title: 'evals: auditar os transcripts do store por abort de provider'
status: To Do
assignee: []
created_date: '2026-11-07T20:50:00Z'
labels: []
dependencies: []
priority: high
type: task
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A TASK-52 passou a classificar abort de provider em runs novos, mas os artefatos antigos nao tem execution.error: o 03-08-51 continua com findings=0 isolated=yes no checker, e so foi pego a mao. Antes do gate do 0.6.2, varrer os transcripts do store por provider.go-limit|provider.rate-limit|overloaded, listar run/case/rep e comparar com o result.json. Para cada run citado como limpo em docs/evals/, ou o abort e seguido de retry bem-sucedido (nao e abort), ou a linha ganha um marcador. Nao reescrever numero e nao rodar draw; o resultado do run antigo fica como esta.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Um comando read-only lista todo transcript com erro provider.* e diz se o result.json registra infrastructure/error.
- [ ] #2 Todo run citado como limpo que tem abort de provider e marcado, ou provado que o erro foi seguido de retry bem-sucedido.
- [ ] #3 Nenhum numero historico reescrito; so marcador/nota na linha.
- [ ] #4 A auditoria e deterministica e roda sem modelo.
<!-- AC:END -->
