# Architecture

## Responsibilities

- `src/csv.js` owns payload splitting. It is the only place that knows how a
  line is numbered or how a cell is trimmed.
- `src/import.js` owns validation and the row shape. It composes the csv
  helpers; it does not re-implement them.

## Rules

- One responsibility per module. A module that both parses and writes is two
  modules.
- No duplicated logic: find the existing helper before writing a new one.
- No god files: past roughly 150 lines, split by responsibility.
- Errors carry the data needed to locate the fault — a row number, not "invalid
  input".

## Tests

- `node --test` is the gate. A change that leaves it red is not done.
- A test that fails before the change and passes after it is evidence; a test
  written after the fact is a description.
