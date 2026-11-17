# Sources and provenance

Read to verify a language detail or inspect the inspiration behind this skill.
This is an original synthesis for this repository, not a redistribution of the
upstream skills or book text. It is not authored or endorsed by Luciano Ramalho.

## Language authority

Use documentation matching the consuming project's Python version:
- [Python data model](https://docs.python.org/3/reference/datamodel.html)
- [Dataclasses](https://docs.python.org/3/library/dataclasses.html)
- [Typing](https://docs.python.org/3/library/typing.html)
- [itertools](https://docs.python.org/3/library/itertools.html)
- [contextlib](https://docs.python.org/3/library/contextlib.html)
- [asyncio task lifecycle](https://docs.python.org/3/library/asyncio-task.html)

## Design inspiration

- Luciano Ramalho, [Fluent Python, second edition](https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/):
  data-model literacy, functions as objects, protocols and idiomatic composition.
  Use the [author's companion site](https://www.fluentpython.com/) and
  [official examples](https://github.com/fluentpython/example-code-2e) for further study.
- [Trail of Bits modern-python](https://github.com/trailofbits/skills/tree/main/plugins/modern-python):
  coherent tooling and project setup. Preserve existing tool choices rather than
  importing its migrations or coverage thresholds as universal policy.
- [wshobson python-design-patterns](https://github.com/wshobson/agents/tree/main/plugins/python-development/skills/python-design-patterns):
  simplicity, composition, and removing unnecessary abstractions.
- [affaan-m Python patterns](https://github.com/affaan-m/ECC/tree/main/skills/python-patterns):
  everyday Python implementation and review.
- [Jeffallan python-pro](https://github.com/Jeffallan/claude-skills/tree/main/skills/python-pro):
  task-specific references for typing, standard library, testing and async.
- [Community ramalho-fluent-python](https://github.com/copyleftdev/sk1llz/blob/master/languages/python/ramalho/SKILL.md):
  the idea of a focused Python fluency skill. Its mutable hashed Vector example
  and blanket repr rules are not adopted here.

## Deliberate departures

Require no async-first default, numeric coverage floor, universal function length,
minimum abstraction count, automatic checker migration, or mandatory descriptors.
Treat stable hashing, resource ownership, target compatibility, and business
invariants as contracts; treat design preferences as context-dependent judgment.

Upstream links are provenance and optional reading, not runtime dependencies.
Do not fetch them for every task or load them as instructions.
