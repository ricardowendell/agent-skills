---
status: processed
processed_at: 2026-11-19 11:02
---

# Compor skills por capacidade, com ferramentas de evidência

## 10:48

**Yes. I would organize the workflow around independently useful capabilities, then compose them according to the task.** Your existing skill boundaries are mostly useful; the main opportunity is to reduce obligatory handoffs and give the skills stronger evidence-producing tools.

I checked the current index, skill instructions, deterministic-check references and evaluation inventory. This is an assessment of those contracts and recorded results; I haven't executed the repository's checks.

**1. Group skills by the question they answer**

Your [index already has five scopes](https://github.com/ricardowendell/agent-skills/blob/main/skills.index.json). I would refine the user-facing workflow into these groups:

| Group | Existing skills | Independently useful result |
|---|---|---|
| **Establish the environment** | `bootstrap-project-harness` | A usable environment, known constraints and explicit gaps. |
| **Understand and decide** | `process-inbox`, `find-blind-spots`, `groom-backlog` | A decision, an experiment, an implementation-ready change, or a reason to stop. |
| **Prepare and implement** | `write-implementation-prompt`, `implement-from-prompt` | A scoped, verified change. |
| **Verify** | `review-code`, `audit-docs`, `audit-code-quality` | Evidence about a diff, documentation consistency or maintainability. |
| **Observe** | `survey-inflight-work`, `report-project-status` | A factual snapshot and relevant next actions. |
| **Maintain** | `sync-branch`, `tighten-harness` | A deliberate maintenance operation with evidence. |

`capture-idea` and `record-decision` should remain lightweight entry points available throughout. `python-luminary` and `agentworks-harness` supply domain expertise wherever relevant.

Grouping does **not** mean merging every instruction into a larger skill. It means a user can request an outcome without manually invoking every intermediate command.

For example:

> "Prepare this idea for implementation."

That could compose processing, targeted investigation and grooming in one session. It should also be allowed to conclude that an experiment is needed.

> "Implement this ready change."

That could compose prompt preparation and implementation. A separate prompt file remains valuable for asynchronous handoff, a different executor or provenance requirements. Your current policy still requires it; making it conditional would be a deliberate contract change.

Keep the independent review boundary. Combining user-facing steps should not quietly turn implementation into its own independent approval.

**2. Your biggest gaps, in priority order**

| Priority | Gap | Why it matters |
|---:|---|---|
| **1** | **Uncertainty has no complete investigation path.** | Skills preserve unanswered questions, but resolving them still depends heavily on asking you. |
| **2** | **Composition policies are inconsistent.** | Different skills can make incompatible assumptions about tools, authority and allowed mutations. |
| **3** | **Repeated collection is still described largely in prose.** | Agents repeatedly reconstruct repository state, dependencies, document relationships and evidence. |
| **4** | **Some evaluation wins measure procedure more directly than useful outcomes.** | Running a scanner or producing the required field can separate skill/control arms without establishing a better engineering decision. |
| **5** | **The loop ends mainly at implementation/review/document consistency.** | It has less explicit support for checking whether the delivered capability actually helped its user. |

Two concrete findings illustrate these gaps:

- `python-luminary` can fetch missing tools through `uvx`; `review-code` and `audit-code-quality` prohibit installing scanners during their operations. **The caller's permissions and tool policy must prevail during composition.** The Python helper also always exits zero, so its successful execution cannot be interpreted as a clean quality gate. [Current analyzer](https://github.com/ricardowendell/agent-skills/blob/main/skills/python-luminary/scripts/analyze.py)
- The index describes **16 indexed skills**, while the current evaluation inventory and repository also contain `agentworks-harness`. That is a concrete catalog-consistency gap worth reconciling.

The biggest missing capability is **bounded investigation**: question, method, budget, evidence, interpretation and next decision. Initially, I would add that behavior to the existing discovery skills rather than create another orchestration system.

**3. Where deterministic support would help each skill**

These are candidates, not a recommendation to install every listed tool.

| Skill | Useful deterministic support | Judgment the agent should retain |
|---|---|---|
| **bootstrap-project-harness** | Extend/reuse its existing state detector; calculate a proposed file/config diff before applying it. | Which unresolved choices require the user. |
| **capture-idea** | Small append operation: timestamp, safe filename, frontmatter and preservation of original text. | Minimal cleanup only. This may already be simple enough without a script. |
| **process-inbox** | Enumerate unprocessed notes, parse statuses, collect references, detect exact duplicates, apply confirmed edits safely. | Meaning, classification, contradictions and product direction. |
| **find-blind-spots** | Validate an experiment's required fields; execute a selected probe and retain its result. | Which assumption matters and which investigation would resolve it. |
| **groom-backlog** | Validate spec structure, references, IDs, dependencies and dependency cycles. | Outcome, scope, testability and whether readiness is justified. |
| **write-implementation-prompt** | Reuse spec hashing; render mechanical sections and verify referenced paths and commands. | Implementation guidance, tradeoffs and the verification strategy. |
| **implement-from-prompt** | Before/after snapshots, scope-diff checks and a command runner preserving exit codes and outputs. | Implementation and interpretation of failures. |
| **python-luminary** | Already has a bundled scan. Improve policy-aware tool selection and explicit per-tool status. | Invariants, meaningful boundaries and whether a refactor earns its cost. |
| **review-code** | Collect the exact diff, spec hash, relevant configured checks and structured results. Existing scanner slots are a good foundation. | Findings, severity and the merge verdict. |
| **audit-docs** | Check links, references, statuses, hashes and commands that can be mechanically verified. | Semantic contradictions and whether divergence is intentional. |
| **audit-code-quality** | Use existing configured tools for dependencies, unused code, duplication, coverage and complexity. | Whether a measured shape creates a practical maintenance cost. |
| **record-decision** | Allocate IDs safely, validate required sections, and update the ADR plus index together. | Whether a decision exists and its actual rationale. |
| **survey-inflight-work** | Git/PR collector plus deterministic overlap and declared-dependency calculations. | Explanation of constraints and relevant next actions. |
| **report-project-status** | Consume the same survey snapshot; calculate issue/spec/CI counts without collecting them twice. | Which facts change the next action. |
| **sync-branch** | A small state machine for branch relationships, allowed operations, conflicts and resumable state. | Decisions not already covered by project policy. |
| **tighten-harness** | Measure thresholds/headroom and calculate the proposed configuration delta. | Whether tightening improves signal enough to justify churn. |
| **agentworks-harness** | Already combines offline checks with live validation. Preserve bundle/version provenance and structured build reports. | Flow design and remediation within the live platform's authority. |

The strongest early script candidates are **survey collection, spec validation and verification execution**. They contain substantial mechanical work that several skills need.

For structural validation, a schema validator such as Ajv can enforce required fields and types. It cannot establish that an acceptance criterion captures the right user outcome. [ajv.js.org](https://ajv.js.org/?utm_source=chatgpt.com)

Likewise, Knip and dependency-cruiser can supply evidence about unused code and dependency relationships. Your skill still needs to establish whether the finding matters in the application. Your existing deterministic-check references already recognize this distinction. [Knip](https://knip.dev/?utm_source=chatgpt.com)

**4. Give scripts a small, consistent evidence contract**

For any helper you introduce, I would require:

- The repository commit and scope it inspected.
- Tool/version and exact command.
- Exit status and output location.
- Findings separated from unavailable, failed or unmeasured checks.
- Explicit mutation behavior.
- No implicit dependency installation.

Use one snapshot where several skills need the same observation. Refresh it when the underlying commit or relevant state changes.

A script can reliably report "this dependency edge exists." The skill decides whether that edge violates an accepted rule or represents a reasonable tradeoff.

**5. Implement this incrementally**

Given your existing harness freeze, I would start with:

1. **Content-only improvements:** clarify composition authority, add bounded investigation, and reconcile catalog/documentation inconsistencies.
2. **Reuse existing helpers:** make collection and checks easier for the relevant skills to invoke consistently.
3. **Test one missing helper in a consuming project:** preferably the shared survey/status collector.
4. **Evaluate the actual benefit:** correctness, omitted facts, intervention time and total cost.
5. **Add it to the catalog only when it demonstrates reusable value**, following the applicable repository policy.

For the first experiment, compare `/status` using its current process with `/status` consuming a deterministic repository snapshot. It is bounded, useful across your projects, and lets you test the central idea directly: **ordinary code gathers the facts; the skill applies judgment to them.**

## 10:52 — verificação local das duas descobertas

Checado no repo, leitura apenas. Três das quatro afirmações conferem; uma pede nuance.

**"16 indexed skills" — correto.** `skills.index.json`: pipeline 7 + verify 3 + observe 2 + maintain 3 + record 1 + data 0 = 16. O `about` do arquivo diz o mesmo.

**`agentworks-harness` fora do índice — correto, e é a única inconsistência real.** `skills/` tem 28 diretórios; 16 indexados, 12 fora. Desses 12, 11 são instalados/upstream (`agent-browser`, `graphify`, `impeccable`, `html`, `orchestration`…), que não pertencem ao índice por escopo. `agentworks-harness` é first-party, tem `evals/agentworks-harness/` e linha de cobertura medida em `docs/evals/coverage.md:12` (canary 12/12, separador 3/3 vs 0/3, re-medido em `ca97fc0`). É o único com evidência e sem entrada. Nenhum gate pega: `scripts/` não referencia `skills.index.json` em lugar nenhum, `validate-skills.mjs` inclusive.

**`uvx` vs. proibição de instalar — correto, mas mais estreito do que parece.** `skills/python-luminary/SKILL.md:60` busca `ruff`/`ty`/`vulture` via `uvx`; `review-code/SKILL.md:140` e `audit-code-quality/SKILL.md:33,147` proíbem instalar. A proibição é deliberada (sem rede durante review/audit). O item não é "remover a restrição": é definir precedência do caller na composição — quem compõe decide, e a skill declara a necessidade sem presumir rede.

**"Sempre sai com zero" — correto e literal.** `skills/python-luminary/scripts/analyze.py:120-150`: todo caminho de `main()` retorna `0`; `:154` faz `sys.exit(main(...))`. Scan com findings e scan limpo são indistinguíveis pelo exit code. Serve como evidência, nunca como gate.

**Não verificado:** se as avaliações medem procedimento em vez de resultado (gap 4), e se `agentworks-harness` foi omitido do índice por decisão registrada. O segundo é pergunta de intenção, não de conteúdo — checar histórico de `skills.index.json`.
