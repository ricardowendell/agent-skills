---
id: SPEC-0015
title: Import validation
status: ready
---

# SPEC-0015: Import validation

## Outcome

A caller hands the service a CSV payload and gets back one row per data line.
A malformed payload is rejected with an error that locates the fault.

## Acceptance Criteria

- AC-1: A CSV with a three-column header and two data rows imports as two rows.
- AC-2: A data row whose column count differs from the header is rejected, and
  the error message includes the 1-based physical line number of that row — the
  number a person reading the payload would count, not the row's index among the
  data lines.
- AC-3: Blank lines are ignored, including trailing ones, and do not shift the
  numbering that AC-2 reports.

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

- Do not touch `test/import.test.js`. It is the acceptance oracle.
