---
id: TASK-12
title: 'eval: remedir a matriz de review-code com o home isolado'
status: To Do
assignee: []
created_date: '2026-11-02T18:45:00Z'
updated_date: '2026-11-02T18:45:00Z'
labels: []
dependencies: []
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A matriz de `review-code` em `docs/evals/review-code-matrix.md` é a medida mais forte do repositório — **30/30 com a skill, 0/30 sem**, em dois modelos — e foi produzida num ambiente que não é mais o do harness. Até a TASK-11, o agente via todas as skills instaladas na máquina: 22 delas, não só a que estava sob teste. Os números da matriz não são falsos, mas respondem a uma pergunta diferente da que o harness faz hoje.

O que se sabe sobre o efeito: em `implement-from-prompt`, o mesmo instrumento e a mesma n deram 15 misses em 64 runs naquele ambiente e **0 em 24** depois da isolação. A matriz não registrou nenhum miss (30/30), então o teto não tem onde subir — o que a re-medição pode mostrar é se o piso sem skill muda, e se a separação se mantém limpa.

Baseline congelado, para comparação: a tabela publicada, commit `338b6b9`, medida em `opencode-go/deepseek-v4.1-flash` e `opencode-go/gpt-6-luna`, 5 repetições por célula, casos #1, #3 e #4 — 30/30 contra 0/30. O doc já carrega a ressalva de isolamento; ela sai se a re-medição confirmar.

Custo: 4 células × 15 runs = 60 execuções de agente. É a mesma ordem da rodada original, que levou ~28 min.

Ordem: remedir sem tocar no texto dos casos. Se a separação se mantiver, atualiza-se a tabela e remove-se a ressalva. Se o piso sem skill subir, isso é achado — significa que o ambiente com 22 skills estava segurando o controle, e a matriz ficou mais fraca, não mais forte.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 baseline pré-isolação registrado com sha do commit e das células antes de rodar
- [ ] #2 as 4 células remedidas com a mesma n (5 por caso), os mesmos modelos e os mesmos casos
- [ ] #3 comparação por célula contra a tabela publicada, não só o agregado
- [ ] #4 se algum controle sem skill passar onde antes falhava, o achado entra no doc em vez de a tabela ser ajustada em silêncio
- [ ] #5 ressalva de isolamento removida do doc só se a re-medição sustentar a tabela
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T18:45:00Z

---

Aberta ao fechar a TASK-11. A isolação provou que muda a taxa de carregamento; a matriz é o maior número do projeto e foi medida antes dela. Re-medi-la é o preço de ter trocado o instrumento — e é a diferença entre um número histórico e um número reproduzível.
<!-- COMMENTS:END -->
