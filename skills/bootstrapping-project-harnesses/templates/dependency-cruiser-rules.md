# Dependency-Cruiser Rules

## Purpose

Enforce layered architecture so agents do not create circular or disallowed dependencies. Works for any project with a clear module structure.

## Example Config

Add this to your dependency-cruiser configuration (`.dependency-cruiser.js` or `dependency-cruiser.config.js`):

```javascript
module.exports = {
  forbidden: [
    {
      name: "clients-no-services",
      comment: "API clients must not depend on the orchestration layer above them",
      severity: "error",
      from: { path: "^src/clients/" },
      to: { path: "^src/services/" }
    },
    {
      name: "domain-no-infrastructure",
      comment: "Domain logic must not import data access or UI code",
      severity: "error",
      from: { path: "^src/domain/" },
      to: { path: "^src/(infrastructure|components)/" }
    },
    {
      name: "no-circular",
      comment: "Circular dependencies create coupling that resists change",
      severity: "error",
      from: {},
      to: { circular: true }
    }
  ]
};
```

## Layer Pattern

```
routes -> services -> clients + domain
                     domain -> (no IO, no SDKs, no data fetching)
                     clients -> (external APIs only)
```

Customize paths and layer names for your project structure.
