# Python Luminary evaluation candidates

Six authored cases: two routing cases and four behavior cases. No draws have
been run. These are candidate oracles, not evidence that the skill outperforms a
model without it. Review the fixtures, establish failing baselines for #3-#6, and
run the documented load canary and candidate/control comparison before publishing
a capability claim. Do not place these cases or fixtures inside the skill.

Behavior checks use only the Python standard library. Structural assertions do
not prove architectural quality: judge the human expectations separately. The
protected contract/tests must not change to manufacture a pass.

1. **Trigger: Python implementation judgment.**
   - prompt: I need to refactor Python domain code: decide between functions, dataclasses and protocols, and keep business rules independent of HTTP clients. Help me implement it.
   - tags: trigger
   - why: language-specific implementation and architectural choices match this skill without naming it
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
   - prompt: Fix money.py so the documented price-key contract holds.
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

4. **Pricing gains an offline consumer.**
   - prompt: Pricing must now work in an offline report too. Refactor checkout.py for that use and preserve checkout behavior.
   - tags: regression, architecture
   - why: extracting the pricing decision enables independent reuse without a layer hierarchy
   - expect: Exposes quote(lines) as pure pricing and reuses it from checkout.
   - expect: Preserves validation-before-charge and exactly one charge for a valid order.
   - expect: Keeps the change cohesive; no service/repository/factory scaffolding.
   - assert: changed checkout.py
   - assert: unchanged tests/test_checkout.py
   - assert: unchanged AGENTS.md
   - assert: ranpass python3 -m unittest discover -s tests
   - assert: nofile src/**
   - assert: nofile pyproject.toml
   - assert: nofile requirements.txt

5. **A large ordered export must produce early results.**
   - prompt: Fix rollup.py so monthly billing handles the large ordered export according to its contract.
   - tags: regression, streaming
   - why: buffering the complete input violates incremental delivery; the oracle allows one-record lookahead
   - expect: Processes an iterator once with bounded group state and no whole-input materialization.
   - expect: Preserves empty/final groups and account ordering.
   - assert: changed rollup.py
   - assert: unchanged tests/test_rollup.py
   - assert: unchanged AGENTS.md
   - assert: ranpass python3 -m unittest discover -s tests
   - assert: nofile pyproject.toml
   - assert: nofile requirements.txt

6. **A tiny fix preserves existing configuration.**
   - prompt: Fix average([]) to return None and keep existing nonempty behavior.
   - tags: regression, restraint
   - why: a Python 3.10 Poetry/Black/mypy project needs a local behavior fix, not a tooling migration
   - expect: Changes only the relevant function, with no new framework or configuration.
   - assert: changed metrics.py
   - assert: unchanged pyproject.toml
   - assert: unchanged tests/test_metrics.py
   - assert: unchanged AGENTS.md
   - assert: ranpass python3 -m unittest discover -s tests
   - assert: nofile uv.lock
   - assert: nofile ruff.toml
   - assert: nofile requirements.txt

7. **A discount bug in a silent repository.**
   - prompt: order_total in pricing.py applies the discount after tax, so discounted orders come out high. Fix it.
   - tags: regression, architecture
   - why: the fixture's AGENTS.md states the business rule but says nothing about structure, so whether the fix stays inside order_total or grows a service/repository/pricing-engine layer is the model's judgment; the seed already has a `_line_cents` helper and a module constant, which invites extraction
   - expect: Keeps the fix inside pricing.py as plain functions; the discount applies to the taxable base.
   - expect: Does not add a PricingService, repository, strategy or factory hierarchy.
   - expect: Preserves the existing helper and constant rather than rewriting the module.
   - assert: changed pricing.py
   - assert: unchanged tests/test_pricing.py
   - assert: unchanged AGENTS.md
   - assert: ranpass python3 -m unittest discover -s tests
   - assert: nofile src/**
   - assert: nofile services/**
   - assert: nofile pyproject.toml
   - assert: nofile requirements.txt
