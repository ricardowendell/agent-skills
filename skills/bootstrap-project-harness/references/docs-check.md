# docs-check behavior (stack-neutral)

Single specification for the spec/prompt consistency sensor. Two
implementations exist — `templates/ts/docs-check.mjs` (Node) and
`templates/python/docs_check.py` (Python, stdlib only) — and a parity check
enforces that they agree. Change this file and both implementations together.

## Inputs

- Specs: `docs/specs/SPEC-NNNN-<name>.md`
- Prompts: `docs/prompts/implementation/SPEC-NNNN-<name>.prompt.md`

Frontmatter is a small YAML subset (scalars plus `- item` lists). Anything else
in the file is ignored.

## Checks

| # | Condition | Severity |
|---|---|---|
| 1 | Spec has no frontmatter | **error** |
| 2 | Spec frontmatter has no `id` | **error** |
| 3 | Spec frontmatter has no `status` | warning |
| 4 | `status` is not one of `draft`, `ready`, `in_progress`, `implemented`, `paused`, `rejected` | warning |
| 5 | `status: ready` and the `## Open Questions` section contains a list item | warning |
| 6 | `status: implemented` and `tests:` is empty | warning |
| 7 | `status: implemented` and a listed test path does not exist | warning |
| 8 | A prompt does not map to an existing spec | **error** |
| 9 | A prompt records a `spec_sha` that differs from the spec's current SHA-256 | warning |
| 10 | A prompt has no `## Verification` section | warning |

`spec_sha` is written by the project's spec-hash helper (`spec-sha.mjs` /
`spec_sha.py`). Prompts without `spec_sha` are legacy and skipped (check 9).

## Output

- No findings: print `docs-check passed.`, exit `0`.
- Findings: print `<level>: <message>` per finding, then
  `docs-check: <errors> errors, <warnings> warnings.`, exit `1` if any error
  else `0`.

Warnings never fail the command. Resilient to a missing `docs/` directory
(treated as no specs/prompts).

## Parity fixtures

`references/sensor-parity/` holds one fixture per check above; the parity script
runs both implementations over each and asserts identical verdicts.
