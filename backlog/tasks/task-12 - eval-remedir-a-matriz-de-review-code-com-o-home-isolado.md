---
id: TASK-12
title: 'eval: remedir a matriz de review-code com o home isolado'
status: Done
assignee: []
created_date: '2026-11-02T18:45:00Z'
updated_date: '2026-11-02T19:05:00Z'
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
- [x] #1 baseline pré-isolação registrado com sha do commit e das células antes de rodar
- [x] #2 as 4 células remedidas com a mesma n (5 por caso), os mesmos modelos e os mesmos casos
- [x] #3 comparação por célula contra a tabela publicada, não só o agregado
- [x] #4 se algum controle sem skill passar onde antes falhava, o achado entra no doc em vez de a tabela ser ajustada em silêncio
- [x] #5 ressalva de isolamento removida do doc só se a re-medição sustentar a tabela
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-02T18:45:00Z

---

Aberta ao fechar a TASK-11. A isolação provou que muda a taxa de carregamento; a matriz é o maior número do projeto e foi medida antes dela. Re-medi-la é o preço de ter trocado o instrumento — e é a diferença entre um número histórico e um número reproduzível.
---

Remedida em 2026-11-02, rápido e sem tocar nos casos. As quatro células, 5 repetições cada, `61978f1`, home isolado:

| caso | flash com | flash sem | luna com | luna sem |
| --- | --- | --- | --- | --- |
| #1 | 5/5 | 0/5 | 5/5 | 0/5 |
| #3 | 5/5 | **1/5** | 5/5 | **3/5** |
| #4 | 5/5 | 0/5 | 5/5 | 0/5 |

O braço com skill se manteve **30/30**. O controle subiu de **0/30 para 4/30**, e os quatro passes estão todos no #3 — exatamente o cenário que o AC-4 mandou registrar em vez de esconder.

Diagnóstico, lido nos transcripts: os passes do controle não aprovaram o branch. Ficaram em silêncio — descreveram o diff, citaram a spec, não emitiram veredito. As asserções do #3 (`noreply veredito` + `reply spec`) são satisfeitas por quem nunca julga. O `0/5` publicado era um modelo que aprovava com confiança; o de hoje às vezes só descreve, e a asserção não distingue as duas coisas.

Consequência para a leitura da matriz, escrita no doc: a separação é limpa em #1 e #4 (0/5 nos dois modelos), e em #3 ela separa de **aprovação confiante**, não de silêncio. O conserto do caso é a TASK-16, com medição própria.

O confundidor de versão de modelo não pode ser descartado: `opencode-go/gpt-6-luna` é alias remoto e o checkpoint pode ter mudado desde a medição original. Isso reforça, não enfraquece, a decisão de remeter em vez de confiar no número antigo.
<!-- COMMENTS:END -->
