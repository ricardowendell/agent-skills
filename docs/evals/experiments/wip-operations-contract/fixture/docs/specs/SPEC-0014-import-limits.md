---
id: SPEC-0014
title: Import limits
status: ready
---

# SPEC-0014: Import limits

## Outcome

A caller can hand the service a CSV payload and get back one row per data line,
with a rejection that says which line was wrong.

## Acceptance Criteria

- AC-1: A CSV with a three-column header and two data rows imports as two rows.
- AC-2: A data row with fewer columns than the header is rejected, and the error
  message includes the 1-based line number of that row.
- AC-3: Blank lines are ignored, including trailing ones.

## Flow

1. Split the payload into lines.
2. Read the first line as the header and count its columns.
3. For every remaining line, split it into columns and compare the count.
4. Return the data rows.

## Non-Goals

- No file upload, no streaming reader, no header aliasing.
- No support for quoted fields or embedded commas.

## Prompt Notes

> Safeguards

- Do not rewrite the CSV helpers: `src/csv.js` already splits lines with their
  numbers and drops blanks.
- Do not touch `test/import.test.js`. It is the acceptance oracle.
