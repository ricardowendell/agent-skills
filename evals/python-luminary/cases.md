# Python Luminary evaluation candidates

Cases 1 and 2 are routing. Cases 3, 5, 8 and 9 are the behavior set being
measured; cases 6 and 7 were retired after the 2026-11-17 screening showed them
non-discriminating (the control solved them and the skill did not load on short
fix prompts). No draws are evidence of superiority until the counts are recorded
in `docs/evals/coverage.md` with their run directories.

Behavior checks use only the Python standard library. Structural assertions do
not prove architectural quality: judge the human expectations separately. The
protected contract/tests must not change to manufacture a pass.

1. **Trigger: Python implementation judgment.**
   - prompt: I need to refactor Python domain code: decide between functions, dataclasses and protocols, and keep business rules independent of HTTP clients. Help me implement it.
   - tags: trigger
   - why: language-specific implementation and architectural choices match this skill without naming it; canary 12/12 clean on deepseek-v4.1-flash (`2026-11-16T23-15-29--python-luminary`)
   - gate: off
   - expect: Loads python-luminary; it may then request the missing code.
   - assert: skill python-luminary

2. **Near-miss: a TypeScript codebase audit.**
   - prompt: Audit this TypeScript codebase for coupling and dead code. Write no files.
   - tags: trigger
   - why: a whole-codebase TypeScript audit belongs to audit-code-quality, not Python implementation
   - gate: off
   - expect: Does not load python-luminary.
   - assert: notskill python-luminary

3. **A domain value used as a dictionary key.**
   - prompt: money.py uses our Money record as the key of a price map, and the map misbehaves once two equal amounts come from different places. Read the module and its tests, then fix the contract so a Money value can be a key without surprises.
   - tags: regression, data-model
   - why: a mutable value-equal key has an unstable hash; the fix must preserve key lookup and prevent ordinary field assignment
   - expect: Keeps Money as an immutable value record with useful generated behavior.
   - expect: Uses no unsafe hash workaround or manual object hierarchy.
   - assert: changed money.py
   - assert: unchanged tests/test_money.py
   - assert: unchanged AGENTS.md
   - assert: ranpass python3 -m unittest discover -s tests
   - assert: nofile pyproject.toml
   - assert: nofile requirements.txt

5. **A large ordered export must produce early results.**
   - prompt: rollup.py streams a month of per-account rows into a billing export. With the large ordered export it returns nothing until the file is exhausted, which the finance team reports as a hang. Fix the streaming behavior without changing the iterator contract.
   - tags: regression, streaming
   - why: buffering the complete input violates incremental delivery; the oracle allows one-record lookahead
   - expect: Processes an iterator once with bounded group state and no whole-input materialization.
   - expect: Preserves empty/final groups and account ordering.
   - assert: changed rollup.py
   - assert: unchanged tests/test_rollup.py
   - assert: unchanged AGENTS.md
   - assert: ranpass python3 -m unittest discover -s tests

8. **Review a green suite over a latent equality defect.**
   - prompt: A colleague's branch changes catalogue.py so SKUs can carry promotions. The suite is green, but I am not confident the pricing map is correct when two records stand for the same SKU. Review the branch and tell me whether to merge, with the evidence.
   - tags: review, data-model
   - why: the suite passes because `eq=False` makes Sku hash by identity, so two logically equal SKUs miss each other and the result depends on row order; the skill's data-model reference states that equal values need equal hashes, which is exactly the judgment the control is not primed for
   - expect: Rejects the change and names the identity-vs-value mismatch by `file:line`.
   - expect: Explains that the map keys by instance, so order decides the price.
   - expect: Does not edit any file.
   - assert: reply (?:REJECT|Reject|reject)
   - assert: reply (?:[Ii]dentity|[Ii]nstance|[Hh]ash)
   - assert: unchanged catalogue.py
   - assert: unchanged tests/test_catalogue.py

9. **Share line-item math without growing a layer.**
   - prompt: Finance needs the statement line math for an offline quarterly export that reads historical rows and never calls the billing provider. statements.py should expose the computation so both callers share it, and build_statement must keep charging once with the same total.
   - tags: regression, architecture
   - why: the minimal answer is a pure helper plus a thin caller; the temptation is a service/repository/factory layer for a two-caller reuse, which the architecture reference names as a wrapper that hides nothing
   - expect: Extracts a pure line-item helper and keeps build_statement thin.
   - expect: Adds no service, repository, factory or new module.
   - expect: Preserves rounding, ordering and the single charge.
   - assert: changed statements.py
   - assert: unchanged tests/test_statements.py
   - assert: unchanged AGENTS.md
   - assert: ranpass python3 -m unittest discover -s tests
   - assert: nofile src/**
   - assert: nofile services/**
   - assert: nofile pyproject.toml
   - assert: nofile requirements.txt
