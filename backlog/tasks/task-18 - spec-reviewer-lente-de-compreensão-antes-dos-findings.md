---
id: TASK-18
title: 'spec-reviewer: lente de compreensão antes dos findings'
status: To Do
assignee: []
created_date: '2026-11-03T10:38:00Z'
updated_date: '2026-11-03T10:38:00Z'
labels: []
dependencies: []
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Origem: `docs/inbox/2026-11-03-egm-para-agent-skills.md`. Registro exploratório: o documento se declara "recomendações para avaliação", sem nada implementado.

Ideia central do EGM: quem escreveu um artefato não consegue ver o que só existe na conversa. Um leitor novo, recebendo apenas os materiais explicitamente selecionados, expõe pressupostos que o autor considera óbvios. O `spec-reviewer` hoje revisa clareza, consistência e escopo; a lente proposta é anterior aos findings: **parafrasear antes de julgar**.

Perguntas que a paráfrase precisa responder:

- Qual resultado o usuário terá?
- O que muda e o que permanece?
- Quais decisões já estão tomadas?
- O que ainda precisa ser inventado para implementar?
- Como demonstrar que a entrega funcionou?

Uma paráfrase incompatível é evidência de lacuna, não veredito de defeito: investiga-se.

Posição no pipeline, conforme o documento: compreensão após o rascunho de grooming; prontidão do prompt depois da geração e antes da implementação. Rigor proporcional ao risco — mudança simples não justifica bateria de revisores.

O `review-code` já recusa revisão na mesma sessão da implementação, então a novidade fica **antes do código**, que é onde ela ainda não existe.

Risco declarado no próprio documento: uma lente que parafraseia pode gerar falso positivo por interpretação errada do revisor. Por isso a saída é "evidência de lacuna", com o trecho que a sustenta.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 a lente escrita em termos de comportamento, não de formato de relatório
- [ ] #2 piloto com specs de defeito conhecido e specs corretas, para medir falso positivo
- [ ] #3 comparação com o `spec-reviewer` atual no mesmo corpus; sem ganho, registrar e não integrar
- [ ] #4 a paráfrase não substitui os findings existentes, só os antecede
- [ ] #5 nada muda no `spec-reviewer` sem o resultado do piloto
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-03T10:38:00Z

---

Aberto a partir do processamento do inbox. É a recomendação principal do EGM e a mais distante do que já existe: o repo mede revisão de código, não compreensão de spec.

Pergunta aberta: o documento propõe três braços (atual, rubrica na sessão do autor, rubrica em sessão nova). O braço B existe para isolar o valor do histórico — mas sem um jeito barato de rodar "mesma sessão", pode ficar só A contra C, declarando a limitação.
<!-- COMMENTS:END -->
