---
status: processed
processed_at: 2026-11-03 10:38
---

# EGM: recomendações para agent-skills

Data da análise: 2 de novembro de 2026.  
Base: agent-skills no commit `61978f1dffb3d1203c70f8797c0f2d5b1afaf09f`; Elephant-Goldfish Model no commit `244292ca394adbcb42ee056297fa6940371ff8bf`.  
Status: recomendações para avaliação; nenhuma alteração implementada ou execução dos workflows nesta análise.

## Recomendação principal

Adaptar a revisão de specs e prompts por uma sessão nova, sem o histórico de elaboração. Começar pelo `spec-reviewer`, validar o benefício com um piloto e só depois decidir se o comportamento merece uma skill própria.

O fluxo atual já cobre captura, grooming, geração de prompt, implementação, revisão e auditoria. A contribuição mais útil do EGM é testar se os artefatos produzidos em uma etapa são compreensíveis e executáveis por outro agente.

## O princípio do EGM

O Elephant elabora o design com o contexto do projeto. O Goldfish revisa o artefato sem a conversa que o originou, recebendo apenas os materiais explicitamente selecionados. Ausência de histórico não significa ausência de código ou documentação, nem garante independência de julgamento entre modelos iguais.

O objetivo é expor decisões que ficaram apenas na conversa e pressupostos que o autor considera óbvios.

## O que adaptar

| Ideia | Estado atual | Adaptação recomendada |
| --- | --- | --- |
| Teste de compreensão | `groom-backlog` verifica readiness por checklist | Pedir a um leitor novo que explique a proposta antes de procurar defeitos |
| Revisão de implementação | `write-implementation-prompt` organiza operações e verificações | Conferir se o prompt deixa decisões relevantes para o implementador inventar |
| Lentes de revisão específicas | `spec-reviewer` reúne clareza, consistência e escopo | Separar compreensão da spec e prontidão do prompt como lentes selecionáveis |
| Rubricas reutilizáveis | Critérios ficam principalmente nos `SKILL.md` | Extrair referências pequenas quando houver reutilização real |
| Drift entre docs e código | `audit-docs` se concentra em consistência documental | Criar um modo explícito de conferir afirmações contra código e testes |
| Isolamento verificável | Evals verificam comportamento, routing e proveniência | Acrescentar um probe de vazamento do contexto do autor |

## Primeira mudança: evoluir o spec-reviewer

### Lente 1 — compreensão da spec

Inspirada no revisor de compreensão do EGM: antes dos findings, o revisor explica com suas próprias palavras o que a proposta muda e como o sistema existente funciona segundo o documento.

O teste deve responder:

- Qual resultado o usuário terá?
- Qual comportamento muda e qual permanece?
- Quais decisões estão tomadas?
- O que ainda precisaria ser inventado para implementar?
- Como demonstrar que a entrega funcionou?

Uma paráfrase incompatível com a intenção é evidência de uma possível lacuna. Deve ser investigada; não implica automaticamente que o documento está errado.

### Lente 2 — prontidão do prompt

Revisar o prompt de implementação junto da spec e das referências declaradas. Procurar decisões pendentes que alterem comportamento, contrato, segurança ou escopo, além de critérios de aceitação sem verificação correspondente.

Não exigir que toda escolha interna de implementação esteja antecipada. O projeto já trata a seção Structure como orientação, e não como contrato.

### Posição no pipeline

- Revisão de compreensão: após o rascunho de grooming, antes de considerar uma spec mais arriscada pronta.
- Revisão de readiness: após a geração do prompt, antes da implementação.
- Manter o rigor proporcional ao risco: mudanças simples não precisam de uma revisão completa com vários agentes.

O `review-code` já recusa revisão na mesma sessão da implementação, salvo insistência explícita com identificação de self-review. Portanto, a novidade proposta está principalmente antes do código.

## Como tratar os findings

Cada finding deve indicar escopo, evidência, consequência e ação sugerida. O autor pode corrigir, contestar com justificativa ou registrar um risco aceito. Um revisor que falha ou não entrega relatório fica como não executado; isso não equivale a zero findings.

Começar com uma rodada e, quando necessário, uma revisão das correções. Não importar o loop completo do EGM antes de medir custo e utilidade. Revisão na mesma sessão deve ser identificada como tal, sem alegar isolamento.

## Evolução do audit-docs

Um modo de drift poderia verificar funcionalidades descritas mas ausentes, campos ou contratos divergentes e atalhos que alteram o comportamento prometido.

Filtrar os documentos por status e intenção: uma proposta ainda não implementada não é automaticamente drift. Classificar cada divergência como defeito, evolução intencional ou documentação desatualizada. Manter o comportamento de leitura e proposta de correções, sem transformar auditoria em expansão de escopo.

## Piloto para comprovar valor

Usar specs e prompts com defeitos conhecidos, além de exemplos corretos para medir falsos positivos.

| Braço | Condição | Pergunta |
| --- | --- | --- |
| A | Processo atual | Qual é o baseline? |
| B | Rubrica adicional na sessão do autor | Qual é o valor dos critérios explícitos? |
| C | Mesma rubrica em sessão nova | Qual é o valor adicional de retirar o histórico? |

Começar com 6–10 casos e três repetições por braço, como exploração. Fixar versões de skills, modelos, documentos e código; registrar ferramentas e orçamento disponíveis. Manter casos reservados fora do ajuste da skill e não expor respostas esperadas aos agentes.

Medir defeitos relevantes encontrados, falsos positivos, ambiguidades que chegam à implementação, custo, tempo e retrabalho. Separar a qualidade do protocolo da conformidade de formato. A validação dos findings deve usar defeitos conhecidos e julgamento humano ou verificações externas quando possível.

A matriz atual de `review-code` encontrou diferencial principalmente na disciplina do processo nos casos medidos. Este piloto deve verificar também a detecção de ambiguidades e decisões ausentes. Não ampliar o framework de evals antes de demonstrar uma necessidade que o mecanismo atual não atende.

## Ordem sugerida

1. Definir as duas rubricas e os casos do piloto.
2. Evoluir o `spec-reviewer` com as lentes selecionáveis.
3. Comparar os três braços e inspecionar os falsos positivos.
4. Integrar a revisão ao grooming e à geração de prompts apenas onde o ganho justificar o custo.
5. Criar uma skill própria ou novas capacidades no runner somente com evidência de uso.

## Referências

- [Visão geral do EGM](https://egm.dev/).
- [EGM — revisor de compreensão](https://github.com/google/elephant-goldfish-model/blob/244292ca394adbcb42ee056297fa6940371ff8bf/agents/comprehension.md).
- [EGM — readiness de implementação](https://github.com/google/elephant-goldfish-model/blob/244292ca394adbcb42ee056297fa6940371ff8bf/resources/document_standards/implementation-readiness-standard.md).
- [EGM — drift report](https://github.com/google/elephant-goldfish-model/blob/244292ca394adbcb42ee056297fa6940371ff8bf/skills/egm-drift-report/SKILL.md).
- [agent-skills — spec-reviewer](https://github.com/ricardowendell/agent-skills/blob/61978f1dffb3d1203c70f8797c0f2d5b1afaf09f/agents/spec-reviewer.md).
- [agent-skills — review-code](https://github.com/ricardowendell/agent-skills/blob/61978f1dffb3d1203c70f8797c0f2d5b1afaf09f/skills/review-code/SKILL.md).
- [agent-skills — matriz de avaliação](https://github.com/ricardowendell/agent-skills/blob/61978f1dffb3d1203c70f8797c0f2d5b1afaf09f/docs/evals/review-code-matrix.md).
