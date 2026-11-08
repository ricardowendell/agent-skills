# AI-focused lint rules (Oxlint)

The four limits below are the harness defaults, installed in `.oxlintrc.json`.
They are not preferences: each one catches a failure mode agents produce often,
and each one is raised only by a diff that says why.

## Cyclomatic complexity 10

Agents create deeply nested conditionals. Complexity counts the branches
independently of how the function looks, so a wide `switch` costs as much as a
deep `if` chain.

```json
{ "complexity": ["error", { "max": 10 }] }
```

## Maximum parameters 4

Agents add a parameter instead of grouping arguments. Past four, force a named
object so the call site keeps its meaning.

```json
{ "max-params": ["error", 4] }
```

## File length 200 lines

Agents append to the file that is already open. The limit is a warning, not an
error, because a long file is a smell rather than a defect.

```json
{ "max-lines": ["warn", { "max": 200, "skipBlankLines": true, "skipComments": true }] }
```

## Function length 60 lines

Same reason, one level down. Blank lines and comments are skipped: a documented
function is not the problem the rule is about.

```json
{
  "max-lines-per-function": ["warn", { "max": 60, "skipBlankLines": true, "skipComments": true }]
}
```

## What the rule set does not give you

- **No type-aware rules.** Oxlint 1.x does not run the type checker. The type
  gate is `tsc --noEmit`; the two are complementary, not redundant.
- **No cognitive complexity.** Cyclomatic and cognitive complexity disagree. A
  wide `switch` adds many cyclomatic paths and one cognitive point, so moving to
  Biome or ESLint changes what this gate catches. If a project replaces the
  linter, record the replacement limit in the project — do not drop it quietly.
- **No message overrides.** Oxlint prints the rule's own message. The help text
  points at the rule, not at a project convention; write conventions down in
  `AGENTS.md` instead of encoding them in a custom rule message.

## Raising a limit

Change `.oxlintrc.json` in a diff of its own, say which limit moved and why, and
keep the other three where they are. A limit raised while a file is being
written is the pattern this gate exists to stop.
