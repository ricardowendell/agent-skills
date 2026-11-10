# Architecture

## Rules

- `src/format/date.js`, `src/format/currency.js` and `src/format/percent.js` are
  shared presentation primitives. Each exists because both `src/report.js` and
  `src/export.js` need the same output for the same value.
- A formatter enters `src/format/**` only when a second consumer needs it. In
  this repo the two consumers are deliberate.
