# AI-Focused ESLint Rules

Add these to your ESLint config for common AI failure modes. This guide shows both **flat config** (ESLint ≥9, `eslint.config.js`) and **legacy config** (ESLint ≤8, `.eslintrc.cjs`).

## Maximum Parameters

Agents frequently create functions with too many parameters. Force extraction into named objects.

Flat config (`eslint.config.js`):
```js
{
  rules: {
    "max-params": ["error", 4],
  },
}
```

Legacy config (`.eslintrc.cjs`):
```json
{
  "rules": {
    "max-params": ["error", 4]
  }
}
```

## Cyclomatic Complexity

Agents create deeply nested conditionals. Limit complexity to keep functions testable.

Flat config:
```js
{
  rules: {
    complexity: ["error", { max: 10 }],
  },
}
```

Legacy config:
```json
{
  "rules": {
    "complexity": ["error", { "max": 10 }]
  }
}
```

## File Length

Agents produce long files. Enforce a limit and let agents increase it only when justified.

Flat config:
```js
{
  rules: {
    "max-lines": ["warn", { max: 200, skipBlankLines: true, skipComments: true }],
  },
}
```

Legacy config:
```json
{
  "rules": {
    "max-lines": ["warn", { "max": 200, "skipBlankLines": true, "skipComments": true }]
  }
}
```

## Function Length

Agents create long functions. Split after 60 lines.

Flat config:
```js
{
  rules: {
    "max-lines-per-function": ["warn", { max: 60, skipBlankLines: true, skipComments: true }],
  },
}
```

Legacy config:
```json
{
  "rules": {
    "max-lines-per-function": ["warn", { "max": 60, "skipBlankLines": true, "skipComments": true }]
  }
}
```

## Self-Correction Messages

Override default messages to give agents context for fixing issues. Example for no-explicit-any:

Flat config:
```js
{
  rules: {
    "@typescript-eslint/no-explicit-any": ["warn", { fixToUnknown: true, ignoreRestArgs: true }],
  },
}
```

Legacy config:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": [
      "warn",
      {
        "fixToUnknown": true,
        "ignoreRestArgs": true
      }
    ]
  }
}
```

Create a custom formatter or override messages through the ESLint configuration to include context like layer rules or project conventions.
