---
id: TASK-103
title: 'evals: --resume rebaixa o isolamento de uma celula legada'
status: Done
assignee: []
created_date: '2026-11-11T09:57:00Z'
updated_date: '2026-11-11T12:39:00Z'
labels: []
dependencies: []
references:
  - scripts/lib/evals/isolation.mjs
  - scripts/eval.mjs
priority: medium
type: task
ordinal: 103000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: SPEC-0034, controle #12 (2026-11-11). isolation.mjs:183-192 grava enforced:false com RESUMED_LEGACY_REASON sempre que o manifesto nao tem params.isolation, sem consultar o probe atual; e o motivo afirma que os draws anteriores nao eram enforced, o que e inferido de um registro ausente, nao provado. Efeito: o unico separador do corpus tem o braco de controle como isolated=unknown, inclusive o draw reexecutado que rodou sob seatbelt. Decidir: registrar por draw (o que cada um provou) em vez de rebaixar a celula inteira, ou declarar o motivo sem afirmar o que nao se sabe. Zero draws.
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-11T12:40:05.666Z

---

Done via SPEC-0067 (merge em main). Isolamento agora e registrado por draw; o resumo do manifesto e derivado e nunca afirma 'earlier draws were not enforced'. Draw sem registro le como sem registro, nao como 'anterior ao probe'. Nos 355 runs, so a celula #12 muda, e so a linha de motivo (+warnings=1). Zero draws. 556 testes.

---
<!-- COMMENTS:END -->
